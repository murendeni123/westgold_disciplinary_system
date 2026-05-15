# Comprehensive Application Description
**Project**: Westgold Disciplinary Management System (Classly)
**Document Version**: 1.0
**Date**: May 7, 2026

---

## Executive Summary

The Westgold Disciplinary Management System (Classly) is a comprehensive, multi-tenant SaaS platform designed to revolutionize how schools manage student behavior, discipline, attendance, detentions, interventions, and parent communication. Built as a full-stack application with separate backend and frontend components, the system serves 50+ schools with complete data isolation through a schema-per-tenant PostgreSQL architecture.

The application provides four distinct portals: Platform/Superadmin, School Admin, Teacher, and Parent. Each portal offers role-specific features optimized for the user's responsibilities. The system emphasizes a positive-first approach to discipline, balancing merit recognition with incident tracking, and provides evidence-based intervention strategies.

---

## Application Overview

**Name**: Westgold Disciplinary Management System (Classly)
**Tagline**: Empowering Education Excellence
**Type**: Multi-Tenant School Disciplinary Management SaaS Platform
**Architecture**: Monolithic with Separate Frontend/Backend
**Scale**: 50+ schools with complete data isolation
**Deployment**: Render (backend) + Vercel (frontend) + Supabase (database)

**Brand Colors**: Green #42C978, Cyan #30C9EE, Navy #143D59, Light #F0F8FB
**Design**: Premium Dark Glassmorphism with modern, accessible UI

---

## Architecture

### Multi-Tenancy Strategy

**Schema-per-Tenant Architecture**:
- Each school receives its own PostgreSQL schema
- Complete data isolation between schools
- SQL injection cannot access other schools' data
- Centralized platform management through shared public schema
- Automatic schema provisioning during school onboarding

**Schema Context Flow**:
1. User login → JWT contains {userId, schoolId, schemaName}
2. Request authentication → Middleware validates JWT
3. Schema context middleware → Sets PostgreSQL search_path
4. Route handlers → Query only current schema's tables
5. Response → Data from isolated school schema

---

## Technology Stack

### Backend
- **Runtime**: Node.js + Express.js (v4.18.2)
- **Database**: PostgreSQL (Supabase) with pg client (v8.16.3)
- **Auth**: JWT (jsonwebtoken v9.0.2) + bcryptjs (v2.4.3)
- **Real-time**: Socket.io (v4.8.1)
- **Security**: express-rate-limit (v8.2.1), helmet, cors
- **Files**: multer (v1.4.5), sharp (v0.34.5), exceljs (v4.4.0)
- **Email**: nodemailer (v7.0.13)
- **Push**: web-push (v3.6.7)
- **Scheduled**: node-cron (v3.0.3)
- **Supabase**: @supabase/supabase-js (v2.94.0)

### Frontend (Main)
- **Framework**: React 18.2.0 + TypeScript 5.3.3
- **Build**: Vite 5.4.0
- **Routing**: React Router DOM 6.20.0
- **State**: React Context API
- **Styling**: Tailwind CSS 3.3.6
- **Animations**: Framer Motion 12.23.26
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React 0.294.0
- **HTTP**: Axios 1.6.2
- **Real-time**: Socket.io Client 4.8.1
- **Date**: date-fns 2.30.0
- **Excel**: xlsx 0.18.5, xlsx-js-style 1.2.0

### Parent Portal (Next.js)
- **Framework**: Next.js 16.2.1 (App Router)
- **React**: 19.2.4
- **State**: TanStack Query 5.62.14
- **Validation**: Zod 3.24.1
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React 0.468.0
- **Real-time**: Socket.io Client 4.8.1

---

## Database Schema

### Public Schema (Shared)

**Platform Management**:
- `platform_users` - Superadmin accounts
- `schools` - School registry with schema_name, status, subscription tier
- `users` - All users across schools (authentication layer)
- `user_schools` - Multi-school linking for parents
- `subscription_plans` - Plan definitions with pricing
- `school_subscriptions` - Active subscriptions per school
- `platform_logs` - Platform-level audit logs
- `email_queue` - Asynchronous email sending
- `import_history` - Bulk import tracking

