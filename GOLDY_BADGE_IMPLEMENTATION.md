# 🏆 Goldy Badge Feature - Implementation Documentation

## Overview

The **Goldy Badge** feature is a recognition system that highlights students with exceptional behavior. The feature is controlled via a toggle in the **Super Admin (Platform Admin) Portal** and displays on the **Merit & Recognition** page when enabled.

### Key Features

1. **Platform Admin Control**: Toggle feature on/off for individual schools or all schools
2. **Clean Points Calculation**: Automatically calculates Clean Points = Total Merits - Total Demerits
3. **Eligibility Criteria**: Only students with **10 or more merits** qualify
4. **Top 10 Display**: Shows the top 10 students ranked by Clean Points
5. **Beautiful UI**: Modern, animated interface with ranking badges and gradients
6. **Non-Intrusive**: When disabled, the Merit & Recognition page remains unchanged

---

## Architecture

### Backend Components

#### 1. Database Schema

**`school_feature_flags` Table**
```sql
CREATE TABLE school_feature_flags (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    feature_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, feature_name)
);
```

#### 2. API Endpoints

**Platform Admin Endpoints** (`/api/platform/feature-flags`)
- `GET /api/platform/feature-flags` - Get all feature flags for all schools
- `GET /api/platform/feature-flags/:schoolId` - Get all flags for a specific school
- `GET /api/platform/feature-flags/:schoolId/:featureName` - Get specific flag
- `POST /api/platform/feature-flags/:schoolId/:featureName` - Toggle specific flag
- `POST /api/platform/feature-flags/bulk/:featureName` - Bulk toggle for multiple schools

**School-Level Endpoints** (`/api/feature-flags`)
- `GET /api/feature-flags/:featureName` - Get feature flag for current school
- `GET /api/feature-flags` - Get all flags for current school

#### 3. New Files Created

```
backend/
├── routes/
│   └── featureFlags.js         # School-level feature flag routes
└── database/
    └── init_postgres.sql       # Updated with school_feature_flags table
```

#### 4. Modified Files

```
backend/
├── routes/
│   └── platform.js             # Added Platform Admin feature flag endpoints
└── server.js                   # Registered feature-flags route
```

---

### Frontend Components

#### 1. Platform Admin Portal

**New Page: Feature Flags Management**

**Location**: `/platform/feature-flags`

**File**: `frontend/src/pages/platform/FeatureFlags.tsx`

**Features**:
- View all schools and their feature flag statuses
- Toggle individual school features with switches
- Bulk enable/disable for all schools
- Feature overview cards with statistics
- Real-time updates

**UI Components**:
- Feature overview cards (shows enabled count)
- School configuration table with toggle switches
- Bulk action buttons (Enable All / Disable All)
- Loading states and animations

#### 2. Merit & Recognition Page

**Updated**: `frontend/src/pages/admin/MeritsDemerits.tsx`

**New Features**:
- Feature flag check on page load
- Goldy Badge section (conditional rendering)
- Clean Points calculation
- Top 10 students display
- Ranking system (Gold, Silver, Bronze badges)

**Calculations**:
```typescript
// Clean Points Formula
clean_points = total_merits - total_demerits

// Eligibility
eligible = total_merits >= 10

// Ranking
sorted_by = clean_points (descending)
```

#### 3. Modified Files

```
frontend/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   └── MeritsDemerits.tsx      # Added Goldy Badge section
│   │   └── platform/
│   │       └── FeatureFlags.tsx        # New page (created)
│   ├── layouts/
│   │   └── PlatformLayout.tsx          # Added Feature Flags nav link
│   ├── services/
│   │   └── api.ts                      # Added feature flag API methods
│   └── App.tsx                         # Added Feature Flags route
```

---

## Usage Guide

### For Platform Admins (Super Admins)

#### Enabling Goldy Badge Feature

