# Behaviour, Discipline & Detention System - Required Improvements
**Created:** January 23, 2026  
**Status:** Planning Phase

---

## Overview

This document outlines all required improvements to the Behaviour, Discipline & Detention System, organized by priority and implementation complexity.

---

## 1. High-Severity Incident Notifications

### Current Issues
- ❌ Admins not receiving notifications when teachers log high-severity incidents
- ⚠️ Low/medium severity incidents may be requiring unnecessary approval

### Required Changes

#### Backend Changes
**File:** `backend/routes/behaviour.js`
- [ ] Add notification trigger when high-severity incident is created
- [ ] Send notification to all admins immediately
- [ ] Ensure low/medium severity incidents bypass approval flow
- [ ] Add severity check in incident creation endpoint

#### Notification Content
```
Title: "High-Severity Incident Logged"
Message: "[Teacher Name] logged a high-severity incident for [Student Name]: [Description]"
Recipients: All admins
Type: high_severity_incident
```

#### Implementation Steps
1. Modify `POST /api/behaviour` endpoint
2. Add severity-based notification logic
3. Query all admin users
4. Send notifications using `createNotification()` helper
5. Test with high/medium/low severity incidents

---

## 2. Behaviour Dashboard Analytics & Graphs

### Current Issues
- ❌ Graphs showing placeholder or incomplete data
- ❌ Analytics not displaying meaningful insights
- ❌ No real-time updates when incidents logged/approved

### Required Improvements

#### Analytics to Implement
1. **Incident Trends Over Time**
   - Line chart showing incidents per day/week/month
   - Breakdown by severity (high/medium/low)
   - Comparison to previous periods

2. **Severity Breakdown**
   - Pie chart showing distribution of incident severities
   - Count and percentage for each severity level

3. **Top Incident Types**
   - Bar chart showing most common incident types
   - Filterable by date range

4. **Student Behavior Patterns**
   - Students with most incidents
   - Repeat offenders tracking
   - Improvement/decline trends

5. **Teacher Activity**
   - Incidents logged per teacher
   - Response times for high-severity incidents

#### Frontend Changes
**File:** `frontend/src/pages/admin/BehaviourDashboard.tsx`
- [ ] Add real-time data fetching with Socket.io
- [ ] Implement proper chart components with real data
- [ ] Add date range filters
- [ ] Add severity filters
- [ ] Add auto-refresh on data changes

#### Backend Changes
**File:** `backend/routes/behaviour.js`
- [ ] Add analytics endpoint: `GET /api/behaviour/analytics`
- [ ] Add severity breakdown endpoint
- [ ] Add trends endpoint with date grouping
- [ ] Optimize queries for performance

---

## 3. Incident Records & Approval Flow

### Current Issues
- ❌ Incident details not displaying: points, type, date/time
- ❌ Approval/decline updates not reflecting on Discipline Centre
- ❌ Approval/decline updates not reflecting on Behaviour Dashboard
- ❌ No notifications sent on approval/decline

### Required Fixes

#### Display Issues
**Files to Check:**
- `frontend/src/pages/admin/DisciplineCentre.tsx`
- `frontend/src/pages/admin/BehaviourDashboard.tsx`
- `frontend/src/components/IncidentCard.tsx` (if exists)

**Fields to Display:**
- [ ] Points deducted
- [ ] Incident type name
- [ ] Date (formatted)
- [ ] Time (formatted)
- [ ] Severity
- [ ] Status (pending/approved/declined)
- [ ] Teacher who logged it
- [ ] Student name

#### Approval Flow Sync
**File:** `backend/routes/behaviour.js`
- [ ] Add `PUT /api/behaviour/:id/approve` endpoint
- [ ] Add `PUT /api/behaviour/:id/decline` endpoint
- [ ] Update incident status in database
- [ ] Emit Socket.io event for real-time updates
- [ ] Trigger notifications to all relevant parties

