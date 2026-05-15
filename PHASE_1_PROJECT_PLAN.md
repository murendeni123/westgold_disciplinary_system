# Phase 1: Project Structure Analysis

## 1) BACKEND Structure and Tech Stack

### Core Technology
- **Runtime**: Node.js
- **Framework**: Express.js (v4.18.2)
- **Language**: JavaScript (ES6+)
- **Database**: PostgreSQL (hosted on Supabase)
- **Real-time**: Socket.io (v4.8.1)
- **Authentication**: JWT (jsonwebtoken v9.0.2) + bcryptjs (v2.4.3)

### Architecture Pattern
- **Multi-Tenant**: Schema-per-school architecture for complete data isolation
- **Monolithic**: Single backend service serving all portals
- **REST API**: RESTful endpoints with JSON responses
- **WebSocket**: Socket.io for real-time notifications and messaging

### Directory Structure
```
backend/
├── database/              # Database management
│   ├── db.js             # PostgreSQL connection pool
│   ├── schemaManager.js  # Multi-tenant schema creation/management
│   ├── init_postgres.sql # Initial schema
│   ├── school_schema_template.sql # School-specific schema template
│   ├── init_multi_tenant.sql # Public schema setup
│   ├── migrations/       # 44 migration scripts
│   └── seeds/            # Seed data files
├── middleware/            # 11 middleware files
│   ├── auth.js           # JWT authentication
│   ├── schemaContext.js  # Multi-tenant schema selection
│   ├── rateLimiter.js    # DDoS protection
│   ├── inputSanitizer.js # XSS prevention
│   ├── requireSchoolContext.js # Schema validation
│   ├── planExpiry.js     # Free trial plan enforcement
│   ├── permissions.js    # Role-based access
│   ├── upload.js         # File upload handling
│   └── validationSchemas.js # Input validation
├── routes/               # 34 API route files
│   ├── auth.js           # Authentication (login, signup, password reset)
│   ├── students.js       # Student CRUD operations
│   ├── teachers.js       # Teacher CRUD operations
│   ├── parents.js        # Parent CRUD operations
│   ├── classes.js        # Class management
│   ├── behaviour.js      # Behavior incidents
│   ├── merits.js         # Merit/demerit tracking
│   ├── attendance.js     # Daily attendance
│   ├── periodRegister.js # Period attendance
│   ├── detentions.js     # Detention management
│   ├── interventions.js  # Intervention tracking
│   ├── consequences.js    # Consequence management
│   ├── messages.js       # Messaging system
│   ├── notifications.js  # Notifications
│   ├── analytics.js      # Dashboard analytics
│   ├── platform.js       # Platform admin routes
│   ├── schoolOnboarding.js # School creation/management
│   ├── bulkImport.js     # Bulk data import
│   ├── bulkImportV2.js   # Enhanced bulk import
│   ├── exports.js        # Data export (CSV, Excel)
│   ├── themeBuilder.js   # Theme customization
│   ├── featureFlags.js   # Feature flag management
│   ├── billingSchedules.js # Subscription billing
│   └── [16 more route files]
├── utils/                # Utility functions
│   ├── jwtSecretValidator.js # JWT secret validation
│   ├── emailService.js   # Email sending (Nodemailer)
│   └── schemaHelper.js   # Schema-aware query helpers
├── jobs/                 # Scheduled tasks
│   └── billingScheduler.js # Subscription billing scheduler
├── scripts/              # Utility scripts (27 files)
│   ├── check_*.js        # Various diagnostic scripts
│   ├── fix_*.js          # Data repair scripts
│   └── migrate_*.js      # Migration helpers
├── uploads/              # File upload storage
│   └── {schoolId}/{type}/{filename}
├── server.js             # Main Express server entry point
├── .env                  # Environment variables (local)
└── .env.example          # Environment template
```

