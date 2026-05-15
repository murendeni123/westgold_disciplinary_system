# Backend API Analysis - Westgold Disciplinary System

**Date:** January 2025  
**Total Route Files:** 44  
**Estimated Endpoints:** 200+

---

## Critical Issues Found

### 1. ROUTING CONFLICTS

**`/api/schools` Duplicate Mount**
- `schools.js` and `schoolOnboarding.js` both mount at `/api/schools`
- **Fix:** Move platform admin routes to `/api/platform/schools`

**Three Theme Management Systems**
- `schoolCustomizations.js` - Simple customizations
- `themeBuilder.js` - Advanced theme builder
- `themeStudio.js` - Another theme system
- **Fix:** Consolidate to single system (keep themeBuilder.js)

### 2. DUPLICATE IMPLEMENTATIONS

**Bulk Import**
- `bulkImport.js` (legacy) vs `bulkImportV2.js` (current)
- **Fix:** Remove `bulkImport.js`

**Consequence Assignment**
- `consequences.js` and `consequence_assignments.js` both handle assignments
- **Fix:** Consolidate into `consequence_assignments.js`

**Timetables**
- `timetables.js` (simple) vs `periodTimetables.js` (advanced)
- **Fix:** Remove `timetables.js`

### 3. SECURITY ISSUES

**Missing Authentication**
- `preferences.js` routes lack `authenticateToken` middleware
- **Fix:** Add authentication middleware

**Emergency Password Reset**
- `emergency-password-reset.js` allows reset without current password
- **Status:** Marked TEMPORARY
- **Fix:** Remove if no longer needed

### 4. INCONSISTENT PATTERNS

**Role Middleware**
- Multiple implementations: `requireRole()`, `requireAdmin()`, `requireAdminOnly()`
- **Fix:** Standardize on `requireRole()`

**Platform Admin Middleware**
- Custom implementation in multiple files
- **Fix:** Consolidate to single shared middleware

**Database Access**
- Mix of `dbAll/dbGet/dbRun`, `schemaAll/schemaGet/schemaRun`, direct `pool.query`
- **Fix:** Standardize on schema helpers for school data

---

## Route File Inventory

### Core Auth & User Management
- `auth.js` - Login, signup, password reset, email verification
- `password.js` - Password change with current verification
- `emergency-password-reset.js` - TEMPORARY bypass
- `users.js` - User CRUD (admin only)
- `preferences.js` - User preferences (MISSING AUTH)
- `parents.js` - Parent profile, child linking, multi-school
- `teachers.js` - Teacher CRUD, photo upload
- `students.js` - Student CRUD, photo upload, parent link codes
- `gradeHeads.js` - Grade head assignment/removal

### School Management
- `schools.js` - Get current/specific school
- `schoolOnboarding.js` - Platform admin school creation (CONFLICTS with schools.js)
- `schoolInfo.js` - School info (cached)
- `schoolAdmins.js` - School admin management
- `schoolCustomizations.js` - Theme system 1 (DEPRECATED)

### Academic Management
- `classes.js` - Class CRUD with students
- `subjects.js` - Subject CRUD
- `timetables.js` - Simple timetables (DEPRECATED)
- `periodTimetables.js` - Advanced template-based timetables
- `periodRegister.js` - Teacher register, period attendance

### Discipline Management
- `behaviour.js` - Incidents, analytics
- `merits.js` - Merit awarding with badge checks
- `detentions.js` - Detention rules, sessions
- `incidentTypes.js` - Incident type CRUD
- `meritTypes.js` - Merit type CRUD
- `interventions.js` - Basic interventions
- `guidedInterventions.js` - Strategy-based interventions
- `consequences.js` - Consequence definitions and assignments
- `consequence_assignments.js` - Assignment management (OVERLAP with consequences.js)

### Attendance & Communication
- `attendance.js` - Attendance CRUD, bulk insert
- `messages.js` - Internal messaging
- `notifications.js` - In-app notifications with email
- `push.js` - Web push notifications

### Analytics & Exports
- `analytics.js` - Critical alerts, at-risk students
- `exports.js` - Student/class export (PDF/Excel)

### Bulk Operations
- `bulkImport.js` - Legacy bulk import (REMOVE)
- `bulkImportV2.js` - Current bulk import with progress

### Platform Admin
- `platform.js` - Platform login, settings
- `billingSchedules.js` - Billing schedule management
- `invoices.js` - Invoice templates and generation
- `featureFlags.js` - Feature flag management
- `features.js` - System features and plan features

### Theming (CONFLICT)
- `themeBuilder.js` - Advanced theme builder
- `themeStudio.js` - Alternative theme system (REMOVE)
- `schoolCustomizations.js` - Simple customizations (REMOVE)

### Other
- `goldieBadge.js` - Badge configuration and awarding

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Immediate)
1. Resolve `/api/schools` routing conflict
2. Add authentication to `preferences.js`
3. Remove or secure `emergency-password-reset.js`

### Phase 2: Remove Duplicates (Week 1)
4. Remove `bulkImport.js`
5. Remove `timetables.js`
6. Remove `themeStudio.js`
7. Remove `schoolCustomizations.js`
8. Consolidate consequence assignment logic

### Phase 3: Standardization (Week 2)
9. Standardize role middleware
10. Consolidate platform admin middleware
11. Standardize database access patterns

---

## Endpoint Count by Category

- Authentication: 7 endpoints
- User Management: 25+ endpoints
- School Management: 20+ endpoints
- Academic: 15+ endpoints
- Discipline: 30+ endpoints
- Attendance/Comm: 12+ endpoints
- Analytics/Exports: 4 endpoints
- Bulk Operations: 6 endpoints
- Platform Admin: 25+ endpoints
- Theming: 15+ endpoints (3 systems)
- Other: 4 endpoints

**Total: ~200+ endpoints**
