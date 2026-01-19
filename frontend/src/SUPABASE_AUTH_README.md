# Supabase Authentication Implementation

This document describes the complete Supabase Auth implementation for the PDS frontend.

## Files Created

```
src/
├── lib/
│   └── supabaseClient.ts      # Supabase client singleton
├── types/
│   ├── supabase.ts            # Database types
│   └── auth.ts                # Auth-related types
├── contexts/
│   └── SupabaseAuthContext.tsx # Auth state management
├── components/
│   └── SupabaseProtectedRoute.tsx # Route protection
├── pages/
│   ├── SupabaseLogin.tsx      # Login page
│   └── Unauthorized.tsx       # Access denied page
└── App.supabase.tsx           # Example App.tsx with Supabase auth
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the frontend directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project:
- Go to Project Settings > API
- Copy the Project URL and anon/public key

### 2. Database Setup

Ensure your Supabase database has the `user_profiles` table:

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'school_admin', 'teacher', 'parent')),
  full_name TEXT NOT NULL,
  whatsapp_number TEXT,
  whatsapp_opt_in BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### 3. Switch to Supabase Auth

Replace your current `App.tsx` with `App.supabase.tsx`:

```bash
# Backup current App.tsx
mv src/App.tsx src/App.legacy.tsx

# Use Supabase version
mv src/App.supabase.tsx src/App.tsx
```

## Architecture

### Authentication Flow

1. **App Load**: `AuthProvider` checks for existing session via `supabase.auth.getSession()`
2. **Session Found**: Fetches user profile from `user_profiles` table
3. **Login**: Calls `supabase.auth.signInWithPassword()`, then fetches profile
4. **State Change**: `onAuthStateChange` listener updates state on any auth event
5. **Logout**: Calls `supabase.auth.signOut()` and clears local state

### Role-Based Access

| Role | Route Prefix | Description |
|------|--------------|-------------|
| `superadmin` | `/platform` | Platform-wide administration |
| `school_admin` | `/admin` | School-level administration |
| `teacher` | `/teacher` | Teacher portal |
| `parent` | `/parent` | Parent portal |

### Protected Routes

```tsx
<ProtectedRoute allowedRoles={['school_admin']}>
  <AdminLayout />
</ProtectedRoute>
```

- Shows loading spinner while checking auth
- Redirects to `/login` if not authenticated
- Redirects to `/unauthorized` if role doesn't match

## API Reference

### useAuth Hook

```tsx
const {
  user,           // Supabase User object
  session,        // Current session with tokens
  profile,        // User profile from user_profiles table
  role,           // User's role (convenience accessor)
  loading,        // True while checking auth state
  signIn,         // (email, password) => Promise<SignInResult>
  signOut,        // () => Promise<void>
  refreshProfile, // () => Promise<void>
} = useAuth();
```

### SignInResult

```tsx
interface SignInResult {
  success: boolean;
  error?: string;
  role?: UserRole;
}
```

## Migration Notes

### Role Name Changes

| Old Role | New Role |
|----------|----------|
| `admin` | `school_admin` |
| `platform_admin` | `superadmin` |
| `teacher` | `teacher` (unchanged) |
| `parent` | `parent` (unchanged) |

### Removed Dependencies

- `axios` for auth (still used for other API calls)
- `localStorage` token management (handled by Supabase)
- Custom JWT handling

### What's Preserved

- All existing page components
- Layout components
- NotificationContext
- SchoolThemeContext
- UI/UX design

## Troubleshooting

### "Missing Supabase environment variables"

Ensure `.env` file exists with valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### "User profile not found"

The user exists in `auth.users` but not in `user_profiles`. Create a profile:

```sql
INSERT INTO user_profiles (id, role, full_name)
VALUES ('user-uuid-here', 'school_admin', 'User Name');
```

### Session not persisting

Check browser localStorage for `sb-<project-ref>-auth-token`. If missing:
- Verify `persistSession: true` in supabaseClient.ts
- Check for localStorage quota issues
- Ensure no other code is clearing localStorage

## Security Considerations

1. **Never expose service role key** - Only use anon key in frontend
2. **Enable RLS** - All tables should have Row Level Security
3. **Validate on backend** - Don't trust frontend role checks alone
4. **Use HTTPS** - Supabase enforces this by default
