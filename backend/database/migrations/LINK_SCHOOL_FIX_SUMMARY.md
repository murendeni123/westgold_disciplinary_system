# Link School Feature - Fixed for Supabase Schema

## Summary of Changes

### 1. Backend Route Updated (`routes/parents.js`)

**POST /api/parents/link-school**
- **Changed**: Now accepts `{ code: string }` instead of `{ school_code: string }`
- **Lookup**: Uses `schools.code ILIKE $1` (case-insensitive)
- **Actions**:
  1. Finds school by code
  2. Inserts into `user_schools` table with `ON CONFLICT DO NOTHING`
  3. Updates `user_profiles.school_id` (not legacy `users` table)
- **Response**: `{ success: true, school: { id, name, code } }`
- **Errors**: 
  - 400 if code missing
  - 404 if school not found
  - 500 with detailed message in dev mode

**GET /api/parents/my-school** (NEW - for debugging)
- Returns current linked school from `user_profiles.school_id`
- Response: `{ school: { id, name, code } }` or `{ school: null, message: "No school linked yet" }`

### 2. Frontend API Client Updated (`services/api.ts`)
- **Changed**: `linkSchoolByCode(code)` now sends `{ code }` instead of `{ school_code: code }`
- **Already correct**: LinkSchool page calls `refreshProfile()` after successful linking

### 3. Database Schema Requirements
Tables must exist:
- `schools` with columns: `id` (uuid), `code` (text unique), `name` (text)
- `user_profiles` with columns: `id` (uuid), `school_id` (uuid nullable)
- `user_schools` with columns: `user_id` (uuid), `school_id` (uuid), `created_at`, unique constraint on (user_id, school_id)

## Testing Instructions

### 1. Verify Database Schema
```sql
-- Check schools table has code column
SELECT id, name, code FROM schools LIMIT 5;

-- Check user_schools table exists
SELECT * FROM user_schools LIMIT 1;

-- Check user_profiles has school_id column
SELECT id, email, role, school_id FROM user_profiles LIMIT 5;
```

### 2. Create Test School (if needed)
```sql
INSERT INTO schools (id, name, code, email, status)
VALUES (
  gen_random_uuid(),
  'Test High School',
  'THS001',
  'admin@testschool.com',
  'active'
);
```

### 3. Restart Backend
```bash
cd "c:\Projects\pds system\backend"
npm start
```

### 4. Test Link School Flow
1. Log in as a parent
2. Navigate to `/parent/link-school`
3. Enter school code (e.g., `THS001`)
4. Click "Link School"
5. Verify success message appears
6. Check that profile is updated: `GET /api/parents/my-school`

### 5. Verify Profile Update
After linking, the parent's profile should have:
- `user_profiles.school_id` = linked school's UUID
- Entry in `user_schools` table
- Navigation should unlock to `/parent/link-child`

## API Endpoints

### POST /api/parents/link-school
**Request:**
```json
{
  "code": "THS001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "school": {
    "id": "uuid-here",
    "name": "Test High School",
    "code": "THS001"
  }
}
```

**Error Responses:**
- 400: `{ "error": "School code is required" }`
- 404: `{ "error": "Invalid school code" }`
- 500: `{ "error": "Internal server error: [details in dev mode]" }`

### GET /api/parents/my-school
**Success Response (200):**
```json
{
  "school": {
    "id": "uuid-here",
    "name": "Test High School",
    "code": "THS001"
  }
}
```

**No School Linked:**
```json
{
  "school": null,
  "message": "No school linked yet"
}
```

## Troubleshooting

### Error: "School code is required"
- Frontend is not sending `code` parameter
- Check network tab: request body should be `{ "code": "THS001" }`

### Error: "Invalid school code"
- School doesn't exist in database
- Check: `SELECT * FROM schools WHERE code ILIKE 'THS001'`
- Verify school code is correct (case-insensitive)

### Error: "relation 'user_schools' does not exist"
- Create the table:
```sql
CREATE TABLE user_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);
```

### Profile not updating after linking
- Check backend logs for errors
- Verify `refreshProfile()` is called in LinkSchool.tsx (line 60)
- Test manually: `GET /api/parents/my-school`

### Navigation still blocked after linking
- Clear browser localStorage and re-login
- Verify `user_profiles.school_id` is set in database
- Check ModernParentLayout.tsx routing logic

## Console Logging
Backend logs will show:
```
School found: Test High School for code: THS001
School linked successfully for user: uuid-here
```

If errors occur:
```
School not found for code: INVALID
Link school failed: Error: [details]
```