1. **Login** to Platform Admin Portal at `/platform/login`
2. Navigate to **Feature Flags** from the sidebar
3. Find the **🏆 Goldy Badge** card
4. Choose one of the following:

   **Option A: Enable for Individual School**
   - Scroll to the school in the table
   - Click the toggle switch in the "🏆 Goldy Badge" column
   - Switch turns green when enabled

   **Option B: Enable for All Schools**
   - Click the green **✓** button in the Goldy Badge overview card
   - Confirm the action
   - All schools will be enabled instantly

   **Option C: Disable for All Schools**
   - Click the red **✗** button in the Goldy Badge overview card
   - Confirm the action
   - All schools will be disabled instantly

#### Managing Multiple Schools

- Each school has independent feature flag control
- Toggle switches update in real-time
- Changes are reflected immediately on school admin portals

### For School Admins

#### Viewing Goldy Badge Students

1. **Login** as Admin
2. Navigate to **Merits & Demerits** page
3. If the feature is enabled, you'll see:
   - **Goldy Badge Section** below the page header
   - Top 10 students with highest Clean Points
   - Student photos/avatars with ranking badges
   - Clean Points, Total Merits, and Total Demerits for each

4. If the feature is disabled:
   - Page appears normal without Goldy Badge section
   - No visual changes to the existing layout

---

## Visual Design

