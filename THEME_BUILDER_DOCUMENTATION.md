# 🎨 Enterprise Theme Builder - Complete Documentation

## Overview

The Enterprise Theme Builder is a comprehensive, multi-tenant theming system that allows platform administrators to customize the appearance and branding of each school's portal. Built with a draft/publish workflow, version history, and live preview capabilities.

---

## 🏗️ Architecture

### System Components

1. **Database Layer** (`theme_system_schema.sql`)
   - `theme_versions` - Stores all theme versions (draft, published, archived)
   - `theme_assets` - Manages uploaded assets (logos, backgrounds)
   - `theme_change_history` - Audit trail of all changes

2. **Backend API** (`routes/themeBuilder.js`)
   - Draft/publish workflow endpoints
   - Asset upload with image processing
   - Version history and rollback
   - Public endpoint for published themes

3. **Frontend Components**
   - Main Theme Builder UI (`pages/platform/ThemeBuilder.tsx`)
   - 8 Customization Sections (Branding, Colors, Typography, etc.)
   - Live Preview System
   - Version History Modal

4. **Type System** (`types/theme.types.ts`)
   - Complete TypeScript definitions
   - Design token interfaces
   - API request/response types

---

## 📊 Database Schema

### Theme Versions Table

```sql
CREATE TABLE public.theme_versions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')),
    tokens JSONB NOT NULL,
    assets JSONB,
    content JSONB,
    email_templates JSONB,
    advanced_overrides JSONB,
    portal_overrides JSONB,
    created_at TIMESTAMP,
    published_at TIMESTAMP,
    UNIQUE(school_id, version_number)
);
```

### Design Tokens Structure

```json
{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "background": "#f9fafb",
    "surface": "#ffffff",
    "textPrimary": "#111827",
    "textSecondary": "#6b7280",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444",
    "border": "#e5e7eb",
    "focusRing": "#3b82f6"
  },
  "typography": {
    "fontPrimary": "Inter",
    "fontSecondary": "Inter",
    "baseFontSize": "16px",
    "headingScale": { "h1": "2.5rem", ... },
    "fontWeights": { "normal": 400, ... },
    "lineHeights": { "tight": 1.25, ... }
  },
  "components": {
    "buttonRadius": "8px",
    "cardRadius": "12px",
    "inputRadius": "8px",
    "shadowLevel": "medium",
    "borderWidth": "1px",
    "spacingScale": { "xs": "0.25rem", ... }
  },
  "layout": {
    "sidebarWidth": "280px",
    "headerHeight": "64px",
    "density": "normal",
    "cornerStyle": "rounded"
  }
}
```

---

## 🔌 API Endpoints

### Public Endpoints

```
GET /api/theme-builder/public/:schoolId/published
```
Returns the currently published theme for a school. No authentication required.

### Platform Admin Endpoints

```
GET    /api/theme-builder/:schoolId/draft
POST   /api/theme-builder/:schoolId/draft
POST   /api/theme-builder/:schoolId/publish
POST   /api/theme-builder/:schoolId/rollback
POST   /api/theme-builder/:schoolId/assets
DELETE /api/theme-builder/:schoolId/assets/:assetId
GET    /api/theme-builder/:schoolId/history
GET    /api/theme-builder/:schoolId/changes
```

### Example: Save Draft

```typescript
POST /api/theme-builder/1/draft

{
  "tokens": { /* design tokens */ },
  "assets": {
    "logo": "/uploads/theme-assets/1/logo-123.png",
    "favicon": "/uploads/theme-assets/1/favicon-123.ico"
  },
  "content": {
    "loginPage": {
      "welcomeMessage": "Welcome to Our School",
      "tagline": "Excellence in Education"
    }
  }
}
```

### Example: Publish Theme

```typescript
POST /api/theme-builder/1/publish

{
  "theme_version_id": 42,
  "force": false
}
```

---

## 🎨 Customization Sections

### 1. Branding (`BrandingSection.tsx`)

**Features:**
- Logo upload (PNG, SVG)
- Favicon upload (ICO, PNG)
- Login background image
- Dashboard background image
- Drag & drop support
- Image preview
- File size validation (10MB max)

**Usage:**
```tsx
<BrandingSection
  schoolId="1"
  assets={draftState.assets}
  onUpdateAssets={(assets) => updateAssets(assets)}
/>
```

---

### 2. Colors (`ColorsSection.tsx`)

**Features:**
- Color pickers for all semantic colors
- Auto-generated color palettes (50-900 shades)
- WCAG contrast validation
- Real-time contrast ratio display
- AAA/AA/Fail badges
- Palette preview

**Color Groups:**
- Brand Colors (Primary, Secondary)
- Semantic Colors (Success, Warning, Danger)
- Background & Surface
- Text Colors
- UI Elements (Border, Focus Ring)

**Contrast Validation:**
```typescript
const ratio = calculateContrast(color1, color2);
// AAA: ratio >= 7
// AA:  ratio >= 4.5
// Fail: ratio < 4.5
```

---

### 3. Typography (`TypographySection.tsx`)

