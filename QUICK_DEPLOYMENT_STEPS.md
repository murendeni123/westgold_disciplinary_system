# Quick Deployment Steps - Vercel (Frontend) + Render (Backend)

## 🚀 Deploy in 20 Minutes

### Prerequisites
- GitHub account
- Render account (sign up at render.com)
- Vercel account (sign up at vercel.com)
- Code pushed to GitHub

---

## Part 1: Deploy Backend on Render (10 minutes)

### Step 1: Create Web Service

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Connect your GitHub account
   - Select your repository
   - Click **"Connect"**

3. **Configure Service**
   ```
   Name: westgold-backend
   Region: Frankfurt (or closest to you)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free (or Starter $7/month for production)
   ```

4. **Add Environment Variables**
   
   Click "Advanced" → Add these environment variables:
   
   ```
   DATABASE_URL=postgresql://postgres.kkmvxmbnmjbrwtfaihas:Murendeni246@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
   
   JWT_SECRET=ztENbBivzQYvO5C+8qsCB28LUO0kudBXozE8bU0+X/856LJf5salcYRLMWHpkHYl6F0RNHxaXsxczoIA74DMQQ==
   
   NODE_ENV=production
   
   PORT=5000
   
   FRONTEND_URL=https://your-frontend-app.vercel.app
   
   SUPABASE_URL=https://kkmvxmbnmjbrwtfaihas.supabase.co
   
   PLATFORM_ADMIN_EMAIL=superadmin@pds.com
   
   PLATFORM_ADMIN_PASSWORD=superadmin123
   ```

5. **Deploy**
   - Click **"Create Web Service"**
   - Wait 3-5 minutes
   - **Copy your backend URL** (e.g., `https://westgold-backend.onrender.com`)

---

## Part 2: Deploy Frontend on Vercel (8 minutes)

### Step 1: Update Production Config

Before deploying, update your frontend production config:

1. **Edit** `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
   **Replace with your actual Render backend URL!**

2. **Commit and push**:
   ```bash
   git add frontend/.env.production
   git commit -m "Update production API URL"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click **"Add New Project"**

2. **Import Repository**
   - Select your GitHub repository
   - Click **"Import"**

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   
   Click "Environment Variables" tab:
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

## Part 3: Update Backend CORS (2 minutes)

### Update Render Environment

1. **Go to Render Dashboard** → Your Backend Service
2. Click **"Environment"** in sidebar
3. **Edit** `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-actual-frontend.vercel.app
   ```
4. Click **"Save Changes"**
5. Render auto-redeploys (wait 2-3 minutes)

---

## ✅ Test Your Deployment

1. **Open your frontend URL**
   ```
   https://your-frontend-app.vercel.app
   ```

2. **Log in**:
   - Platform Admin: `superadmin@pds.com` / `superadmin123`
   - School Admin: `sports@westgoldprimary.co.za` / `admin123`

3. **Verify**:
   - Dashboard loads with data ✓
   - Navigation works ✓
   - Can create/edit records ✓

---

## 🔧 Common Issues

### "Network Error" on Frontend

**Cause**: Wrong API URL or backend not running

**Fix**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Visit backend URL directly to verify it's running
3. Remove trailing slashes from URLs

### CORS Error in Browser

**Cause**: Backend doesn't allow frontend domain

**Fix**:
1. Update `FRONTEND_URL` in Render environment variables
2. Wait for auto-redeploy
3. Clear browser cache

### Backend Takes 30+ Seconds to Respond

**Cause**: Free tier Render services "spin down" after 15 min inactivity

**Fix**:
- Upgrade to Starter plan ($7/month) for always-on service
- Or accept cold start delay (first request is slow)

### Can't Log In

**Cause**: JWT secret or database connection issue

**Fix**:
1. Check Render logs for errors
2. Verify `DATABASE_URL` is correct
3. Verify `JWT_SECRET` is set

---

## 📊 View Logs

### Backend Logs (Render)
```
Render Dashboard → Your Service → Logs tab
```

### Frontend Logs (Vercel)
```
Vercel Dashboard → Your Project → Deployments → Click deployment → Build Logs
```

---

## 🔄 Future Updates

**Automatic Deployments:**
- Push to `main` branch
- Render redeploys backend (3-5 min)
- Vercel redeploys frontend (2-3 min)
- Zero downtime

---

## 💰 Costs

### Free Tier (Good for Testing)
- Render: Free (with cold starts)
- Vercel: Free (100GB bandwidth)
- **Total: $0/month**

### Production (Recommended)
- Render Starter: $7/month (always on)
- Vercel: Free (or Pro $20/month for teams)
- **Total: $7-27/month**

---

## 🎯 Save Your URLs

After deployment, save these:

```
Frontend: https://______________.vercel.app
Backend:  https://______________.onrender.com
```

---

## 📱 Next Steps

1. ✅ Test all features thoroughly
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring/alerts
4. ✅ Set up database backups
5. ✅ Share URLs with users

---

**Need detailed instructions?** See `DEPLOYMENT_GUIDE.md`

**Having issues?** Check the troubleshooting section above or view logs