### School-Specific Schema (Per School - 40+ tables)

**Core Entities**:
- `classes` - Class/grade information
- `students` - Student records with demerit/merit points
- `teachers` - Teacher profiles
- `parents` - Parent profiles
- `student_guardians` - Student-guardian junction

**Behavior Management**:
- `incident_types` - Customizable incident definitions
- `behaviour_incidents` - Incident records with approval workflow
- `merit_types` - Customizable merit definitions
- `merits` - Merit award records

**Detention System**:
- `detention_rules` - Assignment rules
- `detention_sessions` - Session schedules
- `detention_assignments` - Student assignments with attendance
- `detention_session_teachers` - Multi-teacher support

**Consequences**:
- `consequences` - Consequence definitions
- `consequence_assignments` - Assignments with approval workflow

**Interventions**:
- `intervention_types` - Type definitions
- `interventions` - Intervention records
- `intervention_strategies` - 50+ evidence-based strategies
- `intervention_strategies_used` - Strategy tracking
- `intervention_progress` - Progress tracking

**Attendance**:
- `attendance` - Daily attendance
- `period_attendance` - Period-based attendance
- `attendance_codes` - Code definitions

**Communication**:
- `messages` - Internal messaging
- `notifications` - Notification records
- `notification_preferences` - User preferences

**Timetabling**:
- `timetables` - Class timetables
- `period_timetables` - Period time definitions
- `subjects` - Subject definitions

**Customization**:
- `school_customizations` - Branding and theme
- `school_settings` - School-specific settings

**Gamification**:
- `goldie_badge` - Badge system

**Features**:
- `feature_flags` - Feature availability per school

---

## Backend API Structure

### 34 Route Files

**Public Routes**:
- `/api/auth` - Login, signup, password reset, school selection
- `/api/schools` - Public school information

**Platform Admin Routes**:
- `/api/platform` - Platform management
- `/api/school-onboarding` - School creation/management
- `/api/feature-flags` - Feature flag management

**School-Specific Routes** (Require JWT + schema context):
- `/api/students` - Student CRUD, link code generation
- `/api/teachers` - Teacher CRUD
- `/api/parents` - Parent CRUD
- `/api/classes` - Class management
- `/api/behaviour` - Incidents with approval workflow
- `/api/merits` - Merit tracking
- `/api/incident-types` - Customizable types
- `/api/merit-types` - Customizable types
- `/api/attendance` - Daily attendance, bulk marking
- `/api/period-register` - Period attendance
- `/api/detentions` - Sessions, assignments, attendance, auto-assign
- `/api/interventions` - Intervention CRUD
- `/api/guided-interventions` - 2-step system with smart suggestions
- `/api/consequences` - Consequence definitions
- `/api/consequence-assignments` - Assignments with approval
- `/api/messages` - Messaging system
- `/api/notifications` - Notification management
- `/api/analytics` - Dashboard statistics
- `/api/timetables` - Timetable management
- `/api/period-timetables` - Period timetables
- `/api/subjects` - Subject management
- `/api/users` - User management
- `/api/bulk-import` - Bulk import (students, teachers, parents, incidents)
- `/api/bulk-import-v2` - Enhanced bulk import
- `/api/exports` - Data export (CSV, Excel)
- `/api/push` - Push notification management
- `/api/goldie-badge` - Gamification
- `/api/theme-builder` - Theme customization
- `/api/theme-studio` - Theme studio
- `/api/school-customizations` - School customization
- `/api/billing-schedules` - Subscription billing
- `/api/invoices` - Invoice management
- `/api/grade-heads` - Grade head management
- `/api/password` - Password management
- `/api/preferences` - User preferences
- `/api/school-admins` - School admin management

### Middleware Pipeline

1. CORS - Cross-origin configuration
2. Body Parsers - JSON and URL-encoded
3. Input Sanitization - XSS prevention
4. Rate Limiting - DDoS protection (login: 5/15min, signup: 3/hour, API: 100/min)
5. Authentication - JWT verification
6. Schema Context - Multi-tenant schema selection
7. Schema Access Enforcement - Prevent cross-tenant access
8. Plan Expiry - Free trial enforcement
9. Resource Limits - Free trial resource limits (200 students, 5 teachers, 1 admin, 1 grade head)

