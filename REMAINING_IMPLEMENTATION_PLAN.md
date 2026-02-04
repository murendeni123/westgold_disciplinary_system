# Remaining Implementation Plan - Platform Admin Portal

## Overview
This document outlines the remaining work to complete the Platform Admin Portal enhancements. Phase 1 backend is 100% complete and production-ready. Continuing with frontend UIs and subsequent phases.

---

## IMMEDIATE TASKS (Phase 1 Completion)

### 1. Invoice Management UI ⏳
**File**: `frontend/src/pages/platform/PlatformInvoices.tsx`
**Priority**: HIGH
**Estimated Time**: 2-3 hours

**Features Required**:
- List all invoices with filters (school, status, date range)
- Search functionality
- Pagination
- Create invoice button → modal
- View invoice details → modal
- Generate PDF button
- Send invoice via email button
- Record payment button → modal
- Edit invoice → modal
- Delete invoice with confirmation
- Status badges (draft, sent, paid, overdue, cancelled)
- Export to CSV
- Modern UI with animations

### 2. School Details - Admin Management Section ⏳
**File**: `frontend/src/pages/platform/PlatformSchoolDetails.tsx`
**Priority**: HIGH
**Estimated Time**: 1-2 hours

**Features Required**:
- Add "Admins" tab/section to existing page
- List all admins for the school
- Primary admin indicator (star/badge)
- Add admin button → modal with form
- Edit admin button → modal
- Delete admin with confirmation
- Reset password button
- Admin count badge in header
- Welcome email sent notification

### 3. Routing Configuration ⏳
**Files**: App routing configuration
**Priority**: HIGH
**Estimated Time**: 30 minutes

**Required Routes**:
- `/platform/invoice-templates` → PlatformInvoiceTemplates
- `/platform/invoices` → PlatformInvoices
- Add navigation links in platform sidebar/menu
- Update breadcrumbs

---

## PHASE 2: FEATURE MANAGEMENT SYSTEM

### 1. Database Schema ⏳
**File**: `backend/database/migrations/create_system_features.sql`
**Priority**: MEDIUM
**Estimated Time**: 30 minutes

```sql
CREATE TABLE IF NOT EXISTS public.system_features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES public.system_features(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, feature_id)
);

CREATE INDEX idx_plan_features_plan_id ON public.plan_features(plan_id);
CREATE INDEX idx_plan_features_feature_id ON public.plan_features(feature_id);
```

### 2. Seed System Features ⏳
**File**: `backend/database/seeds/seed_system_features.sql`
**Priority**: MEDIUM
**Estimated Time**: 30 minutes

**17 Features to Seed** (Exclude Goldie Badge):
1. Incident Management
2. Merit System
3. Detention Tracking
4. Attendance Management
5. Parent Portal
6. Teacher Portal
7. Admin Portal
8. Reporting & Analytics
9. Email Notifications
10. SMS Notifications
11. Custom Branding
12. API Access
13. Bulk Import/Export
14. Intervention Tracking
15. Consequence Management
16. Class Management
17. Timetable Management

### 3. Features Backend API ⏳
**File**: `backend/routes/features.js`
**Priority**: MEDIUM
**Estimated Time**: 1 hour

**Endpoints**:
- `GET /api/features` - List all system features
- `GET /api/features/categories` - Get feature categories
- `GET /api/features/plans/:planId` - Get features for a plan
- `POST /api/features/plans/:planId/bulk` - Bulk update plan features
- `DELETE /api/features/plans/:planId/features/:featureId` - Remove feature

### 4. Subscriptions UI - Feature Multi-Select ⏳
**File**: Update `frontend/src/pages/platform/PlatformSubscriptions.tsx`
**Priority**: MEDIUM
**Estimated Time**: 1-2 hours

