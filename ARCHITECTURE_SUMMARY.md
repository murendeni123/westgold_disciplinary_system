# Westgold Disciplinary Management System - Architecture Summary

## System Overview

**Type**: Multi-Tenant School Disciplinary Management SaaS Platform  
**Current Architecture**: Monolithic (Separate Frontend/Backend)  
**Scale**: Designed for 50+ schools with complete data isolation

---

## Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Socket.io (WebSocket)
- **Auth**: JWT tokens
- **Security**: Helmet, Rate Limiting, Input Sanitization

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **State**: React Context API
- **Styling**: Tailwind CSS (Dark Theme)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Real-time**: Socket.io Client

---

## Multi-Tenancy Architecture

### Strategy: Schema-per-Tenant
Each school gets its own PostgreSQL schema for complete data isolation.

```
PostgreSQL Database
├── PUBLIC Schema (Shared)
│   ├── platform_users (superadmins)
│   ├── schools (registry with schema_name)
│   ├── users (all users across schools)
│   ├── user_schools (multi-school linking)
│   ├── subscription_plans
│   └── platform_logs
│
├── school_ws2025 Schema (Westgold School)
│   ├── students, teachers, parents, classes
│   ├── behaviour_incidents, merits, attendance
│   ├── detentions, interventions, consequences
│   ├── messages, notifications
│   └── incident_types, merit_types (customizable)
│
├── school_gv2025 Schema (Green Valley School)
│   └── (same tables, isolated data)
│
└── school_es2025 Schema (Eastside School)
    └── (same tables, isolated data)
```

### How Multi-Tenancy Works

1. **School Onboarding**: Platform admin creates school → system creates new schema
2. **User Login**: JWT token contains `{userId, schoolId, schemaName}`
3. **Request Handling**: Middleware sets PostgreSQL `search_path` to school schema
4. **Data Isolation**: Queries only access current schema's tables

---

## 4 User Portals

### 1. Platform/Superadmin Portal (14 pages)
**Users**: Platform administrators  
**Purpose**: Manage multiple schools, subscriptions, analytics

**Key Features**:
- School onboarding and management
- User management across schools
- Platform analytics and logs
- Theme Studio (customize school branding)
- Feature flag management
- Subscription and billing
- School suspension/activation

**Main Pages**:
- PlatformDashboard, PlatformSchools, PlatformUsers
- PlatformAnalytics, ThemeStudio, SchoolOnboardingWizard
- FeatureFlagsManagement, PlatformBilling, PlatformLogs

---

### 2. Admin Portal (34 pages)
**Users**: School administrators  
**Purpose**: Manage their school's operations

**Key Features**:
- Student/teacher/parent management
- Behavior tracking and analytics
- Attendance oversight
- Detention management
- Intervention tracking
- Customizable incident/merit types
- Bulk import/export
- Reports and analytics
- Timetable management
- Discipline rules configuration

**Main Pages**:
- AdminDashboard, Students, Teachers, Parents, Classes
- BehaviourDashboard, AttendanceOverview, Detentions
- Interventions, Consequences, ReportsAnalytics
- IncidentTypes, MeritTypes, TimetableManagement
- BulkImport, UserManagement, AdminSettings

**Core Modules**:
1. **Student Management**: CRUD, profiles, class assignments
2. **Behavior Tracking**: Incidents, merits, demerits, consequences
3. **Attendance**: Daily and period-based tracking
4. **Detention System**: Scheduling, assignments, duty rosters
5. **Interventions**: Tracking and guided workflows
6. **Analytics**: Reports, trends, at-risk students
7. **Communication**: Parent messaging, notifications
8. **Bulk Operations**: Import/export students, teachers, incidents

---

### 3. Teacher Portal (27 pages)
**Users**: Teachers  
**Purpose**: Daily classroom and behavior management

**Key Features**:
- Class management (view assigned classes)
- Log behavior incidents
- Award merits/demerits
- Assign consequences
- Schedule detentions
- Take attendance (daily & period)
- View student profiles
- Intervention tracking
- Parent messaging
- View personal timetable