---

## Frontend Application Structure

### Main Frontend (React + Vite)

**Components**: 76 reusable components
- UI: ModernCard, AnimatedStatCard, GlassCard, Sidebar, Modal, Button, Input, Table, Toast, LoadingSkeleton
- Auth: OnboardingGuard, ProtectedRoute
- Customization: Theme builder components (9 files)
- Parent: Parent-specific components (3 files)
- Theme Studio: Theme components (9 files)

**Contexts**: 8 React contexts
- AuthContext, NotificationContext, SchoolThemeContext, [5 more]

**Hooks**: 6 custom hooks
- useVisibilityAwareInterval, usePortalPrefix, [4 more]

**Layouts**: 6 layout components
- AdminLayout, TeacherLayout, ParentLayout, PlatformLayout, [2 more]

**Pages**: 111 total

**Admin Pages** (34):
- AdminDashboard, Students, Teachers, Parents, Classes
- BehaviourDashboard, AttendanceOverview, AttendanceOverviewEnhanced
- Detentions, DetentionSessions, Interventions, Consequences, ConsequenceManagement
- ReportsAnalytics, BulkImport, BulkImportV2
- TimetableManagement, TimetableManagementNew, Timetables
- IncidentTypes, MeritTypes, DisciplineRules, DisciplineCenter
- StudentProfile, StudentProfile.new, TeacherProfile, TeacherProfile.tsx
- UserManagement, AdminSettings, AdminMessages, Notifications, NotificationsEnhanced
- MeritsDemerits, MeritsDemeritsSimple, ClassDetail, ClassTimetableAssignment

**Teacher Pages** (27):
- TeacherDashboard, MyClasses, ClassDetails
- LogIncident, IncidentHistory
- AwardMerit, ViewMerits, Merits
- AssignConsequence, Consequences, Detentions, ViewDetentions
- MyDetentions, DailyRegister, PeriodRegister, PeriodAttendance
- GuidedIntervention, Interventions
- TeacherMessages, MySchedule, TeacherPeriodTimetable
- TeacherProfile, TeacherReports, TeacherSettings
- Notifications, NotificationsPage, Behaviour

**Parent Pages** (19):
- ModernParentDashboard, ModernMyChildren, ChildProfile
- ModernBehaviourReport, BehaviourDetails
- ModernViewMerits, ModernConsequences, ModernViewDetentions
- ModernAttendanceOverview, AttendanceDayDetail
- ModernInterventions, ModernNotifications, ParentMessages
- LinkChild, LinkSchool, Onboarding, ModernSettings
- ParentProfile, NotificationsPage

**Platform Pages** (18):
- PlatformDashboard, PlatformSchools, PlatformSchoolDetails, PlatformUsers
- SchoolOnboardingWizard, ThemeBuilder, ThemeStudio, SchoolCustomizations
- PlatformAnalytics, PlatformBilling, PlatformSubscriptions, PlatformInvoices
- PlatformInvoiceTemplates, FeatureFlagsManagement, PlatformLogs, PlatformSettings
- NotificationsPage, PlatformLogin

**Grade Head Pages** (3):
- GradeHeadMyDashboard, GradeHeadMyClass, GradeHeadSettings

**Shared Pages** (10):
- Login, LoginPremium, SchoolLogin, SchoolSelect
- Signup, ParentSignup, ParentSignupPremium, AuthCallback
- [4 more]

### Parent Portal (Next.js)

**Structure**:
- `app/dashboard/` - Dashboard pages
- `app/login/` - Login page
- `app/layout.tsx` - Root layout
- `core/auth/` - Authentication context
- `core/api/` - API client
- `core/socket/` - Socket.io client
- `shared/components/` - Shared UI components

**Features**:
- Next.js 16 App Router, React 19
- TanStack Query for state, Zod for validation
- Tailwind CSS 4, Socket.io integration
- Separate deployment from main frontend

---

## User Portals and Features

### 1. Platform/Superadmin Portal (14 pages)

**Users**: Platform administrators

**Purpose**: Manage multiple schools, subscriptions, analytics

