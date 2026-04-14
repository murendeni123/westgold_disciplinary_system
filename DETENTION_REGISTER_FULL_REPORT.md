# Detention Register System — Full Audit Report
**Branch:** `fix2`  
**Date:** April 2026  
**Scope:** Admin · Grade Head · Teacher · Parent

---

## 1. Overview of the Detention Workflow

The system follows this lifecycle:

```
Admin creates session
   → Admin assigns Teacher on Duty
   → Admin manually assigns students OR uses Auto-Assign (rule-based)
   → Parent receives in-app notification + email
   → Teacher starts session → marks attendance → completes session
   → Notifications triggered → Incidents resolved (if attended)
```

---

## 2. Role-by-Role: How the Detention Register Works

---

### 2.1 ADMIN

**Where:** `frontend/src/pages/admin/DetentionSessions.tsx` and `Detentions.tsx`

**What admins can do:**

| Action | Available |
|---|---|
| Create a detention session (date, time, start, end, location, max capacity, notes) | ✅ Yes |
| Assign a teacher on duty to a session | ✅ Yes |
| Change the assigned teacher | ✅ Yes |
| Auto-assign students based on detention rules (10+ demerit points since last detention) | ✅ Yes |
| Manually assign individual students to a session | ✅ Yes |
| Set capacity limits (default 30) | ✅ Yes |
| Create recurring sessions | ✅ Yes |
| Delete a session | ✅ Yes |
| View all sessions across the school (no grade restriction) | ✅ Yes |
| View qualifying students (those with 10+ demerit points not yet assigned) | ✅ Yes |
| View queued students (students waiting for next available slot) | ✅ Yes |
| Filter sessions by status (Scheduled / In Progress / Completed / Cancelled) | ✅ Yes |
| View session details (student list, attendance status per student) | ✅ Yes |
| Mark attendance on behalf of a teacher | ✅ Yes |

**Auto-Assign Logic:**
- Finds all students with 10+ accumulated unresolved demerit points since their last completed detention
- Fills the session up to max capacity
- Overflow students go into a "detention queue" for the next available session
- Parents are notified automatically on assignment

**Notifications admins receive:**
- Notified when any student is marked **absent** from a detention session
- Notified when a student is **dismissed** (via `detention_missed` notification type)

**What admins do NOT receive:**
- ❌ No notification when a teacher submits (completes) the detention register
- ❌ No notification when all attendance has been marked for a session

---

### 2.2 GRADE HEAD

**Where:** Backend `GET /detentions` with grade-head filtering. Grade heads use the same teacher-role UI pages.

**What grade heads can do:**

| Action | Available |
|---|---|
| View detention sessions that contain students from their assigned grade | ✅ Yes (backend-filtered) |
| View session details including student attendance | ✅ Yes |
| See all attendance statuses (present, absent, late, excused, pending) | ✅ Yes |
| Mark attendance for a session (if assigned as teacher on duty) | ✅ Only if they are the assigned teacher |
| Start/complete a session | ✅ Only if they are the assigned teacher |

**How grade-head filtering works:**  
When a grade head calls `GET /api/detentions`, the backend checks `req.user.isGradeHead && req.user.gradeHeadFor` and automatically filters the result to only return sessions that have at least one student from their assigned grade. This is done server-side and is transparent to the UI.

**What grade heads do NOT have:**
- ❌ No dedicated "Grade Head Detention" management page — they share pages with teachers
- ❌ No ability to create or schedule detention sessions (admin-only)
- ❌ No notification when a teacher on duty submits the register for their grade
- ❌ No dedicated grade-head Excel download for detention data

---

### 2.3 TEACHER (Teacher on Duty)

**Where:** `frontend/src/pages/teacher/MyDetentions.tsx`

**What teachers can do:**

| Action | Available |
|---|---|
| View only sessions they are personally assigned to as teacher on duty | ✅ Yes (backend-enforced) |
| See session summary stats: Total, Completed, Scheduled | ✅ Yes |
| See charts: Detention frequency (last 14 days) + Attendance breakdown pie chart | ✅ Yes |
| Start a session (change status from Scheduled → In Progress) | ✅ Yes |
| Complete a session (change status from In Progress → Completed) | ✅ Yes |
| Open a session and view all assigned students | ✅ Yes |
| Mark attendance per student: Pending / Present / Absent / Late / Excused | ✅ Yes |
| Save attendance for all students at once | ✅ Yes |
| View any individual student's full detention history (via `ViewDetentions.tsx`) | ✅ Yes |

**Attendance Marking — Status Options:**

| Status | Displayed As | Stored In DB As |
|---|---|---|
| Present | ✓ Present (green) | `attended` |
| Absent | ✗ Absent (red) | `absent` |
| Late | ⚠ Late (yellow) | `late` |
| Excused | ℹ Excused (blue) | `excused` |
| Pending | ⏳ Pending (gray) | `assigned` |