### Goldy Badge Section Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Goldy Badge - Clean Points Leaders                  │
│ Students with 10+ merits | Clean Points = Merits - Demerits │
│                                                    [##] │
│                                              Eligible Students │
├─────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐      │
│  │ 1  │  │ 2  │  │ 3  │  │ 4  │  │ 5  │  │ 6  │      │
│  │🏆  │  │🥈  │  │🥉  │  │    │  │    │  │    │      │
│  │📷  │  │📷  │  │📷  │  │📷  │  │📷  │  │📷  │      │
│  │Name│  │Name│  │Name│  │Name│  │Name│  │Name│      │
│  │Class│ │Class│ │Class│ │Class│ │Class│ │Class│     │
│  │⭐ ## │ │⭐ ## │ │⭐ ## │ │⭐ ## │ │⭐ ## │ │⭐ ## │     │
│  │Clean│  │Clean│  │Clean│  │Clean│  │Clean│  │Clean│     │
│  │✓/✗ │  │✓/✗ │  │✓/✗ │  │✓/✗ │  │✓/✗ │  │✓/✗ │     │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘      │
│  [7] [8] [9] [10]  + X more students...               │
└─────────────────────────────────────────────────────────┘
```

### Ranking Badges

| Rank | Badge Color | Icon |
|------|-------------|------|
| 1st  | Gold (Yellow) | 🏆 Trophy |
| 2nd  | Silver (Gray) | 🥈 Medal |
| 3rd  | Bronze (Orange) | 🥉 Medal |
| 4+   | Blue | Number only |

### Color Scheme

- **Background**: Yellow-50 to Amber-50 gradient
- **Border**: Yellow-300 (2px)
- **Cards**: White with colored borders based on rank
- **Clean Points**: Green gradient (positive metric)
- **Merits**: Green-50 background
- **Demerits**: Red-50 background

---

## API Methods

### Frontend API Service (`api.ts`)

```typescript
// School-level feature flags
api.getFeatureFlag(featureName: string)
api.getAllFeatureFlags()

// Platform Admin feature flags
api.getAllSchoolFeatureFlags()
api.getSchoolFeatureFlags(schoolId: number)
api.getSchoolFeatureFlag(schoolId: number, featureName: string)
api.toggleSchoolFeatureFlag(schoolId: number, featureName: string, isEnabled: boolean)
api.bulkToggleFeatureFlag(featureName: string, isEnabled: boolean, schoolIds?: number[])
```

### Backend Routes

```javascript
// School-level (requires auth)
GET    /api/feature-flags/:featureName
GET    /api/feature-flags

// Platform Admin (requires platform admin)
GET    /api/platform/feature-flags
GET    /api/platform/feature-flags/:schoolId
GET    /api/platform/feature-flags/:schoolId/:featureName
POST   /api/platform/feature-flags/:schoolId/:featureName
POST   /api/platform/feature-flags/bulk/:featureName
```

---

## Clean Points Calculation Logic

### Algorithm

```typescript
interface StudentMeritStats {
  student_id: number;
  student_name: string;
  photo_path: string | null;
  total_merits: number;
  total_demerits: number;
  clean_points: number;
  class_name: string;
}

const calculateGoldyBadgeStudents = () => {
  const studentStats: { [key: number]: StudentMeritStats } = {};

  // Step 1: Count merits per student
  merits.forEach((merit) => {
    if (!studentStats[merit.student_id]) {
      studentStats[merit.student_id] = {
        student_id: merit.student_id,
        student_name: merit.student_name,
        photo_path: merit.photo_path,
        total_merits: 0,
        total_demerits: 0,
        clean_points: 0,
        class_name: merit.class_name,
      };
    }
    studentStats[merit.student_id].total_merits += 1;
  });

  // Step 2: Count demerits per student
  demerits.forEach((demerit) => {
    if (!studentStats[demerit.student_id]) {
      studentStats[demerit.student_id] = { /* ... */ };
    }
    studentStats[demerit.student_id].total_demerits += 1;
  });

  // Step 3: Calculate clean points and filter
  const eligibleStudents = Object.values(studentStats)
    .map((student) => ({
      ...student,
      clean_points: student.total_merits - student.total_demerits,
    }))
    .filter((student) => student.total_merits >= 10)  // Eligibility: 10+ merits
    .sort((a, b) => b.clean_points - a.clean_points); // Sort by clean points

  setGoldyBadgeStudents(eligibleStudents);
};
```

### Example Calculation

```
Student A:
- Total Merits: 15
- Total Demerits: 3
- Clean Points: 15 - 3 = 12 ✅ Eligible (≥10 merits)

Student B:
- Total Merits: 8
- Total Demerits: 2
- Clean Points: 8 - 2 = 6 ❌ Not Eligible (<10 merits)

Student C:
- Total Merits: 20
- Total Demerits: 8
- Clean Points: 20 - 8 = 12 ✅ Eligible (≥10 merits)

Ranking: Student A/C (tie at 12), Student B (not shown)
```

---

## Technical Details

### State Management

```typescript
// Feature flag state
const [goldyBadgeEnabled, setGoldyBadgeEnabled] = useState(false);

// Eligible students state
const [goldyBadgeStudents, setGoldyBadgeStudents] = useState<StudentMeritStats[]>([]);

// Fetch flag on component mount
useEffect(() => {
  fetchGoldyBadgeFeatureFlag();
}, [viewType, filters]);

// Recalculate when data changes
useEffect(() => {
  if (goldyBadgeEnabled) {
    calculateGoldyBadgeStudents();
  }
}, [goldyBadgeEnabled, merits, demerits, students]);
```

### Conditional Rendering

```typescript
{goldyBadgeEnabled && goldyBadgeStudents.length > 0 && (
  <motion.div>
    {/* Goldy Badge Section */}
  </motion.div>
)}
```

### Animation Delays

The page uses staggered animations. When Goldy Badge is enabled, delays are adjusted:

```typescript
delay: goldyBadgeEnabled && goldyBadgeStudents.length > 0 ? 0.35 : 0.3
```

---

## Security & Permissions

### Platform Admin
- Can toggle features for any school
- Can bulk enable/disable across all schools
- Requires `platform_admin` role

### School Admin
- Can only view their school's feature status
- Cannot modify feature flags
- Relies on Platform Admin to enable features

### Data Isolation
- All queries filtered by `school_id`
- Multi-tenancy fully supported
- No cross-school data leakage

---

## Testing Checklist

### Platform Admin Portal

- [ ] Login to Platform Admin
- [ ] Navigate to Feature Flags page
- [ ] View all schools in the table
- [ ] Toggle Goldy Badge for a specific school
- [ ] Verify toggle updates immediately
- [ ] Use "Enable All" button
- [ ] Verify all toggles turn green
- [ ] Use "Disable All" button
- [ ] Verify all toggles turn gray
- [ ] Check feature statistics update correctly

### School Admin Portal

- [ ] Login as School Admin
- [ ] Navigate to Merits & Demerits
- [ ] **When Disabled**: Verify no Goldy Badge section
- [ ] Enable feature via Platform Admin
- [ ] Refresh page
- [ ] **When Enabled**: Verify Goldy Badge section appears
- [ ] Verify only students with 10+ merits appear
- [ ] Verify Clean Points calculation is correct
- [ ] Verify ranking (1st, 2nd, 3rd) displays correctly
- [ ] Verify top 10 students are shown
- [ ] Verify photos/avatars display correctly
- [ ] Disable feature via Platform Admin
- [ ] Refresh page
- [ ] Verify Goldy Badge section disappears

### Edge Cases

- [ ] No students with 10+ merits: Section doesn't appear
- [ ] All students have same Clean Points: All shown with equal ranking
- [ ] Student has 10 merits, 0 demerits: Clean Points = 10
- [ ] Student has 15 merits, 20 demerits: Clean Points = -5 (still shown if ≥10 merits)

---

## Future Enhancements

### Potential Additions

1. **Badge Levels**
   - Bronze (10-15 merits)
   - Silver (16-25 merits)
   - Gold (26+ merits)
   - Platinum (50+ merits with high Clean Points)

2. **Time-based Tracking**
   - Weekly/Monthly Goldy Badge winners
   - Historical tracking of badge achievements
   - Trend graphs

3. **Rewards Integration**
   - Connect to reward system
   - Generate certificates
   - Email notifications to parents

4. **Gamification**
   - Points-based progression
   - Achievement badges
   - Leaderboard with filters

5. **Export Features**
   - Export Goldy Badge list as PDF
   - Generate recognition certificates
   - Email lists to teachers

---

## Troubleshooting

### Goldy Badge Not Showing

**Issue**: Feature enabled but section doesn't appear

**Solutions**:
1. Check if any students have 10+ merits
2. Verify feature flag is enabled for correct school
3. Refresh browser page
4. Check browser console for errors
5. Verify merits/demerits data is loading correctly

### Feature Toggle Not Working

**Issue**: Toggle switch doesn't update

**Solutions**:
1. Verify Platform Admin authentication
2. Check network tab for API errors
3. Verify school_id is valid
4. Check database connection
5. Review backend logs

### Clean Points Incorrect

**Issue**: Calculation doesn't match expected value

**Solutions**:
1. Verify merits are counting correctly
2. Verify demerits are counting correctly
3. Check filters aren't affecting counts
4. Review calculation logic in browser console
5. Ensure data is from correct school

---

## Summary

### What Was Built

✅ **Platform Admin Feature Toggle Page**
- Complete UI for managing feature flags
- Supports individual and bulk operations
- Real-time updates

✅ **Goldy Badge Display**
- Beautiful, animated UI
- Top 10 student ranking
- Clean Points calculation
- Conditional rendering based on feature flag

✅ **Backend Infrastructure**
- Feature flags table
- Platform Admin and School-level APIs
- Secure, multi-tenant architecture

✅ **Clean Points System**
- Automatic calculation: Merits - Demerits
- 10+ merit eligibility requirement
- Sorted by Clean Points descending

### Files Modified/Created

**Backend** (3 new, 2 modified):
- ✅ `routes/featureFlags.js` (new)
- ✅ `routes/platform.js` (modified - added endpoints)
- ✅ `database/init_postgres.sql` (modified - added table)
- ✅ `server.js` (modified - registered route)

**Frontend** (5 modified, 1 new):
- ✅ `pages/platform/FeatureFlags.tsx` (new)
- ✅ `pages/admin/MeritsDemerits.tsx` (modified - added Goldy Badge)
- ✅ `layouts/PlatformLayout.tsx` (modified - added nav link)
- ✅ `services/api.ts` (modified - added API methods)
- ✅ `App.tsx` (modified - added route)

**Total**: 9 files (1 new page, 7 modified, 1 new route)

---

## Quick Reference

### Toggle Feature (Platform Admin)
```
/platform/login → Feature Flags → Toggle switch
```

### View Goldy Badge (School Admin)
```
/login → Merits & Demerits → Goldy Badge section (if enabled)
```

### API Check Feature Status
```bash
GET /api/feature-flags/goldy_badge
# Returns: { school_id, feature_name, is_enabled }
```

---

**Implementation Complete!** 🎉

*Feature successfully integrated with zero breaking changes to existing functionality.*