**File:** `frontend/src/pages/admin/DisciplineCentre.tsx`
- [ ] Add approve/decline buttons for high-severity incidents
- [ ] Call API endpoints on button click
- [ ] Listen for Socket.io updates
- [ ] Refresh incident list on status change
- [ ] Show success/error messages

---

## 4. Comprehensive Incident Notifications

### Notification Matrix

| Event | Admin | Logging Teacher | Assigned Teacher | Parent |
|-------|-------|-----------------|------------------|--------|
| High-severity logged | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| High-severity approved | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| High-severity declined | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Low/medium logged | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |

### Notification Templates

#### High-Severity Incident Logged (to Admin)
```
Title: "High-Severity Incident Requires Review"
Message: "[Teacher Name] logged a high-severity incident for [Student Name] ([Class]): [Description]"
Action: "Review Incident"
Link: /admin/discipline-centre?incident=[id]
```

#### High-Severity Incident Logged (to Parent)
```
Title: "Incident Notification"
Message: "Your child, [Student Name], was involved in a high-severity incident on [Date]. Details: [Description]. This incident is pending admin review."
```

#### Incident Approved (to Teacher)
```
Title: "Incident Approved"
Message: "The high-severity incident you logged for [Student Name] has been approved by [Admin Name]."
```

#### Incident Approved (to Parent)
```
Title: "Incident Confirmed"
Message: "The incident involving your child, [Student Name], has been reviewed and confirmed. Points deducted: [Points]. Please contact the school if you have questions."
```

#### Incident Declined (to Teacher)
```
Title: "Incident Declined"
Message: "The high-severity incident you logged for [Student Name] has been declined by [Admin Name]. Reason: [Decline Reason]"
```

#### Incident Declined (to Parent)
```
Title: "Incident Review Update"
Message: "The incident involving your child, [Student Name], has been reviewed and will not be processed further."
```

### Implementation
**File:** `backend/routes/behaviour.js`
- [ ] Create notification helper function for incidents
- [ ] Add notifications on incident creation (POST)
- [ ] Add notifications on incident approval (PUT approve)
- [ ] Add notifications on incident decline (PUT decline)
- [ ] Query for student's class teacher
- [ ] Query for student's parent
- [ ] Query for all admins (high-severity only)

---

## 5. Discipline Centre - Admin View All Logs

### Current Issues
- ❌ Admin cannot view all system logs
- ❌ Missing incident logs
- ❌ Missing detention records
- ❌ Missing interventions
- ❌ Missing consequences

### Required Features

#### Unified Discipline Log View
**File:** `frontend/src/pages/admin/DisciplineCentre.tsx`

**Tabs/Sections:**
1. **Incidents** (behaviour_incidents)
   - All incidents with filters
   - Status: pending/approved/declined
   - Severity: high/medium/low
   - Date range filter
   - Student filter
   - Teacher filter

2. **Detentions** (detention_assignments)
   - All detention assignments
   - Status: scheduled/completed/cancelled
   - Date range filter
   - Student filter
   - Session filter

3. **Interventions** (if table exists)
   - All interventions
   - Type filter
   - Date range filter
   - Student filter

4. **Consequences** (consequences table)
   - All consequences assigned
   - Type: suspension/verbal warning/written warning
   - Date range filter
   - Student filter
   - Status filter

#### Backend Endpoints Needed
- [ ] `GET /api/behaviour` - Already exists, verify it returns all incidents for admin
- [ ] `GET /api/detentions/assignments` - Get all detention assignments
- [ ] `GET /api/interventions` - Get all interventions (if applicable)
- [ ] `GET /api/consequences` - Get all consequences

#### Filters to Implement
- [ ] Date range (start_date, end_date)
- [ ] Student (student_id)
- [ ] Teacher (teacher_id)
- [ ] Status (pending/approved/declined/completed/cancelled)
- [ ] Severity (high/medium/low)
- [ ] Type (incident_type_id, consequence_type, etc.)

---

## 6. Detention Session Management

