# Enterprise Design System Guide

## Overview
This document outlines the design patterns and components for creating enterprise-grade, modern UI across all pages.

## Core Design Principles

### 1. **Consistency**
- Use consistent spacing (space-y-6 for main containers)
- Standardized card styling with rounded-xl, shadow-sm, border-gray-200
- Uniform typography hierarchy (text-3xl for h1, text-gray-600 for subtitles)

### 2. **Visual Hierarchy**
- Clear page headers with title + subtitle
- Use StatCard for metrics
- Use ActionCard for quick actions
- Proper use of whitespace

### 3. **Modern Aesthetics**
- Gradient backgrounds for headers/buttons (from-blue-600 to-indigo-600)
- Subtle shadows and hover effects
- Smooth transitions (transition-all, transition-colors)
- Rounded corners (rounded-xl for cards, rounded-lg for buttons)

### 4. **User Experience**
- Loading states with spinners
- Empty states with icons and helpful messages
- Error states with clear messaging
- Responsive design (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

## Component Library

### StatCard
Use for displaying key metrics:
```tsx
<StatCard
  title="Total Students"
  value={count}
  icon={Users}
  iconColor="text-blue-600"
  bgColor="bg-blue-50"
  trend={{ value: 5, isPositive: true }}
/>
```

### ActionCard
Use for quick action buttons:
```tsx
<ActionCard
  title="Take Attendance"
  description="Record daily attendance"
  icon={Calendar}
  onClick={handleAction}
  variant="primary"
/>
```

### Enhanced Loading State
```tsx
<div className="flex justify-center items-center h-64">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
</div>
```

### Enhanced Empty State
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
  <p className="text-gray-500">Description of what's missing</p>
</div>
```

### Enhanced Error State
```tsx
<div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">...</svg>
  <span className="text-sm font-medium">{error}</span>
</div>
```

## Page Structure Template

```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
      <p className="text-gray-600 mt-2">Page subtitle or description</p>
    </div>
    {/* Action buttons */}
  </div>

  {/* Stats/Overview Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard ... />
  </div>

  {/* Main Content */}
  <Card>
    {/* Content */}
  </Card>
</div>
```

## Color Palette

- **Primary**: Blue (blue-600, blue-50, blue-500)
- **Success**: Green (green-600, green-50)
- **Warning**: Yellow (yellow-600, yellow-50)
- **Danger**: Red (red-600, red-50)
- **Neutral**: Gray (gray-50, gray-100, gray-600, gray-900)

## Typography

- **Page Title**: text-3xl font-bold text-gray-900
- **Subtitle**: text-gray-600 mt-2
- **Card Title**: text-lg font-semibold (in Card component)
- **Body**: text-sm text-gray-700
- **Labels**: text-sm font-medium text-gray-600

## Spacing

- **Page Container**: space-y-6
- **Card Padding**: p-6
- **Grid Gaps**: gap-6
- **Form Spacing**: space-y-4 or space-y-5

## Buttons

### Primary
```tsx
<Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
```

### Secondary
```tsx
<Button variant="secondary">
```

## Cards

Standard card styling:
- rounded-xl
- shadow-sm (hover:shadow-lg)
- border border-gray-200
- bg-white
- p-6

## Forms

- Use Input component with labels
- Group related fields
- Show validation errors clearly
- Use modern select dropdowns with icons

## Tables

- Use AdminTableLayout for admin pages
- Use Table component for simple lists
- Include search and filters
- Responsive with horizontal scroll on mobile

## Icons

- Use lucide-react icons consistently
- Size: 20px for buttons, 24px for cards, 16px for inline
- Match icon color to context

## Animations

- Hover effects: transition-all, hover:shadow-lg
- Loading: animate-spin
- Smooth transitions: transition-colors, transition-transform

## Responsive Design

- Mobile-first approach
- Use grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Stack elements vertically on mobile
- Hide/show elements with hidden md:block