### API Route Categories
1. **Public Routes**: Auth, school info (no authentication required)
2. **Platform Admin Routes**: School management, subscriptions, analytics
3. **School-Specific Routes**: All require JWT + schema context
   - Student/Teacher/Parent management
   - Behavior tracking (incidents, merits, consequences)
   - Attendance (daily & period)
   - Detentions & interventions
   - Messaging & notifications
   - Reports & analytics
   - Bulk import/export
   - Theme customization

### Database Schema Structure
- **Public Schema** (Shared across all schools):
  - `platform_users` - Superadmin accounts
  - `schools` - School registry with schema_name
  - `users` - All users with primary_school_id
  - `user_schools` - Multi-school linking
  - `subscription_plans` - Plan definitions
  - `school_subscriptions` - Active subscriptions
  - `platform_logs` - Audit logs
  - `import_history` - Import tracking

- **School-Specific Schemas** (One per school, e.g., `school_ws2025`):
  - Core: students, teachers, parents, classes
  - Behavior: behaviour_incidents, incident_types, merits, merit_types
  - Consequences: consequences, consequence_assignments
  - Interventions: interventions, guided_interventions, intervention_progress
  - Attendance: attendance, period_attendance, attendance_codes
  - Detentions: detentions, detention_assignments, detention_sessions
  - Communication: messages, notifications, notification_preferences
  - Timetabling: timetables, period_timetables, subjects
  - Customization: school_customizations, school_settings

### Key Dependencies
```
@supabase/supabase-js (v2.94.0) - Supabase client
axios (v1.13.2) - HTTP client
bcryptjs (v2.4.3) - Password hashing
cors (v2.8.5) - CORS middleware
dotenv (v16.3.1) - Environment variables
exceljs (v4.4.0) - Excel export
express-rate-limit (v8.2.1) - Rate limiting
jsonwebtoken (v9.0.2) - JWT tokens
multer (v1.4.5-lts.1) - File uploads
node-cron (v3.0.3) - Scheduled tasks
nodemailer (v7.0.13) - Email sending
pdfkit (v0.14.0) - PDF generation
pg (v8.16.3) - PostgreSQL client
sharp (v0.34.5) - Image processing
socket.io (v4.8.1) - WebSocket
validator (v13.15.26) - Input validation
web-push (v3.6.7) - Push notifications
```

### Security Implementation
- JWT authentication with schema context in token payload
- Multi-layer schema isolation (primary security)
- Input sanitization (XSS prevention)
- Rate limiting (DDoS protection)
- CORS with allowed origin patterns
- Row-Level Security (RLS) policies as backup
- Password hashing with bcryptjs
- JWT secret validation on startup

---

## 2) FRONTEND Structure and Tech Stack

### Main Frontend (React + Vite)
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.3.3
- **Build Tool**: Vite 5.4.0
- **Routing**: React Router DOM 6.20.0
- **State Management**: React Context API
- **Styling**: Tailwind CSS 3.3.6
- **Animations**: Framer Motion 12.23.26
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React 0.294.0
- **Real-time**: Socket.io Client 4.8.1
- **HTTP Client**: Axios 1.6.2
- **Date Handling**: date-fns 2.30.0
- **Excel Export**: xlsx 0.18.5, xlsx-js-style 1.2.0
- **Supabase**: @supabase/supabase-js 2.90.1 (OAuth integration)