**Features:**
- Google Fonts integration (14 popular fonts)
- Font search functionality
- Primary & secondary font selection
- Base font size slider (12px - 20px)
- Heading scale editor (H1-H6)
- Font weight controls (100-900)
- Line height settings
- Live font preview

**Google Fonts Auto-Loading:**
```typescript
const loadFont = (fontName: string) => {
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};
```

---

### 4. UI Components (`ComponentsSection.tsx`)

**Features:**
- Border radius controls (buttons, cards, inputs)
- Shadow depth selector (none, sm, medium, lg, xl)
- Border width slider
- Spacing scale editor
- Live component preview

**Component Preview:**
- Buttons (primary, success, danger, outline)
- Cards (default, highlighted)
- Form elements (input, select, textarea)
- Badges (all semantic colors)

---

### 5. Layout (`LayoutSection.tsx`)

**Features:**
- Sidebar width control (200px - 400px)
- Header height control (48px - 96px)
- Content density (compact, normal, comfortable)
- Corner style (sharp, rounded, pill)
- Live layout preview

**Density Impact:**
```typescript
compact: { padding: '0.5rem 0.75rem' }
normal: { padding: '0.5rem 0.75rem' }
comfortable: { padding: '0.75rem 1rem' }
```

---

### 6. Content (`ContentSection.tsx`)

**Features:**
- Login page messaging
  - Welcome message
  - Tagline
  - Text alignment (left, center, right)
- Contact information
  - Contact email
  - Phone number
  - Support email
- Footer links
  - Terms of Service URL
  - Privacy Policy URL

---

### 7. Email Templates (`EmailTemplatesSection.tsx`)

**Features:**
- Email header HTML editor
- Email footer HTML editor
- Email signature editor
- Live email preview
- Sample email content

**Template Structure:**
```html
<!-- Header HTML -->
<div style="text-align: center; padding: 20px;">
  <img src="logo.png" alt="School Logo" />
</div>

<!-- Email Content (auto-generated) -->

<!-- Signature -->
Best regards,
School Administration

<!-- Footer HTML -->
<div style="text-align: center; color: #666;">
  © 2026 School Name
</div>
```

---

### 8. Advanced (`AdvancedSection.tsx`)

**Features:**
- Custom CSS editor
- Scoped CSS preview
- Safety warnings
- Best practices guide
- Custom JavaScript (disabled for security)
- Clear all custom code button

**Security:**
- Unsafe patterns blocked: `eval()`, `expression()`, `javascript:`
- CSS scoped to prevent global conflicts
- JavaScript disabled by default
- Platform admin only access

---

## 🔄 Draft/Publish Workflow

### Workflow States

1. **Draft** - Work in progress, not visible to users
2. **Published** - Live version visible to all users
3. **Archived** - Previous versions kept for history

### Workflow Steps

```
1. Platform admin opens Theme Builder
2. System loads current published theme (if exists)
3. System creates/loads draft from published version
4. Admin makes changes → Auto-saved to draft every 2 seconds
5. Admin clicks "Publish"
6. System validates theme (contrast, assets, unsafe code)
7. Current published version → Archived
8. Draft → Published
9. All users see new theme immediately
```

### Auto-Save

```typescript
useEffect(() => {
  if (!autoSaveEnabled || !draftState.isDirty) return;
  
  const timer = setTimeout(() => {
    saveDraft();
  }, 2000);
  
  return () => clearTimeout(timer);
}, [draftState, autoSaveEnabled]);
```

---

## ✅ Validation System

### Pre-Publish Validation

```typescript
const validateTheme = (): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];
  
  // 1. Contrast Validation
  const ratio = calculateContrast(colors.primary, colors.surface);
  if (ratio < 4.5) {
    warnings.push({
      type: 'contrast',
      severity: 'warning',
      message: 'Primary color contrast below WCAG AA',
      field: 'colors.primary'
    });
  }
  
  // 2. Missing Assets
  if (!assets.logo) {
    warnings.push({
      type: 'missing_asset',
      severity: 'warning',
      message: 'No logo uploaded'
    });
  }
  
  // 3. Unsafe CSS
  const unsafePatterns = ['eval(', 'expression(', 'javascript:'];
  if (customCss && unsafePatterns.some(p => customCss.includes(p))) {
    warnings.push({
      type: 'unsafe_css',
      severity: 'error',
      message: 'Custom CSS contains unsafe code'
    });
  }
  
  return warnings;
};
```

### Validation Levels

- **Error** - Blocks publishing
- **Warning** - Shows alert but allows publishing
- **Info** - Informational only

---

## 📜 Version History & Rollback

### Version History

```typescript
GET /api/theme-builder/:schoolId/history?page=1&pageSize=20

Response:
{
  "versions": [
    {
      "id": 42,
      "version_number": 5,
      "status": "published",
      "name": "Summer 2026 Theme",
      "created_at": "2026-02-08T10:00:00Z",
      "published_at": "2026-02-08T10:30:00Z"
    },
    ...
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

### Rollback

```typescript
POST /api/theme-builder/:schoolId/rollback

