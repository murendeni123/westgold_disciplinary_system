# Parent Portal - Next.js UI Rebuild Specification

## Executive Summary

This document provides a complete specification for rebuilding the Parent Portal UI using Next.js while maintaining 100% compatibility with the existing backend API. The new UI will use the same dark theme colors as the Admin Portal.

---

## Current Parent Portal Overview

### Purpose
A modern, parent-friendly interface for monitoring children's school behavior, attendance, merits, detentions, and interventions. Supports multi-child and multi-school scenarios.

### User Flow
1. **Onboarding**: Link to school → Link children → Access dashboard
2. **Daily Use**: View dashboard → Check notifications → Review behavior/attendance
3. **Communication**: Message teachers → Receive real-time alerts

---

## Theme Colors (Same as Admin Portal)

### Color Palette
```css
/* CSS Variables */
--bg-primary: #0B0F14        /* Main background - very dark blue-gray */
--bg-surface: #121821        /* Card/surface background - dark gray */
--bg-border: #1E293B         /* Border color - subtle dark border */
--color-primary: #00E676     /* Primary accent - bright green */
--color-secondary: #38BDF8   /* Secondary accent - bright cyan */
--text-primary: #E5E7EB      /* Primary text - light gray */
--text-muted: #9CA3AF        /* Muted text - medium gray */
--color-success: #00E676     /* Success state - green */
--color-warning: #f59e0b     /* Warning state - amber */
--color-error: #ef4444       /* Error state - red */
--color-info: #38BDF8        /* Info state - cyan */
```

### Tailwind Config Colors
```javascript
{
  background: '#0B0F14',
  surface: '#121821',
  border: '#1E293B',
  primary: '#00E676',
  secondary: '#38BDF8',
  text: '#E5E7EB',
  muted: '#9CA3AF',
  success: '#00E676',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#38BDF8',
  white: '#ffffff',
  black: '#000000',
}
```

### Gradient Styles
```css
/* Primary Gradient (Green to Cyan) */
background: linear-gradient(135deg, #00E676 0%, #38BDF8 100%);

/* Button Shadow */
box-shadow: 0 4px 14px 0 rgba(0, 230, 118, 0.39);

/* Hover Shadow */
box-shadow: 0 6px 20px rgba(0, 230, 118, 0.5);

/* Card Hover Shadow */
box-shadow: 0 8px 30px rgba(0, 230, 118, 0.12);
```

### Typography
```css
/* Headings */
h1, h2, h3, h4, h5, h6 {
  color: #00E676;  /* Primary green */
  font-weight: 700;
}

/* Body */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #E5E7EB;
}
```

---

## Parent Portal Pages (19 Total)

### 1. ModernParentDashboard.tsx
**Route**: `/parent` or `/parent/dashboard`  
**Purpose**: Main landing page with overview of all children

**Features**:
- Welcome message with parent name
- Quick stats cards (Total Children, Unread Notifications, Recent Incidents, Upcoming Detentions)
- Children overview cards with quick stats
- Recent behavior incidents (last 5)
- Attendance summary chart
- Recent notifications feed
- Quick action buttons

**API Calls**:
```javascript
api.getDashboardStats()
api.getNotifications({ is_read: 'false' })
api.getIncidents({ student_id: childId })
api.getMerits({ student_id: childId })
api.getAttendance({ student_id: childId })
api.getDetentions({ student_id: childId })
api.getConsequences({ student_id: childId })
api.getInterventions({ student_id: childId })
```

**Key Components**:
- AnimatedStatCard (4 stat cards)
- ModernCard (children cards)
- BarChart/LineChart (Recharts)
- Notification list
- Quick action buttons

---

### 2. ModernMyChildren.tsx
**Route**: `/parent/my-children`  
**Purpose**: Detailed view of all linked children

**Features**:
- Grid of child cards with photos
- Per-child statistics (Merits, Incidents, Attendance %)
- Quick view buttons (Behavior, Attendance, Merits)
- Link new child button
- Filter/search children

**API Calls**:
```javascript
api.getMerits({ student_id: childId })
api.getIncidents({ student_id: childId })
api.getAttendance({ student_id: childId })
```