### Directory Structure
```
frontend/
├── src/
│   ├── components/        # 76 reusable components
│   │   ├── ModernCard.tsx
│   │   ├── AnimatedStatCard.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Sidebar.tsx / ModernSidebar.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── SchoolSwitcher.tsx
│   │   ├── QuickStudentSearch.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Button.tsx / PremiumButton.tsx
│   │   ├── Input.tsx / Select.tsx / Textarea.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── DetentionDutyNotification.tsx
│   │   ├── ParentProfileModal.tsx
│   │   ├── OnboardingGuard.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── AnimatedBackground.tsx
│   │   ├── GradientBackground.tsx
│   │   ├── [60+ more components]
│   │   ├── auth/            # Auth-related components
│   │   ├── customization/   # Theme builder components (9 files)
│   │   ├── parent/          # Parent-specific components (3 files)
│   │   └── theme-builder/   # Theme studio components (9 files)
│   ├── contexts/           # 8 React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   ├── NotificationContext.tsx # Notifications
│   │   ├── SchoolThemeContext.tsx # Theme customization
│   │   └── [5 more contexts]
│   ├── hooks/              # 6 custom hooks
│   │   ├── useVisibilityAwareInterval.ts
│   │   ├── usePortalPrefix.ts
│   │   └── [4 more hooks]
│   ├── layouts/            # 6 layout components
│   │   ├── AdminLayout.tsx
│   │   ├── TeacherLayout.tsx
│   │   ├── ParentLayout.tsx
│   │   ├── PlatformLayout.tsx
│   │   └── [2 more layouts]
│   ├── pages/              # 111 page components
│   │   ├── admin/           # 34 admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Teachers.tsx
│   │   │   ├── Parents.tsx
│   │   │   ├── Classes.tsx
│   │   │   ├── BehaviourDashboard.tsx
│   │   │   ├── AttendanceOverview.tsx
│   │   │   ├── Detentions.tsx
│   │   │   ├── Interventions.tsx
│   │   │   ├── Consequences.tsx
│   │   │   ├── ReportsAnalytics.tsx
│   │   │   ├── BulkImport.tsx / BulkImportV2.tsx
│   │   │   ├── TimetableManagement.tsx
│   │   │   ├── IncidentTypes.tsx
│   │   │   ├── MeritTypes.tsx
│   │   │   ├── DisciplineRules.tsx
│   │   │   ├── DisciplineCenter.tsx
│   │   │   ├── StudentProfile.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   └── [12 more admin pages]
│   │   ├── teacher/         # 27 teacher pages
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── MyClasses.tsx
│   │   │   ├── ClassDetails.tsx
│   │   │   ├── LogIncident.tsx
│   │   │   ├── IncidentHistory.tsx
│   │   │   ├── AwardMerit.tsx
│   │   │   ├── ViewMerits.tsx
│   │   │   ├── AssignConsequence.tsx
│   │   │   ├── Consequences.tsx
│   │   │   ├── Detentions.tsx
│   │   │   ├── MyDetentions.tsx
│   │   │   ├── ViewDetentions.tsx
│   │   │   ├── DailyRegister.tsx
│   │   │   ├── PeriodRegister.tsx
│   │   │   ├── PeriodAttendance.tsx
│   │   │   ├── GuidedIntervention.tsx
│   │   │   ├── Interventions.tsx
│   │   │   ├── TeacherMessages.tsx
│   │   │   ├── MySchedule.tsx
│   │   │   ├── TeacherPeriodTimetable.tsx
│   │   │   ├── TeacherProfile.tsx
│   │   │   ├── TeacherSettings.tsx
│   │   │   └── [10 more teacher pages]
│   │   ├── parent/          # 19 parent pages
│   │   │   ├── ModernParentDashboard.tsx
│   │   │   ├── ModernMyChildren.tsx
│   │   │   ├── ChildProfile.tsx
│   │   │   ├── ModernBehaviourReport.tsx
│   │   │   ├── BehaviourDetails.tsx
│   │   │   ├── ModernViewMerits.tsx
│   │   │   ├── ModernConsequences.tsx
│   │   │   ├── ModernViewDetentions.tsx
│   │   │   ├── ModernAttendanceOverview.tsx
│   │   │   ├── AttendanceDayDetail.tsx
│   │   │   ├── ModernInterventions.tsx
│   │   │   ├── ModernNotifications.tsx
│   │   │   ├── ParentMessages.tsx
│   │   │   ├── LinkChild.tsx
│   │   │   ├── LinkSchool.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── ModernSettings.tsx
│   │   │   └── [3 more parent pages]
│   │   ├── platform/         # 18 platform admin pages
│   │   │   ├── PlatformDashboard.tsx
│   │   │   ├── PlatformSchools.tsx
│   │   │   ├── PlatformUsers.tsx
│   │   │   ├── SchoolOnboardingWizard.tsx
│   │   │   ├── ThemeBuilder.tsx
│   │   │   ├── ThemeStudio.tsx
│   │   │   ├── PlatformAnalytics.tsx
│   │   │   ├── PlatformBilling.tsx
│   │   │   └── [10 more platform pages]
│   │   ├── grade-head/      # 3 grade head pages
│   │   │   ├── GradeHeadMyDashboard.tsx
│   │   │   ├── GradeHeadMyClass.tsx
│   │   │   └── GradeHeadSettings.tsx
│   │   ├── Login.tsx
│   │   ├── LoginPremium.tsx
│   │   ├── SchoolLogin.tsx
│   │   ├── SchoolSelect.tsx
│   │   ├── Signup.tsx
│   │   ├── ParentSignup.tsx
│   │   ├── ParentSignupPremium.tsx
│   │   ├── AuthCallback.tsx
│   │   └── [10 more shared pages]
│   ├── services/           # API service layer
│   │   └── api.ts          # Axios instance with interceptors
│   ├── lib/                # Library integrations
│   │   └── supabase.ts     # Supabase client setup
│   ├── utils/              # Utility functions (6 files)
│   │   ├── savedAccounts.ts
│   │   └── [5 more utilities]
│   ├── styles/             # Global styles
│   │   └── globals.css
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── index.css           # Tailwind + custom CSS (19,650 bytes)
│   ├── App.tsx             # Main app component with routing
│   └── main.tsx            # Entry point
├── public/                 # Static assets
│   ├── images/             # Logo, icon, brand info
│   ├── favicon.ico
│   └── PWA icons
├── .env                   # Local environment variables
├── .env.production        # Production environment variables
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json
```

