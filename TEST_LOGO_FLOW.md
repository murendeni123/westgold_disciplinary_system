# Logo Display - Complete Test Flow

## Step-by-Step Verification

### 1. **Refresh Browser**
Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)

### 2. **Check Console Output**
You should now see detailed logs like:

```
=== SIDEBAR DEBUG ===
Customizations object: { logo_path: "/uploads/schools/1/logo-...", primary_color: "#3b82f6", ... }
Logo path value: /uploads/schools/1/logo-1770601409767-279393026.PNG
Logo path type: string
Logo path truthy? true
Condition check (customizations?.logo_path): TRUE - should show logo
Generated logo URL: http://localhost:5000/uploads/schools/1/logo-1770601409767-279393026.PNG
URL type: string
===================
```

**If you see "FALSE - showing icon"**, then customizations aren't loading properly.

### 3. **What the Logs Tell Us**

| Log Output | Meaning | Action |
|------------|---------|--------|
| `Customizations object: null` | Context not loading | Check if logged in as school user (not platform admin) |
| `Logo path value: null` | No logo in database | Re-upload logo |
| `Logo path value: ""` (empty string) | Logo was deleted | Re-upload logo |
| `Logo path value: /uploads/...` + `FALSE` | String is falsy somehow | Bug in condition |
| `Logo path value: /uploads/...` + `TRUE` | Should be showing logo | Check if logo loads |

### 4. **If Logo Should Show But Doesn't**

Check for these messages:
- `Logo loaded successfully` - Logo loaded, might be styling issue
- `Logo failed to load: ...` - URL is wrong or file missing

---

## Quick Fix Options

### **Option A: Logo is Loading But Not Visible (Styling Issue)**

The logo might be:
- Too small to see
- White on white background
- Hidden by CSS

**Test:** Open browser inspector, find the `<img>` tag, check:
- Is it in the DOM?
- What are its dimensions?
- Is it hidden by CSS?

### **Option B: Logo Path is Null/Empty**

**Fix:** Re-upload logo in customization panel:
1. Go to Platform Admin → Schools → Select school → Customize
2. Click Branding section
3. Upload logo again
4. Wait 2 seconds for auto-save
5. Refresh browser

### **Option C: Customizations Not Loading**

**Check:** Are you logged in as platform admin?
- Platform admins don't load customizations (by design)
- You need to be logged in as school admin/teacher/parent

**Fix:** Logout and login as school user

---

## Manual Verification

### Test 1: API Returns Logo
```bash
curl -s http://localhost:5000/api/school-customizations/public/1 | grep logo_path
```
**Expected:** `"logo_path": "/uploads/schools/1/logo-..."`

### Test 2: File Exists
```bash
ls backend/uploads/schools/1/logo-*.PNG
```
**Expected:** File path shown

### Test 3: File Accessible
Open in browser:
```
http://localhost:5000/uploads/schools/1/logo-1770601409767-279393026.PNG
```
**Expected:** Image displays

---

## What to Report

Please copy-paste the console output showing:
```
=== SIDEBAR DEBUG ===
[all the logs]
===================
```

This will tell me exactly what's happening.
