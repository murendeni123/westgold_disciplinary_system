# Google Sign-In Diagnostic Report

## Current Configuration

### Frontend (Supabase)
- **Supabase URL**: `https://kkmvxmbnmjbrwtfaihas.supabase.co`
- **Supabase Anon Key**: Configured ✓
- **OAuth Provider**: Google
- **Redirect URL**: `${window.location.origin}/auth/callback`

### Backend (Sync Endpoint)
- **Endpoint**: `/api/auth/supabase-sync`
- **Method**: POST
- **Purpose**: Sync Supabase OAuth users to local database

## Google Sign-In Flow

1. **User clicks "Sign in with Google"**
   - Frontend calls: `loginWithGoogle()` or `signupWithGoogle()`
   - Supabase initiates OAuth flow: `supabase.auth.signInWithOAuth({ provider: 'google' })`

2. **Google OAuth Redirect**
   - User authenticates with Google
   - Google redirects to: `${origin}/auth/callback?code=...`

3. **Callback Handler**
   - `AuthCallback.tsx` processes the OAuth callback
   - Exchanges code for session: `supabase.auth.exchangeCodeForSession(code)`

4. **Backend Sync**
   - Frontend calls: `/api/auth/supabase-sync`
   - Backend creates/updates user in `public.users` table
   - Returns JWT token for app authentication

5. **User Redirected**
   - Parent users: Need to link student (if no school)
   - Other users: Redirect to dashboard

## Common Issues & Solutions

### Issue 1: Supabase Google OAuth Not Configured
**Symptoms**: 
- "Provider not enabled" error
- OAuth redirect fails

**Solution**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Configure OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Add authorized redirect URIs in Google Cloud Console:
   - `https://kkmvxmbnmjbrwtfaihas.supabase.co/auth/v1/callback`
   - `https://dashboard.render.com/auth/callback` (production)
   - `http://localhost:3001/auth/callback` (development)

### Issue 2: Redirect URI Mismatch
**Symptoms**:
- "redirect_uri_mismatch" error
- OAuth fails after Google authentication

**Solution**:
1. Check Google Cloud Console → APIs & Services → Credentials
2. Add all redirect URIs:
   - Supabase callback URL
   - Production frontend URL
   - Development frontend URL

### Issue 3: Backend Sync Fails
**Symptoms**:
- User authenticated in Supabase but not logged into app
- "Internal server error" after OAuth

**Solution**:
1. Check backend logs for `/api/auth/supabase-sync` errors
2. Verify `public.users` table has `supabase_user_id` column
3. Check database connection in production

### Issue 4: Missing School Context
**Symptoms**:
- User logged in but sees "No school access" error
- Parent needs to link student

**Expected Behavior**:
- New OAuth users are created as "parent" role
- They must link to a student using link code
- After linking, they get school context

### Issue 5: CORS Issues
**Symptoms**:
- Network errors in browser console
- "Access-Control-Allow-Origin" errors

**Solution**:
1. Check backend CORS configuration in `server.js`
2. Ensure Supabase URL is allowed in CORS origins
3. Verify API URL in frontend `.env`

## Debugging Steps

### 1. Check Supabase Configuration
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
  https://kkmvxmbnmjbrwtfaihas.supabase.co/auth/v1/settings
```

### 2. Check Browser Console
- Open DevTools → Console
- Look for errors during OAuth flow
- Check Network tab for failed requests

### 3. Check Backend Logs (Render)
- Look for `/api/auth/supabase-sync` requests
- Check for database errors
- Verify user creation/update

### 4. Test OAuth Flow Manually
1. Click "Sign in with Google"
2. Check URL after Google redirect (should have `code` parameter)
3. Check if `/auth/callback` page loads
4. Check if sync request is sent to backend
5. Check if JWT token is received and stored

## Required Supabase Settings

### Authentication → URL Configuration
- **Site URL**: `https://dashboard.render.com` (production)
- **Redirect URLs**: 
  - `https://dashboard.render.com/auth/callback`
  - `http://localhost:3001/auth/callback`

### Authentication → Providers → Google
- **Enabled**: Yes
- **Client ID**: From Google Cloud Console
- **Client Secret**: From Google Cloud Console
- **Authorized Client IDs**: (optional)

### Authentication → Email Templates
- Confirm signup template (if email verification enabled)
- Reset password template

## Database Schema Requirements

### public.users table must have:
```sql
supabase_user_id TEXT UNIQUE
auth_provider TEXT
last_sign_in TIMESTAMP
```

### Migration to add columns (if missing):
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS supabase_user_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMP;
```

## Next Steps to Diagnose

1. **Check Supabase Dashboard**:
   - Go to Authentication → Users
   - See if users are being created in Supabase
   - Check authentication logs

2. **Check Production Logs**:
   - Look for errors in Render backend logs
   - Search for "Supabase sync" or "Google login"

3. **Test Locally**:
   - Run frontend on port 3001
   - Try Google Sign-In
   - Check browser console for errors

4. **Verify Environment Variables**:
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Backend: `DATABASE_URL`

## Status Indicators

✅ **Working**: User can sign in with Google and access app
⚠️ **Partial**: User authenticates but needs to link student
❌ **Broken**: OAuth fails or backend sync fails

---

**Last Updated**: Feb 4, 2026