**Data Displayed**:
- Child name, photo, class
- Total merits (last 90 days)
- Total incidents
- Attendance percentage (last 30 days)
- Recent behavior trend

---

### 3. ChildProfile.tsx
**Route**: `/parent/children/:id`  
**Purpose**: Comprehensive profile for a single child

**Features**:
- Child header (photo, name, class, year group)
- Tabbed interface:
  - Overview (stats summary)
  - Behavior (incidents + merits)
  - Attendance (calendar view)
  - Detentions
  - Interventions
  - Academic (if available)
- Timeline of recent events
- Contact teacher button

**API Calls**:
```javascript
api.getStudent(childId)
api.getIncidents({ student_id: childId })
api.getMerits({ student_id: childId })
api.getAttendance({ student_id: childId })
api.getDetentions({ student_id: childId })
api.getInterventions({ student_id: childId })
```

---

### 4. ModernBehaviourReport.tsx
**Route**: `/parent/behaviour`  
**Purpose**: View all behavior incidents across all children

**Features**:
- Child selector dropdown
- Date range filter
- Severity filter (low, medium, high, critical)
- Status filter (pending, resolved, escalated)
- Incident type filter
- Incidents table/cards with:
  - Date, incident type, severity, description
  - Teacher who logged it
  - Consequences applied
  - Status badge
- Export to PDF/CSV
- Behavior trend chart

**API Calls**:
```javascript
api.getIncidents({ student_id: childId, start_date, end_date, severity, status })
```

**Filters**:
- Child selection
- Date range (last 7 days, 30 days, 90 days, custom)
- Severity (all, low, medium, high, critical)
- Status (all, pending, resolved, escalated)
- Incident type

---

### 5. BehaviourDetails.tsx
**Route**: `/parent/behaviour/:id`  
**Purpose**: Detailed view of a single incident

**Features**:
- Incident header (date, time, severity)
- Student information
- Incident details (type, description)
- Teacher who logged it
- Consequences applied
- Follow-up actions
- Parent comments section
- Related incidents

**API Calls**:
```javascript
api.getIncident(incidentId)
```

---

### 6. ModernViewMerits.tsx
**Route**: `/parent/merits`  
**Purpose**: View all merits/awards across all children

**Features**:
- Child selector
- Date range filter
- Merit type filter
- Merits grid/table showing:
  - Date, merit type, points, description
  - Teacher who awarded it
  - Category badge
- Total points summary
- Merits trend chart
- Leaderboard (if enabled)

**API Calls**:
```javascript
api.getMerits({ student_id: childId, start_date, end_date })
```

**Data Displayed**:
- Merit date and time
- Merit type (Academic Excellence, Good Behavior, etc.)
- Points awarded
- Description/reason
- Teacher name
- Total points accumulated

---

### 7. ModernConsequences.tsx
**Route**: `/parent/consequences`  
**Purpose**: View assigned consequences for misbehavior

**Features**:
- Child selector
- Status filter (pending, completed, overdue)
- Consequences list showing:
  - Consequence type
  - Related incident
  - Assigned date, due date
  - Status badge
  - Completion status
- Filter by status and date

**API Calls**:
```javascript
api.getConsequences({ student_id: childId })
api.getConsequenceAssignments({ student_id: childId })
```

**Consequence Types**:
- Verbal warning
- Loss of privilege
- Time in buddy classroom
- Parent contact
- Detention
- Suspension (if applicable)

---

### 8. ModernViewDetentions.tsx
**Route**: `/parent/detentions`  
**Purpose**: View detention assignments

**Features**:
- Child selector
- Status filter (scheduled, completed, missed, excused)
- Detentions list showing:
  - Date, time, duration
  - Reason/incident
  - Location, supervisor
  - Status badge
  - Attendance status
- Calendar view option
- Upcoming detentions alert

**API Calls**:
```javascript
api.getDetentions({ student_id: childId })
api.getDetention(detentionId)
```

**Data Displayed**:
- Detention date and time
- Duration (e.g., 30 minutes)
- Reason for detention
- Supervising teacher
- Location/room
- Status (scheduled, completed, missed)
- Related incident link

