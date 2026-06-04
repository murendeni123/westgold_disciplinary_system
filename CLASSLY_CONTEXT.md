# Classly — Product Context Document
> Use this document to give Claude (or any AI assistant) full context about what Classly is, what it does, and how it's built.

---

## What Is Classly?

**Classly** (also referred to internally as "PDS" — Positive Discipline System — or "Westgold") is a **multi-tenant SaaS platform for schools** that digitises and streamlines student behaviour management, discipline, attendance, parent communication, and wellbeing. It replaces paper-based registers, fragmented spreadsheets, and informal phone-call chains with a single, integrated system used by every stakeholder in a school: platform admins, school admins, teachers, grade heads, and parents.

The platform is live and actively serves multiple schools. Each school is completely isolated through a **PostgreSQL schema-per-tenant** architecture — every school gets its own schema (e.g. `school_ws2025`) while shared platform data lives in the `public` schema.

---

## The Problem Classly Solves

Traditional school discipline management is broken in predictable ways:

| Problem | How Classly fixes it |
|---|---|
| Paper detention registers get lost or falsified | Digital sessions with timestamped attendance and teacher attribution |
| Parents only hear about problems days later | Real-time push/email notifications the moment an incident is logged |
| Teachers apply consequences inconsistently | Configurable incident types, severity levels, and school-wide rules enforce consistency |
| Intervention decisions are gut-feel | A guided 2-step system with 50+ evidence-based strategies, smart-ranked by what has/hasn't worked before |
| Positive behaviour goes unrecognised | Full merit system balances the demerits narrative |
| School data sits in silos | Every module (behaviour, attendance, detentions, merits, interventions) feeds a unified analytics dashboard |
| Setting up a new school takes weeks | Platform admin onboarding wizard creates a fully isolated schema in minutes |
| Schools can't afford enterprise ERP systems | Tiered SaaS pricing (Free → Starter → Pro → Enterprise) with resource limits driving upgrades |

---

## Five User Portals

Classly serves five distinct user types, each with their own portal and route namespace.

### 1. Platform Admin (`/platform/*`)
The SaaS operator. Manages all schools from one dashboard.
- Onboard new schools (multi-step wizard, auto-creates DB schema)
- Manage subscriptions and billing (plans, invoices, payment tracking)
- Theme Studio: customise logo, colours, banner, fonts per school
- Feature flags: enable/disable features per school
- Platform-wide analytics (revenue, growth, school health)
- Activity logs and audit trails across the entire platform

### 2. School Admin (`/admin/*`)
The principal or administrative staff member running one school.
- Full student, teacher, parent, and class CRUD
- Discipline Centre: approve/decline high-severity incidents
- Create detention sessions, set rules for auto-assignment
- View the detention queue and manage overflow
- Configure the school's own incident types, merit types, and consequence definitions
- Bulk import/export (students, teachers, parents, incidents) via CSV/Excel
- Comprehensive reports and analytics (export to PDF, Excel, CSV)
- Timetable management (classes, periods, subjects, rooms)
- School branding and settings

### 3. Teacher (`/teacher/*`)
The classroom teacher doing day-to-day logging.
- Log behaviour incidents (type, severity, description → points auto-deducted)
- Award merits (type, description → points added)
- Assign consequences (verbal/written warning instantly; suspension requires admin approval)
- Take daily and period attendance
- Mark detention attendance when on duty
- Create guided interventions (2-step: pick behaviour category → pick strategy)
- Message parents and admins
- View personal timetable and detention schedule

### 4. Grade Head (`/grade-head/*`)
A senior teacher responsible for an entire grade — not just one class. Has the `grade_head` database role.
- Filtered view of admin features, scoped to their grade only
- Can approve/decline incidents for students in their grade
- Oversees behaviour, attendance, and detentions for the whole grade
- Has their own class ("My Teachings") just like a regular teacher
- Can record Goldie Badge awards