**What the teacher does NOT see/do:**
- ❌ Cannot see sessions they are NOT assigned to
- ❌ No download/export button for the detention register from the teacher portal
- ❌ No automatic notification to admin/grade head when they submit (complete) the register

---

### 2.4 PARENT

**Where:** Parent portal `ModernViewDetentions.tsx` (in parent-portal app)

**What parents can see:**

| Information | Available |
|---|---|
| Full history of all detention assignments for their child | ✅ Yes |
| Date and time of each detention | ✅ Yes |
| Duration of each detention | ✅ Yes |
| Location of the detention | ✅ Yes (in the detail modal) |
| Teacher on duty name | ✅ Yes (in the detail modal) |
| Session status (Scheduled / Completed) | ✅ Yes |
| Child's attendance status: Present / Absent / Late / Pending | ✅ Yes (color-coded badges) |
| Reason for detention assignment | ✅ Yes (in the table and modal) |
| Notes from the teacher | ✅ Yes (in the detail modal) |
| Chart: Detention frequency by month | ✅ Yes |
| Chart: Attendance breakdown (pie chart: Present / Absent / Late / Pending) | ✅ Yes |
| Summary stats: Total, Completed, Scheduled, Present count | ✅ Yes |
| Multi-child filtering (if parent has multiple children) | ✅ Yes |
| Click-to-expand detail modal per detention | ✅ Yes |

**Can the parent see if the child was Present, Absent, or Excused?**  
✅ Yes. The attendance status is shown as a color-coded badge in the main list:
- **Green** = Present
- **Red** = Absent
- **Yellow** = Late
- **Blue** = Excused
- **Gray** = Pending

**Notifications parents receive:**

| Event | Notification |
|---|---|
| Child assigned to detention | In-app notification + Email |
| Child marked absent from detention | In-app notification |
| Child marked late to detention | In-app notification |
| Child marked excused from detention | In-app notification (includes reason note) |
| Child successfully completed detention | In-app notification |
| Child auto-reassigned to next session (after absence) | In-app notification with new date |

**What parents do NOT have:**
- ❌ No download/export button for detention history

---

## 3. What Happens After a Child Serves Detention

When a teacher marks a student as **"Present"** (which saves as `attended` in the database), the following cascade occurs:

1. **Student's demerit incidents are resolved**  
   All unresolved behaviour incidents with `points_deducted > 0` for that student are automatically updated to `status = 'resolved'` with `resolved_at = NOW()`. This is the system's way of "clearing the slate" for the student.

2. **Parent is notified**  
   An in-app notification is sent: *"[Child name] successfully completed detention on [date]."*

3. **The assignment record is preserved**  
   The `detention_assignments` record remains in the database permanently with `status = 'attended'`. This forms the permanent detention history used in all reports.

4. **Session completion**  
   When the teacher clicks "Complete Session", an additional cascade runs for all students with `status = 'attended'`, again resolving their pending incidents. This serves as a double-confirmation.

**What does NOT happen automatically:**
- Grade heads and admins are NOT notified when the register is completed
- No automatic PDF/Excel is generated upon completion

---

## 4. Are Detentions Included in Excel Reports?

### 4.1 Student Individual Record Export (Backend)
**Route:** `GET /api/exports/students/:id?format=excel`  
**Who can use:** Admin only

| Included | Not Included |
|---|---|
| Student Info (ID, name, class, grade) | ❌ Detention history |
| Demerit incidents (date, type, severity, points, teacher) | |
| Merit records (date, type, points, teacher) | |

⚠️ **The individual student Excel export from the backend does NOT include detention data.** This is a gap.

---

### 4.2 Reports & Analytics — Admin Export (`ReportsAnalytics.tsx`)
**Who can use:** Admin only (via Reports & Analytics page)

#### "Export Full Report" button (comprehensive report):
Exports a multi-section Excel file with:

| Section | Included |
|---|---|
| Student Summary (ID, name, class, grade, incident count, merit count, net points) | ✅ Yes |
| Behaviour Incidents (date, student, class, type, severity, points, status, teacher, description) | ✅ Yes |
| Merits (date, student, class, type, points, teacher, description) | ✅ Yes |
| **Detentions (date, student, reason, status, duration, served)** | ✅ Yes |
| Consequences (date, student, incident type, consequence, status) | ✅ Conditional |

**Scope filters available:** Overall school / Per Grade / Per Class / Per Student

#### Individual Student Quick Export:
Exports a comprehensive multi-section Excel file for a single student including:
- Student Overview (totals summary)
- Behaviour Incidents
- Merits
- **Detentions (date, reason, status, duration, served)**
- Consequences