---

### 9. ModernAttendanceOverview.tsx
**Route**: `/parent/attendance`  
**Purpose**: View attendance records

**Features**:
- Child selector
- Date range selector
- Attendance calendar (color-coded)
- Attendance statistics:
  - Total days
  - Present days
  - Absent days
  - Late arrivals
  - Attendance percentage
- Attendance trend chart
- Absence reasons breakdown
- Export attendance report

**API Calls**:
```javascript
api.getAttendance({ student_id: childId, start_date, end_date })
```

**Attendance Codes**:
- Present (green)
- Absent (red)
- Late (amber)
- Excused (blue)
- Medical (purple)

---

### 10. AttendanceDayDetail.tsx
**Route**: `/parent/attendance/:date`  
**Purpose**: Detailed view of attendance for a specific day

**Features**:
- Date header
- All children's attendance for that day
- Period-by-period breakdown (if available)
- Absence reason (if absent)
- Time of arrival (if late)
- Notes from teacher

**API Calls**:
```javascript
api.getAttendance({ date })
```

---

### 11. ModernInterventions.tsx
**Route**: `/parent/interventions`  
**Purpose**: View intervention programs child is enrolled in

**Features**:
- Child selector
- Active interventions list
- Completed interventions list
- Intervention details:
  - Type (behavioral, academic, social)
  - Start date, end date
  - Goals and objectives
  - Progress tracking
  - Status (active, completed, paused)
- Progress charts
- Meeting notes/updates

**API Calls**:
```javascript
api.getInterventions({ student_id: childId })
api.getGuidedInterventions({ student_id: childId })
```

**Intervention Types**:
- Behavioral support
- Academic support
- Social-emotional learning
- Anger management
- Peer mediation

---

### 12. ParentMessages.tsx
**Route**: `/parent/messages`  
**Purpose**: Communication with teachers and school admin

**Features**:
- Inbox/Sent tabs
- Compose new message
- Message list (sender, subject, date, read status)
- Message thread view
- Reply/Forward
- Attach files (if enabled)
- Filter by sender (teacher, admin)
- Search messages

**API Calls**:
```javascript
api.getMessages(messageType) // 'inbox' or 'sent'
api.createMessage({ receiver_id, subject, message })
api.getTeachers() // for recipient list
```

**Features**:
- Real-time message notifications
- Unread count badge
- Mark as read/unread
- Delete messages
- Teacher directory

---

### 13. ModernNotifications.tsx
**Route**: `/parent/notifications`  
**Purpose**: View all system notifications

**Features**:
- Unread/All tabs
- Notification list:
  - Icon based on type
  - Title and message
  - Timestamp
  - Read status
- Mark as read
- Mark all as read
- Delete notification
- Filter by type:
  - Behavior incidents
  - Detentions
  - Attendance alerts
  - Messages
  - School announcements

**API Calls**:
```javascript
api.getNotifications({ is_read, type, start_date, end_date })
api.markNotificationRead(id)
api.markAllNotificationsRead()
api.deleteNotification(id)
```

**Notification Types**:
- Incident logged
- Detention assigned
- Merit awarded
- Absence recorded
- Message received
- Intervention update
- School announcement

---

### 14. NotificationsPage.tsx
**Route**: `/parent/notifications` (alternative version)  
**Purpose**: Enhanced notifications page with stats

**Features**:
- Notification statistics (total, unread, read)
- Filter by type and date
- Group by date
- Notification preferences link
- Real-time updates via WebSocket

**API Calls**:
```javascript
api.getNotifications()
api.markNotificationRead(id)
api.markAllNotificationsRead()
api.deleteNotification(id)
```

---

### 15. LinkSchool.tsx
**Route**: `/parent/link-school`  
**Purpose**: Link parent account to a school

**Features**:
- School code input
- School search by name
- Linked schools list
- Switch between schools
- Unlink school option
- School information display

**API Calls**:
```javascript
api.getLinkedSchools()
api.linkSchoolByCode(schoolCode)
api.switchSchool(schoolId)
```

