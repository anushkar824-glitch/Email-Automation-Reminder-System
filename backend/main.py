from datetime import datetime
from contextlib import asynccontextmanager
from pathlib import Path
import csv
import io

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    create_engine, Column, Integer, String, Text,
    Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from apscheduler.schedulers.background import BackgroundScheduler

# ---------------- CONFIGURATION ----------------

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'email_automation.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

scheduler = BackgroundScheduler()
DRY_RUN = True

# ---------------- DATABASE MODELS ----------------

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    company = Column(String(150), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailTemplate(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(30), default="Draft")
    created_at = Column(DateTime, default=datetime.utcnow)


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    recurring = Column(Boolean, default=False)
    status = Column(String(30), default="Scheduled")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    status = Column(String(30), nullable=False)
    details = Column(Text, default="")
    sent_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# ---------------- REQUEST SCHEMAS ----------------

class ContactInput(BaseModel):
    name: str
    email: EmailStr
    company: str = ""


class TemplateInput(BaseModel):
    name: str
    subject: str
    body: str


class CampaignInput(BaseModel):
    name: str
    subject: str
    body: str


class ReminderInput(BaseModel):
    title: str
    recipient: EmailStr
    subject: str
    body: str
    scheduled_at: datetime
    recurring: bool = False


# ---------------- EMAIL SERVICE ----------------

def send_email(recipient, subject, body):
    """
    Safe initial mode: simulate email delivery.
    Real SMTP integration will be added in a later stage.
    """
    db = SessionLocal()

    try:
        if DRY_RUN:
            status = "Simulated"
            details = "Test mode: email was not actually sent."
        else:
            status = "Failed"
            details = "SMTP sending has not been configured."

        log = EmailLog(
            recipient=recipient,
            subject=subject,
            status=status,
            details=details
        )

        db.add(log)
        db.commit()

        return status

    finally:
        db.close()


def process_reminder(reminder_id):
    db = SessionLocal()

    try:
        reminder = db.query(Reminder).filter(
            Reminder.id == reminder_id
        ).first()

        if not reminder or reminder.status != "Scheduled":
            return

        result = send_email(
            reminder.recipient,
            reminder.subject,
            reminder.body
        )

        reminder.status = "Completed"
        db.commit()

    finally:
        db.close()


def schedule_reminder(reminder):
    job_id = f"reminder_{reminder.id}"

    scheduler.add_job(
        process_reminder,
        trigger="date",
        run_date=reminder.scheduled_at,
        args=[reminder.id],
        id=job_id,
        replace_existing=True
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not scheduler.running:
        scheduler.start()

    db = SessionLocal()

    try:
        reminders = db.query(Reminder).filter(
            Reminder.status == "Scheduled"
        ).all()

        for reminder in reminders:
            if reminder.scheduled_at > datetime.now():
                schedule_reminder(reminder)
    finally:
        db.close()

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)


# ---------------- FASTAPI APPLICATION ----------------

app = FastAPI(
    title="Email Automation & Reminder System",
    description="Automated email campaigns, contacts and reminders.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ---------------- DASHBOARD ----------------

@app.get("/")
def home():
    return {
        "message": "Email Automation System API is running",
        "mode": "Dry Run",
        "version": "1.0.0"
    }


@app.get("/dashboard")
def dashboard():
    db = SessionLocal()

    try:
        return {
            "total_contacts": db.query(Contact).count(),
            "total_campaigns": db.query(Campaign).count(),
            "total_reminders": db.query(Reminder).count(),
            "total_emails": db.query(EmailLog).count(),
            "successful_emails": db.query(EmailLog).filter(
                EmailLog.status == "Simulated"
            ).count(),
            "failed_emails": db.query(EmailLog).filter(
                EmailLog.status == "Failed"
            ).count()
        }
    finally:
        db.close()


# ---------------- CONTACT MANAGEMENT ----------------

@app.post("/contacts")
def add_contact(data: ContactInput):
    db = SessionLocal()

    try:
        existing = db.query(Contact).filter(
            Contact.email == data.email
        ).first()

        if existing:
            raise HTTPException(400, "Contact already exists")

        contact = Contact(**data.model_dump())
        db.add(contact)
        db.commit()
        db.refresh(contact)

        return {"message": "Contact added successfully", "id": contact.id}
    finally:
        db.close()


@app.get("/contacts")
def get_contacts():
    db = SessionLocal()

    try:
        contacts = db.query(Contact).order_by(
            Contact.created_at.desc()
        ).all()

        return [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "company": c.company
            }
            for c in contacts
        ]
    finally:
        db.close()


@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int):
    db = SessionLocal()

    try:
        contact = db.query(Contact).filter(
            Contact.id == contact_id
        ).first()

        if not contact:
            raise HTTPException(404, "Contact not found")

        db.delete(contact)
        db.commit()

        return {"message": "Contact deleted"}
    finally:
        db.close()


