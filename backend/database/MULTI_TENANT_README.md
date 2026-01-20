# Multi-Tenant Architecture Documentation

## Overview

This document describes the schema-per-school multi-tenant architecture implemented for the Positive Discipline System (PDS). This architecture provides complete data isolation between schools, enabling the platform to safely scale to 50+ schools.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  PUBLIC SCHEMA (Shared)                                          │
│  ├── platform_users (Super admins)                               │
│  ├── schools (School registry with schema_name)                  │
│  ├── users (All users with primary_school_id)                    │
│  ├── user_schools (Multi-school linking)                         │
│  ├── subscription_plans                                          │
│  ├── school_subscriptions                                        │
│  ├── platform_logs                                               │
│  └── import_history                                              │
├─────────────────────────────────────────────────────────────────┤
│  SCHOOL_WS2025 SCHEMA (Westgold School)                          │
│  ├── students, teachers, parents, classes                        │
│  ├── behaviour_incidents, merits, attendance                     │
│  ├── detentions, detention_assignments                           │
│  ├── messages, notifications                                     │
│  ├── incident_types, merit_types (customizable)                  │
│  └── customizations, settings                                    │
├─────────────────────────────────────────────────────────────────┤
│  SCHOOL_GV2025 SCHEMA (Green Valley School)                      │
│  ├── (Same tables as above, completely isolated)                 │
│  └── ...                                                         │
├─────────────────────────────────────────────────────────────────┤
│  SCHOOL_ES2025 SCHEMA (Eastside School)                          │
│  └── ...                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

### Database Schema
- `init_multi_tenant.sql` - Public schema tables
- `school_schema_template.sql` - Template for school-specific schemas
- `rls_policies.sql` - Row-Level Security policies (backup safety)

### Schema Management
- `schemaManager.js` - Functions to create/drop/manage school schemas
- `db.js` - Database connection with schema context support

### Middleware
- `middleware/schemaContext.js` - Subdomain-based schema detection
- `middleware/auth.js` - JWT authentication with schema context

### Routes
- `routes/schoolOnboarding.js` - Platform admin school management
- `routes/auth.js` - Multi-tenant authentication

### Utilities
- `utils/schemaHelper.js` - Helper functions for schema-aware queries

### Migration
- `migrations/migrate_to_multi_tenant.js` - Migration script

## How It Works

### 1. School Onboarding

When a platform admin creates a new school:

```javascript
POST /api/schools/onboard
{
  "name": "Westgold High School",
  "code": "WS2025",
  "subdomain": "westgold",
  "adminEmail": "admin@westgold.edu",
  "adminName": "John Smith"
}
```

The system:
1. Creates a record in `public.schools` with `schema_name = 'school_ws2025'`
2. Creates the `school_ws2025` schema with all tables
3. Seeds default incident types, merit types, etc.
4. Creates the admin user in `public.users`
5. Links admin to school in `public.user_schools`

### 2. User Authentication

When a user logs in:

```javascript
POST /api/auth/login
{
  "email": "teacher@westgold.edu",
  "password": "password123"
}
```

The system:
1. Finds user in `public.users`
2. Gets user's schools from `public.user_schools`
3. If single school: auto-selects and generates token with schema context
4. If multiple schools: returns list for user to select
5. JWT token contains: `{ userId, schoolId, schemaName }`

### 3. Request Handling

Every authenticated request:

1. **Auth middleware** extracts JWT and sets `req.user`, `req.schemaName`, `req.schoolId`
2. **Schema context middleware** (optional) can also detect from subdomain
3. **Route handlers** use `schemaHelper` functions that automatically use correct schema

```javascript
// In any route handler:
const { schemaGet, schemaAll } = require('../utils/schemaHelper');

// This automatically queries the user's school schema
const students = await schemaAll(req, 'SELECT * FROM students WHERE is_active = true');
```

### 4. Subdomain Support

For subdomain-based access (e.g., `westgold.yourdomain.com`):

```javascript
// Middleware extracts subdomain and sets schema context
app.use(setSchemaFromSubdomain);

// Request to westgold.yourdomain.com automatically uses school_ws2025 schema
```

