# Supabase Migration Guide

This document outlines the complete migration process from the old PostgreSQL database to Supabase.

## Overview

The PDS system is migrating from a direct PostgreSQL connection (`pg` Pool) to Supabase. Both methods connect to the same Supabase PostgreSQL database, but the Supabase JS client provides additional features:

- **Row Level Security (RLS)** - Fine-grained access control
- **Realtime subscriptions** - Live data updates
- **Built-in Auth** - User authentication and management
- **Edge Functions** - Serverless functions
- **Storage** - File storage with CDN

## Migration Phases

### Phase 1: Dual Connection (Current)
- Both `pg` Pool and Supabase JS client can connect
- `DATABASE_URL` points to Supabase PostgreSQL
- Application uses `pg` Pool by default
- Supabase client available for new features

### Phase 2: Switch to Supabase Client
- Set `USE_SUPABASE=true` in `.env`
- All database operations use Supabase JS client
- Test thoroughly in staging environment

### Phase 3: Freeze Old DB & Go Live
- Confirm team stability
- Freeze old database (read-only)
- Full production deployment

---

## Setup Instructions

### Step 1: Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

5. Go to **Settings** → **Database**
6. Copy the **Connection string** → `DATABASE_URL`

### Step 2: Update Environment Variables

Edit your `.env` file:

```env
# PostgreSQL Connection (for pg Pool)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Mode (set to 'true' to use Supabase JS client)
USE_SUPABASE=false
```

### Step 3: Test Connection

Run the connection test script:

```bash
cd backend
node scripts/testSupabaseConnection.js
```

Expected output:
```
✅ PostgreSQL Pool (DATABASE_URL): Working
✅ Supabase JS Client: Working
```

### Step 4: Enable Supabase Client (Optional)

Once tests pass, you can switch to the Supabase JS client:

```env
USE_SUPABASE=true
```

---

## File Structure

```
backend/
├── database/
│   ├── db.js              # Original pg Pool implementation
│   ├── supabaseDb.js      # Supabase JS client implementation
│   └── index.js           # Unified module (auto-selects based on config)
├── lib/
│   └── supabaseClient.js  # Supabase client singleton
├── scripts/
│   └── testSupabaseConnection.js  # Connection test script
└── .env.example           # Environment variable template
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup existing database
- [ ] Document current DATABASE_URL
- [ ] Get Supabase credentials from dashboard
- [ ] Update `.env` with Supabase variables

### Testing Phase
- [ ] Run `node scripts/testSupabaseConnection.js`
- [ ] Verify PostgreSQL Pool connection works
- [ ] Verify Supabase JS client connection works
- [ ] Test all API endpoints with `USE_SUPABASE=false`
- [ ] Test all API endpoints with `USE_SUPABASE=true`

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Test authentication flow
- [ ] Test CRUD operations for all entities
- [ ] Test WhatsApp notifications
- [ ] Verify audit logging works

### Production Deployment
- [ ] Schedule maintenance window
- [ ] Notify team of migration
- [ ] Set `USE_SUPABASE=true` in production
- [ ] Monitor error logs
- [ ] Verify all features working
- [ ] Freeze old database (if separate)

### Post-Migration
- [ ] Document any issues encountered
- [ ] Update team on new architecture
- [ ] Remove old database references (if applicable)
- [ ] Enable RLS policies (optional)
- [ ] Set up Supabase realtime (optional)

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution:** Check that your `DATABASE_URL` or `SUPABASE_URL` is correct and the database is accessible.

### SSL Certificate Error
```
Error: self signed certificate in certificate chain
```
**Solution:** The `db.js` already handles this with `ssl: { rejectUnauthorized: false }` for Supabase connections.

### Table Does Not Exist
```
Error: relation "schools" does not exist
```
**Solution:** Run the database migrations:
```bash
# Apply the schema
psql $DATABASE_URL -f database/init_postgres.sql
```

### RLS Policy Violation
```
Error: new row violates row-level security policy
```
**Solution:** When using `SUPABASE_SERVICE_ROLE_KEY`, RLS is bypassed. If using `SUPABASE_ANON_KEY`, ensure RLS policies allow the operation.

---

## API Compatibility

The migration maintains full API compatibility. All existing endpoints continue to work:

| Endpoint | Status |
|----------|--------|
| `/api/auth/*` | ✅ Compatible |
| `/api/students/*` | ✅ Compatible |
| `/api/teachers/*` | ✅ Compatible |
| `/api/classes/*` | ✅ Compatible |
| `/api/behaviour/*` | ✅ Compatible |
| `/api/merits/*` | ✅ Compatible |
| `/api/attendance/*` | ✅ Compatible |
| `/api/whatsapp/*` | ✅ Compatible |
| `/api/analytics/*` | ✅ Compatible |

---

## Security Notes

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the frontend
2. The service role key bypasses all RLS policies
3. Use `SUPABASE_ANON_KEY` for client-side operations
4. Enable RLS policies for additional security layer

---

## Rollback Plan

If issues occur after migration:

1. Set `USE_SUPABASE=false` in `.env`
2. Restart the server
3. The application will use the `pg` Pool connection
4. Both connect to the same database, so no data loss

---

## Support

For issues with this migration:
1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check server logs for detailed error messages