### Current Issues
- ❌ Teachers cannot mark detention session status (in progress/completed)
- ❌ No attendance tracking (present/absent/late/excused)
- ❌ No notifications when learner is absent/late/excused
- ❌ Admins cannot cancel detention sessions
- ❌ No auto-queueing when session cancelled

### Required Features

#### 6.1 Teacher Controls - Session Status

**Database Schema Check:**
```sql
-- detention_sessions table should have:
status VARCHAR (scheduled/in_progress/completed/cancelled)
```

**Backend Endpoint:**
```
PUT /api/detentions/sessions/:id/status
Body: { status: 'in_progress' | 'completed' }
```

**File:** `backend/routes/detentions.js`
- [ ] Add session status update endpoint
- [ ] Validate status transitions
- [ ] Emit Socket.io event on status change
- [ ] Add authorization check (only assigned teacher or admin)

**Frontend:**
**File:** `frontend/src/pages/teacher/DetentionSession.tsx` (or similar)
- [ ] Add "Start Session" button (scheduled → in_progress)
- [ ] Add "Complete Session" button (in_progress → completed)
- [ ] Show current session status
- [ ] Disable buttons based on status

#### 6.2 Attendance Tracking

**Database Schema:**
```sql
-- detention_assignments table should have:
attendance_status VARCHAR (present/absent/late/excused)
attendance_marked_at TIMESTAMP
attendance_marked_by INTEGER (teacher_id)
```

**Backend Endpoint:**
```
PUT /api/detentions/assignments/:id/attendance
Body: { 
  attendance_status: 'present' | 'absent' | 'late' | 'excused',
  notes: 'Optional notes'
}
```

**File:** `backend/routes/detentions.js`
- [ ] Add attendance marking endpoint
- [ ] Update detention_assignments table
- [ ] Trigger notifications for absent/late/excused
- [ ] Record who marked attendance and when

**Frontend:**
**File:** `frontend/src/pages/teacher/DetentionSession.tsx`
- [ ] Show list of assigned students
- [ ] Add attendance buttons for each student
- [ ] Show attendance status with color coding
- [ ] Add notes field for each student
- [ ] Save attendance in bulk or individually

#### 6.3 Attendance Notifications

**Notification Triggers:**

**Student Absent:**
```
To: Parent, Admin
Title: "Detention Absence"
Message: "Your child, [Student Name], was marked absent from detention on [Date] at [Time]. This may result in additional consequences."
```

**Student Late:**
```
To: Parent, Admin
Title: "Detention Late Arrival"
Message: "Your child, [Student Name], arrived late to detention on [Date]. Arrival time: [Time]."
```

**Student Excused:**
```
To: Parent, Admin
Title: "Detention Excused"
Message: "Your child, [Student Name], has been excused from detention on [Date]. Reason: [Reason]."
```

**File:** `backend/routes/detentions.js`
- [ ] Add notification helper for attendance
- [ ] Send to parent when absent/late/excused
- [ ] Send to admin for absent status
- [ ] Include detention details in notification

#### 6.4 Admin Session Cancellation

**Backend Endpoint:**
```
PUT /api/detentions/sessions/:id/cancel
Body: { reason: 'Cancellation reason' }
```

**File:** `backend/routes/detentions.js`
- [ ] Add session cancellation endpoint
- [ ] Update session status to 'cancelled'
- [ ] Get all students assigned to this session
- [ ] Move students to detention queue
- [ ] Auto-assign to next available session
- [ ] Send notifications to affected students/parents
- [ ] Send notification to session teacher

**Auto-Queueing Logic:**
```javascript
// When session cancelled:
1. Get all students in cancelled session
2. For each student:
   - Remove from cancelled session
   - Add to detention_queue table
   - Calculate priority (based on original assignment date)
3. Run auto-assignment for next available session
4. Send notifications
```

**Frontend:**
**File:** `frontend/src/pages/admin/DetentionSessions.tsx`
- [ ] Add "Cancel Session" button for admins
- [ ] Show confirmation dialog with reason input
- [ ] Display cancelled status
- [ ] Show re-queued students list

---