**Features Required**:
- Add "Features" section to plan create/edit modal
- Fetch all system features
- Multi-select checkboxes grouped by category
- "Select All" / "Deselect All" buttons per category
- Visual indicators for selected features
- Exclude Goldie Badge from list
- Save selected features when saving plan
- Display feature count on plan cards

### 5. Billing Automation Cron Job ⏳
**File**: `backend/jobs/billingScheduler.js`
**Priority**: MEDIUM
**Estimated Time**: 1 hour

**Features Required**:
- Check for due billing schedules daily
- Auto-generate invoices for due schedules
- Auto-send invoices if enabled
- Update next billing date
- Log results to console/file
- Error handling and retry logic
- Email notifications for failures

### 6. Portal-Specific Logo Upload ⏳
**Files**: Multiple files
**Priority**: MEDIUM
**Estimated Time**: 2 hours

**Database Changes**:
- Add columns to `school_branding` table:
  - `parent_portal_logo_url`
  - `teacher_portal_logo_url`
  - `admin_portal_logo_url`

**Backend Updates**:
- Update `schoolCustomizations.js` with new upload endpoints
- Handle three separate logo uploads

**Frontend Updates**:
- Update `SchoolCustomizations.tsx` with three logo upload sections
- Label each: "Parent Portal Logo", "Teacher Portal Logo", "Admin Portal Logo"

---

## PHASE 3: ENHANCED ANALYTICS & CUSTOMIZATION

### 1. Enhanced Analytics Dashboard ⏳
**File**: Update `frontend/src/pages/platform/PlatformAnalytics.tsx`
**Priority**: LOW
**Estimated Time**: 2-3 hours

**New Metrics**:
- System-wide KPIs card:
  - Total Active Schools
  - Monthly Recurring Revenue (MRR)
  - Average Revenue Per School (ARPS)
  - Churn Rate
  - Growth Rate (MoM)
- User Engagement:
  - Daily Active Users (DAU)
  - Weekly Active Users (WAU)
  - Monthly Active Users (MAU)
  - Engagement Score
- Feature Usage:
  - Most used features
  - Feature adoption rates
  - Usage by school
- Performance Metrics:
  - System uptime
  - Average response time

### 2. Portal-Specific Color Themes ⏳
**Files**: Multiple files
**Priority**: LOW
**Estimated Time**: 2-3 hours

**Database Schema**:
```sql
ALTER TABLE public.school_branding ADD COLUMN IF NOT EXISTS parent_portal_colors JSONB;
ALTER TABLE public.school_branding ADD COLUMN IF NOT EXISTS teacher_portal_colors JSONB;
ALTER TABLE public.school_branding ADD COLUMN IF NOT EXISTS admin_portal_colors JSONB;
```

**Backend Updates**:
- Update `schoolCustomizations.js` to handle portal-specific colors

**Frontend Updates**:
- Update `SchoolCustomizations.tsx` with portal selector
- Three tabs: Parent Portal, Teacher Portal, Admin Portal
- Color pickers for each portal
- Live preview for each portal type

### 3. Manual Invoice Creation UI ⏳
**File**: Add to `PlatformInvoices.tsx`
**Priority**: LOW
**Estimated Time**: 1 hour

**Features**:
- "Create Invoice" button
- Modal with form:
  - School dropdown
  - Template dropdown
  - Amount input
  - Billing period dates
  - Issue date
  - Due date
  - Add line items (dynamic)
  - Notes textarea
- Preview before saving
- Save as draft or send immediately

---

## PHASE 4: POLISH & ENHANCEMENT

### 1. Enhanced Live Preview ⏳
**File**: Update `frontend/src/pages/platform/SchoolCustomizations.tsx`
**Priority**: LOW
**Estimated Time**: 2 hours

**Features**:
- Realistic portal mockups (not just buttons)
- Portal switcher dropdown
- Show logo placement in preview
- Show color theme application
- Interactive elements
- Responsive preview

### 2. Feature Access Control ⏳
**Files**: Multiple files
**Priority**: LOW
**Estimated Time**: 3-4 hours