**Key Features**:
- School onboarding wizard (multi-step)
- School management (create, view, suspend, activate, remove)
- User management across schools
- Platform analytics and logs
- Theme Studio (branding, colors, logo, banner, fonts)
- Feature flags (enable/disable per school)
- Subscription and billing management
- Plan creation and editing
- Invoice generation and tracking
- Platform settings

### 2. School Admin Portal (34 pages)

**Users**: School administrators

**Purpose**: Manage school operations

**Key Features**:
- Student management (CRUD, profiles, class assignment, parent linking, bulk import/export)
- Teacher management (CRUD, profiles, class teacher assignment, subject assignment, bulk import/export)
- Parent management (view profiles, link to students)
- Class management (create, assign teachers, grade levels)
- Behavior tracking (dashboard, incidents, approve/decline, types, trends, at-risk)
- Attendance oversight (dashboard, daily/period reports, trends, chronic absenteeism)
- Detention management (sessions, teacher assignment, auto/manual assign, queue, cancel, attendance)
- Intervention tracking (view, progress, effectiveness, at-risk)
- Consequence management (definitions, assign, suspension approval workflow)
- Reports & analytics (comprehensive dashboard, behavior/attendance/detention reports, export)
- Bulk operations (import students/teachers/parents/incidents, templates, validation)
- Timetable management (class/period timetables, subjects, rooms)
- School settings (information, discipline rules, detention rules, consequences, notifications)

### 3. Teacher Portal (27 pages)

**Users**: Teachers

**Purpose**: Daily classroom and behavior management

**Key Features**:
- Dashboard (class overview, incidents, detentions, tasks, quick actions)
- Class management (assigned classes, details, student lists, profiles)
- Behavior logging (log incidents, type, severity, description, history)
- Merit awards (award merits, type, description, history)
- Consequence assignment (warnings, detentions, suspensions with approval)
- Detention management (assigned detentions, duties, start session, attendance, complete)
- Attendance (daily/period marking, bulk marking, notes, excuse verification)
- Interventions (guided 2-step system, behavior categories, smart strategy suggestions, progress)
- Messaging (message parents/admins/teachers, history)
- Schedule (personal timetable, period timetable, duties, calendar)
- Notifications (view, mark read, history)
- Profile (update info, password change, classes, duties)
- Reports (behavior, class, attendance, detention)

### 4. Parent Portal (19 pages)

**Users**: Parents/Guardians

**Purpose**: Monitor children's school performance

**Key Features**:
- Dashboard (child overview, stats, incidents, detentions, notifications)
- Child management (view all, profiles, link children, link schools, switch children)
- Behavior reports (incidents, details, severity, points, history, trends)
- Merit tracking (awards, details, points, history, recognition)
- Consequences (assignments, details, status, history)
- Detentions (assignments, date/time/location, attendance, rescheduling)
- Attendance (daily overview, details, patterns, absence notifications)
- Interventions (view, progress, outcomes, resources)
- Notifications (real-time, all types, history)
- Messaging (message teachers/admins, history)
- Settings (profile, contact, emergency contacts, notification preferences)
- Onboarding (link school, link children with code, two-step signup)

---

## Core Modules

### 1. Authentication & Authorization
- JWT token-based authentication
- Multi-school user support
- Platform admin authentication
- Role-based access control (Platform Admin, School Admin, Teacher, Parent, Grade Head)
- Password hashing with bcrypt
- Password reset functionality
- Account lockout after failed attempts
- Rate limiting
- Multi-school linking (user_schools table)

### 2. Behavior Management
- Incident logging with mandatory descriptions
- Severity levels (low, medium, high)
- Customizable incident types per school
- Automatic point deduction
- Approval workflow for high-severity incidents
- Merit awards with mandatory descriptions
- Customizable merit types per school
- Behavior analytics and trends
- At-risk student identification
- Repeat offender tracking

### 3. Detention Management
- Create detention sessions with date/time/location/capacity
- Assign teacher on duty
- Auto-assign based on rules (e.g., 10+ demerit points)
- Manual student assignment
- Capacity management and overflow queue
- Session status tracking (scheduled/in_progress/completed/cancelled)
- Attendance marking (present/absent/late/excused)
- Cancellation with auto-queueing
- Duty roster management
- Parent notifications

