# Database Analysis - Westgold Disciplinary System

**Date:** January 2025  
**Purpose:** Comprehensive analysis of database schema, table structures, and critical issues.

---

## Executive Summary

Multi-tenant PostgreSQL database with schema-per-school architecture. **44+ tables** across public (shared) and school-specific schemas. Several critical data integrity and security issues identified.

---

## Architecture

```
PostgreSQL Database
├── public schema (shared)
│   ├── platform_users, schools, users, user_schools
│   ├── subscription_plans, school_subscriptions
│   ├── platform_logs, email_queue, push_subscriptions
│   ├── import_history, user_sessions
│   ├── invoice_templates, invoices, billing_schedules
│   └── theme_versions, theme_assets, theme_change_history
│
├── school_ws2025 schema (per-school)
│   ├── students, teachers, parents, classes
│   ├── behaviour_incidents, merits, attendance
│   ├── detention_sessions, detention_assignments
│   ├── messages, notifications
│   ├── incident_types, merit_types, intervention_types
│   ├── interventions, consequences, student_consequences
│   ├── timetables, academic_years, terms
│   ├── customizations, settings, audit_log
│   └── import_history
```

---

## PUBLIC SCHEMA TABLES

### Authentication & Users

**platform_users** - Super admin accounts
- Issues: None critical

**users** - Central authentication for all users
- **CRITICAL:** No password history, password_reset_token in plain text, no failed login tracking, no account lockout at DB level
- **CRITICAL:** email_verified field but no verification code storage
- **ISSUE:** primary_school_id can be null but users must belong to at least one school

**user_schools** - Multi-school linking (parents)
- **CRITICAL:** role_in_school can differ from users.role (permission conflicts)
- **ISSUE:** is_primary flag not validated (multiple could be primary)
- **ISSUE:** No effective_date/expiry_date (cannot track temporary access)

### School Management

**schools** - School registry
- **CRITICAL:** No foreign key from schema_name to actual schema (orphan references possible)
- **CRITICAL:** No validation that schema_name actually exists
- **ISSUE:** trial_ends_at and subscription_ends_at overlap (confusing precedence)
- **ISSUE:** No cancellation reason tracking

**subscription_plans** - Plan definitions
- **ISSUE:** No tax rate field, no trial duration in plan, features JSONB not validated

**school_subscriptions** - Active subscriptions
- **CRITICAL:** No payment method stored
- **ISSUE:** No grace period for expiry, no proration logic, no discount support
- **ISSUE:** end_date can be null (unclear for auto-renew)

### Platform Operations

**platform_logs** - Audit trail
- **ISSUE:** No retention policy (grows indefinitely), no proper indexing on action_type + created_at

**email_queue** - Async email sending
- **CRITICAL:** No cleanup mechanism (failed emails accumulate)
- **ISSUE:** No deduplication, no batch ID, no reply-to tracking

**push_subscriptions** - Web push endpoints
- **CRITICAL:** No expiration date (old endpoints never cleaned)
- **ISSUE:** p256dh and auth stored in plain text (should be encrypted)

**import_history** - Bulk import tracking
- **ISSUE:** No file storage reference, error_log JSONB not validated, no rollback mechanism

**user_sessions** - Session management
- **CRITICAL:** No cleanup of expired sessions (grows indefinitely)
- **ISSUE:** No session limit per user, token_hash not indexed, no refresh token tracking

### Invoicing System

**invoice_templates** - Template definitions
- **ISSUE:** template_file_url not validated, no version control, created_by can be null

**invoices** - Generated invoices
- **CRITICAL:** status and payment_status overlap (confusing workflow)
- **ISSUE:** No overdue calculation trigger, no credit note support, pdf_url not validated

**billing_schedules** - Billing automation
- **ISSUE:** No timezone handling, no holiday exclusion, billing_day not validated

**invoice_line_items** - Invoice breakdown
- **ISSUE:** total not calculated via trigger, no tax/VAT tracking

**invoice_payments** - Payment history
- **CRITICAL:** No validation that payment amount ≤ invoice amount (could overpay)
- **CRITICAL:** No transaction ID from payment gateway (cannot reconcile)
- **ISSUE:** No refund tracking