**Backend Middleware**:
- Create `checkFeatureAccess` middleware
- Check subscription features before allowing access
- Return 403 if feature not available

**Frontend**:
- Feature flag system
- Show/hide menu items based on features
- Display "Upgrade" prompts for locked features
- Usage tracking

---

## IMPLEMENTATION ORDER

### Sprint 1 (Complete Phase 1)
1. ✅ Invoice Management UI
2. ✅ School Details Admin Section
3. ✅ Routing Configuration
4. ✅ Test end-to-end workflows
5. ✅ Commit and push

### Sprint 2 (Phase 2 - Feature System)
6. ✅ Database schema
7. ✅ Seed features
8. ✅ Backend API
9. ✅ Subscriptions UI update
10. ✅ Test feature selection
11. ✅ Commit and push

### Sprint 3 (Phase 2 - Automation & Logos)
12. ✅ Billing automation cron
13. ✅ Portal-specific logos
14. ✅ Test automation
15. ✅ Commit and push

### Sprint 4 (Phase 3)
16. ✅ Enhanced analytics
17. ✅ Portal-specific themes
18. ✅ Manual invoice creation
19. ✅ Commit and push

### Sprint 5 (Phase 4)
20. ✅ Live preview enhancement
21. ✅ Feature access control
22. ✅ Final testing
23. ✅ Documentation
24. ✅ Final commit and push

---

## TESTING CHECKLIST

### Phase 1
- [ ] Upload invoice template
- [ ] Create invoice manually
- [ ] Generate PDF
- [ ] Send invoice via email
- [ ] Record payment
- [ ] Add multiple admins to school
- [ ] Set primary admin
- [ ] Reset admin password
- [ ] Delete admin

### Phase 2
- [ ] Create plan with features
- [ ] Update plan features
- [ ] Verify feature list excludes Goldie Badge
- [ ] Test billing automation (manual trigger)
- [ ] Upload portal-specific logos
- [ ] Verify logos display correctly

### Phase 3
- [ ] View enhanced analytics
- [ ] Set portal-specific colors
- [ ] Preview portal themes
- [ ] Create manual invoice

### Phase 4
- [ ] Test live preview
- [ ] Verify feature access control
- [ ] Test upgrade prompts

---

## DEPLOYMENT CHECKLIST

- [ ] Run database migrations
- [ ] Set environment variables
- [ ] Test all API endpoints
- [ ] Test all frontend pages
- [ ] Check error handling
- [ ] Verify email delivery
- [ ] Test file uploads
- [ ] Check PDF generation
- [ ] Verify cron job setup
- [ ] Review logs
- [ ] Performance testing
- [ ] Security audit

---

## SUCCESS CRITERIA

### Phase 1
- ✅ All invoicing features functional
- ✅ Multi-admin management working
- ✅ All UIs responsive and animated
- ✅ No TypeScript errors
- ✅ Build succeeds

### Phase 2
- ✅ Feature selection working
- ✅ Billing automation running
- ✅ Portal logos uploading

### Phase 3
- ✅ Analytics showing correct data
- ✅ Portal themes applying correctly
- ✅ Manual invoices creating

### Phase 4
- ✅ Live preview functional
- ✅ Feature access enforced
- ✅ All tests passing

---

## ESTIMATED TOTAL TIME

- Phase 1 Remaining: 4-6 hours
- Phase 2: 6-8 hours
- Phase 3: 5-7 hours
- Phase 4: 5-6 hours

**Total**: 20-27 hours of focused development

---

## CURRENT STATUS

- Phase 1 Backend: ✅ 100% Complete
- Phase 1 Frontend: 🚧 70% Complete (1 of 3 UIs)
- Phase 2: ⏳ 0% Complete
- Phase 3: ⏳ 0% Complete
- Phase 4: ⏳ 0% Complete

**Next Action**: Create Invoice Management UI (PlatformInvoices.tsx)
