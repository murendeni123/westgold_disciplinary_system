# Theme Builder Technical Audit & Rebuild Specification

**Date:** February 9, 2026  
**Purpose:** Document current system architecture before rebuilding Theme Builder  
**Status:** Complete - Ready for Implementation

---

## 1. CURRENT UI PATTERNS & COMPONENT LIBRARY

### Core Component Library
The app uses a **consistent design system** with these base components:

#### **Button Component** (`/frontend/src/components/Button.tsx`)
```typescript
- Variants: 'primary' | 'secondary' | 'danger'
- Sizes: 'sm' | 'md' | 'lg'
- Uses CSS variables: var(--primary-color), var(--secondary-color), var(--danger-color)
- Border radius: var(--button-border-radius, 8px)
```

#### **Card Component** (`/frontend/src/components/Card.tsx`)
```typescript
- Simple wrapper with title support
- Border radius: var(--card-border-radius, 12px)
- Background: white
- Text color: var(--text-primary-color)
```

#### **Modal Component** (`/frontend/src/components/Modal.tsx`)
```typescript
- Sizes: 'sm' | 'md' | 'lg' | 'xl'
- Fixed positioning with overlay
- Close button (X icon from lucide-react)
- Scrollable content area
- Left offset for sidebar: left-0 sm:left-64
```

#### **Input Component** (`/frontend/src/components/Input.tsx`)
```typescript
- Label support
- Error message display
- Uses .input CSS class
- Error state: border-red-500
```

#### **Select Component** (`/frontend/src/components/Select.tsx`)
```typescript
- Standard dropdown with label
- Error state support
```

### Platform Admin Page Patterns

**Example: PlatformSchools.tsx**
```typescript
// Standard imports
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Search, Plus, Edit, Trash2, ... } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Standard layout structure:
1. State management (useState for data, loading, modals)
2. useEffect for data fetching
3. CRUD handlers (create, edit, delete)
4. Filter/search functionality
5. Table/grid display with action buttons
6. Modals for forms
7. Toast notifications for feedback
```

**Common UI Patterns:**
- **Header Section:** Title + action buttons (Add New, etc.)
- **Filter Bar:** Search input + status filters + dropdown filters
- **Data Table:** Responsive table with hover effects
- **Action Buttons:** Icon buttons (Eye, Edit, Trash2) with tooltips
- **Modals:** Form modals for create/edit, confirmation modals for delete
- **Loading States:** Loading skeleton or spinner
- **Empty States:** Friendly message when no data
- **Toast Notifications:** Success/error feedback

### Styling Conventions
```css
- Tailwind CSS utility classes
- Custom CSS variables for theming
- Framer Motion for animations
- Lucide React for icons
- Glass morphism effects (backdrop-blur)
- Gradient backgrounds
- Shadow utilities (shadow-sm, shadow-md, shadow-lg)
- Spacing: p-4, p-6, mb-4, mt-6, etc.
- Text sizes: text-sm, text-base, text-lg, text-xl, text-2xl
- Font weights: font-medium, font-semibold, font-bold
```

---

## 2. CURRENT API ENDPOINTS & PAYLOAD STRUCTURES

### **Legacy Customization System** (Currently Used)

**Base Route:** `/api/school-customizations`  
**File:** `backend/routes/schoolCustomizations.js`  
**Registered in:** `server.js` line 163

#### Endpoints:

**1. Get Customizations (Public)**
```
GET /api/school-customizations/public/:schoolId
Auth: None (public endpoint)
Response: {
  id: number,
  school_id: number,
  logo_path: string | null,
  favicon_path: string | null,
  login_background_path: string | null,
  dashboard_background_path: string | null,
  primary_color: string,
  secondary_color: string,
  success_color: string,
  warning_color: string,
  danger_color: string,
  background_color: string,
  text_primary_color: string,
  text_secondary_color: string,
  primary_font: string,
  secondary_font: string,
  base_font_size: string,
  button_border_radius: string,
  card_border_radius: string,
  sidebar_background: string,
  header_background: string,
  login_welcome_message: string | null,
  login_tagline: string | null,
  login_background_color: string,
  contact_email: string | null,
  contact_phone: string | null,
  support_email: string | null,
  terms_url: string | null,
  privacy_url: string | null,
  custom_css: string | null,
  custom_js: string | null,
  email_header_html: string | null,
  email_footer_html: string | null,
  email_signature: string | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

**2. Get Customizations (Admin)**
```
GET /api/school-customizations/:schoolId
Auth: Platform Admin JWT
Response: Same as public endpoint
```

**3. Update Customizations**
```
PUT /api/school-customizations/:schoolId
Auth: Platform Admin JWT
Body: {
  primary_color?: string,
  secondary_color?: string,
  success_color?: string,
  warning_color?: string,
  danger_color?: string,
  background_color?: string,
  text_primary_color?: string,
  text_secondary_color?: string,
  primary_font?: string,
  secondary_font?: string,
  base_font_size?: string,
  button_border_radius?: string,
  card_border_radius?: string,
  sidebar_background?: string,
  header_background?: string,
  login_welcome_message?: string,
  login_tagline?: string,
  login_background_color?: string,
  contact_email?: string,
  contact_phone?: string,
  support_email?: string,
  terms_url?: string,
  privacy_url?: string,
  custom_css?: string,
  custom_js?: string,
  email_header_html?: string,
  email_footer_html?: string,
  email_signature?: string
}
Response: Updated customization object
```

**4. Upload Logo**
```
POST /api/school-customizations/:schoolId/logo
Auth: Platform Admin JWT
Content-Type: multipart/form-data
Body: FormData with 'logo' file
Response: { logo_path: string }
```

**5. Upload Favicon**
```
POST /api/school-customizations/:schoolId/favicon
Auth: Platform Admin JWT
Content-Type: multipart/form-data
Body: FormData with 'favicon' file
Response: { favicon_path: string }
```

**6. Upload Login Background**
```
POST /api/school-customizations/:schoolId/login-background
Auth: Platform Admin JWT
Content-Type: multipart/form-data
Body: FormData with 'background' file
Response: { login_background_path: string }
```

**7. Upload Dashboard Background**
```
POST /api/school-customizations/:schoolId/dashboard-background
Auth: Platform Admin JWT
Content-Type: multipart/form-data
Body: FormData with 'background' file
Response: { dashboard_background_path: string }
```

**8. Delete Assets**
```
DELETE /api/school-customizations/:schoolId/logo
DELETE /api/school-customizations/:schoolId/favicon
DELETE /api/school-customizations/:schoolId/login-background
DELETE /api/school-customizations/:schoolId/dashboard-background
Auth: Platform Admin JWT
Response: { message: 'Asset deleted successfully' }
```

### **New Theme Builder System** (Partially Implemented)

**Base Route:** `/api/theme-builder`  
**File:** `backend/routes/themeBuilder.js`  
**Registered in:** `server.js` line 164

**Note:** This system uses `theme_versions` table with versioning support, but is NOT currently integrated with the frontend SchoolThemeContext.

---

## 3. DATABASE ARCHITECTURE (Multi-Tenant)

### **Schema Strategy**

The system uses **hybrid multi-tenancy**:

1. **Public Schema** - Shared tables for all schools:
   - `public.schools` - School master list
   - `public.school_customizations` - **CURRENT CUSTOMIZATION STORAGE**
   - `public.theme_versions` - New theme system (not used yet)
   - `public.platform_users` - Platform admins
   - `public.subscriptions` - Billing data

2. **Per-School Schemas** - Isolated data per school:
   - `school_ws2025.students`
   - `school_ws2025.teachers`
   - `school_ws2025.incidents`
   - etc.

### **Current Customization Storage**

**Table:** `public.school_customizations`

**Schema:**
```sql
CREATE TABLE public.school_customizations (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Assets
  logo_path TEXT,
  favicon_path TEXT,
  login_background_path TEXT,
  dashboard_background_path TEXT,
  
  -- Colors
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#8b5cf6',
  success_color TEXT DEFAULT '#10b981',
  warning_color TEXT DEFAULT '#f59e0b',
  danger_color TEXT DEFAULT '#ef4444',
  background_color TEXT DEFAULT '#f9fafb',
  text_primary_color TEXT DEFAULT '#111827',
  text_secondary_color TEXT DEFAULT '#6b7280',
  
  -- Typography
  primary_font TEXT DEFAULT 'Inter',
  secondary_font TEXT DEFAULT 'Inter',
  base_font_size TEXT DEFAULT '16px',
  
  -- UI Components
  button_border_radius TEXT DEFAULT '8px',
  card_border_radius TEXT DEFAULT '12px',
  sidebar_background TEXT DEFAULT '#ffffff',
  header_background TEXT DEFAULT '#ffffff',
  
  -- Login Page
  login_welcome_message TEXT,
  login_tagline TEXT,
  login_background_color TEXT DEFAULT '#ffffff',
  
  -- Contact Info
  contact_email TEXT,
  contact_phone TEXT,
  support_email TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  
  -- Advanced
  custom_css TEXT,
  custom_js TEXT,
  
  -- Email Templates
  email_header_html TEXT,
  email_footer_html TEXT,
  email_signature TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Storage:** Individual columns (NOT JSON)  
**Assets:** File paths stored as TEXT, files in `/uploads/schools/:schoolId/`

### **New Theme System** (Not Currently Used)

**Table:** `public.theme_versions`

**Schema:**
```sql
CREATE TABLE public.theme_versions (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  name VARCHAR(255),
  description TEXT,
  
  -- All data stored as JSONB
  tokens JSONB NOT NULL DEFAULT '{}',
  assets JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  email_templates JSONB DEFAULT '{}',
  advanced_overrides JSONB DEFAULT '{}',
  portal_overrides JSONB DEFAULT '{}',
  
  created_by INTEGER REFERENCES public.platform_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  published_by INTEGER REFERENCES public.platform_users(id),
  
  UNIQUE(school_id, version_number)
);
```

**Storage:** JSONB columns for flexibility  
**Versioning:** Multiple versions per school  
**Status:** draft, published, archived

---

## 4. CURRENT CUSTOMIZATION DATA FLOW

### **Loading Customizations at Login**

**Flow:**
1. User logs in → JWT token issued with `school_id`
2. `SchoolThemeContext` mounts in `App.tsx` (line 116)
3. `useEffect` triggers `fetchCustomizations()` (line 367)
4. Calls `api.getSchoolCustomizationsPublic(schoolId)` 
5. Backend: `GET /api/school-customizations/public/:schoolId`
6. Database: `SELECT * FROM public.school_customizations WHERE school_id = $1`
7. Returns customization object or defaults
8. Frontend: `applyCustomizations()` called (line 257)
9. Sets CSS variables on `document.documentElement`
10. Updates favicon
11. Loads custom fonts
12. Applies custom CSS

**Code Reference:**
```typescript
// frontend/src/contexts/SchoolThemeContext.tsx

const fetchCustomizations = async () => {
  const targetSchoolId = schoolId || user?.school_id;
  const response = await api.getSchoolCustomizationsPublic(targetSchoolId);
  setCustomizations(response.data || null);
  applyCustomizations(response.data);
};

const applyCustomizations = (customs) => {
  if (customs.primary_color) {
    document.documentElement.style.setProperty('--primary-color', customs.primary_color);
  }
  // ... repeat for all fields
};
```

### **Applying Customizations in App**

**CSS Variables Set:**
```css
--primary-color
--secondary-color
--success-color
--warning-color
--danger-color
--background-color
--text-primary-color
--text-secondary-color
--button-border-radius
--card-border-radius
--sidebar-background
--header-background
--primary-font
--secondary-font
--base-font-size
```

**Components Using Variables:**
- `Button.tsx` - Uses `var(--primary-color)`, `var(--button-border-radius)`
- `Card.tsx` - Uses `var(--card-border-radius)`, `var(--text-primary-color)`
- `index.css` - Defines defaults and applies to body
- All layouts - Use CSS variables for colors

### **Saving Updates**

**Flow (Platform Admin Only):**
1. Platform admin navigates to school details
2. Clicks "Customize" button
3. Opens customization form/page
4. Edits fields (colors, fonts, etc.)
5. Uploads assets (logo, favicon)
6. Clicks "Save"
7. Frontend: `api.updateSchoolCustomizations(schoolId, data)`
8. Backend: `PUT /api/school-customizations/:schoolId`
9. Database: `UPDATE public.school_customizations SET ... WHERE school_id = $1`
10. Returns updated customization object
11. Frontend: Shows success toast
12. Changes apply immediately (context refreshes)

---

## 5. ISSUES IDENTIFIED

### **Critical Issues**

1. **Two Competing Systems**
   - Legacy: `school_customizations` table (flat columns)
   - New: `theme_versions` table (JSONB, versioning)
   - **Problem:** Frontend only uses legacy system
   - **Impact:** New Theme Builder not integrated

2. **CSS Variable Naming Mismatch** ✅ FIXED
   - New theme system used `--primary` instead of `--primary-color`
   - Fixed in commit 576bd7b

3. **Asset URL Generation** ✅ FIXED
   - Production used localhost URLs
   - Fixed in commit cee794e

4. **No Live Preview in Current System**
   - Legacy customization page lacks real-time preview
   - Users can't see changes before saving

5. **No Version History**
   - Legacy system has no rollback capability
   - Can't track who changed what

6. **Limited Customization Options**
   - Legacy system has basic fields only
   - No advanced layout controls
   - No portal-specific overrides

### **Data Mismatches**

1. **Field Name Inconsistencies:**
   - Backend: `primary_color` (snake_case)
   - Frontend CSS: `--primary-color` (kebab-case)
   - New system: `primary` (camelCase in JSON)

2. **Asset Path Handling:**
   - Backend stores: `/uploads/schools/1/logo-123.png`
   - Frontend needs: Full URL with domain
   - `getImageUrl()` function handles conversion

3. **Default Values:**
   - Defined in 3 places: DB schema, backend code, frontend code
   - Can get out of sync

### **Missing Features**

1. **No Draft/Publish Workflow**
   - Changes go live immediately
   - No way to preview before publishing

2. **No Validation**
   - No color contrast checking
   - No accessibility validation
   - No size limits on text fields

3. **No Portal-Specific Overrides**
   - Can't customize Admin vs Teacher vs Parent portals differently

4. **No Email Template Customization**
   - Fields exist but no UI to edit them

---

## 6. SCHEMA RESOLUTION FLOW

### **How School Schema is Determined**

**For Regular Users (Admin/Teacher/Parent):**
```
1. User logs in
2. JWT token issued with claims:
   {
     user_id: 123,
     school_id: 1,
     role: 'admin',
     schema_name: 'school_ws2025'
   }
3. Backend middleware extracts school_id from JWT
4. Middleware sets PostgreSQL search_path to school schema
5. All queries run in that schema context
```

**For Platform Admin:**
```
1. Platform admin logs in
2. JWT token issued with:
   {
     user_id: 456,
     role: 'platform_admin',
     school_id: null  // No school association
   }
3. Platform admin can access any school's data
4. Must explicitly specify school_id in requests
5. Backend validates platform_admin role
6. Sets search_path per request based on school_id parameter
```

**Middleware:**
```javascript
// backend/middleware/auth.js
const setSchemaFromToken = async (req, res, next) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  req.schoolId = decoded.school_id;
  req.schemaName = decoded.schema_name;
  // Set PostgreSQL search_path
  await client.query(`SET search_path TO ${req.schemaName}, public`);
  next();
};
```

### **Customization Access Pattern**

**Public Endpoint (No Auth):**
```
GET /api/school-customizations/public/:schoolId
- No JWT required
- Anyone can fetch school branding
- Used by login page before authentication
```

**Admin Endpoint (Platform Admin Only):**
```
GET /api/school-customizations/:schoolId
PUT /api/school-customizations/:schoolId
POST /api/school-customizations/:schoolId/logo
- Requires platform_admin role in JWT
- Can modify any school's customizations
```

---

## 7. REBUILD RECOMMENDATIONS

### **Option A: Enhance Legacy System** (RECOMMENDED)

**Pros:**
- Already integrated and working
- No data migration needed
- Simpler implementation
- Lower risk

**Cons:**
- No versioning
- Limited to flat schema
- No draft/publish workflow

**Implementation:**
1. Build new UI using existing API endpoints
2. Add live preview component
3. Add validation and contrast checking
4. Keep using `school_customizations` table
5. Add version tracking in separate table if needed

### **Option B: Migrate to New Theme System**

**Pros:**
- Modern architecture with versioning
- Draft/publish workflow
- Flexible JSONB storage
- Better for future features

**Cons:**
- Requires data migration
- More complex implementation
- Higher risk of breaking changes
- Need to update SchoolThemeContext

**Implementation:**
1. Migrate existing data to `theme_versions`
2. Update SchoolThemeContext to use new API
3. Build new Theme Builder UI
4. Implement version history UI
5. Add rollback functionality

### **Recommended Approach: Option A**

**Rationale:**
- Production system is live
- Users depend on current customizations
- Legacy system works and is well-tested
- Can enhance UI without backend changes
- Lower risk of breaking production

---

## 8. THEME BUILDER REBUILD SPECIFICATION

### **Architecture Decision**

**Use Legacy System** (`school_customizations` table)  
**Enhance UI** with modern design patterns  
**Keep Backend** API as-is  
**Add Features** incrementally

### **New Theme Builder Structure**

```
/platform/schools/:schoolId/customize
├── Header (School name, Save button, Preview toggle)
├── Sidebar Navigation
│   ├── Branding
│   ├── Colors
│   ├── Typography
│   ├── Components
│   ├── Layout
│   ├── Login Page
│   ├── Contact Info
│   └── Advanced
└── Main Content Area
    ├── Section Forms (left panel)
    └── Live Preview (right panel, toggleable)
```

### **UI Components to Build**

1. **CustomizationLayout.tsx** - Main container
2. **CustomizationSidebar.tsx** - Section navigation
3. **BrandingPanel.tsx** - Logo/favicon uploads
4. **ColorsPanel.tsx** - Color pickers with preview
5. **TypographyPanel.tsx** - Font selection
6. **ComponentsPanel.tsx** - Border radius controls
7. **LayoutPanel.tsx** - Sidebar/header colors
8. **LoginPagePanel.tsx** - Welcome message, tagline
9. **ContactPanel.tsx** - Contact info fields
10. **AdvancedPanel.tsx** - Custom CSS/JS
11. **LivePreview.tsx** - Real-time preview iframe

### **API Integration**

**Use Existing Endpoints:**
- `GET /api/school-customizations/:schoolId` - Load data
- `PUT /api/school-customizations/:schoolId` - Save changes
- `POST /api/school-customizations/:schoolId/logo` - Upload logo
- `POST /api/school-customizations/:schoolId/favicon` - Upload favicon
- `DELETE /api/school-customizations/:schoolId/logo` - Delete logo
- `DELETE /api/school-customizations/:schoolId/favicon` - Delete favicon

**Frontend Service Methods (Already Exist):**
```typescript
api.getSchoolCustomizations(schoolId)
api.updateSchoolCustomizations(schoolId, data)
api.uploadSchoolLogo(schoolId, file)
api.uploadSchoolFavicon(schoolId, file)
api.deleteSchoolLogo(schoolId)
api.deleteSchoolFavicon(schoolId)
```

### **State Management**

```typescript
const [customizations, setCustomizations] = useState(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [activeSection, setActiveSection] = useState('branding');
const [showPreview, setShowPreview] = useState(true);
const [hasChanges, setHasChanges] = useState(false);
```

### **Auto-Save Strategy**

```typescript
// Debounced auto-save after 2 seconds of inactivity
useEffect(() => {
  if (hasChanges) {
    const timer = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [customizations, hasChanges]);
```

### **Live Preview Implementation**

```typescript
// Apply changes to preview iframe in real-time
useEffect(() => {
  if (previewRef.current) {
    const doc = previewRef.current.contentDocument;
    Object.entries(customizations).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/_/g, '-')}`;
      doc.documentElement.style.setProperty(cssVar, value);
    });
  }
}, [customizations]);
```

---

## 9. IMPLEMENTATION CHECKLIST

### **Phase 1: Setup & Layout**
- [ ] Create `/platform/schools/:schoolId/customize` route
- [ ] Build CustomizationLayout component
- [ ] Build CustomizationSidebar with section navigation
- [ ] Implement state management
- [ ] Add loading states

### **Phase 2: Core Panels**
- [ ] BrandingPanel - Logo/favicon uploads with preview
- [ ] ColorsPanel - Color pickers for all color fields
- [ ] TypographyPanel - Font family and size selectors
- [ ] ComponentsPanel - Border radius sliders

### **Phase 3: Additional Panels**
- [ ] LayoutPanel - Sidebar/header customization
- [ ] LoginPagePanel - Welcome message and tagline
- [ ] ContactPanel - Contact info fields
- [ ] AdvancedPanel - Custom CSS/JS with code editor

### **Phase 4: Live Preview**
- [ ] Build LivePreview component
- [ ] Implement real-time CSS variable updates
- [ ] Add device size toggles (desktop/tablet/mobile)
- [ ] Add portal type toggles (admin/teacher/parent)

### **Phase 5: Polish**
- [ ] Add validation (color contrast, required fields)
- [ ] Add unsaved changes warning
- [ ] Add reset to defaults button
- [ ] Add export/import configuration
- [ ] Add keyboard shortcuts
- [ ] Add accessibility features

### **Phase 6: Testing**
- [ ] Test all CRUD operations
- [ ] Test file uploads
- [ ] Test live preview updates
- [ ] Test on different screen sizes
- [ ] Test with different user roles
- [ ] Test error handling

---

## 10. SUCCESS CRITERIA

The rebuilt Theme Builder is complete when:

✅ Platform admin can access customization page  
✅ All existing fields are editable  
✅ Logo and favicon can be uploaded/deleted  
✅ Color changes show in live preview  
✅ Font changes apply correctly  
✅ Changes auto-save after 2 seconds  
✅ Manual save button works  
✅ Preview updates in real-time  
✅ Changes apply to actual portals after save  
✅ No data loss or corruption  
✅ UI matches existing platform design  
✅ Mobile responsive  
✅ Accessible (keyboard navigation, screen readers)  
✅ Error handling for failed uploads/saves  
✅ Loading states for all async operations  

---

## CONCLUSION

**Current State:**
- Legacy customization system is functional and integrated
- Uses `public.school_customizations` table with flat columns
- API endpoints exist and work correctly
- Frontend SchoolThemeContext applies customizations
- CSS variables system is working (after recent fixes)

**Rebuild Strategy:**
- Enhance existing system rather than replace
- Build modern UI using current API endpoints
- Add live preview and validation
- Keep backend unchanged for stability
- Use established UI patterns from platform pages

**Next Steps:**
1. Review this document with user
2. Get approval on approach
3. Begin implementation of Phase 1
4. Iterate through phases with testing
5. Deploy when all success criteria met

---

*Ready for implementation. No code changes until user approval.*