### Theme System

**theme_versions** - Theme configurations
- **ISSUE:** Multiple JSONB columns not validated, no size limits, no rollback to previous version

**theme_assets** - Theme files
- **ISSUE:** No file size limit, no file cleanup when theme deleted, no image dimension validation

**theme_change_history** - Theme audit
- **ISSUE:** No retention policy, changes JSONB not validated

---

## SCHOOL SCHEMA TABLES (Per-School)

### Core Entities

**classes** - Class definitions
- **CRITICAL:** student_count not calculated via trigger (manual maintenance)
- **ISSUE:** teacher_id can be null, no room/building tracking, academic_year is TEXT not DATE

**students** - Student records
- **CRITICAL:** demerit_points and merit_points not calculated (manual maintenance)
- **CRITICAL:** parent_id references public.parents but in school schema (cross-schema FK not enforced)
- **CRITICAL:** parent_link_code not hashed (security risk)
- **ISSUE:** secondary_parent_id not validated, medical_info/special_needs should be JSONB
- **ISSUE:** No unique constraint on student_id + school_id, withdrawal_date not indexed

**teachers** - Teacher profiles
- **CRITICAL:** user_id references public.users but in school schema (cross-schema FK not enforced)
- **ISSUE:** subjects as TEXT[] (no validation), is_class_teacher and class_teacher_of inconsistent
- **ISSUE:** No grade_head tracking, has_class flag not in database

**parents** - Parent profiles
- **CRITICAL:** user_id references public.users but in school schema (cross-schema FK not enforced)
- **ISSUE:** No child linking in parents table, address fields not structured, no language preference

### Discipline System

**incident_types** - Customizable incident categories
- **ISSUE:** None critical

**merit_types** - Customizable merit categories
- **ISSUE:** None critical

**behaviour_incidents** - Demerit records
- **ISSUE:** No index on incident_date + student_id, points not validated against incident_type

**merits** - Positive behavior records
- **ISSUE:** No index on merit_date + student_id, points not validated against merit_type

**detention_rules** - Detention escalation rules
- **ISSUE:** auto_assign not implemented via trigger, no priority ordering

**detention_sessions** - Scheduled detentions
- **CRITICAL:** is_frozen not indexed, no capacity validation trigger
- **ISSUE:** teacher_on_duty_id can be null, no multi-teacher support in main table

**detention_assignments** - Student detention assignments
- **ISSUE:** No validation that detention is not full, attendance_time not validated

**detention_session_teachers** - Multi-teacher support
- **ISSUE:** None critical

### Consequences & Interventions

**consequences** - Consequence definitions
- **ISSUE:** None critical

**student_consequences** - Assigned consequences
- **CRITICAL:** parent_acknowledged not indexed, completion_verified not calculated
- **ISSUE:** due_date not validated against consequence.default_duration

**intervention_types** - Intervention categories
- **ISSUE:** None critical

**interventions** - Active interventions
- **ISSUE:** No index on student_id + status, parent_consent not validated

**intervention_sessions** - Intervention meetings
- **ISSUE:** No validation that session_date is within intervention date range

### Attendance System

**attendance** - Daily attendance
- **CRITICAL:** No constraint preventing duplicate attendance for same student/class/date/period
- **ISSUE:** late_minutes not validated against school setting, no bulk attendance tracking

**period_attendance_tables** (migration) - Per-period attendance system
- **ISSUE:** Multiple new tables not in main schema (incomplete migration)
- **Tables:** timetable_templates, time_slots, subjects, classrooms, class_timetables, period_sessions, period_attendance_records, student_dismissals, student_late_arrivals, attendance_flags

### Communication

**messages** - Internal messaging
- **ISSUE:** No thread support, no attachment tracking in separate table, no read receipt for groups

**notifications** - In-app notifications
- **ISSUE:** expires_at not indexed for cleanup, no notification grouping

### Academic Structure

**timetables** - Class schedules
- **ISSUE:** No conflict detection (teacher/classroom double-booking), no validation of day_of_week

