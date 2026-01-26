# Comprehensive Fixes - 8 Tasks Implementation Plan

## Task 1: Consequence Details Page ✅ COMPLETE
**Status:** Working correctly
**Finding:** The consequence details modal already displays all required fields:
- Severity (with color coding)
- Consequence name/type
- Due date (editable)
- Status (editable)
- Assigned by, assigned date
- Notes
- Related incident ID

**Location:** `frontend/src/pages/admin/Consequences.tsx` lines 637-793
**No changes needed.**

---

## Task 2: Parent Onboarding Flow
**Issues Identified:**
1. ✅ Onboarding completion flag works correctly (localStorage)
2. ❌ School not appearing in Settings page after linking
3. ✅ OnboardingGuard properly checks completion status

**Root Cause:** The `getLinkedSchools()` API returns schools from `user_schools` table, but may not include the user's primary `school_id` from the users table.

**Fix Required:**
- Backend: Ensure `/api/parents/linked-schools` returns the user's primary school
- Backend: Update route to include user's school_id in results
- Verify user_schools table is populated when school is linked

**Files to Fix:**
- `backend/routes/parents.js` - line 234-249 (getLinkedSchools route)

---

## Task 3: Remove Export Buttons from Parent Portal
**Action:** Find and remove all export buttons from parent portal pages

**Files to Check:**
- All files in `frontend/src/pages/parent/`
- Search for: "export", "Export", "download", "Download", "CSV", "PDF"

---

## Task 4: Notifications Detail View
**Issue:** Clicking notification should show full contextual details

**Fix Required:**
- Update notification click handler to fetch and display related entity details
- Show incident details, detention details, merit details, etc.
- Create modal or detail view component

**Files to Fix:**
- Notification components
- Add detail fetching logic

---

## Task 5: Mobile Responsiveness Across Portals
**Action:** Apply parent portal's sticky header and mobile sidebar to all portals

**Parent Portal Pattern (Working Well):**
- Sticky header with mobile menu
- Mobile-friendly sidebar
- Touch-friendly buttons (min-h-[44px])
- Responsive spacing and text sizes

**Portals to Update:**
- Admin Portal
- Teacher Portal

**Files to Update:**
- Admin layout/header components
- Teacher layout/header components

---

## Task 6: Admin Add Student Error
**Issue:** Internal server error when admin adds student manually

**Investigation Needed:**
- Check backend `/api/students` POST route
- Check for missing required fields
- Check database constraints
- Review error logs

**Files to Check:**
- `backend/routes/students.js` - POST route
- Frontend add student form validation

---

## Task 7: Discipline Rules Page Responsiveness
**Action:** Make Discipline Rules page mobile responsive

**Files to Fix:**
- Find Discipline Rules page
- Apply responsive patterns:
  - Responsive grid layouts
  - Touch-friendly buttons
  - Responsive text sizes
  - Proper spacing on mobile

---

## Task 8: Auto-Refresh Issue
**Issue:** App continuously refreshes during normal use

**Possible Causes:**
- Infinite useEffect loops
- Token refresh loops
- WebSocket reconnection loops
- Navigation loops
- State update loops

**Investigation:**
- Check useEffect dependencies
- Check authentication refresh logic
- Check WebSocket connection logic
- Check navigation guards

**Files to Check:**
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/OnboardingGuard.tsx`
- WebSocket setup
- Route guards

---

## Implementation Order:
1. ✅ Task 1 - Already complete
2. Task 2 - Parent Onboarding (backend fix)
3. Task 3 - Remove export buttons (quick)
4. Task 6 - Admin Add Student (critical bug)
5. Task 8 - Auto-refresh (critical UX issue)
6. Task 4 - Notifications detail view
7. Task 7 - Discipline Rules responsive
8. Task 5 - Mobile responsiveness across portals (largest task)