#### Other Export Types Available to Admin:
| Report | Detention Data Included |
|---|---|
| Behaviour Report (incidents only) | ❌ No |
| Merit Report | ❌ No |
| Student Progress Report | ❌ No |
| Class Breakdown Report | ❌ No |
| Grade Analytics Report | ❌ No |

⚠️ **Known data issue:** The "Served" column in the detention export checks `d.served ? 'Yes' : 'No'`. However, the API does not return a `served` field — attendance status is stored as `status: 'attended'`. This means the "Served" column may always show "No" even for students who attended. The correct check should be `d.status === 'attended' || d.status === 'present' ? 'Yes' : 'No'`.

---

### 4.3 Class Record Export (Backend)
**Route:** `GET /api/exports/class/:id?format=excel`  
**Includes:** Student ID, Name, Demerit Points, Merit Points, Net Points  
**Detention Data:** ❌ Not included

---

## 5. Can Teachers, Admins, and Grade Heads Download Detention Reports?

| Role | Can Download Detention Data | How |
|---|---|---|
| **Admin** | ✅ Yes (partial) | Via Reports & Analytics → Export Full Report (includes detention section) |
| **Admin** | ✅ Yes (individual student) | Via Reports & Analytics → Quick Student Search → Export |
| **Admin** | ❌ No dedicated detention register | No session-specific download (e.g., "all students + attendance for session X") |
| **Grade Head** | ❌ No | No download capability for detention data |
| **Teacher** | ❌ No | No download capability from teacher portal |

**Summary:** No role can currently download a **per-session detention register** (the equivalent of a physical sign-in sheet showing all students assigned to a session and their attendance status). This is a feature gap.

---

## 6. Can Parents Download Detention History?

❌ **No.** The parent portal does not have an export/download button for detention history. Parents can only view the data on-screen.

---

## 7. Do Admins and Grade Heads Receive the Submitted Register?

| Event | Admin Notified | Grade Head Notified |
|---|---|---|
| Teacher starts a session | ❌ No | ❌ No |
| Teacher marks a student absent | ✅ Yes (via `detention_absence` notification) | ❌ No |
| Teacher marks a student dismissed | ✅ Yes (via `detention_missed` notification) | ❌ No |
| Teacher **completes the session** (submits register) | ❌ No | ❌ No |
| Teacher marks all students present | ❌ No | ❌ No |

⚠️ **There is no mechanism for admins or grade heads to be notified when the teacher on duty submits/completes a detention register.** They also cannot currently download the completed register in Excel format.

---

## 8. Summary of Gaps and Missing Features

| # | Gap | Affected Roles |
|---|---|---|
| 1 | No notification to admin/grade head when a teacher completes the detention register | Admin, Grade Head |
| 2 | No per-session detention register download (session + student list + attendance as Excel) | Admin, Grade Head, Teacher |
| 3 | Grade head has no dedicated detention page with grade-specific view | Grade Head |
| 4 | No detention download in the parent portal | Parent |
| 5 | The `GET /exports/students/:id` Excel export excludes detention history | Admin |
| 6 | The "Served" column in the comprehensive Excel report is always "No" (uses wrong field `d.served`) | Admin |
| 7 | Grade heads are NOT notified when a student from their grade is absent from detention | Grade Head |
| 8 | Teachers cannot download the attendance register they just submitted | Teacher |

---

## 9. What IS Working Well

| Feature | Status |
|---|---|
| Full detention session lifecycle (scheduled → in_progress → completed) | ✅ Working |
| Parent notification on assignment (in-app + email) | ✅ Working |
| Parent notification on absence/late/excused/completion | ✅ Working |
| Auto-reassignment to next session when student is absent | ✅ Working |
| Detention queue for overflow students | ✅ Working |
| Attendance status colours in teacher portal | ✅ Working |
| Parent can see full detention history with attendance status | ✅ Working |
| Incident resolution when student serves detention | ✅ Working |
| Admin comprehensive Excel report includes detention section | ✅ Working (with "Served" bug) |
| Grade head filtered view of detention sessions | ✅ Working (backend-enforced) |
| Admin notified on student absence from detention | ✅ Working |

---

*Report generated from codebase audit on branch `fix2`.*  
*Key files reviewed:*
- `backend/routes/detentions.js`
- `backend/routes/exports.js`
- `frontend/src/pages/admin/DetentionSessions.tsx`
- `frontend/src/pages/teacher/MyDetentions.tsx`
- `frontend/src/pages/teacher/ViewDetentions.tsx`
- `frontend/src/pages/parent/ModernViewDetentions.tsx`
- `frontend/src/pages/admin/ReportsAnalytics.tsx`
- `frontend/src/utils/excelExport.ts`
- `frontend/src/services/api.ts`
