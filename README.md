# Email Automation & Reminder System

A web-based application for managing contacts, creating email templates, organizing email campaigns, scheduling reminders, and reviewing activity logs.

## Features

- **Dashboard:** View an overview of contacts, campaigns, reminders, and recent activity.
- **Contact management:** Add, view, and remove contacts.
- **Email templates:** Create and manage reusable email templates.
- **Campaign management:** Create campaigns and run them in test mode.
- **Reminders:** Schedule and manage one-time reminders.
- **Activity logs:** Review campaign and reminder activity.
- **Reports:** Export report data as a CSV file.

## Technology Stack

**Frontend**
- Next.js
- React
- TypeScript
- CSS
- Lucide React

**Backend**
- Python
- FastAPI
- SQLAlchemy
- SQLite
- APScheduler
- Pydantic

## Project Structure

```text
Email-Automation-Reminder-System/
├── backend/
│   └── main.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── next.config.ts
├── .gitignore
└── requirements.txt
```

## Getting Started

### Prerequisites

- Python 3.11 or later
- Node.js and npm

### 1. Clone the repository

```bash
git clone https://github.com/anushkar824-glitch/Email-Automation-Reminder-System.git
cd Email-Automation-Reminder-System
```

### 2. Set up the backend

Create and activate a virtual environment.

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the backend from the project root:

```bash
cd backend
uvicorn main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Set up the frontend

Open a second terminal at the project root and run:

```bash
cd frontend
npm install
```

Create a file named `.env.local` inside the `frontend` folder with:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## Email Sending Mode

The current project is configured in **test mode** (`DRY_RUN = True`). Campaign actions are simulated and recorded in the activity logs. The application does not send real emails through an SMTP provider in its current configuration.

## Current Reminder Support

The application supports scheduling one-time reminders. Recurring reminder scheduling is not currently implemented.

## Future Enhancements

- SMTP integration for real email delivery
- Recurring reminder schedules
- User authentication and role-based access
- Enhanced campaign analytics
- Deployment and production configuration

## Author

Created as a portfolio project to demonstrate full-stack development, API integration, database operations, and workflow automation.
