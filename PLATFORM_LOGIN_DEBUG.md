# Platform Login Debug Guide

## Issue
User logs in with super admin credentials but gets "platform access from admin required" error.

## What We Verified
✅ Platform admin exists in database (ID: 1)
✅ Email: superadmin@pds.com
✅ Password: superadmin123 (matches database)
✅ Backend auth route returns correct data

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors when logging in

### Step 2: Check LocalStorage
1. In DevTools, go to Application tab
2. Look at Local Storage
3. Check these keys:
   - `platform_token` - Should exist after login
   - `platform_user` - Should contain user data

### Step 3: Verify User Data
In browser console, run:
```javascript
JSON.parse(localStorage.getItem('platform_user'))
```

Should return:
```json
{
  "id": 1,
  "email": "superadmin@pds.com",
  "name": "Super Admin",
  "role": "platform_admin",
  "isPlatformAdmin": true
}
```

### Step 4: Check Token
In browser console, run:
```javascript
localStorage.getItem('platform_token')
```

Should return a JWT token string.

## Common Issues

### Issue 1: Wrong Login Page
- Make sure you're at: `http://localhost:3001/platform/login`
- NOT the regular login at: `http://localhost:3001/login`

### Issue 2: Old Token
If you previously logged in as regular admin, clear storage:
```javascript
localStorage.clear()
```
Then refresh and login again.

### Issue 3: Role Mismatch
The backend returns `role: "platform_admin"` but frontend might be checking for different value.

Check ProtectedRoute.tsx line 32:
```typescript
if (platformUser.role !== 'platform_admin') {
  return <Navigate to="/platform/login" replace />;
}
```

## Quick Fix Steps

1. **Clear browser storage:**
   - Open DevTools → Application → Local Storage
   - Right-click → Clear
   - Refresh page

2. **Login again:**
   - Go to: http://localhost:3001/platform/login
   - Email: superadmin@pds.com
   - Password: superadmin123

3. **Check console for errors**

4. **If still failing, check Network tab:**
   - Look for `/api/auth/login` request
   - Check response data
   - Verify it contains `isPlatformAdmin: true`

## Expected Flow

1. User goes to `/platform/login`
2. Enters credentials
3. Frontend calls `api.platformLogin()`
4. Backend checks `platform_users` table
5. Returns token + user object with `role: "platform_admin"`
6. Frontend stores in localStorage
7. ProtectedRoute checks `platformUser.role === 'platform_admin'`
8. Allows access to platform routes

## If Error Persists

The error message "platform access from admin required" suggests:
- Either `platformUser` is null
- Or `platformUser.role` is not "platform_admin"

This could mean:
1. Login succeeded but data not stored correctly
2. Data stored but not loaded correctly on page refresh
3. Wrong auth context being used (regular Auth vs PlatformAuth)
