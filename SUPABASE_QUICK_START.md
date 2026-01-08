# Supabase Quick Start Guide

## What You Need from Supabase

You only need **ONE thing** from Supabase: the **Database Connection String**

## Step-by-Step Instructions

### Step 1: Create a Supabase Account (if you don't have one)
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email

### Step 2: Create a New Project
1. Click "New Project" in your Supabase dashboard
2. Fill in the details:
   - **Name:** PDS System (or any name you prefer)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose the region closest to you
   - **Pricing Plan:** Free tier is fine for development
3. Click "Create new project"
4. Wait 1-2 minutes for the project to be created

### Step 3: Get Your Connection String
1. In your Supabase project dashboard, click on **Settings** (gear icon in the left sidebar)
2. Click on **Database** in the settings menu
3. Scroll down to the **Connection string** section
4. You'll see tabs: **URI**, **JDBC**, **Golang**, etc.
5. Click on the **URI** tab
6. You'll see a connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 4: Replace the Password
The connection string will have `[YOUR-PASSWORD]` as a placeholder. Replace it with the actual database password you set when creating the project.

**Example:**
- If your password is: `MySecurePass123!`
- And your connection string is: `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres`
- Your final connection string should be: `postgresql://postgres:MySecurePass123!@db.abcdefghijk.supabase.co:5432/postgres`

### Step 5: Add to Your .env File
1. Open `backend/.env` file
2. Find the line: `DATABASE_URL=`
3. Paste your connection string (with the password replaced):
   ```env
   DATABASE_URL=postgresql://postgres:MySecurePass123!@db.abcdefghijk.supabase.co:5432/postgres
   ```
4. Save the file

### Step 6: Test the Connection
1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```
2. You should see:
   ```
   Connected to PostgreSQL database
   PostgreSQL connection established
   Database time: ...
   Database schema initialized
   Server running on http://localhost:5000
   ```

## What Information You DON'T Need

You **don't need**:
- ❌ API Keys
- ❌ Project ID
- ❌ Anon Key
- ❌ Service Role Key
- ❌ Any other Supabase credentials

**You ONLY need the Database Connection String!**

## Troubleshooting

### "Connection refused" or "Cannot connect"
- ✅ Check that your password is correct (no spaces, special characters properly encoded)
- ✅ Verify the connection string format is correct
- ✅ Make sure your Supabase project is active (not paused)
- ✅ Check that you're using the **URI** tab, not JDBC or other formats

### "Password authentication failed"
- ✅ Double-check your database password
- ✅ Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- ✅ If your password has special characters, they might need URL encoding:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - etc.

### "SSL connection required"
- ✅ The connection string should work as-is (SSL is handled automatically)
- ✅ If you see SSL errors, make sure you're using the connection string from the **URI** tab

## Quick Reference

**Location in Supabase Dashboard:**
```
Settings → Database → Connection string → URI tab
```

**What it looks like:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**What to put in .env:**
```env
DATABASE_URL=postgresql://postgres:YourActualPassword@db.xxxxx.supabase.co:5432/postgres
```

## Security Note

⚠️ **Never commit your `.env` file to git!** It contains your database password.

✅ **Do commit `.env.example`** (it has placeholders, not real passwords)