### Parent Portal (Next.js - Separate Application)
- **Framework**: Next.js 16.2.1 (App Router)
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4
- **State**: TanStack Query 5.62.14
- **Icons**: Lucide React 0.468.0
- **Charts**: Recharts 2.15.4
- **Real-time**: Socket.io Client 4.8.1
- **Validation**: Zod 3.24.1

```
parent-portal/
├── app/
│   ├── dashboard/         # Dashboard pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── login/             # Login page
│   │   └── page.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/redirect
│   └── globals.css        # Global styles
├── core/
│   ├── auth/              # Authentication context
│   │   └── AuthProvider.tsx
│   ├── api/               # API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   └── socket/            # Socket.io client
│       └── client.ts
├── shared/
│   └── components/        # Shared UI components
├── package.json
└── next.config.js
```

### Port Configuration
- **Main Frontend**: Port 3001 (Vite dev server)
- **Parent Portal**: Port 3000 (Next.js dev server)
- **Backend**: Port 5000 (Express)

---

## 3) UI/UX

### Design System
- **Theme**: Premium Dark Glassmorphism
- **Brand Colors**:
  - Green: `#42C978`
  - Cyan: `#30C9EE`
  - Navy: `#143D59`
  - Light: `#F0F8FB`
- **Typography**: System fonts with Tailwind defaults
- **Spacing**: Generous whitespace, spacious layouts
- **Border Radius**: Rounded corners (xl, 2xl) for modern feel
- **Shadows**: Soft shadows with glow effects
- **Animations**: Framer Motion for smooth transitions

### Visual Components
- **Glass Cards**: Translucent backgrounds with backdrop blur
- **Stat Cards**: Animated statistics with gradient icons
- **Sidebar**: Collapsible navigation with role-specific items
- **Modals**: Centered dialogs with backdrop
- **Tables**: Clean data tables with sorting/filtering
- **Forms**: Modern inputs with validation feedback
- **Charts**: Recharts with custom tooltips and styling
- **Notifications**: Toast notifications with icons
- **Loading States**: Skeleton loaders and spinners

