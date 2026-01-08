# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: PDS System
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project

## Step 3: Configure Environment Variables

1. Create a `.env` file in the `backend` directory (if it doesn't exist)
2. Add your database URL:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

Replace:
- `YOUR_PASSWORD` with your actual database password
- `xxxxx` with your project reference

## Step 4: Run Database Migrations

The database schema will be automatically created when you start the server. The `initDatabase()` function in `db.js` will:

1. Connect to your Supabase database
2. Run all CREATE TABLE statements from `init_postgres.sql`
3. Create all necessary indexes

## Step 5: Start the Server

```bash
cd backend
npm start
```

You should see:
```
Connected to PostgreSQL database
PostgreSQL connection established
Database time: ...
Database schema initialized
Server running on http://localhost:5000
```

## Step 6: Verify Connection

The server will automatically:
- Test the connection
- Create all tables if they don't exist
- Set up indexes

## Troubleshooting

### Connection Issues

If you see connection errors:
1. Check your `DATABASE_URL` is correct
2. Verify your Supabase project is active
3. Check if your IP needs to be whitelisted (Supabase allows all by default)
4. Ensure the password in the connection string matches your database password

### SSL Issues

If you see SSL errors, the connection string should include SSL parameters. The current setup handles this automatically for Supabase URLs.

### Migration Errors

If tables already exist, you'll see warnings but the server will continue. This is normal if you restart the server.

## Environment Variables Reference

```env
# Required
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# Optional (with defaults)
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
PLATFORM_ADMIN_EMAIL=superadmin@pds.com
PLATFORM_ADMIN_PASSWORD=superadmin123
```

## Notes

- The database automatically converts SQLite syntax (`?` placeholders) to PostgreSQL syntax (`$1`, `$2`, etc.)
- All INSERT queries should include `RETURNING id` to get the inserted ID
- The `dbRun`, `dbGet`, and `dbAll` functions handle the conversion automatically
- Multi-tenancy is supported via `school_id` columns in all tables

