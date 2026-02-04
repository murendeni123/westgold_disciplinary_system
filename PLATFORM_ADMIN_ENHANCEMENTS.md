# Platform Admin Portal Enhancement Plan

## Overview
This document outlines the comprehensive enhancements needed for the Super/Platform Admin Portal to provide enterprise-level school management, customization, analytics, invoicing, and subscription management capabilities.

---

## 1. School Management Enhancements

### Current State
- **Frontend**: `PlatformSchoolDetails.tsx` - Modern UI with floating cards already implemented
- **Backend**: `platform.js` - Basic CRUD operations exist
- **Features Present**:
  - School information display (name, email, status, user/student counts)
  - Subscription management
  - Basic statistics
  - Edit/Delete functionality
  - Status toggle (active/inactive)

### Required Enhancements

#### 1.1 Admin Credential Management
**Status**: ⚠️ Partially Implemented
**Tasks**:
- [ ] Add ability to view all admins for a school (currently only shows one)
- [ ] Add "Add Admin" functionality to assign multiple admins per school
- [ ] Add "Edit Admin" to modify existing admin details (name, email, password reset)
- [ ] Add "Remove Admin" functionality
- [ ] Backend API endpoints needed:
  - `GET /api/platform/schools/:id/admins` - List all admins for a school
  - `POST /api/platform/schools/:id/admins` - Add new admin
  - `PUT /api/platform/schools/:id/admins/:adminId` - Update admin
  - `DELETE /api/platform/schools/:id/admins/:adminId` - Remove admin
  - `POST /api/platform/schools/:id/admins/:adminId/reset-password` - Reset password

#### 1.2 UI Improvements
**Status**: ✅ Already Modern
**Notes**: The UI already uses floating cards, gradients, and modern design. Minor tweaks may be needed for admin management section.

---

## 2. School Customizations

### Current State
- **Frontend**: `SchoolCustomizations.tsx` - Comprehensive customization UI exists
- **Backend**: `schoolCustomizations.js` - File upload and customization management exists
- **Features Present**:
  - Logo upload
  - Favicon upload
  - Login/Dashboard background images
  - Color theme customization (8 colors)
  - Typography settings
  - UI component styling
  - Email template customization
  - Custom CSS/JS
  - Live preview panel

### Required Enhancements

#### 2.1 Logo Management Across Portals
**Status**: ⚠️ Needs Portal-Specific Implementation
**Tasks**:
- [ ] Ensure logo uploads use Supabase Storage (already implemented for profile photos)
- [ ] Add portal-specific logo fields:
  - `parent_portal_logo_url`
  - `teacher_portal_logo_url`
  - `admin_portal_logo_url`
- [ ] Update database schema to support portal-specific logos
- [ ] Modify frontend to allow separate logo uploads for each portal
- [ ] Implement logo display logic in each portal (parent, teacher, admin)

#### 2.2 Portal-Specific Color Themes
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Extend color customization to support portal-specific themes:
  - Parent portal theme
  - Teacher portal theme
  - Admin portal theme
- [ ] Database schema updates for portal-specific colors
- [ ] Frontend UI to select portal and customize colors
- [ ] Live preview for each portal type
- [ ] Apply theme dynamically based on user role/portal

#### 2.3 Live Preview Enhancement
**Status**: ⚠️ Basic Preview Exists
**Tasks**:
- [ ] Enhance preview panel to show realistic portal mockups
- [ ] Add portal switcher in preview (Parent/Teacher/Admin views)
- [ ] Show logo placement in preview
- [ ] Show color theme application in preview
- [ ] Add "Apply Changes" confirmation before saving

---

## 3. Analytics Enhancement

### Current State
- **Frontend**: `PlatformAnalytics.tsx` - Basic analytics with charts
- **Backend**: Platform analytics endpoint exists
- **Features Present**:
  - Revenue trend (line chart)
  - Schools by status (pie chart)
  - Users by role (bar chart)
  - Date range filters
  - Export to CSV

### Required Enhancements

#### 3.1 System-Wide Overview
**Status**: ⚠️ Needs Enhancement
**Tasks**:
- [ ] Add platform-level KPIs:
  - Total active schools
  - Total revenue (all-time)
  - Monthly Recurring Revenue (MRR)
  - Average Revenue Per School (ARPS)
  - Churn rate
  - Growth rate
- [ ] Add trend indicators (up/down arrows with percentages)
- [ ] Add comparison to previous period

#### 3.2 Additional Metrics
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] User engagement metrics:
  - Daily Active Users (DAU)
  - Weekly Active Users (WAU)
  - Monthly Active Users (MAU)
  - Login frequency by school
- [ ] Feature usage metrics:
  - Most used features per school
  - Feature adoption rates
  - Incidents logged per school
  - Merits awarded per school
- [ ] Performance metrics:
  - Average response time
  - System uptime
  - Error rates