# ---------------- EMAIL TEMPLATES ----------------

@app.post("/templates")
def create_template(data: TemplateInput):
    db = SessionLocal()

    try:
        template = EmailTemplate(**data.model_dump())
        db.add(template)
        db.commit()
        db.refresh(template)

        return {"message": "Template created", "id": template.id}
    finally:
        db.close()


@app.get("/templates")
def get_templates():
    db = SessionLocal()

    try:
        return [
            {
                "id": t.id,
                "name": t.name,
                "subject": t.subject,
                "body": t.body
            }
            for t in db.query(EmailTemplate).all()
        ]
    finally:
        db.close()


# ---------------- CAMPAIGNS ----------------

@app.post("/campaigns")
def create_campaign(data: CampaignInput):
    db = SessionLocal()

    try:
        campaign = Campaign(**data.model_dump())
        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        return {"message": "Campaign created", "id": campaign.id}
    finally:
        db.close()


@app.get("/campaigns")
def get_campaigns():
    db = SessionLocal()

    try:
        return [
            {
                "id": c.id,
                "name": c.name,
                "subject": c.subject,
                "status": c.status,
                "created_at": c.created_at
            }
            for c in db.query(Campaign).order_by(
                Campaign.created_at.desc()
            ).all()
        ]
    finally:
        db.close()


@app.post("/campaigns/{campaign_id}/send")
def send_campaign(campaign_id: int):
    db = SessionLocal()

    try:
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id
        ).first()

        if not campaign:
            raise HTTPException(404, "Campaign not found")

        contacts = db.query(Contact).all()

        if not contacts:
            raise HTTPException(400, "Add contacts before sending")

        for contact in contacts:
            personalized_body = campaign.body.replace(
                "{{name}}", contact.name
            )

            send_email(
                contact.email,
                campaign.subject,
                personalized_body
            )

        campaign.status = "Sent"
        db.commit()

        return {
            "message": "Campaign processed in test mode",
            "recipients": len(contacts)
        }
    finally:
        db.close()


# ---------------- REMINDERS ----------------

@app.post("/reminders")
def create_reminder(data: ReminderInput):
    if data.scheduled_at.astimezone().replace(tzinfo=None) <= datetime.now():
        raise HTTPException(400, "Choose a future date and time")

    db = SessionLocal()

    try:
        reminder = Reminder(**data.model_dump())
        db.add(reminder)
        db.commit()
        db.refresh(reminder)

        schedule_reminder(reminder)

        return {
            "message": "Reminder scheduled successfully",
            "id": reminder.id
        }
    finally:
        db.close()


@app.get("/reminders")
def get_reminders():
    db = SessionLocal()

    try:
        return [
            {
                "id": r.id,
                "title": r.title,
                "recipient": r.recipient,
                "subject": r.subject,
                "scheduled_at": r.scheduled_at,
                "recurring": r.recurring,
                "status": r.status
            }
            for r in db.query(Reminder).order_by(
                Reminder.scheduled_at
            ).all()
        ]
    finally:
        db.close()


@app.delete("/reminders/{reminder_id}")
def cancel_reminder(reminder_id: int):
    db = SessionLocal()

    try:
        reminder = db.query(Reminder).filter(
            Reminder.id == reminder_id
        ).first()

        if not reminder:
            raise HTTPException(404, "Reminder not found")

        if reminder.status == "Scheduled":
            job_id = f"reminder_{reminder.id}"

            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)

        reminder.status = "Cancelled"
        db.commit()

        return {"message": "Reminder cancelled"}
    finally:
        db.close()


# ---------------- EMAIL ACTIVITY LOGS ----------------

@app.get("/logs")
def get_logs():
    db = SessionLocal()

    try:
        logs = db.query(EmailLog).order_by(
            EmailLog.sent_at.desc()
        ).limit(500).all()

        return [
            {
                "id": log.id,
                "recipient": log.recipient,
                "subject": log.subject,
                "status": log.status,
                "details": log.details,
                "sent_at": log.sent_at
            }
            for log in logs
        ]
    finally:
        db.close()


# ---------------- CSV REPORT EXPORT ----------------

@app.get("/reports/export")
def export_report():
    db = SessionLocal()

    try:
        logs = db.query(EmailLog).order_by(
            EmailLog.sent_at.desc()
        ).all()

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "ID", "Recipient", "Subject",
            "Status", "Details", "Date"
        ])

        for log in logs:
            writer.writerow([
                log.id,
                log.recipient,
                log.subject,
                log.status,
                log.details,
                log.sent_at
            ])

        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                "attachment; filename=email_report.csv"
            }
        )
    finally:
        db.close()