**Main Pages**:
- TeacherDashboard, MyClasses, ClassDetails
- LogIncident, IncidentHistory, AwardMerit, ViewMerits
- AssignConsequence, Detentions, MyDetentions
- DailyRegister, PeriodRegister, PeriodAttendance
- GuidedIntervention, TeacherMessages, MySchedule

**Daily Workflows**:
1. Take attendance (period or daily)
2. Log incidents during class
3. Award merits for good behavior
4. Assign consequences for misbehavior
5. Schedule detentions
6. Communicate with parents
7. Track intervention progress

---

### 4. Parent Portal (19 pages)
**Users**: Parents/Guardians  
**Purpose**: Monitor children's school performance

**Key Features**:
- View children's behavior records
- See merits and demerits
- View detention assignments
- Check attendance records
- Track interventions
- Receive notifications
- Message teachers
- Link multiple children
- Link to multiple schools

**Main Pages**:
- ModernParentDashboard, ModernMyChildren, ChildProfile
- ModernBehaviourReport, BehaviourDetails
- ModernViewMerits, ModernConsequences, ModernViewDetentions
- ModernAttendanceOverview, ModernInterventions
- ParentMessages, ModernNotifications, LinkChild

**Parent Features**:
1. Real-time notifications for incidents
2. View behavior trends and analytics
3. See upcoming detentions
4. Track attendance patterns
5. Monitor intervention progress
6. Direct messaging with teachers
7. Multi-child support

---

## Backend Structure

### API Routes (34 route files)

#### Public Routes
```
/api/auth                   - Login, signup, password reset
/api/schools                - Public school info
```

#### Platform Admin Routes
```
/api/platform               - Platform management
/api/school-onboarding      - Create/manage schools
/api/platform/schools       - Theme studio
/api/feature-flags          - Feature flags
```

#### School-Specific Routes (Schema-Aware)
All require: Authentication + Schema Context + Access Enforcement

```
/api/students               - Student CRUD
/api/teachers               - Teacher CRUD
/api/parents                - Parent CRUD
/api/classes                - Class CRUD
/api/behaviour              - Behavior incidents
/api/merits                 - Merit/demerit tracking
/api/attendance             - Daily attendance
/api/period-register        - Period attendance
/api/detentions             - Detention management
/api/interventions          - Intervention tracking
/api/guided-interventions   - Guided workflows
/api/consequences           - Consequence management
/api/consequence-assignments - Assignments
/api/incident-types         - Customizable types
/api/merit-types            - Customizable types
/api/messages               - Messaging
/api/notifications          - Notifications
/api/analytics              - Reports
/api/timetables             - Timetables
/api/period-timetables      - Period timetables
/api/subjects               - Subject management
/api/users                  - User management
/api/bulk-import            - Bulk import
/api/bulk-import-v2         - Enhanced import
/api/exports                - Data export
/api/push                   - Push notifications
/api/goldie-badge           - Gamification
```

### Middleware Stack
```
1. CORS
2. Body Parsers (JSON, URL-encoded)
3. Input Sanitization (XSS prevention)
4. Rate Limiting (DDoS protection)
5. Authentication (JWT verification)
6. Schema Context (Multi-tenant schema selection)
7. Schema Access Enforcement (Prevent cross-tenant access)
```

---

## Database Schema Details

### PUBLIC Schema Tables
```sql
-- Platform
platform_users
schools (id, name, code, subdomain, schema_name, status)
subscription_plans
school_subscriptions
platform_logs
import_history

-- Users (Cross-School)
users (id, email, password_hash, role, primary_school_id)
user_schools (user_id, school_id, role)
user_roles
```

