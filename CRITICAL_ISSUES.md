# 🚨 CRITICAL ISSUES - FIX BEFORE HOSTING

## 1. DATABASE PASSWORD EXPOSED
**File:** `/backend/.env` line 13
- Database password visible in plain text
- **FIX:** Remove .env from git, use environment variables on host

## 2. WEAK ADMIN PASSWORD
**File:** `/backend/.env` lines 23-24
- Default password: `superadmin123`
- **FIX:** Change to strong password, use env vars only

## 3. HARDCODED LOCALHOST IN CORS
**File:** `/backend/server.js` line 69
```javascript
origin: ['http://localhost:3001', 'http://192.168.0.108:3001']
```
- **FIX:** Use `process.env.FRONTEND_URL` for production domain

## 4. LOCALHOST SOCKET URL
**File:** `/frontend/.env` line 16
- `VITE_SOCKET_URL=http://localhost:5000`
- **FIX:** Change to production backend URL

## 5. HARDCODED API PROXY
**File:** `/frontend/vite.config.ts` lines 10-13
- Proxy points to localhost:5000
- **FIX:** Use full backend URL in production, remove proxy

## 6. APP CRASHES ON DB ERROR
**File:** `/backend/database/db.js` lines 29-32
- `process.exit(-1)` on any DB error
- **FIX:** Add retry logic, graceful error handling

## 7. NO HTTPS ENFORCEMENT
- All traffic unencrypted
- **FIX:** Add helmet.js, enforce HTTPS redirect

## 8. MISSING ERROR TRACKING
- 376+ console.log statements
- **FIX:** Add Sentry or similar, use proper logging library

## 9. WEAK RATE LIMITING
- Only on exports/imports
- **FIX:** Add to all endpoints, especially auth

## 10. PLACEHOLDER SUPABASE KEY
**File:** `/backend/.env` line 17
- `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here`
- **FIX:** Add real key or remove if unused

---

## ✅ GOOD PRACTICES FOUND
- JWT secret validation on startup
- Parameterized SQL queries (prevents SQL injection)
- Input sanitization middleware
- Schema validation (prevents cross-tenant access)
- Try-catch blocks in most routes
- Authentication middleware on protected routes

---

## 📋 DEPLOYMENT CHECKLIST
- [ ] Remove .env from version control
- [ ] Set all env vars on hosting platform
- [ ] Change admin password to strong value
- [ ] Update CORS origins to production domain
- [ ] Update Socket.io URL to production
- [ ] Update frontend API URL to production
- [ ] Add HTTPS/SSL certificate
- [ ] Add error tracking service
- [ ] Test all endpoints in production
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
