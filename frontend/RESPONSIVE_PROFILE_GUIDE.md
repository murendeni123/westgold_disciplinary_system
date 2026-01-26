# Profile Pages Responsive Design Guide

## Key Responsive Patterns for All Profile Pages

### 1. Container & Spacing
```tsx
// Main container
<div className="space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-0">

// Card spacing
<div className="space-y-3 sm:space-y-4">
```

### 2. Headers
```tsx
// Page title
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">

// Section title
<h2 className="text-xl sm:text-2xl font-bold">

// Subtitle
<p className="text-sm sm:text-base md:text-lg text-gray-600">
```

### 3. Grid Layouts
```tsx
// 2-column grid (Basic Info + Parent Info)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

// 4-column stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
```

### 4. Cards
```tsx
// Card container
<div className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-4 sm:p-6">

// Info cards
<div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
  <p className="text-xs sm:text-sm text-gray-600 mb-1">Label</p>
  <p className="text-base sm:text-lg font-semibold text-amber-700">Value</p>
</div>
```

### 5. Photo Section
```tsx
// Photo container - stack on mobile, side-by-side on desktop
<div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
  <div className="flex-shrink-0">
    <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mx-auto sm:mx-0">
      {/* Photo */}
    </div>
    
    // Buttons - horizontal on mobile, vertical on desktop
    <div className="flex flex-row sm:flex-col gap-2 mt-3 justify-center sm:justify-start">
      <Button className="text-xs py-2.5 px-3 rounded-lg sm:rounded-xl w-full min-h-[44px]">
        Upload
      </Button>
    </div>
  </div>
</div>
```

### 6. Buttons
```tsx
// Touch-friendly buttons (44px minimum)
<Button className="rounded-lg sm:rounded-xl min-h-[44px] w-full sm:w-auto">

// Icon buttons
<button className="p-2 rounded-lg sm:rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center">
```

### 7. Stats Cards
```tsx
<div className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-4 sm:p-6 cursor-pointer">
  <div className="flex items-center justify-between mb-3 sm:mb-4">
    <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
      <Icon className="text-white" size={20} />
    </div>
  </div>
  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Label</h3>
  <p className="text-2xl sm:text-3xl font-bold text-gray-900">Value</p>
  <p className="text-xs text-gray-500 mt-1">Subtitle</p>
</div>
```

### 8. Text Overflow Prevention
```tsx
// For names
<p className="break-words">Long Name</p>

// For emails
<p className="break-all">long.email@example.com</p>

// For codes
<code className="overflow-x-auto flex-1">LONG-CODE-123</code>
```

### 9. Flex Layouts
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">

// Header with back button
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
```

### 10. Input Fields
```tsx
// Prevent iOS zoom (16px minimum)
<input className="text-base px-3 sm:px-4 py-3 sm:py-3.5" />
```

## Checklist for Each Profile Page

- [ ] Container has responsive spacing (space-y-4 sm:space-y-6 md:space-y-8)
- [ ] Container has mobile padding (px-2 sm:px-0)
- [ ] Page title is responsive (text-2xl sm:text-3xl md:text-4xl)
- [ ] Grids use proper breakpoints (grid-cols-1 lg:grid-cols-2)
- [ ] Cards have responsive padding (p-4 sm:p-6)
- [ ] Cards have responsive border radius (rounded-xl sm:rounded-2xl)
- [ ] Section titles are responsive (text-xl sm:text-2xl)
- [ ] All text has responsive sizes
- [ ] Photo section stacks on mobile
- [ ] Buttons are touch-friendly (min-h-[44px])
- [ ] Long text has overflow protection (break-words, break-all)
- [ ] Stats cards use responsive grid (sm:grid-cols-2 lg:grid-cols-4)
- [ ] All interactive elements meet 44px tap target minimum

## Files to Update

1. `/pages/admin/StudentProfile.tsx` ⏳ In Progress
2. `/pages/admin/TeacherProfile.tsx`
3. `/pages/teacher/StudentProfile.tsx`
4. `/pages/teacher/TeacherProfile.tsx`
5. `/pages/parent/ParentProfile.tsx`
6. `/pages/parent/ChildProfile.tsx`
