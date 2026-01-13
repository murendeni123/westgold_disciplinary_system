# 🏆 Goldy Badge - Quick Start Guide

## What You Need to Know

The **Goldy Badge** feature displays top students with exceptional behavior on the Merit & Recognition page. It's controlled from the **Platform Admin Portal**.

### Key Concept
- **Clean Points** = Total Merits - Total Demerits
- Only students with **10 or more merits** qualify
- Top 10 students are displayed with rankings

---

## For Platform Admins (Super Admins)

### Step 1: Access Feature Flags

1. Login to Platform Admin Portal:
   - URL: `http://localhost:5173/platform/login`
   - Email: `platform@admin.com`
   - Password: `platform123`

2. Click **Feature Flags** in the sidebar (yellow flag icon)

### Step 2: Enable Goldy Badge

**Option A: Enable for One School**
- Find the school in the table
- Click the toggle switch under "🏆 Goldy Badge" column
- Switch turns green = Enabled

**Option B: Enable for All Schools**
- Click the green **✓** button in the Goldy Badge overview card
- Confirms instantly

**Option C: Disable for All Schools**
- Click the red **✗** button in the Goldy Badge overview card
- Disables instantly

---

## For School Admins

### Viewing Goldy Badge Students

1. Login as Admin:
   - URL: `http://localhost:5173/login`
   - Email: `admin@school.com`
   - Password: `admin123`

2. Navigate to **Merits & Demerits**

3. If feature is **enabled**, you'll see:
   - 🏆 **Goldy Badge Section** below the header
   - Top 10 students with Clean Points
   - Rankings: 1st (Gold), 2nd (Silver), 3rd (Bronze)
   - Each student shows:
     - Photo/Avatar
     - Name & Class
     - **Clean Points** (big number in green)
     - Merits count (green)
     - Demerits count (red)

4. If feature is **disabled**:
   - Page looks normal
   - No Goldy Badge section appears

---

## Visual Guide

### Platform Admin - Feature Flags Page

```
┌────────────────────────────────────────┐
│ Feature Flags Management               │
├────────────────────────────────────────┤
│                                        │
│  🏆 Goldy Badge                       │
│  Enable special recognition badges     │
│  Enabled: 3 / 5 schools               │
│  [✓] Enable All  [✗] Disable All      │
│                                        │
├────────────────────────────────────────┤
│ School | Code | Status | 🏆 Goldy Badge│
│ ─────────────────────────────────────  │
│ West   | WS01 | Active | [●──] ON      │
│ East   | ES01 | Active | [─○─] OFF     │
│ North  | NS01 | Active | [●──] ON      │
└────────────────────────────────────────┘
```

### School Admin - Merit & Recognition Page

**When Enabled:**
```
┌─────────────────────────────────────────────┐
│ Merits & Demerits                          │
├─────────────────────────────────────────────┤
│ 🏆 Goldy Badge - Clean Points Leaders      │
│ Students with 10+ merits                   │
│ Clean Points = Merits - Demerits          │
│                                            │
│ [1]🏆  [2]🥈  [3]🥉  [4]   [5]             │
│  📷     📷     📷     📷     📷              │
│ John   Mary   Sam   Lisa  Tom             │
│ 10A    9B     10C   8A    9A              │
│ ⭐ 15  ⭐ 12  ⭐ 10  ⭐ 8   ⭐ 7            │
│ 18M 3D 15M 3D 12M 2D 10M 2D 9M 2D          │
└─────────────────────────────────────────────┘
│ [Filters Card] ...                         │
│ [Charts] ...                               │
│ [Table] ...                                │
```

**When Disabled:**
```
┌─────────────────────────────────────────────┐
│ Merits & Demerits                          │
├─────────────────────────────────────────────┤
│ [Filters Card] ...                         │
│ [Charts] ...                               │
│ [Table] ...                                │
```

---

## Testing the Feature

### Test Scenario 1: Enable and View

1. **Platform Admin**:
   - Login to `/platform/login`
   - Go to Feature Flags
   - Enable Goldy Badge for "West School"

2. **School Admin**:
   - Login as admin for West School
   - Go to Merits & Demerits
   - **Expected**: Goldy Badge section appears

### Test Scenario 2: Disable and Hide

1. **Platform Admin**:
   - Go to Feature Flags
   - Disable Goldy Badge for "West School"

2. **School Admin**:
   - Refresh Merits & Demerits page
   - **Expected**: Goldy Badge section disappears

### Test Scenario 3: Clean Points Calculation

Create test data:
- Student A: 15 merits, 3 demerits → Clean Points = 12 ✅
- Student B: 8 merits, 2 demerits → Clean Points = 6 ❌ (Not shown, <10 merits)
- Student C: 20 merits, 10 demerits → Clean Points = 10 ✅

**Expected Result**: Students A and C appear, ranked by Clean Points (A=12, C=10)

---

## Troubleshooting

### "Goldy Badge section not showing"

**Causes**:
1. Feature flag is disabled
2. No students have 10+ merits
3. Need to refresh page

**Solutions**:
1. Check Platform Admin → Feature Flags
2. Add more merits to students
3. Hard refresh browser (Ctrl+F5)

### "Toggle not working in Platform Admin"

**Causes**:
1. Not logged in as Platform Admin
2. Network error

**Solutions**:
1. Verify you're at `/platform/login` (not `/login`)
2. Check browser console for errors
3. Restart backend server

### "Clean Points seem wrong"

**Check**:
1. Merits count for the student
2. Demerits count for the student
3. Formula: Clean Points = Merits - Demerits

**Example**:
- 18 merits - 3 demerits = 15 Clean Points ✓
- 10 merits - 2 demerits = 8 Clean Points ✓
- 5 merits - 1 demerit = 4 Clean Points (but won't show, <10 merits) ✓

---

## Quick Commands

### Start Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points
- **Platform Admin**: http://localhost:5173/platform/login
- **School Admin**: http://localhost:5173/login
- **Feature Flags Page**: http://localhost:5173/platform/feature-flags

### Default Credentials
```
Platform Admin:
- Email: platform@admin.com
- Password: platform123

School Admin:
- Email: admin@school.com
- Password: admin123
```

---

## Summary

### What This Feature Does

✅ Shows top 10 students with best behavior (10+ merits)
✅ Calculates "Clean Points" = Merits - Demerits
✅ Controlled from Platform Admin Portal
✅ Can be enabled/disabled per school
✅ Beautiful UI with rankings and photos

### How to Use It

1. **Platform Admin** enables feature for schools
2. **School Admin** sees Goldy Badge on Merit & Recognition page
3. Students with 10+ merits appear automatically
4. Ranked by Clean Points (highest first)

---

## Files to Review

- **Platform Admin Page**: `frontend/src/pages/platform/FeatureFlags.tsx`
- **Merit & Recognition Page**: `frontend/src/pages/admin/MeritsDemerits.tsx`
- **Backend Routes**: `backend/routes/featureFlags.js` & `backend/routes/platform.js`
- **Database**: `backend/database/init_postgres.sql` (school_feature_flags table)

---

## Next Steps

1. ✅ Start your backend and frontend servers
2. ✅ Login to Platform Admin Portal
3. ✅ Enable Goldy Badge for a school
4. ✅ Login as School Admin
5. ✅ View the Goldy Badge section!

**That's it! You're ready to recognize exceptional students!** 🏆✨
