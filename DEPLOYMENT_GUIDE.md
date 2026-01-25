# Deployment Guide - Frontend (Vercel) + Backend (Render)

## 📋 Overview

This guide covers deploying your full-stack application with:
- **Frontend**: React/Vite application on Vercel
- **Backend**: Node.js/Express API on Render
- **Database**: Supabase PostgreSQL (already hosted)

## 🏗️ Architecture

```
Frontend (Vercel) → Backend (Render) → Supabase PostgreSQL
```

---

## 🚀 Part 1: Deploy Backend on Render

### Step 1: Prepare Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Create Web Service

1. **Click "New +"** → **"Web Service"**

2. **Connect Repository**
   - Select your GitHub repository
   - Click "Connect"

3. **Configure Service**
   ```
   Name: westgold-backend (or your preferred name)
   Region: Choose closest to your users (e.g., Frankfurt for EU)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Select Plan**
   - **Free**: Good for testing (spins down after inactivity)
   - **Starter ($7/month)**: Recommended for production (always on)

### Step 3: Set Environment Variables

In the "Environment" section, add these variables:

```
DATABASE_URL=postgresql://postgres.kkmvxmbnmjbrwtfaihas:Murendeni246@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=ztENbBivzQYvO5C+8qsCB28LUO0kudBXozE8bU0+X/856LJf5salcYRLMWHpkHYl6F0RNHxaXsxczoIA74DMQQ==
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-app.vercel.app
SUPABASE_URL=https://kkmvxmbnmjbrwtfaihas.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PLATFORM_ADMIN_EMAIL=superadmin@pds.com
PLATFORM_ADMIN_PASSWORD=superadmin123
```

**Note**: You'll update `FRONTEND_URL` after deploying frontend in Part 2.

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. **Copy your backend URL** (e.g., `https://westgold-backend.onrender.com`)

### Step 5: Test Backend

Visit your backend URL in browser:
```
https://your-backend.onrender.com/api/health
```

You should see a health check response.

---

## 🎨 Part 2: Deploy Frontend on Vercel

### Step 1: Update Frontend Configuration

#### 1.1 Update `.env.production`

Edit `/frontend/.env.production`:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

**Replace with your actual Render backend URL from Part 1!**

Commit and push this change:
```bash
git add frontend/.env.production
git commit -m "Update production API URL for Render backend"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click **"Add New Project"**

2. **Import Repository**
   - Select your GitHub repository
   - Click **"Import"**

3. **Configure Frontend Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
   **Use your actual Render backend URL!**

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - **Copy your frontend URL** (e.g., `https://westgold-app.vercel.app`)

---

## 🔄 Part 3: Update Backend CORS

### Step 3.1: Update Render Environment Variables