## 7. Parent & Teacher Notifications for Consequences

### 7.1 Suspension Notifications (Admin Only)

**Trigger:** When admin assigns suspension to a learner

**Database Check:**
```sql
-- consequences table should have:
consequence_type VARCHAR (suspension/verbal_warning/written_warning)
assigned_by INTEGER (user_id)
assigned_to INTEGER (student_id)
```

**Notification Recipients:**
- Parent/Guardian
- Class Teacher

**Notification Template:**
```
To: Parent
Title: "Suspension Notice"
Message: "Your child, [Student First Name] [Student Last Name], has been suspended. An official suspension process is in effect. You will receive formal documentation regarding this matter."

To: Class Teacher
Title: "Student Suspension Notice"
Message: "[Student First Name] [Student Last Name] has been suspended by [Admin Name]. Please update your records accordingly."
```

**Implementation:**
**File:** `backend/routes/consequences.js` (or similar)
- [ ] Add suspension creation endpoint
- [ ] Restrict to admin role only
- [ ] Send notification to parent
- [ ] Send notification to class teacher
- [ ] Log consequence in database

### 7.2 Verbal & Written Warning Notifications

**Trigger:** When teacher or admin assigns verbal/written warning

**Notification Recipients:**
- Parent/Guardian

**Notification Templates:**

**Verbal Warning:**
```
To: Parent
Title: "Verbal Warning Issued"
Message: "Your child, [Student First Name] [Student Last Name], has received a verbal warning. A letter has been issued regarding this matter."
```

**Written Warning:**
```
To: Parent
Title: "Written Warning Issued"
Message: "Your child, [Student First Name] [Student Last Name], has received a written warning. A formal letter has been issued regarding this matter."
```

**Implementation:**
**File:** `backend/routes/consequences.js`
- [ ] Add warning creation endpoint
- [ ] Allow both teacher and admin roles
- [ ] Send notification to parent
- [ ] Specify warning type in notification
- [ ] Log consequence in database

### 7.3 Detention Assignment Notifications

**Trigger:** When learner is assigned to detention

**Notification Recipients:**
- Parent/Guardian

**Notification Template:**
```
To: Parent
Title: "Detention Assignment"
Message: "Your child, [Student First Name] [Student Last Name], has been assigned to detention on [Date] at [Time]. A letter will be issued and sent home with your child for parent acknowledgment."
```

**Implementation:**
**File:** `backend/routes/detentions.js`
- [ ] Modify detention assignment endpoint
- [ ] Send notification immediately on assignment
- [ ] Include detention date and time
- [ ] Mention letter will be sent home
- [ ] Do NOT wait for session to occur

### General Notification Requirements

**Backend Implementation:**
- [ ] All notifications triggered automatically (no manual action)
- [ ] Include learner first and last name
- [ ] Include clear reason/action taken
- [ ] Backend is single source of truth
- [ ] Use existing `createNotification()` helper
- [ ] Consistent across admin and teacher actions

**Notification Helper Function:**
```javascript
async function notifyConsequence(req, studentId, consequenceType, details) {
  // Get student info
  const student = await getStudent(studentId);
  
  // Get parent
  const parent = student.parent_id;
  
  // Get class teacher
  const classTeacher = await getClassTeacher(student.class_id);
  
  // Build notification based on consequence type
  let title, message;
  
  switch(consequenceType) {
    case 'suspension':
      // Send to parent and class teacher
      break;
    case 'verbal_warning':
    case 'written_warning':
      // Send to parent only
      break;
    case 'detention':
      // Send to parent only
      break;
  }
  
  // Send notifications
  await createNotification(req, parent, type, title, message);
}
```

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ High-severity incident notifications to admin
2. ✅ Incident record display fixes (points, type, date/time)
3. ✅ Approval flow sync (Discipline Centre + Behaviour Dashboard)
4. ✅ Notifications for incident approval/decline

### Phase 2: Core Features (Week 2)
5. ✅ Behaviour Dashboard analytics with real data
6. ✅ Discipline Centre unified log view
7. ✅ Detention session status management
8. ✅ Attendance tracking for detention

