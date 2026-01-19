# Link School Feature - Complete Fix

## Problem
Parent "Link to School" shows success modal but UI still says "No Schools Linked" and parent cannot navigate to other pages.

## Root Cause
- Backend was correctly updating `user_profiles.school_id` and `user_schools` table
- Frontend was calling `refreshProfile()` but not navigating after success
- RLS policies were missing on `user_schools` table, potentially blocking reads

## Solution Summary

### 1. Backend Route (Already Correct)
**File**: `backend/routes/parents.js` (lines 160-215)

The route correctly:
- ✅ Finds school by `schools.code` (case-insensitive)
- ✅ Inserts into `user_schools` with `ON CONFLICT DO NOTHING`
- ✅ Updates `user_profiles.school_id`
- ✅ Returns `{ success: true, school: { id, name, code } }`
- ✅ Uses `req.user.id` (Supabase UUID from auth middleware)
- ✅ Added detailed logging for debugging

**Enhanced Logging Output**:
```
✅ School found: Test High School (ID: uuid-here) for code: THS001
📝 Inserting into user_schools - user_id: uuid-here school_id: uuid-here
✅ user_schools insert successful
📝 Updating user_profiles.school_id for user: uuid-here
✅ user_profiles.school_id updated successfully
🎉 School linked successfully for user: uuid-here
```

### 2. Frontend Changes
**File**: `frontend/src/pages/parent/LinkSchool.tsx`

**Change 1**: Fixed navigate variable (line 18)
```diff
- const _navigate = useNavigate();
+ const navigate = useNavigate();
```

**Change 2**: Navigate to link-child after success (lines 84-89)
```diff
  const handleContinue = () => {
    setSuccess(false);
    setLinkedSchool(null);
-   fetchLinkedSchools();
+   // Navigate to link-child page after successful school linking
+   navigate('/parent/link-child');
  };
```

**Already Correct** (lines 59-61):
```typescript
// Refresh profile data and linked schools from server
await refreshProfile();
await fetchLinkedSchools();
```

### 3. RLS Policies (CRITICAL)
**File**: `backend/database/migrations/004_user_schools_rls_policies.sql`

Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on user_schools table
ALTER TABLE user_schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own school memberships" ON user_schools;
DROP POLICY IF EXISTS "Users can insert their own school memberships" ON user_schools;
DROP POLICY IF EXISTS "Users can delete their own school memberships" ON user_schools;

-- Policy: Users can SELECT their own rows
CREATE POLICY "Users can view their own school memberships"
ON user_schools
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can INSERT their own rows
CREATE POLICY "Users can insert their own school memberships"
ON user_schools
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can DELETE their own rows (optional)
CREATE POLICY "Users can delete their own school memberships"
ON user_schools
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

## Complete Testing Flow

### Step 1: Run RLS Policies
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL from `004_user_schools_rls_policies.sql`
3. Click "Run"
4. Verify policies are created:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'user_schools';
   ```

### Step 2: Restart Backend
```bash
cd "c:\Projects\pds system\backend"
npm start
```

### Step 3: Test Link School Flow
1. Log in as a parent
2. Navigate to `/parent/link-school`
3. Enter a valid school code (e.g., `THS001`)
4. Click "Link to School"
5. **Expected**:
   - Success modal appears
   - Backend logs show all ✅ messages
   - Click "Continue" → navigates to `/parent/link-child`
   - Profile is updated with `school_id`
   - Navigation unlocks

### Step 4: Verify Data Persistence
```sql
-- Check user_profiles was updated
SELECT id, email, role, school_id FROM user_profiles WHERE id = 'your-user-uuid';

-- Check user_schools has entry
SELECT * FROM user_schools WHERE user_id = 'your-user-uuid';

-- Check via API
GET /api/parents/my-school
```

## API Endpoints

### POST /api/parents/link-school
**Request**:
```json
{
  "code": "THS001"
}
```

**Success Response (200)**:
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

### GET /api/parents/my-school (Debug Endpoint)
**Response**:
```json
{
  "school": {
    "id": "uuid-here",
    "name": "Test High School",
    "code": "THS001"
  }
}
```

## Troubleshooting

### Issue: "No Schools Linked" still shows after success
**Cause**: RLS policies not applied or `fetchLinkedSchools()` failing
**Fix**: 
1. Run RLS policies SQL
2. Check browser console for API errors
3. Verify `GET /api/parents/linked-schools` returns data

### Issue: Backend logs show success but profile not updated
**Cause**: Database transaction failed silently
**Fix**:
1. Check backend terminal for error messages
2. Verify `user_profiles` table exists and has `school_id` column
3. Test manually:
   ```sql
   UPDATE user_profiles SET school_id = 'school-uuid' WHERE id = 'user-uuid';
   ```

### Issue: Navigation still blocked after linking
**Cause**: `refreshProfile()` not updating context
**Fix**:
1. Check `SupabaseAuthContext.tsx` `refreshProfile()` implementation
2. Verify it fetches from `user_profiles` table
3. Clear localStorage and re-login
4. Check `ModernParentLayout.tsx` routing guards

### Issue: RLS policy errors
**Cause**: Policies already exist with different names
**Fix**:
```sql
-- List all policies
SELECT policyname FROM pg_policies WHERE tablename = 'user_schools';

-- Drop all policies
DROP POLICY IF EXISTS "policy-name-here" ON user_schools;

-- Re-run the RLS policies SQL
```

## Code Diff Summary

### Backend (routes/parents.js)
```diff
  console.log('School found:', school.name, 'for code:', code);
+ console.log('✅ School found:', school.name, '(ID:', school.id, ') for code:', code);

+ console.log('📝 Inserting into user_schools - user_id:', req.user.id, 'school_id:', school.id);
  await dbRun(
      `INSERT INTO user_schools (user_id, school_id, created_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id, school_id) DO NOTHING`,
      [req.user.id, school.id]
  );
+ console.log('✅ user_schools insert successful');

+ console.log('📝 Updating user_profiles.school_id for user:', req.user.id);
  await dbRun(
      'UPDATE user_profiles SET school_id = $1 WHERE id = $2',
      [school.id, req.user.id]
  );
+ console.log('✅ user_profiles.school_id updated successfully');
```

### Frontend (pages/parent/LinkSchool.tsx)
```diff
- const _navigate = useNavigate();
+ const navigate = useNavigate();

  const handleContinue = () => {
    setSuccess(false);
    setLinkedSchool(null);
-   fetchLinkedSchools();
+   // Navigate to link-child page after successful school linking
+   navigate('/parent/link-child');
  };
```

## Files Modified
1. ✅ `backend/routes/parents.js` - Enhanced logging
2. ✅ `frontend/src/pages/parent/LinkSchool.tsx` - Fixed navigation
3. ✅ `backend/database/migrations/004_user_schools_rls_policies.sql` - NEW RLS policies

## Next Steps After Fix
1. Test school linking with real school code
2. Verify navigation unlocks to `/parent/link-child`
3. Test linking a child after school is linked
4. Verify multi-school switching works correctly
5. Test logout and re-login to ensure persistence