### 5. Parent (`/parent/*`)
The parent or guardian monitoring their child.
- View all incidents, merits, consequences, detentions, and attendance for their child
- Submit absence excuses
- Receive real-time push notifications and email alerts
- Message teachers and admins directly
- Link to multiple children and multiple schools
- Onboarding flow with school code + child link code

---

## Core Feature Modules

### Behaviour Management
- Teachers log incidents with mandatory description, incident type (school-configurable), and severity (Low / Medium / High)
- Points are automatically deducted based on severity
- High/critical severity incidents enter an **approval workflow** — admin must approve or decline
- Full incident history per student; analytics show trends, top incident types, repeat offenders

### Merit & Recognition System
- Teachers award merit points to reinforce positive behaviour
- Schools define their own merit types and point values
- Merit points offset demerit points in the "clean points" calculation
- Parents notified instantly when their child earns a merit

### Detention Management
- Admins create sessions (date, time, location, capacity, supervising teacher)
- **Auto-assignment rules**: when a student's net demerit points cross a configurable threshold (e.g. −10 clean points) they are automatically queued
- **Queue management**: overflow students are queued and assigned to the next available session
- Teachers mark attendance (Present / Absent / Late / Excused) with per-student notes
- Sessions lock to a register after completion; Excel register download available
- Parents notified on assignment and if their child misses

### Intervention System
- Guided 2-step flow:
  1. Select behaviour category (Disruptive Behaviour / Non-Compliance / Inattention / Peer Conflict / Low Engagement)
  2. System suggests evidence-based strategies, ranked: *untried first → previously effective → tried without outcome → previously ineffective*
- 50+ strategies across 5 categories
- Progress tracked with review dates; outcomes recorded to build effectiveness history

### Consequence Management
- Four consequence types: Verbal Warning, Written Warning, Detention, Suspension
- Verbal/written: instant, no approval needed
- Suspension assigned by teacher: requires admin approval (audit trail)
- Suspension assigned by admin: immediate
- Full consequence history per student

### Attendance
- Daily attendance and period-based attendance per class
- Codes: Present, Absent, Late, Excused, Early Departure
- Parent notified of absences in real-time
- Chronic absenteeism flagging in analytics

### Goldie Badge System
- Students who earn ≥10 merit points AND maintain positive clean points become eligible
- Four badge tiers: Bronze (10–14), Silver (15–29), Gold (30–49), Platinum (50+)
- Admins and grade heads log when a badge is physically awarded (date + notes)
- Award history tracked per student; visible in Discipline Centre under the Goldie Badges tab

### Analytics & Reporting
- Real-time dashboards for each role
- Behaviour trends (line charts), severity breakdown (pie/bar), top incident types
- Detention fill rates, attendance rates
- Intervention effectiveness tracking
- Date-range filtering, Excel/CSV/PDF export

### Notifications
- Real-time via **Socket.io** (WebSocket)
- Web push notifications (VAPID)
- Email via Nodemailer
- Notification types: incidents, merits, detentions, attendance, messages, approvals
- Per-user preferences; notification history with read/unread tracking

### Bulk Operations
- Import students, teachers, parents, incidents from CSV/Excel
- Downloadable templates with column structure
- Validation with error reporting; import history with timestamps

### Theme Studio (Platform Admin)
- Per-school: logo, banner, primary/accent/secondary colours, font
- Live preview before applying

### Feature Flags
- Each feature can be enabled/disabled per school
- Used for gradual rollout, A/B testing, plan-gating

### Subscription & Billing
- Plans: Free, Starter, Pro, Enterprise with different resource limits
- Free trial enforcement (writes blocked on expired plans via middleware)
- Invoice generation (PDF), email delivery, payment recording

### Multilingual Support
- Four languages: English, Afrikaans, Zulu, Xhosa
- `useLanguage()` hook with `t(key)` translation function throughout UI

---

## Technical Architecture

### Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + framer-motion |
| Parent Portal | Next.js 16 + TypeScript + Tailwind CSS 4 (separate app) |
| Backend | Node.js + Express + Socket.io |
| Database | PostgreSQL via Supabase (schema-per-tenant) |
| Auth | JWT (stored in localStorage: `token` for school users, `platform_token` for platform admin) |
| Real-time | Socket.io (WebSocket) |
| Email | Nodemailer (SMTP) |
| File Storage | Supabase Storage |
| PDF | PDFKit |
| Excel (backend) | ExcelJS |
| Excel (frontend) | xlsx-js-style |
| Deployment | Render (backend) + Vercel (frontend) + Supabase (DB) |

### Repository Layout
```
westgold_disciplinary_system/
├── backend/          # Node.js/Express API (port 5000)
│   ├── routes/       # 44 route files, ~200+ endpoints
│   ├── middleware/   # auth, schema context, plan expiry
│   ├── database/     # db.js pool + init SQL files
│   └── utils/        # schemaHelper, schemaRepair, emailService, etc.
├── frontend/         # React/Vite (port 3001) — all 5 portals
│   ├── src/pages/    # 94+ pages across admin/teacher/parent/platform/grade-head
│   ├── src/components/ # 76+ shared components
│   ├── src/contexts/ # 8 React contexts (Auth, Language, Theme, Notifications, etc.)
│   └── src/locales/  # en.ts, af.ts, zu.ts, xh.ts
└── parent-portal/    # Separate Next.js 16 modern parent experience
```

### Database Design
- `public` schema: `users`, `schools`, `user_schools`, `subscription_plans`, `school_subscriptions`, `platform_users`, `platform_logs`, `email_queue`, `goldie_badge_config`
- Per-school schema (e.g. `school_ws2025`): `students`, `teachers`, `classes`, `subjects`, `behaviour_incidents`, `merits`, `merit_types`, `incident_types`, `detention_sessions`, `detention_assignments`, `detention_rules`, `interventions`, `intervention_types`, `consequences`, `consequence_assignments`, `attendance`, `timetable_slots`, `notifications`, `messages`, `goldie_badge_awards`, `import_history`, and more (~40 tables)
- `schemaRepair.js` runs on every server start — idempotent `ADD COLUMN IF NOT EXISTS` ensures forward compatibility

### Request Lifecycle (school routes)
```
authenticateToken → setSchemaFromToken → enforceSchemaAccess → enforceActivePlan → route handler
```

### Key Backend Helpers
- `schemaAll(req, sql, params)` — returns array of rows from school schema
- `schemaGet(req, sql, params)` — returns first row
- `schemaRun(req, sql, params)` — executes DML, returns result
- `getSchemaClient(schemaName)` — returns pg client with search_path set (must release in finally)

### Key Frontend Helpers
- `api` from `src/services/api.ts` — axios instance; auto-injects auth token and `x-school-id`
- `useAuth()` — current user, token, login/logout
- `useLanguage()` / `t(key)` — translations
- `usePortalPrefix()` — returns `/admin`, `/teacher`, or `/grade-head` based on current URL

---

## Role Reference

| Role string | Portal | DB location |
|---|---|---|
| `platform_admin` | `/platform` | `public.platform_users` |
| `admin` | `/admin` | `public.users` |
| `teacher` | `/teacher` | `public.users` + school `teachers` row |
| `grade_head` | `/grade-head` | `public.users` + school `teachers` row (`is_grade_head = true`) |
| `parent` | `/parent` | `public.users` |

Grade heads have `role = 'grade_head'` in `public.users`. The auth middleware enriches their JWT with `isGradeHead: true`, `gradeHeadFor: '<grade>'`, `teacherId`, and `hasClass` from the school `teachers` table.

---

## Scale & Scope

- 94+ frontend pages
- 44 backend route files, 200+ API endpoints
- ~40 database tables per school schema
- 5 user roles
- 4 supported languages (EN, AF, ZU, XH)
- 50+ evidence-based intervention strategies
- Multi-school SaaS with complete per-tenant data isolation