### 4. Intervention Management
- 2-step guided intervention system
- 50+ evidence-based strategies in library
- Behavior categorization (5 categories)
- Smart strategy suggestions (prioritizes untried, previously effective)
- Intervention progress tracking
- Effectiveness tracking
- Student intervention history
- Review date scheduling
- Outcome recording

### 5. Consequence Management
- Consequence type definitions (suspension, verbal warning, written warning)
- Verbal/written warnings (teacher-assigned, no approval)
- Detentions (teacher-assigned, no approval)
- Suspensions (teacher-assigned requires approval; admin-assigned immediate)
- Suspension approval workflow
- Consequence tracking
- Parent notifications
- Audit trail

### 6. Attendance Management
- Daily attendance marking
- Period-based attendance
- Attendance codes (present, absent, late, excused, early departure)
- Bulk attendance marking
- Excuse verification
- Parent notifications for absence
- Attendance analytics and trends
- Chronic absenteeism identification
- Integration with discipline system

### 7. Communication
- Internal messaging system
- User-to-user messaging
- Group messaging (class, grade, all parents, all teachers)
- Message types (general, incident, merit, attendance, detention, urgent)
- Priority levels (low, normal, high, urgent)
- Read/unread status, archiving
- Attachment support

### 8. Notifications
- Real-time notifications via Socket.io
- Web Push API support
- Notification types for all events
- Priority levels
- Read/unread status, dismiss functionality
- Expiration dates, history
- User preferences

### 9. Analytics & Reporting
- Dashboard analytics with real-time statistics
- Behavior trend charts (line charts)
- Severity breakdown (pie charts)
- Top incident types (bar charts)
- Student behavior patterns
- Teacher activity metrics
- Attendance analytics
- Detention analytics
- Intervention effectiveness
- Custom date range reports
- Export to CSV/Excel
- Data visualization

### 10. Timetabling
- Class timetable management
- Period timetable management
- Subject management
- Room assignment
- Teacher assignment
- Day-of-week scheduling
- Period time definitions
- Conflict detection

### 11. Bulk Import/Export
- Bulk import students/teachers/parents/incidents
- Template downloads
- Validation and error reporting
- Import history tracking
- Rollback on failure
- Export students/incidents/attendance to CSV/Excel
- Custom date ranges and filters

### 12. Theme Studio
- Custom school colors
- Logo and banner upload
- Font customization
- Layout preferences
- Live preview
- Before/after comparison
- Instant apply or save draft
- Per-school customization

### 13. Gamification
- Goldie badge system
- Badge types
- Badge awarding and tracking
- Recognition display
- Achievement milestones

### 14. Feature Flags
- Enable/disable features per school
- Gradual feature rollout
- A/B testing support
- Feature usage tracking
- Platform-wide feature control

### 15. Subscription & Billing
- Subscription plan management
- Plan creation and editing
- School subscription tracking
- Billing cycle management
- Invoice generation
- Payment tracking
- Free trial management
- Plan enforcement
- Resource limits

---

## Security Implementation

### Multi-Layer Security

1. **Schema Isolation** (Primary) - PostgreSQL schema-per-tenant, SQL injection protection
2. **JWT Authentication** - Token with schema context, validation on every request
3. **Schema Access Enforcement** - Middleware validates access, prevents cross-tenant
4. **Input Sanitization** - XSS prevention, SQL injection protection
5. **Rate Limiting** - DDoS protection, account lockout
6. **Password Security** - bcrypt hashing, strong requirements, reset tokens
7. **CORS Configuration** - Specific allowed origins, credentials enabled
8. **Row-Level Security** (Backup) - PostgreSQL RLS policies

### Security Features
- Role-based access control (RBAC)
- School-level access control
- Grade-level access control
- Resource-level permissions
- Encryption at rest (Supabase)
- Encryption in transit (HTTPS/TLS)
- Audit logging (all actions, user attribution, timestamps)
- GDPR-ready data structure
- Data export capabilities
- Privacy controls

---