#### 3.3 Modern Dashboard UI
**Status**: ⚠️ Good but Needs Polish
**Tasks**:
- [ ] Add executive summary cards at top
- [ ] Implement drill-down capability (click chart to see details)
- [ ] Add comparison views (school vs school, period vs period)
- [ ] Add export options (PDF reports, not just CSV)
- [ ] Add scheduled report generation
- [ ] Improve data visualization with more chart types

---

## 4. Invoicing Module

### Current State
- **Frontend**: `PlatformBilling.tsx` - Billing/payment tracking exists
- **Backend**: Billing endpoint exists
- **Features Present**:
  - Transaction history
  - Revenue tracking
  - Payment status monitoring
  - Basic invoice download (text format)

### Required Enhancements

#### 4.1 Invoice Template Management
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Database schema for invoice templates:
  ```sql
  CREATE TABLE invoice_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_file_url TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] Upload invoice templates (PDF/HTML from Canva)
- [ ] Store templates in Supabase Storage
- [ ] Template preview functionality
- [ ] Set default template
- [ ] Multiple template support

#### 4.2 Invoice Generation
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Database schema for invoices:
  ```sql
  CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    school_id INTEGER REFERENCES schools(id),
    template_id INTEGER REFERENCES invoice_templates(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    billing_period_start DATE,
    billing_period_end DATE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    pdf_url TEXT,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] Generate invoice from template with school data
- [ ] Populate invoice fields (school name, amount, dates, etc.)
- [ ] Generate PDF from template
- [ ] Store generated invoice in Supabase Storage
- [ ] Invoice numbering system (auto-increment with prefix)

#### 4.3 Email Invoices
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Email invoice to school admin(s)
- [ ] Use existing email service (`emailService.js`)
- [ ] Email template for invoice delivery
- [ ] Attach PDF invoice to email
- [ ] Track email sent status
- [ ] Resend invoice functionality