### SCHOOL_* Schema Tables (Per School)
```sql
-- Core Entities
students (id, first_name, last_name, class_id, is_active)
teachers (id, first_name, last_name, email, is_active)
parents (id, first_name, last_name, email)
student_guardians (student_id, parent_id)
classes (id, class_name, teacher_id, year_group)

-- Behavior
behaviour_incidents (id, student_id, teacher_id, incident_type_id, description, severity, date)
incident_types (id, name, description, severity, demerit_points)
merits (id, student_id, teacher_id, merit_type_id, points, date)
merit_types (id, name, description, points)

-- Consequences & Interventions
consequences (id, name, description, severity_level)
consequence_assignments (id, student_id, consequence_id, assigned_by, status)
interventions (id, student_id, type, status, start_date, end_date)
guided_interventions (id, student_id, workflow_type, current_step, status)
intervention_progress (id, intervention_id, step, completed, notes)

-- Attendance
attendance (id, student_id, date, status, marked_by)
period_attendance (id, student_id, period_id, date, status, marked_by)
attendance_codes (code, description, is_present)

-- Detentions
detentions (id, student_id, date, duration, reason, assigned_by, status)
detention_assignments (id, detention_id, student_id, status)
detention_sessions (id, date, start_time, end_time, supervisor_id)
detention_duty_assignments (id, session_id, teacher_id)

-- Communication
messages (id, sender_id, recipient_id, subject, body, read, sent_at)
notifications (id, user_id, type, title, message, read, created_at)
notification_preferences (user_id, email_enabled, push_enabled)

-- Timetabling
timetables (id, class_id, day, period, subject_id, teacher_id)
period_timetables (id, period_number, start_time, end_time, day_of_week)
subjects (id, name, code, description)

-- Customization
school_customizations (theme_colors, logo_url, banner_url)
school_settings (key, value)
```

---

## Authentication & Authorization

### JWT Token Structure
```javascript
{
  userId: 123,
  schoolId: 5,
  schemaName: "school_ws2025",
  role: "teacher",
  email: "teacher@school.com",
  exp: 1234567890
}
```

### Role-Based Access Control
```
Platform Admin → Full access to all schools
School Admin   → Full access to their school
Teacher        → Access to assigned classes and students
Parent         → Access to their children's data only
```

### Multi-School Support
- Users can be linked to multiple schools via `user_schools` table
- Login returns school list if user has multiple schools
- User selects school → receives JWT with that school's context
- Can switch schools without re-login

---

## Real-Time Features (Socket.io)

### WebSocket Events
```javascript
// Server → Client
'notification'          // New notification
'message'              // New message
'incident_created'     // New behavior incident
'detention_assigned'   // Detention assigned
'merit_awarded'        // Merit awarded
'attendance_updated'   // Attendance changed

// Client → Server
'join_school'          // Join school room
'mark_read'            // Mark notification read
```

### Use Cases
1. Real-time notifications to parents when incident logged
2. Live updates to admin dashboard
3. Instant messaging between teachers and parents
4. Attendance updates
5. Detention notifications

---

## Security Implementation

### Layers of Security

1. **Schema Isolation** (Primary)
   - Each school's data in separate PostgreSQL schema
   - SQL injection cannot access other schools

2. **JWT Authentication**
   - Tokens contain schema context
   - Validated on every request

3. **Schema Access Enforcement**
   - Middleware validates user can access requested schema
   - Prevents cross-tenant attacks

4. **Input Sanitization**
   - XSS prevention on all inputs
   - SQL injection protection

5. **Rate Limiting**
   - Prevents DDoS attacks
   - Stricter limits on sensitive endpoints

6. **Row-Level Security** (Backup)
   - PostgreSQL RLS policies as safety net

---

## File Upload System

### Supported Uploads
- School logos and banners (Theme Studio)
- Student profile photos
- Bulk import CSV files
- Report exports

### Storage
- Local filesystem: `backend/uploads/`
- Organized by: `uploads/{schoolId}/{type}/{filename}`

---

## Data Flow Examples

### Example 1: Teacher Logs Incident
```
1. Teacher clicks "Log Incident" in Teacher Portal
2. Frontend sends POST /api/behaviour with JWT token
3. Backend middleware:
   - Validates JWT
   - Extracts schemaName = "school_ws2025"
   - Sets PostgreSQL search_path
4. Route handler inserts into behaviour_incidents table
5. Backend emits Socket.io event to parent
6. Parent receives real-time notification
7. Response sent to teacher
```

