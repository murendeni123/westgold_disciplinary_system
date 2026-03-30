# Theme Studio - Complete Implementation Guide

## Overview

The Theme Studio is a comprehensive theming system for GREENSTEM DMS that allows platform administrators to customize the appearance and branding of individual schools. Each school's theme is isolated to their specific schema, ensuring complete tenant separation.

## Features Implemented

### ✅ Core Functionality

1. **Draft & Active Theme System**
   - Edit themes in draft mode without affecting live users
   - Preview drafts before publishing
   - Publish drafts to make them active
   - Discard drafts to revert changes
   - Revert to default theme

2. **Theme Customization Sections**
   - **Branding**: School logo upload, school name
   - **Colors**: Primary, secondary, accent, background, surface, text colors
   - **Login Page**: Custom headline, subtext, banner image
   - **UI Options**: Corner radius (0-24px), density (compact/comfortable)

3. **Real-Time Preview System**
   - Live preview panel shows changes as you edit
   - Session-based preview mode (doesn't affect other users)
   - Preview banner with publish/exit options
   - Preview works across all pages

4. **File Upload System**
   - Logo upload (max 2MB, images only)
   - Login banner upload (max 2MB, images only)
   - Tenant-safe storage: `/uploads/schools/{schoolSlug}/branding/`
   - File deletion support

5. **CSS Variable Theming**
   - Non-breaking implementation using CSS variables
   - Variables: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-text`, `--radius`
   - Existing components unaffected

## Architecture

### Database Schema

**Table**: `public.schools`

New columns added:
```sql
active_theme_json JSONB DEFAULT NULL
draft_theme_json JSONB DEFAULT NULL
```

**Theme JSON Structure**:
```json
{
  "brand": {
    "schoolName": "School Name",
    "logoUrl": "/uploads/schools/slug/branding/logo.png"
  },
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#06b6d4",
    "background": "#f9fafb",
    "surface": "#ffffff",
    "text": "#111827"
  },
  "login": {
    "headline": "Welcome Back",
    "subtext": "Sign in to access your dashboard",
    "bannerUrl": "/uploads/schools/slug/branding/login-banner.png"
  },
  "ui": {
    "radius": 12,
    "density": "comfortable"
  }
}
```

### Backend API Endpoints

**Base Path**: `/api/platform/schools/:schoolSlug/theme`

All endpoints require platform_admin authentication.

#### GET `/:schoolSlug/theme`
Returns active theme, draft theme, defaults, and school info.

**Response**:
```json
{
  "activeTheme": { /* theme object */ },
  "draftTheme": { /* theme object or null */ },
  "defaults": { /* default theme */ },
  "schoolName": "School Name",
  "schoolId": 1
}
```

#### PUT `/:schoolSlug/theme/draft`
Save draft theme (does not publish).

**Request Body**: Theme JSON object

**Response**:
```json
{
  "success": true,
  "draftTheme": { /* saved theme */ }
}
```

#### POST `/:schoolSlug/theme/publish`
Publish draft theme to active (copies draft → active, clears draft).

**Response**:
```json
{
  "success": true,
  "activeTheme": { /* published theme */ }
}
```

#### DELETE `/:schoolSlug/theme/draft`
Discard draft theme.

**Response**:
```json
{
  "success": true
}
```

#### POST `/:schoolSlug/theme/revert`
Set draft to default theme (does not auto-publish).

**Response**:
```json
{
  "success": true,
  "draftTheme": { /* default theme */ }
}
```

#### POST `/:schoolSlug/theme/upload/:type`
Upload logo or banner image.

**Parameters**:
- `type`: "logo" or "banner"
- `file`: multipart/form-data file upload

**Response**:
```json
{
  "success": true,
  "url": "/uploads/schools/slug/branding/logo.png",
  "filename": "logo.png",
  "type": "logo"
}
```

#### DELETE `/:schoolSlug/theme/upload/:type`
Delete logo or banner image.

**Parameters**:
- `type`: "logo" or "banner"

### Frontend Components

#### 1. ThemeStudio Page
**Location**: `/frontend/src/pages/platform/ThemeStudio.tsx`

**Route**: `/platform/schools/:schoolSlug/theme-studio`

**Features**:
- Tabbed interface (Branding, Colors, Login, UI)
- Real-time preview panel
- File upload with drag-and-drop
- Color pickers with hex input
- Save Draft, Publish, Discard, Revert buttons
- Loading and error states

#### 2. ThemeProvider Context
**Location**: `/frontend/src/contexts/ThemeContext.tsx`

**Features**:
- Manages theme state globally
- Detects preview mode from URL params or sessionStorage
- Applies CSS variables dynamically
- Provides preview controls (exit, publish)

#### 3. ThemePreviewBanner
**Location**: `/frontend/src/components/ThemePreviewBanner.tsx`

**Features**:
- Sticky banner at top when preview is active
- Shows school name being previewed
- Publish and Exit Preview buttons
- Auto-hides when not in preview mode

### Frontend API Methods

**Location**: `/frontend/src/services/api.ts`

```typescript
getSchoolTheme(schoolSlug: string)
saveDraftTheme(schoolSlug: string, theme: any)
publishTheme(schoolSlug: string)
discardDraftTheme(schoolSlug: string)
revertTheme(schoolSlug: string)
uploadThemeFile(schoolSlug: string, type: 'logo' | 'banner', file: File)
deleteThemeFile(schoolSlug: string, type: 'logo' | 'banner')
```

## Usage Guide

### For Platform Admins

#### Accessing Theme Studio

1. Navigate to Platform Admin portal
2. Go to Schools section
3. Click on a school to view details
4. Click "Theme Studio" button

#### Editing a Theme

1. **Branding Tab**:
   - Upload school logo (click upload area or drag & drop)
   - Edit school name if needed

2. **Colors Tab**:
   - Use color pickers or enter hex codes
   - Changes preview in real-time

3. **Login Page Tab**:
   - Customize headline and subtext
   - Upload banner image for login page

4. **UI Options Tab**:
   - Adjust corner radius (0-24px)
   - Choose density (compact/comfortable)

5. **Save & Preview**:
   - Click "Save Draft" to save changes
   - Click "Preview Login" to see how login page looks
   - Preview banner appears - navigate around to see theme applied

6. **Publishing**:
   - When satisfied, click "Publish" to make theme live
   - Confirm the action
   - Theme is now active for all school users

#### Reverting Changes

- **Discard Draft**: Removes all unpublished changes
- **Revert to Default**: Sets draft to default theme (must publish to apply)

### Preview Mode

**How it works**:
- Preview is session-only (uses sessionStorage)
- Does NOT affect other users
- Preview state persists across page navigation
- Preview banner shows at top with controls

**Preview Controls**:
- **Publish**: Publishes the current draft theme
- **Exit Preview**: Clears preview mode and returns to normal view

**Preview URLs**:
- Login: `/s/{schoolSlug}/login?previewTheme=1`
- Dashboard: `/admin/dashboard?previewTheme=1`

## Validation & Safety

### Server-Side Validation

1. **Required Fields**: All color fields must be present
2. **Hex Color Format**: Validates #RGB or #RRGGBB format
3. **File Size**: Max 2MB for uploads
4. **File Type**: Only image files allowed
5. **Safe Fallbacks**: Missing fields merge with defaults

### Client-Side Validation

1. **File Size Check**: Before upload
2. **File Type Check**: Only images accepted
3. **Real-time Preview**: Shows changes before saving
4. **Confirmation Dialogs**: For destructive actions (publish, discard, revert)

## CSS Variables Contract

The following CSS variables are set when a theme is applied:

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-accent: #06b6d4;
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-text: #111827;
  --radius: 12px;
}
```

