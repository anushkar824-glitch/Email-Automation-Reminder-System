
"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Mail, Clock, FileText,
  BarChart3, Settings, Search, Bell, Plus, Send,
  CheckCircle2, Trash2, Download, Menu, RefreshCw
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Contacts", icon: Users },
  { label: "Campaigns", icon: Mail },
  { label: "Reminders", icon: Clock },
  { label: "Templates", icon: FileText },
  { label: "Activity Logs", icon: BarChart3 },
  { label: "Reports", icon: BarChart3 },
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [data, setData] = useState<any>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [contactForm, setContactForm] = useState({
    name: "", email: "", company: ""
  });
  const [campaignForm, setCampaignForm] = useState({
    name: "", subject: "", body: ""
  });
  const [reminderForm, setReminderForm] = useState({
    title: "", recipient: "", subject: "", body: "",
    scheduled_at: "", recurring: false
  });
  const [templateForm, setTemplateForm] = useState({
    name: "", subject: "", body: ""
  });

  async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Something went wrong");
    }

    return result;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [dashboard, contactData, campaignData, reminderData, templateData, logData] =
        await Promise.all([
          request("/dashboard"),
          request("/contacts"),
          request("/campaigns"),
          request("/reminders"),
          request("/templates"),
          request("/logs"),
        ]);

      setData(dashboard);
      setContacts(contactData);
      setCampaigns(campaignData);
      setReminders(reminderData);
      setTemplates(templateData);
      setLogs(logData);
    } catch (e: any) {
      setError(e.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function perform(action: () => Promise<any>, success: string) {
    setMessage("");
    setError("");

    try {
      await action();
      setMessage(success);
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const filteredContacts = contacts.filter((c) =>
    `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { title: "Total Contacts", value: data.total_contacts ?? 0, icon: Users },
    { title: "Campaigns", value: data.total_campaigns ?? 0, icon: Mail },
    { title: "Scheduled Reminders", value: data.total_reminders ?? 0, icon: Clock },
    { title: "Emails Processed", value: data.total_emails ?? 0, icon: Send },
  ];

  function heading(description: string) {
    return (
      <div className="mb-7">
        <p className="text-sm font-medium text-blue-600">WORKSPACE MANAGEMENT</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{active}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    );
  }

  function input(label: string, value: string, onChange: (v: string) => void, placeholder: string, type = "text") {
    return (
      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
    );
  }

  function textarea(label: string, value: string, onChange: (v: string) => void, placeholder: string) {
    return (
      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          rows={4}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
    );
  }

  function button(label: string, onClick: () => void, icon = true) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        {icon && <Plus size={16} />}
        {label}
      </button>
    );
  }

  function panel(children: React.ReactNode) {
    return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">{children}</div>;
  }

  function table(headers: string[], rows: any[][]) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              {headers.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-slate-400">No records found yet.</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                {row.map((cell, j) => <td key={j} className="px-4 py-4 text-slate-600">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const status = (value: string) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      ["Completed", "Sent", "Simulated"].includes(value)
        ? "bg-emerald-50 text-emerald-700"
        : value === "Failed"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700"
    }`}>{value}</span>
  );

  function overview() {
    return (
      <>
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">WORKSPACE OVERVIEW</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Welcome back!</h1>
            <p className="mt-2 text-sm text-slate-500">Monitor your email automation and manage your campaigns.</p>
          </div>
          {button("Refresh dashboard", loadData, false)}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={21} /></div>
                <p className="mt-5 text-sm text-slate-500">{s.title}</p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900">{s.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h3 className="font-bold text-slate-900">Email performance</h3>
            <p className="mt-1 text-xs text-slate-400">Current email processing summary</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 p-5">
                <CheckCircle2 className="text-emerald-600" />
                <p className="mt-3 text-xs text-emerald-700">Successful test sends</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">{data.successful_emails ?? 0}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-5">
                <Clock className="text-red-600" />
                <p className="mt-3 text-xs text-red-700">Failed sends</p>
                <p className="mt-1 text-2xl font-bold text-red-800">{data.failed_emails ?? 0}</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Email delivery is currently in safe simulation mode. No real emails are sent.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">Quick actions</h3>
            <p className="mt-1 text-xs text-slate-400">Manage your workspace</p>
            <div className="mt-5 space-y-3">
              {["Contacts", "Campaigns", "Reminders", "Templates"].map((name) => (
                <button key={name} onClick={() => setActive(name)} className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50">
                  {name}<span className="text-blue-600">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {panel(
            <>
              <h3 className="font-bold text-slate-900">Recent activity</h3>
              <p className="mb-4 mt-1 text-xs text-slate-400">Latest email processing records</p>
              {table(["Recipient", "Subject", "Status", "Date"], logs.slice(0, 5).map((l) => [
                l.recipient, l.subject, status(l.status),
                l.sent_at ? new Date(l.sent_at).toLocaleString() : "-"
              ]))}
            </>
          )}
        </div>
      </>
    );
  }

  function contactsPage() {
    return (
      <>
        {heading("Add, search and manage your email recipients.")}
        {panel(
          <>
            <h3 className="mb-5 font-bold text-slate-900">Add new contact</h3>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={(e) => {
              e.preventDefault();
              perform(
                () => request("/contacts", { method: "POST", body: JSON.stringify(contactForm) }),
                "Contact added successfully."
              );
              setContactForm({ name: "", email: "", company: "" });
            }}>
              {input("Full name", contactForm.name, (v) => setContactForm({ ...contactForm, name: v }), "Enter contact name")}
              {input("Email address", contactForm.email, (v) => setContactForm({ ...contactForm, email: v }), "name@example.com", "email")}
              {input("Company", contactForm.company, (v) => setContactForm({ ...contactForm, company: v }), "Company name")}
              <div className="md:col-span-3">{button("Add contact", () => document.getElementById("contact-submit")?.click())}<button id="contact-submit" type="submit" className="hidden" /></div>
            </form>
          </>
        )}
        <div className="mt-6">
          {panel(
            <>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
                <div><h3 className="font-bold text-slate-900">Contact directory</h3><p className="mt-1 text-xs text-slate-400">{contacts.length} contacts</p></div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="w-full text-sm outline-none" />
                </div>
              </div>
              {table(["Name", "Email", "Company", "Action"], filteredContacts.map((c) => [
                c.name, c.email, c.company || "-",
                <button key={c.id} onClick={() => perform(() => request(`/contacts/${c.id}`, { method: "DELETE" }), "Contact deleted.")} className="text-red-500 hover:text-red-700"><Trash2 size={17} /></button>
              ]))}
            </>
          )}
        </div>
      </>
    );
  }

  function campaignsPage() {
    return (
      <>
        {heading("Create email campaigns and process them for your contacts.")}
        {panel(
          <>
            <h3 className="mb-5 font-bold text-slate-900">Create campaign</h3>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              perform(() => request("/campaigns", { method: "POST", body: JSON.stringify(campaignForm) }), "Campaign created.");
              setCampaignForm({ name: "", subject: "", body: "" });
            }}>
              {input("Campaign name", campaignForm.name, (v) => setCampaignForm({ ...campaignForm, name: v }), "e.g. Welcome campaign")}
              {input("Email subject", campaignForm.subject, (v) => setCampaignForm({ ...campaignForm, subject: v }), "Enter email subject")}
              {textarea("Email message", campaignForm.body, (v) => setCampaignForm({ ...campaignForm, body: v }), "Write your email. Use {{name}} to personalize the recipient's name.")}
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Save campaign</button>
            </form>
          </>
        )}
        <div className="mt-6">
          {panel(
            <>
              <h3 className="mb-4 font-bold text-slate-900">Campaign history</h3>
              {table(["Campaign", "Subject", "Status", "Action"], campaigns.map((c) => [
                c.name, c.subject, status(c.status),
                <button key={c.id} onClick={() => {
                  if (confirm("Process this campaign in safe simulation mode?")) {
                    perform(() => request(`/campaigns/${c.id}/send`, { method: "POST" }), "Campaign processed in test mode.");
                  }
                }} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"><Send size={15} /> Process</button>
              ]))}
            </>
          )}
        </div>
      </>
    );
  }

  function remindersPage() {
    return (
      <>
        {heading("Schedule and manage automated email reminders.")}
        {panel(
          <>
            <h3 className="mb-5 font-bold text-slate-900">Schedule a reminder</h3>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => {
              e.preventDefault();
              perform(() => request("/reminders", {
                method: "POST",
                body: JSON.stringify({
                  ...reminderForm,
                  scheduled_at: new Date(reminderForm.scheduled_at).toISOString()
                })
              }), "Reminder scheduled.");
              setReminderForm({ title: "", recipient: "", subject: "", body: "", scheduled_at: "", recurring: false });
            }}>
              {input("Reminder title", reminderForm.title, (v) => setReminderForm({ ...reminderForm, title: v }), "e.g. Follow-up reminder")}
              {input("Recipient email", reminderForm.recipient, (v) => setReminderForm({ ...reminderForm, recipient: v }), "name@example.com", "email")}
              {input("Email subject", reminderForm.subject, (v) => setReminderForm({ ...reminderForm, subject: v }), "Reminder subject")}
              {input("Schedule date and time", reminderForm.scheduled_at, (v) => setReminderForm({ ...reminderForm, scheduled_at: v }), "", "datetime-local")}
              <div className="md:col-span-2">{textarea("Email message", reminderForm.body, (v) => setReminderForm({ ...reminderForm, body: v }), "Write your reminder message.")}</div>
              <div className="md:col-span-2"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Schedule reminder</button></div>
            </form>
            <p className="mt-4 text-xs text-amber-600">Note: Recurring reminders are not enabled yet; scheduled reminders currently run once.</p>
          </>
        )}
        <div className="mt-6">
          {panel(
            <>
              <h3 className="mb-4 font-bold text-slate-900">Reminder schedule</h3>
              {table(["Title", "Recipient", "Scheduled time", "Status", "Action"], reminders.map((r) => [
                r.title, r.recipient, new Date(r.scheduled_at).toLocaleString(), status(r.status),
                r.status === "Scheduled" ? <button key={r.id} onClick={() => perform(() => request(`/reminders/${r.id}`, { method: "DELETE" }), "Reminder cancelled.")} className="text-red-500"><Trash2 size={17} /></button> : "-"
              ]))}
            </>
          )}
        </div>
      </>
    );
  }

  function templatesPage() {
    return (
      <>
        {heading("Save reusable email messages for your campaigns.")}
        {panel(
          <>
            <h3 className="mb-5 font-bold text-slate-900">Create email template</h3>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              perform(() => request("/templates", { method: "POST", body: JSON.stringify(templateForm) }), "Template saved.");
              setTemplateForm({ name: "", subject: "", body: "" });
            }}>
              {input("Template name", templateForm.name, (v) => setTemplateForm({ ...templateForm, name: v }), "e.g. Welcome email")}
              {input("Email subject", templateForm.subject, (v) => setTemplateForm({ ...templateForm, subject: v }), "Enter subject")}
              {textarea("Email body", templateForm.body, (v) => setTemplateForm({ ...templateForm, body: v }), "Write reusable email content.")}
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Save template</button>
            </form>
          </>
        )}
        <div className="mt-6">
          {panel(
            <>
              <h3 className="mb-4 font-bold text-slate-900">Saved templates</h3>
              {table(["Name", "Subject", "Message"], templates.map((t) => [t.name, t.subject, t.body]))}
            </>
          )}
        </div>
      </>
    );
  }

  function logsPage() {
    return (
      <>
        {heading("Review email processing history and delivery status.")}
        {panel(
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Email activity</h3>
              <button onClick={loadData} className="text-blue-600"><RefreshCw size={17} /></button>
            </div>
            {table(["Recipient", "Subject", "Status", "Details", "Date"], logs.map((l) => [
              l.recipient, l.subject, status(l.status), l.details,
              l.sent_at ? new Date(l.sent_at).toLocaleString() : "-"
            ]))}
          </>
        )}
      </>
    );
  }

  function reportsPage() {
    return (
      <>
        {heading("Review your email statistics and export activity reports.")}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            ["Total processed", data.total_emails ?? 0],
            ["Simulated sends", data.successful_emails ?? 0],
            ["Failed sends", data.failed_emails ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          {panel(
            <>
              <h3 className="font-bold text-slate-900">Export email report</h3>
              <p className="mt-2 text-sm text-slate-500">Download your email activity history as a CSV spreadsheet.</p>
              <a href={`${API}/reports/export`} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Download size={17} /> Download CSV report
              </a>
            </>
          )}
        </div>
      </>
    );
  }

  const pages: Record<string, () => React.ReactNode> = {
    Overview: overview,
    Contacts: contactsPage,
    Campaigns: campaignsPage,
    Reminders: remindersPage,
    Templates: templatesPage,
    "Activity Logs": logsPage,
    Reports: reportsPage,
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#111c35] text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500"><Mail size={21} /></div>
          <div><h1 className="text-lg font-bold">EmailFlow</h1><p className="text-[10px] tracking-widest text-slate-400">AUTOMATION PLATFORM</p></div>
        </div>
        <div className="px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">Workspace</p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return <button key={item.label} onClick={() => setActive(item.label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${active === item.label ? "bg-blue-600 font-semibold text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={18} />{item.label}</button>;
            })}
          </nav>
          <p className="mb-4 mt-10 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">Preferences</p>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-white/5"><Settings size={18} /> Settings</button>
        </div>
        <div className="mt-auto border-t border-white/10 p-5">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-emerald-400" /> System status</div>
            <p className="mt-2 text-xs text-slate-400">Safe test mode enabled</p>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <Menu className="text-slate-500 lg:hidden" />
            <div><p className="text-xs text-slate-400">Workspace / {active}</p><h2 className="text-lg font-bold text-slate-900">{active}</h2></div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadData} title="Refresh data" className="text-slate-500 hover:text-blue-600"><RefreshCw size={18} /></button>
            <Bell size={19} className="text-slate-500" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">A</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 md:p-9">
          {message && <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading && <p className="mb-4 text-xs text-slate-400">Refreshing workspace data...</p>}
          {(pages[active] || overview)()}
          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <p>© 2026 EmailFlow. Email Automation Platform.</p>
            <p>Safe simulation mode · API connected through local backend</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
