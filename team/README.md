# EMS Team — staff workspace

Private app for Elite Media Solutions staff at **team.elitemedia.qa**.
Next.js 16 + Prisma + PostgreSQL, served behind the VPS's nginx.

## Roles

| Role | Access |
|---|---|
| CEO, Project Manager | Everything |
| Admin | Team accounts (not CEO/PM), clients, equipment, leave approvals, time reports, all projects |
| Creative Director | Creates/edits projects, any task, approves files, all projects, time reports |
| Staff | Projects they're on, their own tasks, uploads, time, leave requests, equipment bookings |
| Client | The client portal only (`/portal`): their company's projects — progress, milestones, upcoming shoots, files shared with them (approve / request changes), and messages with the team |

Rules live in `lib/permissions.js`.

## Features

Dashboard · projects & clients · Kanban tasks with comments · shared calendar
(meetings, shoots, leave, deadlines) · equipment with clash-free booking ·
files with review/approval and comments · time tracking with CSV export ·
leave requests and approvals · team management · client portal.

## Client portal

Create logins on **Clients → Client portal access**. On a project, tick
“Show to the client as a milestone” on tasks, use **Share with client** on
files, and talk to the client in the **Client** tab. Everything else stays
internal.

## Server

- Install / repair: `bash /var/www/ems/scripts/team-setup.sh` (as root)
- Updates: `bash /var/www/ems/scripts/vps-deploy.sh` (also updates the website)
- New account or forgotten password: `cd /var/www/ems/team && sudo -u ems node scripts/create-user.mjs`
- Logs: `journalctl -u ems-team -f`
- Uploads: `/var/www/ems-team-files` · DB backups: `/var/backups/ems-team` (nightly, 14 days)

## Local development

```
cp .env.example .env    # point DATABASE_URL at a local Postgres
npm install
npx prisma migrate dev
node scripts/create-user.mjs
npm run dev             # http://localhost:3010
```
