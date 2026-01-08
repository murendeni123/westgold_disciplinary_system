# Environment Variables Setup Guide

## Quick Start

1. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your actual values (if needed)
   ```

## Backend Environment Variables

### Required Variables

#### `DATABASE_URL` (Optional - falls back to SQLite)
- **For Supabase:** Get from Supabase Dashboard → Settings → Database → Connection string
- **Format:** `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Example:** `postgresql://postgres:mypassword123@db.abcdefghijk.supabase.co:5432/postgres`
- **Leave empty** to use SQLite (for development/testing)

#### `JWT_SECRET` (Required)
- **Generate:** `openssl rand -base64 32`
- **Or use:** Any long random string
- **Important:** Change this in production!

### Optional Variables

#### `PORT` (Default: 5000)
- Port for the backend server
- Example: `5000`

#### `NODE_ENV` (Default: development)
- Environment mode: `development` or `production`
- Example: `development`

#### `FRONTEND_URL` (Default: http://localhost:3000)
- Frontend URL for CORS and Socket.io
- Example: `http://localhost:3000`

#### `PLATFORM_ADMIN_EMAIL` (Default: superadmin@pds.com)
- Super Admin login email
- Example: `superadmin@pds.com`

#### `PLATFORM_ADMIN_PASSWORD` (Default: superadmin123)
- Super Admin login password
- **Important:** Change this in production!

#### `VAPID_PUBLIC_KEY` (Optional)
- Public key for push notifications
- Generate: `npm install -g web-push && web-push generate-vapid-keys`
- Example: `BEl62iUYgUivxIkv69yViEuiBIa40HI...`

#### `VAPID_PRIVATE_KEY` (Optional)
- Private key for push notifications
- Generate: `npm install -g web-push && web-push generate-vapid-keys`
- Example: `qWrYx8vP2mN5jK7lH9gF3dS6aZ1cX4vB...`

#### `VAPID_SUBJECT` (Optional)
- Email or URL for push notification subject
- Example: `mailto:admin@school.com`

## Frontend Environment Variables

### Optional Variables (with defaults)

#### `VITE_API_URL` (Default: /api)
- API base URL
- Use `/api` for local development (uses proxy)
- Use full URL for production: `https://api.yourschool.com/api`

#### `VITE_SOCKET_URL` (Default: http://localhost:5000)
- Socket.io server URL
- Use `http://localhost:5000` for local development
- Use your computer's IP for network access: `http://192.168.1.100:5000`
- Use full URL for production: `https://api.yourschool.com`

#### `VITE_APP_NAME` (Default: Positive Discipline System)
- Application name
- Example: `Positive Discipline System`

#### `VITE_APP_VERSION` (Default: 1.0.0)
- Application version
- Example: `1.0.0`

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
```

Then edit `.env` and fill in:

1. **For Supabase:**
   - Get `DATABASE_URL` from Supabase dashboard
   - Add it to `.env`

2. **Generate JWT Secret:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as `JWT_SECRET` in `.env`

3. **Generate VAPID Keys (optional):**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```
   Copy the public and private keys to `.env`

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

For local development, you usually don't need to change anything. The defaults work fine.

**For network access (mobile devices):**
- Update `VITE_SOCKET_URL` to your computer's IP address
- Example: `VITE_SOCKET_URL=http://192.168.1.100:5000`

### 3. Verify Setup

**Backend:**
```bash
cd backend
npm start
```

You should see:
- `Connected to PostgreSQL database` (if DATABASE_URL is set)
- OR `Connected to SQLite database` (if DATABASE_URL is empty)
- `Server running on http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
- `Local: http://localhost:3000`

## Production Setup

### Backend Production Variables

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong-random-secret>
DATABASE_URL=<your-production-database-url>
FRONTEND_URL=https://yourdomain.com
PLATFORM_ADMIN_EMAIL=admin@yourdomain.com
PLATFORM_ADMIN_PASSWORD=<strong-password>
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### Frontend Production Variables

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_APP_NAME=Positive Discipline System
VITE_APP_VERSION=1.0.0
```

## Security Notes

1. **Never commit `.env` files to git** - they contain secrets
2. **Always use `.env.example`** as a template
3. **Change default passwords** in production
4. **Use strong JWT secrets** (at least 32 characters)
5. **Keep VAPID keys secure** - don't share private keys

## Troubleshooting

### Backend can't connect to database
- Check `DATABASE_URL` is correct
- Verify Supabase project is active
- Check database password is correct

### Frontend can't connect to backend
- Check `VITE_API_URL` and `VITE_SOCKET_URL`
- Verify backend is running on correct port
- Check CORS settings in backend

### Socket.io not connecting
- Verify `VITE_SOCKET_URL` matches backend URL
- Check backend Socket.io CORS settings
- Ensure token is being sent correctly