**Usage in Components**:
```css
.button {
  background-color: var(--color-primary);
  border-radius: var(--radius);
}
```

## File Structure

```
backend/
├── routes/
│   └── themeStudio.js          # Theme API endpoints
├── migrations/
│   └── add_theme_columns.sql   # Database migration
└── uploads/
    └── schools/
        └── {schoolSlug}/
            └── branding/
                ├── logo.png
                └── login-banner.png

frontend/
├── src/
│   ├── pages/
│   │   └── platform/
│   │       └── ThemeStudio.tsx      # Main theme editor
│   ├── contexts/
│   │   └── ThemeContext.tsx         # Theme state management
│   ├── components/
│   │   └── ThemePreviewBanner.tsx   # Preview mode banner
│   └── services/
│       └── api.ts                   # API methods (updated)
```

## Testing Checklist

- [x] Database migration runs successfully
- [x] Backend endpoints respond correctly
- [x] Theme Studio page loads without errors
- [x] Can edit all theme sections
- [x] Real-time preview updates as expected
- [x] File uploads work (logo and banner)
- [x] File deletion works
- [x] Save Draft saves to database
- [x] Publish copies draft to active
- [x] Discard Draft clears draft_theme_json
- [x] Revert to Default sets draft to defaults
- [x] Preview mode activates correctly
- [x] Preview banner appears in preview mode
- [x] Exit Preview clears preview state
- [x] CSS variables apply correctly
- [x] No breaking changes to existing pages
- [x] Validation prevents invalid data
- [x] Error handling works properly

## Default Theme Values

```json
{
  "brand": {
    "schoolName": "",
    "logoUrl": null
  },
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#06b6d4",
    "background": "#f9fafb",
    "surface": "#ffffff",
    "text": "#111827"
  },
  "login": {
    "headline": "Welcome Back",
    "subtext": "Sign in to access your disciplinary management dashboard",
    "bannerUrl": null
  },
  "ui": {
    "radius": 12,
    "density": "comfortable"
  }
}
```

## Security Considerations

1. **Authentication**: All endpoints require platform_admin role
2. **File Upload**: Size and type validation
3. **Tenant Isolation**: Files stored per school slug
4. **SQL Injection**: Parameterized queries used
5. **XSS Prevention**: JSON sanitization
6. **Preview Isolation**: Session-only, no database writes

## Future Enhancements

Potential additions for future iterations:

1. **Font Customization**: Upload custom fonts
2. **Advanced Layouts**: Grid/list view toggles
3. **Email Templates**: Customize notification emails
4. **Mobile App Theming**: Extend to mobile apps
5. **Theme Templates**: Pre-built theme presets
6. **A/B Testing**: Test multiple themes
7. **Analytics**: Track theme engagement
8. **Bulk Operations**: Apply theme to multiple schools

## Troubleshooting

### Theme not applying in preview
- Check sessionStorage for `themePreviewEnabled` and `themePreviewJson`
- Verify ThemeProvider is wrapping the app
- Check browser console for errors

### File upload fails
- Verify file size < 2MB
- Ensure file is an image type
- Check uploads directory permissions
- Verify backend route is registered

### Preview banner not showing
- Confirm preview mode is active (check sessionStorage)
- Verify ThemePreviewBanner is rendered in App.tsx
- Check for CSS z-index conflicts

### Colors not changing
- Verify CSS variables are being set on :root
- Check if components use CSS variables
- Inspect element to see computed styles

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify database schema is up to date
4. Review this guide for proper usage

---

**Implementation Status**: ✅ Complete and Production-Ready

**Last Updated**: March 5, 2026
