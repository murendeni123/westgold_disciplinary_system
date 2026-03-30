# Logo Not Displaying - Debug Instructions

**Date:** February 9, 2026  
**Issue:** Logo uploaded in customizations is not showing in the sidebar  
**Status:** 🔍 Debugging in progress

---

## 🔍 Debug Steps

I've added console logging to help identify the issue. Follow these steps:

### **1. Start the Frontend (if not running)**
```bash
cd frontend && npm run dev -- --port 3001
```

### **2. Open Browser Console**
1. Open your browser to `http://localhost:3001`
2. Login as school admin (the user from your screenshot)
3. Open Developer Tools:
   - **Chrome/Edge:** Press `F12` or `Cmd+Option+I` (Mac)
   - **Firefox:** Press `F12` or `Cmd+Option+K` (Mac)
4. Click on the **Console** tab

### **3. Check Console Logs**

You should see these logs:
```
Sidebar customizations: { logo_path: "/uploads/schools/1/logo-...", ... }
Logo path: /uploads/schools/1/logo-1770601409767-279393026.PNG
Logo URL: http://localhost:5000/uploads/schools/1/logo-1770601409767-279393026.PNG
```

**Then one of these:**
- ✅ `Logo loaded successfully` - Logo is loading but might not be visible due to styling
- ❌ `Logo failed to load: ...` - Logo URL is broken or file not accessible

---

## 🐛 Possible Issues & Solutions

### **Issue 1: Customizations Not Loading**
**Symptoms:**
```
Sidebar customizations: null
```

**Cause:** SchoolThemeContext not loading for your user role

**Solution:** Check if you're logged in as platform admin (customizations don't load for platform admins)

---

### **Issue 2: Logo Path is Null**
**Symptoms:**
```
Sidebar customizations: { logo_path: null, ... }
Logo path: null
```

**Cause:** Logo not saved in database or was deleted

**Solution:** Re-upload logo in customization panel

---

### **Issue 3: Logo URL is Incorrect**
**Symptoms:**
```
Logo URL: null
OR
Logo URL: http://localhost:5000/undefined
```

**Cause:** `getImageUrl` function returning null or incorrect URL

**Solution:** Check SchoolThemeContext.tsx getImageUrl function

---

### **Issue 4: Logo Fails to Load (404)**
**Symptoms:**
```
Logo failed to load: ...
Attempted URL: http://localhost:5000/uploads/schools/1/logo-...
```

**Cause:** File doesn't exist or backend not serving static files

**Solution:** 
1. Check if file exists: `ls backend/uploads/schools/1/`
2. Check if backend is serving uploads folder
3. Test URL directly: `curl http://localhost:5000/uploads/schools/1/logo-...`

---

### **Issue 5: Logo Loads But Not Visible**
**Symptoms:**
```
Logo loaded successfully
```
But logo still not visible in UI

**Cause:** CSS styling issue (logo might be hidden, too small, or wrong color)

**Solutions:**
1. Check logo dimensions: `h-10 sm:h-12` (40px-48px height)
2. Check logo background: `bg-white/20` (might hide white logos)
3. Inspect element in browser to see actual rendered size
4. Try uploading a different logo with contrasting colors

---

## 🧪 Quick Tests

### **Test 1: Check Database**
```bash
curl -s http://localhost:5000/api/school-customizations/public/1 | grep logo_path
```

**Expected:** `"logo_path": "/uploads/schools/1/logo-..."`

---

### **Test 2: Check File Exists**
```bash
ls -la backend/uploads/schools/1/
```

**Expected:** You should see `logo-1770601409767-279393026.PNG`

---

### **Test 3: Check File Accessible**
```bash
curl -I http://localhost:5000/uploads/schools/1/logo-1770601409767-279393026.PNG
```

**Expected:** `HTTP/1.1 200 OK`

---

### **Test 4: Check in Browser**
Open this URL directly in browser:
```
http://localhost:5000/uploads/schools/1/logo-1770601409767-279393026.PNG
```

**Expected:** Logo image should display

---

## 📋 What to Report Back

After checking the console, please tell me:

1. **What do you see in the console?**
   - Are customizations loading?
   - Is logo_path present?
   - What is the Logo URL?
   - Does it say "Logo loaded successfully" or "Logo failed to load"?

2. **Can you see the logo when opening the URL directly?**
   - Open `http://localhost:5000/uploads/schools/1/logo-1770601409767-279393026.PNG` in browser
   - Does the image display?

3. **What does the logo look like?**
   - Is it a white logo on transparent background?
   - What are the dimensions?
   - What format (PNG, JPG, SVG)?

---

## 🎨 Temporary Workaround

If the logo is loading but not visible due to styling, try this:

1. Go to Customization panel
2. Upload a logo with:
   - **Dark colors** (not white/light)
   - **Solid background** (not transparent)
   - **Reasonable size** (200x60px recommended)

This will help us see if it's a styling issue vs a loading issue.

---

**Next Steps:** Once you provide the console output, I can pinpoint the exact issue and fix it.
