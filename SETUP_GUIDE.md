# Complete Setup Guide - PDS Application

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js** (version 16 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **npm** (comes with Node.js)
   - Check: `npm --version`

3. **PostgreSQL** (if using Supabase/PostgreSQL)
   - Or use SQLite (default, no setup needed)

## Quick Start Guide

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Environment Configuration

#### Backend Environment (.env file)

Create a file `backend/.env` with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration
# Option 1: SQLite (default, no setup needed)
# DATABASE_URL= (leave empty or omit for SQLite)

# Option 2: PostgreSQL/Supabase (if using)
# DATABASE_URL=postgresql://user:password@host:port/database
# Example for Supabase:
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Socket.io Configuration (optional)
SOCKET_URL=http://localhost:5000

# Push Notifications (optional - for web push)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your-email@example.com
```

#### Frontend Environment (.env file)

Create a file `frontend/.env` with the following:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Socket.io Configuration (optional)
VITE_SOCKET_URL=http://localhost:5000
```

### Step 4: Start the Application

#### Option A: Start Both Servers Manually

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### Option B: Use a Process Manager (Recommended)

You can use `concurrently` or `pm2` to run both servers together.

**Install concurrently globally:**
```bash
npm install -g concurrently
```

**Then from the root directory, create a script:**
```bash
concurrently "cd backend && npm start" "cd frontend && npm run dev"
```

### Step 5: Access the Application

Once both servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Default Login Credentials

### Admin Portal
- **URL**: http://localhost:5173/login
- **Email**: `admin@school.com`
- **Password**: `admin123`

### Teacher Portal
- **URL**: http://localhost:5173/login
- **Email**: `teacher1@school.com`
- **Password**: `teacher123`

### Parent Portal
- **URL**: http://localhost:5173/login
- **Email**: `parent1@email.com`
- **Password**: `parent123`

### Platform Admin (Super Admin)
- **URL**: http://localhost:5173/platform/login
- **Email**: `platform@admin.com`
- **Password**: `platform123`

## Database Setup

### SQLite (Default - No Setup Required)

The application uses SQLite by default. The database file (`pds.db`) will be automatically created in the `backend/database/` directory when you first start the server.

### PostgreSQL/Supabase (Optional)

If you want to use PostgreSQL instead:

1. Set up a PostgreSQL database (local or Supabase)
2. Add `DATABASE_URL` to `backend/.env`
3. The server will automatically use PostgreSQL when `DATABASE_URL` is set
4. The database schema will be automatically initialized

## Troubleshooting

### Port Already in Use

If port 5000 or 5173 is already in use:

**Backend:**
- Change `PORT` in `backend/.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

**Frontend:**
- Vite will automatically use the next available port
- Or kill the process: `lsof -ti:5173 | xargs kill -9`

### Dependencies Not Installed

If you see module errors:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

**SQLite:**
- Ensure `backend/database/` directory exists
- Check file permissions

**PostgreSQL:**
- Verify `DATABASE_URL` is correct in `backend/.env`
- Ensure PostgreSQL server is running
- Check database credentials

### Frontend Not Compiling

- Check for TypeScript errors: `cd frontend && npm run build`
- Clear Vite cache: `rm -rf frontend/node_modules/.vite`
- Check console for specific error messages

## Project Structure

```
pds system/
├── backend/
│   ├── .env                 # Backend environment variables
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   ├── database/            # Database files
│   ├── routes/              # API routes
│   └── middleware/          # Express middleware
│
└── frontend/
    ├── .env                 # Frontend environment variables
    ├── package.json         # Frontend dependencies
    ├── vite.config.ts       # Vite configuration
    └── src/                 # React source code
```

## Development Commands

### Backend
```bash
cd backend
npm start          # Start server
npm run dev        # Start with nodemon (auto-reload)
```

### Frontend
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `backend/.env`
2. Build frontend: `cd frontend && npm run build`
3. Serve frontend build files (using nginx, serve, etc.)
4. Run backend: `cd backend && npm start`
5. Use a process manager like PM2: `pm2 start backend/server.js`

## Additional Notes

- The application uses **framer-motion** for animations (already installed)
- **Tailwind CSS** is configured for styling
- **Socket.io** is set up for real-time features
- **Recharts** is used for data visualization
- All modern design components are ready to use

## Need Help?

If you encounter issues:
1. Check the console/terminal for error messages
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Check that ports 5000 and 5173 are available