#### 4.4 Billing Schedules
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Database schema for billing schedules:
  ```sql
  CREATE TABLE billing_schedules (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id),
    frequency VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annually'
    next_billing_date DATE NOT NULL,
    auto_generate BOOLEAN DEFAULT TRUE,
    auto_send BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] Configure billing frequency per school (monthly, quarterly, annually)
- [ ] Automated invoice generation based on schedule
- [ ] Automated invoice sending
- [ ] Schedule management UI

#### 4.5 Invoice History & Management
**Status**: ⚠️ Basic History Exists
**Tasks**:
- [ ] View all invoices for a school
- [ ] Filter invoices (status, date range, school)
- [ ] Search invoices
- [ ] Download invoice PDF
- [ ] Resend invoice email
- [ ] Mark invoice as paid/unpaid
- [ ] Void/cancel invoice
- [ ] Generate credit notes

#### 4.6 Manual Invoice Creation
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Manual invoice creation form
- [ ] Select school
- [ ] Select template
- [ ] Enter amount and details
- [ ] Set dates (issue, due)
- [ ] Generate and preview
- [ ] Send immediately or save as draft

---

## 5. Subscriptions Enhancement

### Current State
- **Frontend**: `PlatformSubscriptions.tsx` - Comprehensive subscription management
- **Backend**: Subscription CRUD exists
- **Features Present**:
  - Create/Edit/Delete plans
  - Plan pricing
  - Student/Teacher limits
  - Features list per plan
  - Active/Inactive status
  - School count per plan

### Required Enhancements

#### 5.1 Currency Display (ZAR)
**Status**: 🔴 Currently Shows USD
**Tasks**:
- [ ] Update all price displays to show "R" instead of "$"
- [ ] Update database to store currency type
- [ ] Add currency field to plans table
- [ ] Update frontend to display ZAR (R symbol)
- [ ] Update forms to accept ZAR amounts
- [ ] Add currency conversion support (future)

#### 5.2 Feature Multi-Select
**Status**: ⚠️ Basic Feature List Exists
**Tasks**:
- [ ] Database schema for system features:
  ```sql
  CREATE TABLE system_features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES subscription_plans(id),
    feature_id INTEGER REFERENCES system_features(id),
    UNIQUE(plan_id, feature_id)
  );
  ```
- [ ] Seed system features:
  - Incident Management
  - Merit System
  - Detention Tracking
  - Attendance Management
  - Parent Portal
  - Teacher Portal
  - Admin Portal
  - Reporting & Analytics
  - Email Notifications
  - SMS Notifications
  - Custom Branding
  - API Access
  - Bulk Import/Export
  - Intervention Tracking
  - Consequence Management
  - Class Management
  - Timetable Management
  - (Exclude: Goldie Badge - as requested)
- [ ] Multi-select UI component for features
- [ ] "Select All" / "Deselect All" buttons
- [ ] Feature categories/grouping
- [ ] Visual indicators for selected features
- [ ] Save selected features to plan_features table

#### 5.3 Feature Access Control
**Status**: 🔴 Not Implemented
**Tasks**:
- [ ] Implement feature flag system based on subscription
- [ ] Check feature access in backend routes
- [ ] Show/hide features in frontend based on plan
- [ ] Display upgrade prompts for locked features
- [ ] Feature usage tracking

---

## Implementation Priority

### Phase 1: Critical (Week 1-2)
1. **Invoicing Module** - Core business requirement
   - Invoice template upload
   - Invoice generation
   - Email invoices
   - Invoice history
2. **Subscriptions - ZAR Currency** - Immediate fix needed
3. **Admin Credential Management** - Essential for school management

### Phase 2: High Priority (Week 3-4)
4. **Feature Multi-Select System** - Required for proper subscription management
5. **Billing Schedules** - Automate recurring billing
6. **Logo Management Across Portals** - Branding consistency

### Phase 3: Medium Priority (Week 5-6)
7. **Portal-Specific Color Themes** - Enhanced customization
8. **Analytics Enhancement** - Better insights
9. **Manual Invoice Creation** - Flexibility for special cases

### Phase 4: Polish (Week 7-8)
10. **Live Preview Enhancement** - Better UX
11. **Advanced Analytics** - Executive reporting
12. **Feature Access Control** - Enforce subscription limits

---

## Database Schema Changes Required

### New Tables
1. `invoice_templates`
2. `invoices`
3. `billing_schedules`
4. `system_features`
5. `plan_features`
6. `portal_customizations` (extend school_branding)

### Table Modifications
1. `subscription_plans` - Add `currency` field
2. `school_branding` - Add portal-specific logo fields
3. `schools` - Add billing schedule reference

---

## API Endpoints to Create

### School Admin Management
- `GET /api/platform/schools/:id/admins`
- `POST /api/platform/schools/:id/admins`
- `PUT /api/platform/schools/:id/admins/:adminId`
- `DELETE /api/platform/schools/:id/admins/:adminId`
- `POST /api/platform/schools/:id/admins/:adminId/reset-password`

### Invoice Management
- `GET /api/platform/invoices`
- `GET /api/platform/invoices/:id`
- `POST /api/platform/invoices`
- `PUT /api/platform/invoices/:id`
- `DELETE /api/platform/invoices/:id`
- `POST /api/platform/invoices/:id/send`
- `POST /api/platform/invoices/:id/generate-pdf`
- `GET /api/platform/schools/:id/invoices`

### Invoice Templates
- `GET /api/platform/invoice-templates`
- `POST /api/platform/invoice-templates`
- `PUT /api/platform/invoice-templates/:id`
- `DELETE /api/platform/invoice-templates/:id`
- `POST /api/platform/invoice-templates/:id/set-default`

### Billing Schedules
- `GET /api/platform/schools/:id/billing-schedule`
- `POST /api/platform/schools/:id/billing-schedule`
- `PUT /api/platform/schools/:id/billing-schedule`

### System Features
- `GET /api/platform/features`
- `GET /api/platform/plans/:id/features`
- `POST /api/platform/plans/:id/features`
- `DELETE /api/platform/plans/:id/features/:featureId`

### Enhanced Analytics
- `GET /api/platform/analytics/overview`
- `GET /api/platform/analytics/engagement`
- `GET /api/platform/analytics/revenue`
- `GET /api/platform/analytics/features`

---

## Technical Considerations

### File Storage
- Use Supabase Storage for:
  - Invoice templates
  - Generated invoice PDFs
  - Portal logos
- Namespace by school: `invoices/school_123/INV-001.pdf`

### Email Service
- Leverage existing `emailService.js`
- Create new email templates for invoices
- Support PDF attachments

### Currency Handling
- Store amounts as DECIMAL(10,2)
- Always store currency code (ZAR, USD, etc.)
- Display with proper currency symbol
- Consider future multi-currency support

### Performance
- Index frequently queried fields (invoice_number, school_id, dates)
- Cache system features list
- Optimize analytics queries with aggregations
- Consider materialized views for complex analytics

### Security
- Validate file uploads (type, size)
- Sanitize template content
- Restrict invoice access to authorized users
- Audit trail for invoice operations

---

## Testing Requirements

### Unit Tests
- Invoice generation logic
- Currency conversion
- Feature access control
- Email sending

### Integration Tests
- Invoice workflow (create → generate → send)
- Billing schedule automation
- Multi-admin management
- Feature flag enforcement

### UI Tests
- Form validations
- File uploads
- Multi-select interactions
- Preview functionality

---

## Documentation Needs

### User Documentation
- How to upload invoice templates
- How to configure billing schedules
- How to manage school admins
- How to customize portal branding

### Developer Documentation
- API endpoint specifications
- Database schema documentation
- Invoice template format requirements
- Feature flag implementation guide

---

## Success Metrics

1. **Invoicing**: 100% automated invoice generation and delivery
2. **Admin Management**: Support for unlimited admins per school
3. **Customization**: Portal-specific branding fully functional
4. **Analytics**: Executive-ready dashboards with drill-down
5. **Subscriptions**: Feature-based access control working
6. **Currency**: All amounts displayed in ZAR

---

## Next Steps

1. Review and approve this plan
2. Set up database migrations
3. Begin Phase 1 implementation
4. Conduct regular progress reviews
5. Deploy incrementally with feature flags