## Migration Guide

### Step 1: Backup Database
```bash
pg_dump your_database > backup_before_migration.sql
```

### Step 2: Run Migration
```bash
cd backend/database/migrations
node migrate_to_multi_tenant.js
```

### Step 3: Verify Migration
- Check that `public.schools` has `schema_name` for each school
- Check that school schemas exist: `\dn` in psql
- Verify data in school schemas

### Step 4: Update Environment
```env
# Add to .env
PLATFORM_ADMIN_EMAIL=superadmin@yourplatform.com
PLATFORM_ADMIN_PASSWORD=YourSecurePassword123!
```

### Step 5: Test Login
```bash
# Test platform admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@yourplatform.com","password":"YourSecurePassword123!"}'
```

## Updating Existing Routes

To make an existing route multi-tenant aware:

### Before (Old Way)
```javascript
router.get('/students', async (req, res) => {
  const students = await dbAll('SELECT * FROM students WHERE school_id = ?', [req.user.school_id]);
  res.json(students);
});
```

### After (New Way)
```javascript
const { schemaAll } = require('../utils/schemaHelper');

router.get('/students', async (req, res) => {
  // Automatically uses the correct school schema from req.schemaName
  const students = await schemaAll(req, 'SELECT * FROM students WHERE is_active = true');
  res.json(students);
});
```

## Security Layers

### Layer 1: Schema Isolation (Primary)
- Each school's data is in a separate PostgreSQL schema
- Queries can only access tables in the current `search_path`
- Even SQL injection cannot access other schools' data

### Layer 2: JWT Schema Context
- JWT tokens contain `schemaName` and `schoolId`
- Backend validates token and sets schema context
- Users can only access schools they're linked to

### Layer 3: Row-Level Security (Backup)
- RLS policies on public tables
- Additional protection if application code has bugs
- See `rls_policies.sql` for implementation

### Layer 4: Application-Level Checks
- `verifySchoolAccess()` function validates access
- `requireSchoolContext` middleware ensures schema is set
- Audit logging tracks all actions

## API Endpoints

### Platform Admin
- `POST /api/schools/onboard` - Create new school
- `GET /api/schools` - List all schools
- `GET /api/schools/:id` - Get school details
- `PATCH /api/schools/:id` - Update school
- `POST /api/schools/:id/suspend` - Suspend school
- `POST /api/schools/:id/activate` - Activate school
- `DELETE /api/schools/:id` - Delete school (dangerous!)
- `POST /api/schools/:id/add-admin` - Add admin to school

### Authentication
- `POST /api/auth/login` - Login (returns school list if multiple)
- `POST /api/auth/select-school` - Select school after login
- `POST /api/auth/signup` - Parent signup
- `POST /api/auth/link-student` - Link parent to student
- `GET /api/auth/me` - Get current user with school context

## Common Issues

### "School context required" Error
The user is trying to access a school-specific endpoint without being logged into a school. Ensure:
1. User is authenticated
2. JWT token contains `schemaName`
3. User is linked to a school in `user_schools`

### "Access denied to this school" Error
The user is trying to access a school they're not linked to. Check:
1. `user_schools` table has entry for user + school
2. User's `primary_school_id` matches if no `user_schools` entry

### Schema Not Found
The school's schema doesn't exist. Run:
```javascript
const { createSchoolSchema } = require('./database/schemaManager');
await createSchoolSchema('SCHOOLCODE');
```

## Performance Considerations

1. **Connection Pooling**: Pool is set to 30 connections for multi-tenant workload
2. **Schema Caching**: School lookups are cached for 5 minutes
3. **Indexes**: All school schemas have indexes on common query columns
4. **Query Timeout**: Set to 15 seconds for complex queries

## Future Improvements

1. **Read Replicas**: Route read queries to replicas per school
2. **Schema Partitioning**: Partition large tables by date
3. **Data Archiving**: Archive old academic years
4. **Tenant Metrics**: Per-school usage tracking
5. **Auto-Scaling**: Dynamic connection pool per school load