**academic_years** - Academic year tracking
- **ISSUE:** No overlap validation, no current year enforcement

**terms** - Term tracking
- **ISSUE:** No validation that term is within academic year

### Customization & Settings

**customizations** - School branding
- **ISSUE:** No validation of color format (hex), no size limits on custom_css

**settings** - Key-value settings
- **ISSUE:** setting_value not validated against setting_type, no setting categories

**audit_log** - School-level audit
- **ISSUE:** No retention policy, metadata JSONB not validated

**import_history** - School import tracking
- **ISSUE:** Duplicate of public.import_history (redundancy)

---

## CRITICAL ISSUES SUMMARY

### Security Issues (5)

1. **users.password_reset_token stored in plain text** - Should be hashed
2. **users.password_hash** - No password history for rotation policies
3. **users** - No failed login attempt tracking or account lockout at DB level
4. **students.parent_link_code not hashed** - Security risk if leaked
5. **push_subscriptions.p256dh/auth** - Stored in plain text, should be encrypted

### Data Integrity Issues (8)

6. **schools.schema_name** - No FK validation to actual schema (orphan references)
7. **students.parent_id** - Cross-schema FK not enforced
8. **teachers.user_id** - Cross-schema FK not enforced
9. **parents.user_id** - Cross-schema FK not enforced
10. **students.demerit_points/merit_points** - Not calculated via trigger
11. **classes.student_count** - Not calculated via trigger
12. **invoices** - No validation that payment amount ≤ invoice amount
13. **attendance** - No constraint preventing duplicate records

### Performance Issues (4)

14. **user_sessions** - No cleanup of expired sessions
15. **email_queue** - No cleanup of failed emails
16. **push_subscriptions** - No cleanup of old subscriptions
17. **platform_logs, audit_log, theme_change_history** - No retention policies

### Missing Features (6)

18. **users** - No verification code storage for email_verified
19. **schools** - No cancellation reason tracking
20. **school_subscriptions** - No payment method stored
21. **invoices** - No transaction ID from payment gateway
22. **teachers** - No grade_head tracking
23. **attendance** - No bulk attendance tracking

### Schema Design Issues (4)

24. **user_schools.role_in_school** - Can differ from users.role (permission conflicts)
25. **students.medical_info/special_needs** - Should be JSONB not TEXT
26. **parents.address fields** - Should be separate address table
27. **timetables** - No conflict detection for double-booking

---

## RECOMMENDED FIXES

### HIGH PRIORITY (Security & Data Integrity)

1. **Hash password_reset_token** - Use bcrypt before storing
2. **Add cross-schema FK validation** - Application-level checks or use PostgreSQL FDW
3. **Add triggers for calculated fields** - student_count, demerit_points, merit_points
4. **Add invoice payment validation** - Trigger to prevent overpayment
5. **Hash parent_link_code** - Use bcrypt before storing
6. **Encrypt push subscription keys** - Use pgcrypto
7. **Add unique constraint** - Prevent duplicate attendance records
8. **Add failed login tracking** - New table or column in users

### MEDIUM PRIORITY (Performance & Maintenance)

9. **Add retention policies** - Auto-delete old logs, sessions, failed emails
10. **Add cleanup jobs** - Scheduled tasks for expired data
11. **Add proper indexing** - Token hash, withdrawal_date, expires_at
12. **Add data validation** - Color format, setting types, JSONB schemas
13. **Add missing foreign keys** - Where cross-schema is not needed

### LOW PRIORITY (Feature Enhancements)

14. **Add verification code storage** - For email_verified field
15. **Add cancellation reason** - To schools table
16. **Add payment method** - To school_subscriptions
17. **Add transaction ID** - To invoice_payments
18. **Add grade_head tracking** - To teachers table
19. **Refactor address fields** - Separate address table
20. **Add conflict detection** - For timetables

---

## ESTIMATED EFFORT

- High priority fixes: 3-5 days
- Medium priority fixes: 1-2 weeks
- Low priority fixes: 2-3 weeks

**Total Critical Issues:** 13  
**Total Issues Identified:** 27
