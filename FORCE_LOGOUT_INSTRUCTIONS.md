# FORCE LOGOUT - Complete Instructions

## The Problem
You have an OLD TOKEN (v1) that the new system rejects.
The backend keeps saying "SECURITY VIOLATION: Non-existent schema" because your token is outdated.

## SOLUTION: Complete Browser Reset

### Step 1: Open Browser DevTools
- Press **F12** (or Right-click → Inspect)
- Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

### Step 2: Clear ALL localStorage
In the Console tab, paste this and press Enter:
```javascript
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');
```

### Step 3: Clear Cookies
- Still in Application/Storage tab
- Click **Cookies** → `http://localhost:3001`
- Right-click → **Clear**

### Step 4: Hard Refresh
- Press **Ctrl+Shift+R** (Windows/Linux)
- Or **Cmd+Shift+R** (Mac)

### Step 5: Close and Reopen Browser
- Close the browser completely
- Reopen and go to `http://localhost:3001`

### Step 6: Login Fresh
- Login with: sports@westgoldprimary.co.za
- You will get a NEW v2 token
- Import will work ✅

---

## Alternative: Use Incognito/Private Window
1. Open Incognito/Private window
2. Go to `http://localhost:3001`
3. Login
4. Try import - should work immediately