**Flow**:
1. Enter school code (e.g., "WS2025")
2. System validates code
3. School is linked to parent account
4. Parent can access that school's data

---

### 16. LinkChild.tsx
**Route**: `/parent/link-child`  
**Purpose**: Link children to parent account

**Features**:
- Child link code input
- Linked children list
- Unlink child option
- Child information preview
- Multiple children support

**API Calls**:
```javascript
api.linkChild(linkCode)
api.refreshUser() // to get updated children list
```

**Flow**:
1. School admin generates link code for student
2. Parent enters code
3. Child is linked to parent account
4. Parent can view child's data

---

### 17. Onboarding.tsx
**Route**: `/parent/onboarding`  
**Purpose**: First-time setup wizard for new parents

**Features**:
- Multi-step wizard:
  - Step 1: Welcome
  - Step 2: Link School
  - Step 3: Link Children
  - Step 4: Complete
- Progress indicator
- Skip option (if already set up)
- Animated transitions

**API Calls**:
```javascript
api.linkSchoolByCode(schoolCode)
api.linkChild(childLinkCode)
api.refreshUser()
```

---

### 18. ParentProfile.tsx
**Route**: `/parent/profile`  
**Purpose**: View and edit parent profile

**Features**:
- Profile information:
  - Name, email, phone
  - Address
  - Emergency contact
- Edit profile
- Change password
- Profile photo upload
- Linked children summary
- Linked schools summary

**API Calls**:
```javascript
api.getParentProfile()
api.updateParentProfile(profileData)
```

---

### 19. ModernSettings.tsx
**Route**: `/parent/settings`  
**Purpose**: Account settings and preferences

**Features**:
- Tabs:
  - Profile Settings
  - Notification Preferences
  - Privacy Settings
  - Linked Accounts
  - Security
- Notification preferences:
  - Email notifications (on/off per type)
  - Push notifications (on/off per type)
  - SMS notifications (if enabled)
- Privacy settings:
  - Data sharing preferences
  - Visibility settings
- Security:
  - Change password
  - Two-factor authentication (if enabled)
  - Active sessions
- Linked accounts:
  - Linked schools
  - Linked children
  - Unlink options

**API Calls**:
```javascript
api.getParentProfile()
api.updateParentProfile(profileData)
api.changePassword({ currentPassword, newPassword })
api.getLinkedSchools()
api.getStudents() // to get linked children
```

---

## Layout Component

### ModernParentLayout.tsx
**Purpose**: Main layout wrapper for all parent pages

**Features**:
- Sidebar navigation (collapsible)
- Header with:
  - Menu toggle (mobile)
  - Page title
  - Quick student search
  - School switcher
  - Notification bell
  - User avatar/menu
- Animated background
- Gradient header matching sidebar
- Responsive design (mobile, tablet, desktop)
- Setup status check (redirects if school/child not linked)

**Navigation Items**:
1. Dashboard (Home icon)
2. My Children (Users icon)
3. Behaviour (AlertTriangle icon)
4. Merits (Award icon)
5. Consequences (Shield icon)
6. Detentions (Clock icon)
7. Attendance (Calendar icon)
8. Interventions (Target icon)
9. Messages (Mail icon)
10. Notifications (Bell icon)
11. Settings (Settings icon)

---

## API Endpoints Used by Parent Portal

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### Parent Management
```
GET /api/parents/profile
PUT /api/parents/profile
POST /api/parents/change-password
POST /api/parents/link-school
POST /api/parents/link-child
GET /api/parents/linked-schools
POST /api/parents/switch-school
```

### Students (Children)
```
GET /api/students
GET /api/students/:id
```

### Behavior
```
GET /api/behaviour?student_id=X
GET /api/behaviour/:id
```

### Merits
```
GET /api/merits?student_id=X
```

### Consequences
```
GET /api/consequences?student_id=X
GET /api/consequence-assignments?student_id=X
```

### Detentions
```
GET /api/detentions?student_id=X
GET /api/detentions/:id
```

### Attendance
```
GET /api/attendance?student_id=X&start_date=Y&end_date=Z
GET /api/attendance?date=Y
```