## Real-Time Features

### WebSocket (Socket.io)

**Server**: Integrated with Express, JWT authentication, room-based communication (per school), user socket mapping

**Client**: Socket.io client, auto-reconnection, room joining, event listening/emitting

**Real-Time Events**:
- `incident_created/approved/declined`
- `merit_awarded`
- `consequence_assigned`, `suspension_approved/denied`
- `detention_assigned/cancelled`, `detention_attendance_marked`
- `attendance_updated`
- `notification`, `notification_read`
- `message`, `message_read`

**Use Cases**:
- Real-time notifications to parents
- Live dashboard updates
- Instant messaging
- Attendance updates
- Detention notifications
- Incident approval updates

---

## Deployment Architecture

### Current Configuration

**Backend: Render.com**
- Web Service (Node.js)
- Auto-deploy on push to main
- Environment: DATABASE_URL, JWT_SECRET, NODE_ENV, PORT, FRONTEND_URL, SUPABASE keys, VAPID keys
- Plans: Free (spins down) or Starter ($7/month, always on)

**Frontend: Vercel**
- Vite (React)
- Auto-deploy on push to main
- Environment: VITE_API_URL, VITE_SOCKET_URL
- Features: Global CDN, SSL/HTTPS, Preview deployments
- Plans: Free (100GB/month) or Pro ($20/month)

**Parent Portal: Vercel (Planned)**
- Next.js (App Router)
- Separate deployment

**Database: Supabase**
- PostgreSQL (AWS EU-West-1)
- Connection pooling, real-time, RLS, backups, logs
- Plans: Free (500MB) or Pro ($8GB)

### Architecture

```
User Browser
├── Main Frontend (Vercel) - Port 3001
└── Parent Portal (Vercel) - Port 3000
    ↓ HTTPS
Backend API (Render) - Port 5000
    ├── Express + Socket.io
    ├── JWT Auth, Multi-tenant Schema
    ├── Rate Limiting, Input Sanitization
    ↓ PostgreSQL
Supabase PostgreSQL (AWS EU-West-1)
    ├── Public Schema (Shared)
    │   └── platform_users, schools, users, subscriptions, logs
    └── School Schemas (Per School)
        ├── school_ws2025, school_gv2025, etc.
        └── 40+ tables per schema
```

### Cost Summary

**Free Tier**: $0/month (Render free spins down, Vercel 100GB, Supabase 500MB)
**Production**: $7-52/month (Render Starter $7, Vercel Pro $20, Supabase Pro $25)

---

## Configuration Management

### Environment Variables

**Backend (.env)**:
- PORT=5000, NODE_ENV=development
- JWT_SECRET, DATABASE_URL
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- FRONTEND_URL, PLATFORM_ADMIN_EMAIL/PASSWORD
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

**Frontend (.env.production)**:
- VITE_API_URL, VITE_SOCKET_URL

### Configuration Files

**Backend**: server.js (Express, CORS, Socket.io), database/db.js (PostgreSQL connection)

**Frontend**: vite.config.ts (Vite), tsconfig.json (TypeScript), tailwind.config.js (Tailwind), index.css (global styles)

**Parent Portal**: next.config.js (Next.js), tsconfig.json, tailwind.config.ts

### Customization

**School Customizations** (database): Theme colors (JSONB), logo URL, banner URL, font family, custom CSS

**Feature Flags** (database): Feature name, enabled status, school ID, enabled by, notes

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Backend Route Files | 34 |
| Backend Middleware Files | 11 |
| Database Tables per School | 40+ |
| Public Schema Tables | 10 |
| Frontend Pages (Total) | 111 |
| Admin Pages | 34 |
| Teacher Pages | 27 |
| Parent Pages | 19 |
| Platform Pages | 18 |
| Grade Head Pages | 3 |
| Frontend Components | 76 |
| React Contexts | 8 |
| Custom Hooks | 6 |
| Layout Components | 6 |
| Supported Schools | 50+ |
| User Roles | 5 |
| Deployment Platforms | 3 (Render, Vercel, Supabase) |

---

**Document Status**: Complete
**Next Steps**: Use as reference for development, onboarding, and stakeholder communication
