# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Westgold is a **multi-tenant SaaS school disciplinary management platform** (also referred to as "Classly" or "PDS" internally). It serves multiple schools from a single deployment, with complete PostgreSQL schema-per-tenant data isolation. Each school gets its own PostgreSQL schema (e.g., `school_ws2025`), with a shared `public` schema for platform-level data.

The system has five distinct portals: Platform/Superadmin, Admin, Teacher, Parent, and Grade Head.

## Repository Layout

```
westgold_disciplinary_system/
├── backend/          # Node.js/Express API server (port 5000)
├── frontend/         # React + Vite app (port 3001) — Admin, Teacher, Parent, Platform, Grade Head portals
├── parent-portal/    # Separate Next.js 16 app — modern parent-facing portal
└── Documentation/    # 50+ markdown docs covering architecture and features
```

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev        # nodemon auto-reload, listens on :5000
npm start          # production
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev        # Vite dev server on :3001, proxies /api → localhost:5000
npm run build      # tsc + vite build
npm run preview    # preview production build
```

### Parent Portal (Next.js)
```bash
cd parent-portal
npm install
npm run dev        # Next.js dev server
npm run build
npm run lint       # ESLint
```

### Manual test scripts (no test runner)
```bash
cd backend
node test_api_endpoints.js
node test_auth_flow.js
node comprehensive_api_check.js
```
There is no automated test suite — manual Node scripts in `backend/` are used for integration testing.

## Backend Architecture

### Request Lifecycle

Every school-scoped API request goes through this middleware chain in `server.js`:

```
authenticateToken → setSchemaFromToken → enforceSchemaAccess → enforceActivePlan → route handler
```

- `authenticateToken` (`middleware/auth.js`): Validates JWT, attaches `req.user` with `{ userId, role, schoolId, schemaName }`
- `setSchemaFromToken` (`middleware/schemaContext.js`): Sets PostgreSQL `search_path` to the school's schema + public
- `enforceSchemaAccess` (`utils/schemaHelper.js`): Prevents cross-schema access attacks
- `enforceActivePlan` (`middleware/planExpiry.js`): Blocks writes for expired free-trial schools

Platform routes (`/api/platform/*`) skip schema middleware and use `platform_admin` role tokens.

### JWT Tokens

Two token types stored in `localStorage`:
- `token` — school user token containing `{ userId, email, role, schoolId, schoolCode, schemaName }`
- `platform_token` — superadmin token containing `{ platformUserId, email, role: 'platform_admin', isPlatformAdmin: true }`

The frontend `api.ts` axios interceptor prefers `platform_token` over `token`, and injects `x-school-id` header for non-platform routes.

### Database Layer (`backend/database/db.js`)

Single `pg.Pool` (max 30 connections). Key exported helpers:
- `dbGet(sql, params)` — returns first row or null
- `dbAll(sql, params)` — returns array of rows
- `dbRun(sql, params)` — returns result object
- `getSchemaClient(schemaName)` — returns a client with `search_path` already set; **must be released** with `client.release()`
- `pool` — exported directly for transactions

Schema repair (`utils/schemaRepair.js`) runs on every server startup to ensure all `school_*` schemas have required columns for backward compatibility.

### Route Files (`backend/routes/`)

Each file maps to one API prefix. School-scoped routes get the full middleware stack. Notable ones:
- `auth.js` → `/api/auth` (public, handles login for all roles)
- `platform.js` → `/api/platform` (platform admin CRUD, no schema middleware)
- `detentions.js` → `/api/detentions` (also exports `startDetentionAutoClose` — a cron job initialized at server start)
- `notifications.js` and `push.js` export `.router` (named export, not default)

### Real-Time (Socket.io)

`io` and `userSockets` (Map of userId → socket) are set on the Express app with `app.set()`. Routes access them via `req.app.get('io')` and `req.app.get('userSockets')` to push real-time events.

## Frontend Architecture

### Context Providers

Wrap the entire app in `App.tsx` (outermost to innermost):
`DarkModeProvider` → `PlatformAuthProvider` → `AuthProvider` → `SchoolThemeProvider` → `FeatureFlagsProvider` → `NotificationProvider` → `ToastProvider` → `LanguageProvider`

Key contexts:
- `AuthContext` — `useAuth()` — user, token, login/logout, Google OAuth via Supabase
- `PlatformAuthContext` — `usePlatformAuth()` — platform admin auth (separate from school auth)
- `LanguageContext` — `useLanguage()` — i18n, supports `en`, `af`, `zu`, `xh` (Afrikaans, Zulu, Xhosa)
- `SchoolThemeContext` — per-school branding/colors from customizations API
- `FeatureFlagsContext` — feature flag checks per school

### Routing Structure

All pages are lazy-loaded via `React.lazy`. Routes are grouped by portal under their respective layouts and `ProtectedRoute` guards:
- `/admin/*` → `AdminLayout` (role: `admin`)
- `/teacher/*` → `TeacherLayout` (role: `teacher`)
- `/grade-head/*` → `GradeHeadLayout` (role: `grade_head` / `isGradeHead`)
- `/platform/*` → `PlatformLayout` (role: `platform_admin`)
- `/parent/*` → `ModernParentLayout` (role: `parent`)

### API Service (`frontend/src/services/api.ts`)

Single axios instance with base URL from `VITE_API_URL` env var (falls back to `/api` for Vite proxy). Import as:
```ts
import { axiosInstance as api } from '../services/api';
```

## Multi-Tenancy Rules

- **Never** query school-specific tables without first ensuring schema context is set
- School schemas are named `school_<code><year>` (e.g., `school_ws2025`)
- `public` schema holds: `platform_users`, `schools`, `users`, `user_schools`, `subscription_plans`, `school_subscriptions`, `platform_logs`, `email_queue`
- All per-school tables (students, classes, incidents, detentions, attendance, etc.) live in the school schema
- When writing new routes: always use `getSchemaClient(req.schemaName)` for transactions; release client in a `finally` block

## Environment Variables

Copy `backend/.env.example` to `backend/.env`. Required:
```
DATABASE_URL=postgresql://...   # Supabase PostgreSQL connection string
JWT_SECRET=...                  # Validated on startup — must be set in production
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=http://localhost:3001
VAPID_PUBLIC_KEY=...            # Web push notifications
VAPID_PRIVATE_KEY=...
```

`JWT_SECRET` is validated by `utils/jwtSecretValidator.js` at startup — the server will refuse to start in production without a secure value.

## Key Conventions

- **Roles**: `platform_admin`, `admin`, `teacher`, `parent`, `grade_head` — checked in middleware and route handlers via `req.user.role`
- **Grade heads** are teachers with `isGradeHead: true` and `gradeHeadFor` (class name) in their JWT payload
- **Schema repair** (`repairAllSchoolSchemas`) is idempotent and safe to call; it uses `ADD COLUMN IF NOT EXISTS`
- **Translations** live in `frontend/src/locales/{en,af,zu,xh}.ts` — add new keys to all four files
- **School customizations** (colors, logos, feature flags) are fetched on login and stored in `SchoolThemeContext`
- **Billing**: `jobs/billingScheduler.js` runs cron jobs for subscription management; `enforceActivePlan` middleware blocks write operations on expired plans
- CORS allows `localhost:*`, `192.168.*`, `*.vercel.app`, and `*.onrender.com` — update `allowedOriginPatterns` in `server.js` when deploying to new domains

## Admin Detention Sessions Page (`frontend/src/pages/admin/DetentionSessions.tsx`)

The dashboard cards at the top trigger modals:
- **Qualifying Students card** (amber/orange): opens `QualifyingStudentsModal` showing students with 10+ demerit points since last detention. Data from `GET /api/detentions/qualifying-students` — fields: `id`, `student_number`, `student_name`, `class_name`, `total_points`.
- **Queued Students card** (purple/pink): opens `QueueModal` showing students waiting for a session. Data from the detention queue endpoint — fields: `id`, `student_number`, `student_name`, `class_name`, `points_at_queue`, `queued_at`.

Both modals are defined as standalone components at the bottom of the file and rendered inside `<AnimatePresence>` blocks.