### Interventions
```
GET /api/interventions?student_id=X
GET /api/guided-interventions?student_id=X
```

### Messages
```
GET /api/messages?type=inbox|sent
POST /api/messages
GET /api/teachers (for recipient list)
```

### Notifications
```
GET /api/notifications?is_read=true|false&type=X
PUT /api/notifications/:id/read
PUT /api/notifications/mark-all-read
DELETE /api/notifications/:id
```

### Dashboard
```
GET /api/analytics/dashboard-stats (or custom parent dashboard endpoint)
```

---

## Reusable Components

### 1. ModernCard
**Purpose**: Card container with hover effects  
**Props**: `title`, `subtitle`, `children`, `className`, `onClick`  
**Styling**: Dark surface background, border, hover lift effect

### 2. AnimatedStatCard
**Purpose**: Animated statistics display  
**Props**: `icon`, `label`, `value`, `trend`, `color`  
**Features**: Number count-up animation, trend indicator

### 3. ModernSidebar
**Purpose**: Navigation sidebar  
**Props**: `isOpen`, `onToggle`  
**Features**: Collapsible, active route highlighting, gradient background

### 4. NotificationBell
**Purpose**: Notification icon with unread count  
**Props**: None (uses NotificationContext)  
**Features**: Real-time count, dropdown preview

### 5. SchoolSwitcher
**Purpose**: Switch between linked schools  
**Props**: None (uses AuthContext)  
**Features**: Dropdown with school list, current school indicator

### 6. QuickStudentSearch
**Purpose**: Search for children quickly  
**Props**: None  
**Features**: Autocomplete, keyboard navigation

### 7. PageTransition
**Purpose**: Animated page transitions  
**Props**: `children`  
**Features**: Fade/slide animations using Framer Motion

### 8. AnimatedBackground
**Purpose**: Animated gradient background  
**Props**: None  
**Features**: Floating orbs, subtle animations

### 9. ModernFilter
**Purpose**: Filter component for lists  
**Props**: `filters`, `onFilterChange`  
**Features**: Date range, dropdowns, search

### 10. ModernPageHeader
**Purpose**: Page title with breadcrumbs  
**Props**: `title`, `subtitle`, `actions`  
**Features**: Gradient text, action buttons

### 11. LoadingSkeleton
**Purpose**: Loading state placeholder  
**Props**: `type` (card, table, list)  
**Features**: Shimmer animation

### 12. StatusBadge
**Purpose**: Status indicator badge  
**Props**: `status`, `variant`  
**Features**: Color-coded, icon support

---

## Context Providers

### 1. AuthContext
**Purpose**: User authentication state  
**Provides**: `user`, `login`, `logout`, `refreshUser`, `updateUser`  
**Used By**: All pages

### 2. NotificationContext
**Purpose**: Real-time notifications  
**Provides**: `notifications`, `unreadCount`, `markAsRead`  
**Uses**: Socket.io for real-time updates

### 3. SchoolThemeContext
**Purpose**: School branding/theme  
**Provides**: `customizations`, `getImageUrl`  
**Features**: Logo, colors, banner

### 4. ToastContext
**Purpose**: Toast notifications  
**Provides**: `showToast`, `hideToast`  
**Features**: Success, error, warning, info toasts

---

## Real-Time Features (Socket.io)

### Events Listened To
```javascript
socket.on('notification', (data) => {
  // New notification received
  // Update notification count
  // Show toast
});

socket.on('incident_created', (data) => {
  // New incident logged for child
  // Show alert
  // Refresh behavior data
});

socket.on('detention_assigned', (data) => {
  // Detention assigned to child
  // Show alert
  // Refresh detention list
});

socket.on('merit_awarded', (data) => {
  // Merit awarded to child
  // Show celebration animation
  // Refresh merits
});

socket.on('message', (data) => {
  // New message received
  // Update message count
  // Show notification
});
```

### Connection Setup
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

---

## Data Models

