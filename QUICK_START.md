# Quick Start Guide - PDS Application

## What You Need to Run This Application

### Prerequisites
1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **PostgreSQL** (optional - only if using Supabase, otherwise SQLite is used automatically)

---

## Step-by-Step Setup

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Create Environment Files (Optional but Recommended)

**Backend (.env file):**
```bash
cd backend
```

Create `backend/.env` file with:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional: For PostgreSQL/Supabase (leave empty for SQLite)
# DATABASE_URL=postgresql://user:password@host:port/database
```

**Frontend (.env file):**
```bash
cd frontend
```

Create `frontend/.env` file with:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

> **Note:** If you don't create `.env` files, the app will use default values and SQLite database.

### Step 3: Start the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```

You should see:
```
Server running on http://localhost:5000
Connected to SQLite database (or PostgreSQL if DATABASE_URL is set)
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

---

## Default Login Credentials

### Admin Portal
- **Email:** `admin@school.com`
- **Password:** `admin123`
- **URL:** http://localhost:5173/login

### Teacher Portal
- **Email:** `teacher1@school.com`
- **Password:** `teacher123`
- **URL:** http://localhost:5173/login

### Parent Portal
- **Email:** `parent1@email.com`
- **Password:** `parent123`
- **URL:** http://localhost:5173/login

### Platform Admin (Super Admin)
- **Email:** `platform@admin.com`
- **Password:** `platform123`
- **URL:** http://localhost:5173/platform/login

---

## Quick Commands Reference

### Start Backend
```bash
cd backend
npm start          # Production mode
npm run dev        # Development mode (with auto-reload)
```

### Start Frontend
```bash
cd frontend
npm run dev        # Development server
npm run build      # Build for production
```

### Kill All Processes
```bash
pkill -f "vite"
pkill -f "node server.js"
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
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

### Database Issues
- **SQLite:** No setup needed, works automatically
- **PostgreSQL:** Ensure `DATABASE_URL` in `backend/.env` is correct

### Frontend Not Loading
- Wait 30-60 seconds for Vite to compile (first time takes longer)
- Check browser console for errors
- Verify backend is running on port 5000

---

## What's Included

✅ **Modern Design System** - Ultra-modern UI with animations  
✅ **All Portals** - Admin, Teacher, Parent, and Platform Admin  
✅ **Real-time Features** - Socket.io for notifications  
✅ **Database** - SQLite (default) or PostgreSQL (optional)  
✅ **Authentication** - JWT-based security  
✅ **Responsive Design** - Works on mobile, tablet, and desktop  

---

## Need Help?

1. Check terminal/console for error messages
2. Verify Node.js version: `node --version` (should be 16+)
3. Ensure ports 5000 and 5173 are available
4. Check that all dependencies are installed

---

**That's it! You're ready to run the application.** 🚀