{
  "target_version_number": 3
}

// Creates new published version from target version
// Archives current published version
// Logs rollback action in change history
```

---

## 🎯 Design Token Application

### CSS Variables

Design tokens are applied as CSS variables:

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --button-radius: 8px;
  --card-radius: 12px;
  /* ... */
}
```

### Component Usage

```tsx
<button
  style={{
    backgroundColor: 'var(--primary-color)',
    borderRadius: 'var(--button-radius)',
    fontFamily: 'var(--primary-font)'
  }}
>
  Click Me
</button>
```

### Dynamic Application

```typescript
const applyTokens = (tokens: DesignTokens) => {
  // Colors
  Object.entries(tokens.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(
      `--${camelToKebab(key)}`,
      value
    );
  });
  
  // Typography
  document.documentElement.style.setProperty(
    '--primary-font',
    tokens.typography.fontPrimary
  );
  
  // Components
  document.documentElement.style.setProperty(
    '--button-radius',
    tokens.components.buttonRadius
  );
};
```

---

## 🚀 Deployment & Setup

### 1. Database Migration

```bash
cd backend
psql -U postgres -d your_database -f database/theme_system_schema.sql
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install sharp  # For image processing

# Frontend (already installed)
cd frontend
npm install
```

### 3. Environment Variables

```bash
# backend/.env
JWT_SECRET=your-secret-key
```

### 4. Start Services

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm start
```

### 5. Access Theme Builder

```
Navigate to: /platform/schools/{schoolId}/theme-builder
```

---

## 📱 Multi-Portal Support

### Portal Overrides

Each portal (Admin, Teacher, Parent) can have custom overrides:

```json
{
  "portal_overrides": {
    "admin": {
      "colors": {
        "primary": "#f59e0b"  // Orange for admin
      }
    },
    "teacher": {
      "colors": {
        "primary": "#10b981"  // Green for teacher
      }
    },
    "parent": {
      "colors": {
        "primary": "#3b82f6"  // Blue for parent
      }
    }
  }
}
```

### Fallback Logic

```typescript
const getPortalColor = (portal: PortalType, colorKey: string) => {
  return (
    portalOverrides[portal]?.colors?.[colorKey] ||
    globalTokens.colors[colorKey] ||
    DEFAULT_COLORS[colorKey]
  );
};
```

---

## 🔒 Security

### Authentication

- All admin endpoints require platform admin JWT
- Public endpoint for published themes only
- Asset uploads validated for file type and size

### Input Validation

- File type whitelist: `image/jpeg`, `image/png`, `image/svg+xml`, etc.
- File size limit: 10MB
- CSS pattern blocking: `eval()`, `expression()`, `javascript:`
- SQL injection prevention via parameterized queries

### Asset Storage

```
backend/uploads/theme-assets/{schoolId}/{assetType}-{timestamp}-{random}.ext
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload logo and verify display
- [ ] Change primary color and verify contrast validation
- [ ] Select different fonts and verify Google Fonts loading
- [ ] Adjust border radius and verify preview
- [ ] Save draft and verify auto-save
- [ ] Publish theme and verify live update
- [ ] Rollback to previous version
- [ ] Test on different portals (Admin, Teacher, Parent)
- [ ] Test on different devices (Desktop, Tablet, Mobile)

### API Testing

```bash
# Get published theme
curl http://localhost:5000/api/theme-builder/public/1/published

# Save draft (requires auth)
curl -X POST http://localhost:5000/api/theme-builder/1/draft \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokens": {...}}'
```

---

## 🐛 Troubleshooting

### Issue: Theme not applying

**Solution:**
1. Check browser console for errors
2. Verify theme is published (not draft)
3. Clear browser cache
4. Check CSS variables in DevTools

### Issue: Assets not loading

**Solution:**
1. Verify file path in database
2. Check file exists in `backend/uploads/theme-assets/`
3. Verify backend server is running
4. Check CORS settings

### Issue: Auto-save not working

**Solution:**
1. Check `isDirty` flag is true
2. Verify no console errors
3. Check network tab for API calls
4. Ensure backend is accessible

---

## 📈 Future Enhancements

### Planned Features

1. **Live Preview Iframe**
   - Real-time preview of actual portal pages
   - Device switching (desktop, tablet, mobile)
   - Portal switching (admin, teacher, parent)

2. **Advanced Validation**
   - Accessibility score
   - Performance impact analysis
   - Mobile responsiveness check

3. **Theme Templates**
   - Pre-built theme templates
   - One-click theme import
   - Theme marketplace

4. **Collaboration**
   - Multiple admins editing
   - Comment system
   - Approval workflow

5. **Analytics**
   - Theme usage metrics
   - User engagement tracking
   - A/B testing support

---

## 📚 Additional Resources

- [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Google Fonts API](https://developers.google.com/fonts/docs/getting_started)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

## 🤝 Support

For issues or questions:
- Check this documentation
- Review code comments
- Check browser console for errors
- Contact platform support team

---

**Last Updated:** February 8, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