### User (Parent)
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'parent';
  school_id: number;
  phone?: string;
  address?: string;
  children?: Student[];
}
```

### Student (Child)
```typescript
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
  year_group: string;
  photo_url?: string;
  is_active: boolean;
}
```

### Incident
```typescript
interface Incident {
  id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  incident_type_id: number;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'escalated';
  date: string;
  consequences_applied?: string;
  demerit_points: number;
}
```

### Merit
```typescript
interface Merit {
  id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  merit_type_id: number;
  merit_type: string;
  description: string;
  points: number;
  date: string;
}
```

### Detention
```typescript
interface Detention {
  id: number;
  student_id: number;
  student_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  reason: string;
  assigned_by: number;
  assigned_by_name: string;
  supervisor_id?: number;
  supervisor_name?: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'excused';
  attendance_status?: string;
}
```

### Attendance
```typescript
interface Attendance {
  id: number;
  student_id: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: number;
  marked_by_name: string;
  reason?: string;
  notes?: string;
}
```

### Intervention
```typescript
interface Intervention {
  id: number;
  student_id: number;
  student_name: string;
  type: 'behavioral' | 'academic' | 'social';
  description: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  goals?: string;
  progress_notes?: string[];
}
```

### Notification
```typescript
interface Notification {
  id: number;
  user_id: number;
  type: 'incident' | 'detention' | 'merit' | 'attendance' | 'message' | 'announcement';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
  related_type?: string;
}
```

### Message
```typescript
interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  receiver_id: number;
  receiver_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  sent_at: string;
}
```

---

## Next.js Project Structure

```
parent-portal/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home/redirect
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard
│   ├── children/
│   │   ├── page.tsx               # My Children list
│   │   └── [id]/
│   │       └── page.tsx           # Child profile
│   ├── behaviour/
│   │   ├── page.tsx               # Behaviour report
│   │   └── [id]/
│   │       └── page.tsx           # Incident details
│   ├── merits/
│   │   └── page.tsx               # Merits page
│   ├── consequences/
│   │   └── page.tsx               # Consequences page
│   ├── detentions/
│   │   └── page.tsx               # Detentions page
│   ├── attendance/
│   │   ├── page.tsx               # Attendance overview
│   │   └── [date]/
│   │       └── page.tsx           # Day detail
│   ├── interventions/
│   │   └── page.tsx               # Interventions page
│   ├── messages/
│   │   └── page.tsx               # Messages page
│   ├── notifications/
│   │   └── page.tsx               # Notifications page
│   ├── link-school/
│   │   └── page.tsx               # Link school
│   ├── link-child/
│   │   └── page.tsx               # Link child
│   ├── onboarding/
│   │   └── page.tsx               # Onboarding wizard
│   ├── profile/
│   │   └── page.tsx               # Parent profile
│   └── settings/
│       └── page.tsx               # Settings
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   └── Table.tsx
│   ├── features/
│   │   ├── StatCard.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── SchoolSwitcher.tsx
│   │   ├── StudentSearch.tsx
│   │   ├── BehaviorChart.tsx
│   │   ├── AttendanceCalendar.tsx
│   │   └── MessageComposer.tsx
│   └── shared/
│       ├── Loading.tsx
│       ├── Error.tsx
│       └── Empty.tsx
│
├── lib/
│   ├── api.ts                     # API client
│   ├── socket.ts                  # Socket.io client
│   ├── auth.ts                    # Auth helpers
│   └── utils.ts                   # Utility functions
│
├── contexts/
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   ├── useSocket.ts
│   └── useApi.ts
│
├── types/
│   ├── user.ts
│   ├── student.ts
│   ├── incident.ts
│   ├── merit.ts
│   ├── detention.ts
│   ├── attendance.ts
│   └── notification.ts
│
├── styles/
│   └── globals.css                # Global styles with theme
│
├── public/
│   ├── images/
│   └── icons/
│
├── tailwind.config.ts             # Tailwind with theme colors
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Key Features to Implement

### 1. Multi-Child Support
- Dropdown to switch between children
- Aggregate views across all children
- Individual child profiles

### 2. Multi-School Support
- School switcher in header
- Different data per school
- School branding (logo, colors)

### 3. Real-Time Updates
- Socket.io integration
- Live notification updates
- Instant incident alerts
- Message notifications

