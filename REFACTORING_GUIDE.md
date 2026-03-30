# Frontend Dark Theme Refactoring Guide

## Overview
This guide documents the complete refactoring of the frontend to use a consistent dark theme without inline styles or hardcoded colors.

## Theme System

### Color Variables (CSS Variables)
All colors are defined in `index.css`:
```css
--bg-primary: #0B0F14      /* Main background */
--bg-surface: #121821      /* Cards, surfaces */
--bg-border: #1E293B       /* Borders, dividers */
--color-primary: #00E676   /* Primary accent (green) */
--color-secondary: #38BDF8 /* Secondary accent (cyan) */
--text-primary: #E5E7EB    /* Primary text */
--text-muted: #9CA3AF      /* Muted text */
--color-success: #00E676   /* Success state */
--color-warning: #f59e0b   /* Warning state */
--color-error: #ef4444     /* Error state */
--color-info: #38BDF8      /* Info state */
```

### Tailwind Colors
Simplified color palette in `tailwind.config.js`:
- `background` - Main background
- `surface` - Cards and surfaces
- `border` - Borders and dividers
- `primary` - Primary accent
- `secondary` - Secondary accent
- `text` - Primary text
- `muted` - Muted text

## Reusable CSS Classes

### Layout
- `.app-container` - Main app wrapper
- `.page-wrapper` - Page content wrapper with padding
- `.content-section` - Content section with background and border

### Buttons
- `.btn` - Base button
- `.btn-primary` - Primary button (green-cyan gradient)
- `.btn-secondary` - Secondary button (surface background)
- `.btn-danger` - Danger button (red gradient)
- `.btn-sm` - Small button
- `.btn-lg` - Large button

### Cards
- `.card` - Base card with hover effect
- `.card-header` - Card header section
- `.card-title` - Card title
- `.card-subtitle` - Card subtitle
- `.stat-card` - Stat card layout
- `.stat-icon` - Stat icon container
- `.stat-content` - Stat content wrapper
- `.stat-label` - Stat label
- `.stat-value` - Stat value

### Forms
- `.form-group` - Form field wrapper
- `.form-label` - Form label
- `.form-input` - Form input (also applies to input, textarea, select)

### Tables
- `.table-wrapper` - Table container with border
- `.data-table` - Table element
- `.data-table thead` - Table header
- `.data-table th` - Table header cell
- `.data-table td` - Table data cell
- `.data-table tbody tr` - Table row

### Badges
- `.badge` - Base badge
- `.badge-primary` - Primary badge
- `.badge-secondary` - Secondary badge
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-error` - Error badge

### Navigation
- `.sidebar` - Sidebar container
- `.sidebar-header` - Sidebar header
- `.sidebar-nav` - Sidebar navigation
- `.nav-item` - Navigation item
- `.nav-item.active` - Active navigation item

### Header
- `.app-header` - Application header
- `.page-title` - Page title
- `.page-subtitle` - Page subtitle

### Modal
- `.modal-overlay` - Modal overlay
- `.modal-content` - Modal content
- `.modal-header` - Modal header
- `.modal-title` - Modal title

### Alerts
- `.alert` - Base alert
- `.alert-success` - Success alert
- `.alert-warning` - Warning alert
- `.alert-error` - Error alert
- `.alert-info` - Info alert

### Tabs
- `.tabs` - Tab container
- `.tab` - Tab item
- `.tab.active` - Active tab

### Dropdown
- `.dropdown` - Dropdown container
- `.dropdown-menu` - Dropdown menu
- `.dropdown-item` - Dropdown item

### Loading
- `.loading-spinner` - Loading spinner

### Utilities
- `.text-primary` - Primary text color
- `.text-muted` - Muted text color
- `.text-success` - Success text color
- `.text-warning` - Warning text color
- `.text-error` - Error text color
- `.text-info` - Info text color
- `.bg-primary` - Primary background
- `.bg-surface` - Surface background
- `.bg-border` - Border background
- `.gradient-primary` - Primary gradient
- `.gradient-text` - Gradient text
- `.shadow-primary` - Primary shadow
- `.shadow-secondary` - Secondary shadow

### Animations
- `.animate-fadeIn` - Fade in animation
- `.animate-slideUp` - Slide up animation
- `.animate-slideDown` - Slide down animation

## Refactoring Rules

### DO NOT Use
❌ Inline styles: `style={{ backgroundColor: '#fff' }}`
❌ Hardcoded Tailwind colors: `bg-blue-500`, `text-orange-600`
❌ Hardcoded hex colors: `#3b82f6`, `#f97316`
❌ RGB/RGBA colors: `rgb(59, 130, 246)`

### DO Use
✅ CSS classes from index.css: `card`, `btn-primary`, `stat-card`
✅ Tailwind theme colors: `bg-primary`, `text-muted`, `border-border`
✅ CSS variables: `var(--color-primary)`, `var(--bg-surface)`

## Migration Examples

### Before (Bad)
```tsx
<div style={{ backgroundColor: '#fff', padding: '20px' }}>
  <button className="bg-blue-600 text-white px-4 py-2">
    Click me
  </button>
</div>
```

### After (Good)
```tsx
<div className="card">
  <button className="btn btn-primary">
    Click me
  </button>
</div>
```

### Before (Bad)
```tsx
<div className="bg-gradient-to-r from-orange-500 to-pink-500">
  <h1 className="text-gray-900">Title</h1>
</div>
```

### After (Good)
```tsx
<div className="gradient-primary">
  <h1 className="page-title">Title</h1>
</div>
```

## Files Requiring Refactoring

### High Priority (133 files with hardcoded colors)
1. All Dashboard pages (Admin, Teacher, Parent, Platform)
2. All Layout components
3. All Form components
4. All Card components
5. All Navigation components

### Current Status
- ✅ `index.css` - Complete reusable class library created
- ✅ `tailwind.config.js` - Simplified dark theme palette
- ✅ `theme-override.css` - Temporary override for hardcoded colors
- ⏳ Component refactoring - In progress

## Testing Checklist
- [ ] All portals display with dark theme
- [ ] No inline styles remain
- [ ] No hardcoded colors visible
- [ ] All buttons use theme colors
- [ ] All cards use theme colors
- [ ] All forms use theme colors
- [ ] All tables use theme colors
- [ ] All navigation uses theme colors
- [ ] Hover states work correctly
- [ ] Focus states work correctly
- [ ] Loading states work correctly
- [ ] Modal/dialogs work correctly

## Next Steps
1. Remove theme-override.css once all components are refactored
2. Systematically refactor components starting with layouts
3. Test each portal after refactoring
4. Remove all inline style attributes
5. Replace all hardcoded Tailwind color classes with theme classes