### Phase 3: Enhanced Features (Week 3)
9. ✅ Attendance notifications (absent/late/excused)
10. ✅ Admin session cancellation with auto-queueing
11. ✅ Consequence notifications (suspension, warnings)
12. ✅ Detention assignment notifications

---

## Testing Checklist

### High-Severity Incident Flow
- [ ] Teacher logs high-severity incident
- [ ] Admin receives notification immediately
- [ ] Parent receives notification
- [ ] Class teacher receives notification
- [ ] Incident appears in Discipline Centre as "pending"
- [ ] Admin approves incident
- [ ] All parties receive approval notification
- [ ] Incident status updates on dashboard
- [ ] Points deducted from student record

### Detention Flow
- [ ] Student assigned to detention
- [ ] Parent receives immediate notification
- [ ] Teacher starts detention session
- [ ] Teacher marks attendance (present/absent/late/excused)
- [ ] Parent/admin receive notification for absent/late/excused
- [ ] Teacher completes session
- [ ] Attendance saved in database
- [ ] Admin cancels session
- [ ] Students auto-queued for next session
- [ ] All affected parties notified

### Consequence Flow
- [ ] Admin assigns suspension
- [ ] Parent receives notification
- [ ] Class teacher receives notification
- [ ] Teacher assigns verbal warning
- [ ] Parent receives notification
- [ ] Admin assigns written warning
- [ ] Parent receives notification

---

## Files to Modify

### Backend
- `backend/routes/behaviour.js` - Incident notifications, approval flow
- `backend/routes/detentions.js` - Session management, attendance, cancellation
- `backend/routes/consequences.js` - Consequence notifications (may need to create)
- `backend/routes/notifications.js` - Notification helpers
- `backend/database/migrations/` - Schema updates for attendance tracking

### Frontend
- `frontend/src/pages/admin/BehaviourDashboard.tsx` - Analytics improvements
- `frontend/src/pages/admin/DisciplineCentre.tsx` - Unified log view, approval UI
- `frontend/src/pages/teacher/DetentionSession.tsx` - Session management, attendance
- `frontend/src/pages/admin/DetentionSessions.tsx` - Session cancellation
- `frontend/src/components/IncidentCard.tsx` - Display all incident fields

---

## Database Schema Updates Needed

### detention_sessions
```sql
ALTER TABLE detention_sessions 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'scheduled';
-- Values: scheduled, in_progress, completed, cancelled
```

### detention_assignments
```sql
ALTER TABLE detention_assignments 
ADD COLUMN IF NOT EXISTS attendance_status VARCHAR;
-- Values: present, absent, late, excused

ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMP;
ADD COLUMN IF NOT EXISTS attendance_marked_by INTEGER REFERENCES teachers(id);
ADD COLUMN IF NOT EXISTS attendance_notes TEXT;
```

### consequences (if doesn't exist)
```sql
CREATE TABLE IF NOT EXISTS consequences (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  consequence_type VARCHAR NOT NULL,
  -- Values: suspension, verbal_warning, written_warning
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR DEFAULT 'active'
);
```

---

## Success Criteria

### System is considered fixed when:
1. ✅ All high-severity incidents trigger admin notifications
2. ✅ Behaviour Dashboard shows accurate, real-time analytics
3. ✅ All incident details display correctly
4. ✅ Approval/decline updates sync across all views
5. ✅ All relevant parties receive notifications for incidents
6. ✅ Admin can view all discipline logs with filters
7. ✅ Teachers can manage detention sessions and mark attendance
8. ✅ Parents/admins notified of detention attendance issues
9. ✅ Admins can cancel sessions with auto-queueing
10. ✅ All consequence types trigger appropriate notifications
11. ✅ Detention assignments send immediate parent notifications
12. ✅ No manual intervention needed for any notification

---

**Document Status:** Complete - Ready for Implementation  
**Next Step:** Begin Phase 1 implementation