### 4. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop full features
- Touch-friendly interactions

### 5. Dark Theme
- Consistent with admin portal
- Green (#00E676) primary color
- Cyan (#38BDF8) secondary color
- Dark backgrounds (#0B0F14, #121821)

### 6. Animations
- Framer Motion for page transitions
- Smooth hover effects
- Loading skeletons
- Success celebrations (for merits)

### 7. Data Visualization
- Recharts for behavior trends
- Attendance calendar heatmap
- Merit points progress
- Intervention timeline

### 8. Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode option

---

## API Integration Notes

### Base URL
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

### Authentication
All API calls require JWT token in Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Error Handling
```javascript
try {
  const response = await fetch(`${API_BASE_URL}/endpoint`);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Show toast notification
  // Redirect to login if 401
}
```

### Caching Strategy
- Use Next.js App Router caching
- Revalidate on user actions
- Real-time updates via Socket.io
- Optimistic UI updates

---

## Performance Optimizations

### 1. Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (automatic in Next.js)
- Lazy load charts and visualizations

### 2. Image Optimization
- Next.js Image component
- Lazy loading
- Responsive images
- WebP format

### 3. Data Fetching
- Server Components where possible
- Parallel data fetching
- Pagination for large lists
- Infinite scroll for feeds

### 4. Caching
- API response caching
- Static generation for public pages
- Incremental Static Regeneration
- Client-side caching with SWR/React Query

---

## Security Considerations

### 1. Authentication
- JWT token stored in httpOnly cookie (preferred) or localStorage
- Token refresh mechanism
- Auto-logout on expiry
- Secure password requirements

### 2. Authorization
- Parent can only view their own children's data
- API validates parent-child relationship
- School context enforced on backend
- No direct student ID manipulation

### 3. Data Protection
- HTTPS only in production
- XSS prevention (React escaping)
- CSRF protection
- Input sanitization

### 4. Privacy
- No sensitive data in URLs
- Audit logging on backend
- Data retention policies
- GDPR compliance (if applicable)

---

## Testing Strategy

### 1. Unit Tests
- Component tests (Jest + React Testing Library)
- Hook tests
- Utility function tests

### 2. Integration Tests
- API integration tests
- Context provider tests
- Form submission tests

### 3. E2E Tests
- Critical user flows (Playwright/Cypress)
- Login → Dashboard → View Behavior
- Link School → Link Child
- Send Message workflow

### 4. Visual Regression
- Storybook for component library
- Chromatic for visual testing
- Responsive design testing

---

## Deployment Considerations

### 1. Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_SCHOOL_CODE=WS2025
```

### 2. Build Configuration
- Production build optimization
- Environment-specific configs
- CDN for static assets
- Image optimization

### 3. Hosting Options
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Self-hosted (Docker)

---

## Migration Plan

### Phase 1: Setup (Week 1)
- Initialize Next.js project
- Set up Tailwind with theme colors
- Create base layout components
- Implement authentication

### Phase 2: Core Pages (Week 2-3)
- Dashboard
- My Children
- Behavior Report
- Attendance Overview

### Phase 3: Secondary Pages (Week 4)
- Merits, Detentions, Consequences
- Interventions
- Messages
- Notifications

### Phase 4: Settings & Onboarding (Week 5)
- Settings page
- Link School/Child
- Onboarding wizard
- Profile page

### Phase 5: Polish & Testing (Week 6)
- Real-time features
- Animations
- Performance optimization
- Testing
- Bug fixes

### Phase 6: Deployment (Week 7)
- Production build
- Deploy to hosting
- Monitor and fix issues
- User training

---

## Summary

This specification provides everything needed to rebuild the Parent Portal UI in Next.js while maintaining 100% backend compatibility. The new UI will:

✅ Use the same dark theme as Admin Portal  
✅ Support all 19 existing pages  
✅ Integrate with existing API endpoints  
✅ Maintain real-time features via Socket.io  
✅ Support multi-child and multi-school scenarios  
✅ Provide modern, responsive design  
✅ Include animations and data visualizations  
✅ Ensure accessibility and performance  

**No backend changes required** - all API endpoints remain the same!