### User Experience Principles
- **Role-Specific Layouts**: Each portal has tailored navigation and dashboard
- **Positive-First Tone**: Emphasis on merits and achievements, not just incidents
- **Progressive Disclosure**: Complex features hidden behind expandable sections
- **Mobile Responsive**: All pages work on mobile, tablet, and desktop
- **Real-Time Feedback**: Instant notifications for incidents, merits, messages
- **Quick Actions**: Prominent action buttons for common tasks
- **Data Visualization**: Charts and graphs for behavior trends
- **Search & Filter**: Easy data discovery across all lists

### Portal-Specific UX
- **Platform Admin**: Focus on school management, analytics, theme customization
- **School Admin**: School overview, critical alerts, at-risk students, bulk operations
- **Teacher**: Class-focused dashboard, quick incident/merit logging, attendance
- **Parent**: Child-centric view, reassuring tone, behavior trends, notifications
- **Grade Head**: Grade-level focus, at-risk monitoring, intervention tracking

### Customization System
- **Theme Studio**: Platform admins can customize school branding
- **Custom Colors**: Schools can set their own color scheme
- **Custom Logos**: Upload school logos and banners
- **Custom Incident/Merit Types**: Schools can define their own behavior categories
- **Live Preview**: Real-time preview of theme changes

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- High contrast ratios in dark mode
- Focus states on interactive elements

---

## 4) Cloud Structure

### Current Hosting Configuration

#### Backend: Render.com
- **Service Type**: Web Service (Node.js)
- **Runtime**: Node.js
- **Region**: Configurable (e.g., Frankfurt for EU)
- **Deployment**: Automatic on push to main branch
- **Environment Variables**:
  - `DATABASE_URL` - PostgreSQL connection string
  - `JWT_SECRET` - JWT signing key
  - `NODE_ENV` - production
  - `PORT` - 5000
  - `FRONTEND_URL` - Frontend URL for CORS
  - `SUPABASE_URL` - Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
  - `PLATFORM_ADMIN_EMAIL` - Superadmin email
  - `PLATFORM_ADMIN_PASSWORD` - Superadmin password
  - `VAPID_PUBLIC_KEY` - Push notification public key
  - `VAPID_PRIVATE_KEY` - Push notification private key
  - `VAPID_SUBJECT` - Push notification subject
- **Plans**:
  - Free: Spins down after 15min inactivity
  - Starter ($7/month): Always on, 512MB RAM
- **CORS Configuration**: Allows localhost, Vercel, Render domains

#### Frontend: Vercel
- **Framework**: Vite (React)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Deployment**: Automatic on push to main branch
- **Environment Variables**:
  - `VITE_API_URL` - Backend API URL
  - `VITE_SOCKET_URL` - WebSocket URL
- **Features**:
  - Global CDN
  - Automatic SSL/HTTPS
  - Preview deployments for PRs
  - Edge functions support
- **Plans**:
  - Free: 100GB bandwidth/month
  - Pro ($20/month): Team features, advanced analytics

#### Database: Supabase
- **Type**: PostgreSQL database
- **Provider**: Supabase (AWS-backed)
- **Region**: AWS EU-West-1 (Ireland)
- **Features**:
  - Connection pooling (port 5432 for direct, 6543 for pooler)
  - Real-time subscriptions
  - Row-Level Security (RLS)
  - Database backups
  - Database logs
- **Plans**:
  - Free: 500MB database, 2GB bandwidth
  - Pro ($25/month): 8GB database, better performance