1. Go to Render Dashboard → Your Backend Service
2. Click "Environment" in left sidebar
3. Update `FRONTEND_URL` to your actual Vercel frontend URL:
   ```
   FRONTEND_URL=https://your-frontend-app.vercel.app
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

### Step 3.2: Update CORS in Code (Optional but Recommended)

Update `backend/server.js` to include your frontend URL:

```javascript
const corsOptions = {
    origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://your-actual-frontend.vercel.app', // Add your actual URL
        process.env.FRONTEND_URL
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
```

Commit and push:
```bash
git add backend/server.js
git commit -m "Update CORS for production frontend URL"
git push origin main
```

Render will auto-redeploy.

---

## ✅ Part 4: Test Your Deployment

1. **Open Frontend URL** in browser
   ```
   https://your-frontend-app.vercel.app
   ```

2. **Try Logging In**
   - Platform Admin: `superadmin@pds.com` / `superadmin123`
   - School Admin: `sports@westgoldprimary.co.za` / `admin123`

3. **Verify Features Work**
   - Dashboard loads with data
   - Navigation works
   - Real-time features (Socket.io) work
   - Can create/edit records

---

## 🔧 Troubleshooting

### Frontend Shows "Network Error"

**Check:**
- `VITE_API_URL` in Vercel environment variables
- Backend URL doesn't have trailing slash
- Backend is running (visit backend URL directly)

**Solution:**
- Update environment variable in Vercel
- Redeploy frontend

### CORS Errors in Browser Console

**Check:**
- `FRONTEND_URL` in Render environment variables
- CORS configuration in `server.js`

**Solution:**
- Update `FRONTEND_URL` in Render
- Wait for auto-redeploy (or manually redeploy)

### Backend Not Responding

**Check:**
- Render service status (Dashboard → Your Service)
- Free tier services spin down after 15 min inactivity (first request takes ~30 seconds)

**Solution:**
- Upgrade to Starter plan ($7/month) for always-on service
- Or accept cold start delay on free tier

### Database Connection Issues

**Check:**
- `DATABASE_URL` is correct in Render
- Supabase database is accessible
- Connection timeout settings in `backend/database/db.js`

**Solution:**
- Verify DATABASE_URL format
- Check Supabase dashboard for issues

### Socket.io Not Working

**Check:**
- `VITE_SOCKET_URL` matches backend URL
- Backend logs for WebSocket errors

**Solution:**
- Ensure URLs match exactly
- Check Render logs for connection issues

---

## 📊 Monitoring & Logs

### Render Logs (Backend)

1. Go to Render Dashboard → Your Service
2. Click "Logs" tab
3. View real-time logs
4. Filter by severity (Info, Warning, Error)

### Vercel Logs (Frontend)

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click on a deployment
4. View "Build Logs" or "Function Logs"

### Database Monitoring

1. Go to Supabase Dashboard
2. Check "Database" → "Logs"
3. Monitor connection pool usage

---

## 🔐 Security Checklist

- [ ] Changed JWT_SECRET for production
- [ ] Database uses strong password
- [ ] SSL/HTTPS enabled (automatic on Render & Vercel)
- [ ] Environment variables not in Git
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled (check middleware)
- [ ] Input validation active

---

## 💰 Cost Breakdown

### Free Tier (Testing)
- **Render**: Free (spins down after inactivity)
- **Vercel**: Free (100GB bandwidth/month)
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Total**: $0/month

### Production Recommended
- **Render Starter**: $7/month (always on, 512MB RAM)
- **Vercel Pro**: $20/month (optional, for team features)
- **Supabase Pro**: $25/month (8GB database, better performance)
- **Total**: $7-52/month depending on needs

---

## 🔄 Deployment Workflow

### Automatic Deployments

**Backend (Render):**
- Push to `main` branch → Auto-deploys
- Takes 3-5 minutes
- Can view progress in Render dashboard

**Frontend (Vercel):**
- Push to `main` branch → Auto-deploys
- Takes 2-3 minutes
- Preview deployments for PRs

### Manual Deployment

**Render:**
1. Dashboard → Your Service
2. Click "Manual Deploy" → "Deploy latest commit"

**Vercel:**
1. Dashboard → Your Project
2. Deployments → "..." → "Redeploy"

### Rollback

**Render:**
1. Dashboard → Your Service → "Events"
2. Find previous deployment
3. Click "Rollback to this deploy"

**Vercel:**
1. Dashboard → Deployments
2. Find working deployment
3. Click "..." → "Promote to Production"

---

## 🌐 Custom Domains (Optional)

### Add Domain to Vercel (Frontend)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `app.westgold.co.za`)
3. Configure DNS:
   ```
   Type: CNAME
   Name: app (or @)
   Value: cname.vercel-dns.com
   ```

### Add Domain to Render (Backend)

1. Render Dashboard → Your Service → Settings
2. Scroll to "Custom Domain"
3. Add domain (e.g., `api.westgold.co.za`)
4. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-service.onrender.com
   ```

5. **Update Environment Variables**
   - Update `VITE_API_URL` in Vercel to use custom domain
   - Update `FRONTEND_URL` in Render to use custom domain

---

## 📈 Performance Tips

### Backend (Render)

1. **Upgrade Plan**: Starter plan prevents cold starts
2. **Connection Pooling**: Already configured in `db.js`
3. **Caching**: Consider Redis for session storage
4. **Database Indexes**: Optimize Supabase queries

### Frontend (Vercel)

1. **Code Splitting**: Vite handles this automatically
2. **Asset Optimization**: Images compressed
3. **CDN**: Vercel's global CDN is automatic
4. **Caching**: Configured in `vercel.json`

### Database (Supabase)

1. **Connection Pooler**: Use pooler URL (port 6543)
2. **Indexes**: Add indexes for frequently queried columns
3. **Query Optimization**: Use EXPLAIN ANALYZE
4. **Upgrade Plan**: More resources for production

---

## 🆘 Getting Help

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Vercel Support
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Status: https://www.vercel-status.com

### Your Application
- Check logs first (Render & Vercel)
- Test API endpoints with Postman/curl
- Check browser console for frontend errors
- Verify environment variables

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Can log in as platform admin
- [ ] Can log in as school admin
- [ ] Dashboard displays data correctly
- [ ] Navigation works across all pages
- [ ] Real-time features work (notifications, etc.)
- [ ] Database connections stable
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] SSL/HTTPS working
- [ ] Logs accessible
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 🎯 Your Deployment URLs

After deployment, save these URLs:

```
Frontend: https://your-app.vercel.app
Backend:  https://your-backend.onrender.com
Database: https://kkmvxmbnmjbrwtfaihas.supabase.co
```

---

**Last Updated**: January 25, 2026
