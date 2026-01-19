# Link Child Feature - Migration to Supabase Schema

## Changes Made

### 1. Backend Route Updated (`routes/parents.js`)
- **Changed**: `/parents/link-child` endpoint
- **Old behavior**: Updated `students.parent_id` column directly
- **New behavior**: Inserts into `parent_students` junction table
- **Key improvements**:
  - Uses PostgreSQL syntax (`$1`, `$2` instead of `?`)
  - Case-insensitive link code matching
  - `ON CONFLICT DO NOTHING` prevents duplicate links
  - Returns structured response with `success: true`
  - Better error logging with dev mode details

### 2. Database Migration Created
- **File**: `003_create_parent_students.sql`
- **Creates**:
  - `parent_students` table (parent_id UUID, student_id UUID, created_at)
  - Indexes on both foreign keys
  - `students.parent_link_code` column (if not exists)
  - Index on `parent_link_code` for fast lookups

### 3. Frontend API Client
- **Already correct**: `api.linkChild()` sends to `/parents/link-child`
- **Authorization**: Automatically added by axios interceptor

## How to Apply

### Step 1: Run Database Migration
Go to your Supabase SQL Editor and run:
```sql
-- Copy and paste the contents of:
-- backend/database/migrations/003_create_parent_students.sql
```

### Step 2: Generate Link Codes for Existing Students
If you have existing students without link codes:
```sql
UPDATE students 
SET parent_link_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE parent_link_code IS NULL;
```

### Step 3: Restart Backend Server
```bash
cd "c:\Projects\pds system\backend"
npm start
```

### Step 4: Test Link Child Feature
1. Log in as a parent
2. Go to `/parent/link-child`
3. Enter a student's link code
4. Verify the link is created in `parent_students` table

## API Response Format

**Success (200)**:
```json
{
  "success": true,
  "message": "Child linked successfully",
  "student": {
    "id": "uuid-here",
    "student_number": "12345",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Error (400/403/404/500)**:
```json
{
  "error": "Error message here"
}
```

## Troubleshooting

### Error: "relation 'parent_students' does not exist"
- Run the migration SQL in Supabase SQL Editor

### Error: "column 'parent_link_code' does not exist"
- The migration adds this column automatically
- Ensure migration ran successfully

### Error: "Invalid link code"
- Verify the student has a `parent_link_code` set
- Check case sensitivity (now case-insensitive)

### Error: "You must link a school first"
- Parent must have `school_id` set in `user_profiles`
- Complete school linking first