### Example 2: Parent Views Child's Behavior
```
1. Parent logs in, selects school
2. JWT contains parent's userId and schemaName
3. Frontend requests GET /api/behaviour/student/:id
4. Backend:
   - Validates parent owns this student
   - Sets schema context
   - Queries behaviour_incidents
5. Returns filtered incidents
6. Frontend displays in ModernBehaviourReport
```

### Example 3: Platform Admin Creates School
```
1. Platform admin uses SchoolOnboardingWizard
2. POST /api/school-onboarding with school details
3. Backend (in transaction):
   - Creates record in public.schools
   - Creates new PostgreSQL schema (school_newschool2025)
   - Runs school_schema_template.sql
   - Seeds default incident_types, merit_types
   - Creates admin user
   - Links admin to school
4. Returns school details
5. School is ready for use
```

---

## Current Limitations & Technical Debt

### Scalability
1. **Single Database**: All schemas in one PostgreSQL instance
2. **No Caching**: No Redis for session/query caching
3. **File Storage**: Local filesystem (not cloud storage)
4. **No CDN**: Static assets served from backend

### Code Organization
1. **Monolithic Structure**: All code in single backend/frontend repos
2. **Route Files Too Large**: Some routes >1000 lines
3. **Duplicate Logic**: Similar code across portals
4. **No Service Layer**: Business logic in route handlers

### Database
1. **No Connection Pooling per Schema**: Shared pool for all schools
2. **No Read Replicas**: All queries hit primary database
3. **No Partitioning**: Large tables not partitioned
4. **Migration System**: Manual migrations, no automated rollback

### Testing
1. **No Unit Tests**: No automated testing
2. **No Integration Tests**: Manual testing only
3. **No E2E Tests**: No Playwright/Cypress

### Monitoring
1. **No APM**: No application performance monitoring
2. **Basic Logging**: Console.log only
3. **No Error Tracking**: No Sentry/Rollbar
4. **No Metrics**: No Prometheus/Grafana

---

## Recommended Modular Monolith Structure

### Proposed Module Breakdown

```
1. Platform Module (Superadmin)
   - School management
   - Subscription management
   - Platform analytics
   - Feature flags

2. Identity Module (Shared)
   - Authentication
   - Authorization
   - User management
   - Multi-tenancy

3. Student Module
   - Student CRUD
   - Student profiles
   - Class assignments

4. Behavior Module
   - Incidents
   - Merits/Demerits
   - Consequences
   - Interventions

5. Attendance Module
   - Daily attendance
   - Period attendance
   - Attendance codes

6. Detention Module
   - Detention scheduling
   - Assignments
   - Duty rosters

7. Communication Module
   - Messaging
   - Notifications
   - Real-time events

8. Timetable Module
   - Class timetables
   - Period timetables
   - Subjects

9. Analytics Module
   - Reports
   - Dashboards
   - Exports

10. Customization Module
    - Theme Studio
    - School settings
    - Incident/Merit types
```

### Benefits of Modular Monolith
- Clear boundaries between domains
- Easier to test individual modules
- Can extract to microservices later
- Shared database with module-specific tables
- Reduced code duplication
- Better separation of concerns

---

## Summary Statistics

- **Total Backend Routes**: 34 route files
- **Total Frontend Pages**: 94 pages (34 admin + 27 teacher + 19 parent + 14 platform)
- **Total Components**: 53 reusable components
- **Total Contexts**: 7 React contexts
- **Total Layouts**: 5 layout components
- **Database Tables per School**: ~40 tables
- **Public Schema Tables**: ~10 tables
- **Supported Schools**: 50+ (current design)
- **User Roles**: 4 (Platform Admin, School Admin, Teacher, Parent)

---

This architecture document provides the foundation for planning your migration to a modular monolith. The current system is already well-structured for this transition with clear domain boundaries.