#### Parent Portal: (Not Yet Deployed)
- **Intended**: Vercel (Next.js App Router)
- **Configuration**: Similar to main frontend
- **Separate Deployment**: Independent from main frontend

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Main Frontend    │  │ Parent Portal    │                 │
│  │ (Vercel)         │  │ (Vercel - Future)│                 │
│  │ Port: 3001       │  │ Port: 3000       │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
└───────────┼────────────────────┼───────────────────────────┘
            │                    │
            │ HTTPS              │ HTTPS
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Render)                            │
│              Port: 5000                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js + Socket.io                              │  │
│  │  - JWT Authentication                                 │  │
│  │  - Multi-tenant Schema Context                        │  │
│  │  - Rate Limiting                                      │  │
│  │  - Input Sanitization                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ PostgreSQL (pg)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Supabase PostgreSQL Database                      │
│            Region: AWS EU-West-1                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Public Schema (Shared)                               │  │
│  │  - platform_users                                    │  │
│  │  - schools                                           │  │
│  │  - users                                             │  │
│  │  - user_schools                                      │  │
│  │  - subscriptions                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  School Schemas (Per School)                          │  │
│  │  school_ws2025 (Westgold)                             │  │
│  │  school_gv2025 (Green Valley)                        │  │
│  │  school_es2025 (Eastside)                             │  │
│  │  [40+ tables per schema]                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### File Storage
- **Current**: Local filesystem (`backend/uploads/`)
- **Organization**: `uploads/{schoolId}/{type}/{filename}`
- **Supported**: Logos, banners, profile photos, CSV imports
- **Future Recommendation**: Cloud storage (AWS S3 or Supabase Storage)

### Real-Time Communication
- **Protocol**: WebSocket (Socket.io)
- **Server**: Embedded in Express backend
- **Client**: Socket.io Client in all frontends
- **Use Cases**:
  - Real-time notifications to parents
  - Live dashboard updates
  - Instant messaging
  - Attendance updates
  - Detention notifications

### Monitoring & Logging
- **Current**: Console.log only (basic)
- **Backend Logs**: Render dashboard logs
- **Frontend Logs**: Vercel deployment logs
- **Database Logs**: Supabase dashboard logs
- **Future Recommendations**:
  - APM (Application Performance Monitoring)
  - Error tracking (Sentry/Rollbar)
  - Metrics (Prometheus/Grafana)

### Security in Cloud
- **SSL/HTTPS**: Automatic on Render, Vercel, Supabase
- **CORS**: Configured with specific allowed origins
- **Environment Variables**: Stored securely in platform dashboards
- **Secrets Management**: Platform's secret management
- **Rate Limiting**: Backend middleware protection
- **Input Validation**: All inputs sanitized
- **JWT Validation**: On every request

### Cost Summary (Current Configuration)
- **Render (Backend)**: $0 (Free) or $7/month (Starter)
- **Vercel (Frontend)**: $0 (Free) or $20/month (Pro)
- **Supabase (Database)**: $0 (Free tier) or $25/month (Pro)
- **Total**: $0/month (testing) to $52/month (production)

### Custom Domains (Optional)
- **Frontend**: Configured in Vercel (e.g., `app.westgold.co.za`)
- **Backend**: Configured in Render (e.g., `api.westgold.co.za`)
- **DNS**: CNAME records pointing to platform endpoints

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Backend Route Files | 34 |
| Backend Middleware Files | 11 |
| Database Tables per School | ~40 |
| Public Schema Tables | ~10 |
| Frontend Pages (Total) | 111 |
| - Admin Pages | 34 |
| - Teacher Pages | 27 |
| - Parent Pages | 19 |
| - Platform Pages | 18 |
| - Grade Head Pages | 3 |
| Frontend Components | 76 |
| React Contexts | 8 |
| Custom Hooks | 6 |
| Layout Components | 6 |
| Supported Schools | 50+ |
| User Roles | 4 |
| Deployment Platforms | 3 (Render, Vercel, Supabase) |

---

**Document Created**: May 7, 2026
**Project**: Westgold Disciplinary Management System (Classly)
