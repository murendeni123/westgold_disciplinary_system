# Student Suspension Workflow Guide
**Where and How Admins Suspend Students**

---

## 🎯 CURRENT SUSPENSION SYSTEM

### **Where Admins Suspend Students:**

Admins can assign suspensions through the **Consequences System** in two main locations:

---

## 📍 LOCATION 1: Consequences Page

**Path:** Admin Portal → Consequences

### **How to Suspend a Student:**

1. **Navigate to Consequences Page**
   - Click "Consequences" in admin sidebar
   - View all consequence definitions and assignments

2. **Click "Assign Consequence" Button**
   - Opens `AssignConsequenceModal`

3. **Fill in Suspension Details:**
   - **Student:** Select the student to suspend
   - **Consequence:** Select a suspension consequence from dropdown
   - **Assigned Date:** Date suspension starts
   - **Due Date:** Date suspension ends (return date)
   - **Notes:** Reason for suspension, details, conditions

4. **Submit**
   - Consequence is assigned
   - Parent is notified (if parent exists)
   - Record is saved to database

---

## 📍 LOCATION 2: Behaviour Dashboard

**Path:** Admin Portal → Behaviour Dashboard

### **How to Suspend from Incident:**

1. **View Incident Details**
   - Click on a behaviour incident
   - Modal opens with incident details

2. **Click "Assign Consequence" Button**
   - Opens `AssignConsequenceModal`
   - Student is pre-selected from incident

3. **Select Suspension**
   - Choose suspension consequence
   - Set dates and add notes
   - Submit

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Component Used:**
`/frontend/src/components/AssignConsequenceModal.tsx`

### **API Endpoint:**
```
POST /api/consequences/assign
```

### **Request Body:**
```json
{
  "student_id": 123,
  "consequence_id": 5,
  "incident_id": 45,
  "assigned_date": "2026-01-20",
  "due_date": "2026-01-27",
  "notes": "Suspended for 7 days due to fighting incident"
}
```

### **Database Table:**
`consequences` (in school schema)

### **Fields:**
- `student_id` - Student being suspended
- `consequence_id` - Reference to consequence definition
- `incident_id` - Related incident (optional)
- `assigned_date` - Start date of suspension
- `due_date` - End date of suspension
- `status` - pending/completed/cancelled
- `notes` - Suspension details and reason
- `assigned_by` - Admin who assigned it

---

## 📋 CONSEQUENCE TYPES

Suspensions are defined as consequence definitions with type `suspension`:

### **Example Suspension Consequences:**
1. **In-School Suspension (ISS)** - Student attends school but isolated
2. **Out-of-School Suspension (OSS)** - Student stays home
3. **Short-Term Suspension** - 1-3 days
4. **Long-Term Suspension** - 4-10 days
5. **Extended Suspension** - 10+ days (may require board approval)

---

## ⚡ IMMEDIATE SUSPENSION WORKFLOW

### **For Immediate/Emergency Suspensions:**

1. **Admin receives report of serious incident**
   - Fighting, weapons, substance abuse, etc.

2. **Admin goes to Behaviour Dashboard**
   - Views or creates incident record

3. **Clicks "Assign Consequence"**
   - Modal opens with student pre-selected

4. **Selects "Immediate Suspension"**
   - Sets start date to TODAY
   - Sets end date based on severity
   - Adds detailed notes about incident

5. **Submits**
   - Suspension takes effect immediately
   - Parent is notified automatically
   - Record is created

6. **Follow-up Actions:**
   - Contact parent by phone
   - Schedule re-entry meeting
   - Assign interventions if needed
   - Document in student file

---

## 🔄 SUSPENSION PROCESS FLOW

```
Serious Incident Occurs
    ↓
Admin Creates/Views Incident
    ↓
Admin Clicks "Assign Consequence"
    ↓
Selects Student (pre-filled if from incident)
    ↓
Selects Suspension Type
    ↓
Sets Dates (Start & End)
    ↓
Adds Notes (Reason, Conditions)
    ↓
Submits Form
    ↓
System Records Suspension
    ↓
Parent Notified (if exists)
    ↓
Suspension Active
```

---

## 📊 SUSPENSION MANAGEMENT

### **View All Suspensions:**
- Go to **Consequences** page
- Filter by consequence type = "suspension"
- View all active and past suspensions

### **Track Suspension Status:**
- **Pending** - Suspension scheduled but not started
- **Active** - Currently suspended
- **Completed** - Suspension served
- **Cancelled** - Suspension revoked

### **Update Suspension:**
- Click on suspension record
- Edit dates, notes, or status
- Save changes

---

## ⚠️ MISSING FEATURES (RECOMMENDATIONS)

### **What's NOT Currently Implemented:**

1. **Dedicated Suspension Page**
   - No separate "Suspensions" menu item
   - Suspensions mixed with other consequences

2. **Suspension Calendar**
   - No visual calendar showing who's suspended when
   - No capacity planning

3. **Suspension Workflow States**
   - No "pending approval" state
   - No "parent notified" confirmation
   - No "re-entry meeting scheduled" tracking

4. **Suspension Documents**
   - No suspension letter generation
   - No parent signature collection
   - No re-entry contract

5. **Suspension Alerts**
   - Admin not automatically notified of serious incidents
   - No alerts for suspension end dates
   - No reminders for re-entry meetings

6. **Suspension Reports**
   - No suspension statistics dashboard
   - No suspension trends by student/grade/type
   - No compliance reporting

---

## 🚀 RECOMMENDED ENHANCEMENTS

### **Quick Wins:**

1. **Add "Suspensions" to Admin Sidebar**
   - Dedicated page for suspension management
   - Filter consequences where type = suspension
   - Quick access to active suspensions

2. **Add Suspension Status Badge**
   - Show "SUSPENDED" badge on student profiles
   - Display suspension end date
   - Show days remaining

3. **Add Quick Suspend Button**
   - On incident details modal
   - Pre-fills suspension form
   - One-click immediate suspension

4. **Add Suspension Notifications**
   - Notify admin when suspension is due to end
   - Remind to schedule re-entry meeting
   - Alert if suspended student attempts to attend

### **Medium-Term Improvements:**

5. **Suspension Workflow**
   - Add approval workflow for long-term suspensions
   - Track parent notification confirmation
   - Schedule re-entry meetings
   - Assign re-entry interventions

6. **Suspension Documents**
   - Generate suspension letters
   - Collect parent signatures
   - Create re-entry contracts
   - Store documents in student file

7. **Suspension Calendar**
   - Visual calendar of suspensions
   - Capacity planning
   - Conflict detection

8. **Suspension Analytics**
   - Dashboard with suspension statistics
   - Trends by student, grade, type, reason
   - Disproportionality analysis
   - Compliance reporting

---

## ✅ CURRENT CAPABILITIES

**What Works Now:**
- ✅ Assign suspension to any student
- ✅ Set start and end dates
- ✅ Add detailed notes
- ✅ Link to incident (optional)
- ✅ Parent notification (automatic)
- ✅ Track suspension status
- ✅ View suspension history
- ✅ Update suspension details
- ✅ Cancel suspension if needed

**What's Missing:**
- ❌ Dedicated suspension interface
- ❌ Immediate suspension quick action
- ❌ Suspension calendar view
- ❌ Admin notifications for serious incidents
- ❌ Re-entry workflow
- ❌ Suspension documents
- ❌ Suspension analytics

---

## 📝 QUICK REFERENCE

### **To Suspend a Student NOW:**

1. Go to **Admin Portal** → **Consequences**
2. Click **"Assign Consequence"**
3. Select **Student**
4. Select **Suspension** consequence
5. Set **Start Date** = Today
6. Set **End Date** = Return date
7. Add **Notes** = Reason for suspension
8. Click **"Assign Consequence"**
9. ✅ Done! Student is suspended, parent notified

### **To View All Suspensions:**

1. Go to **Admin Portal** → **Consequences**
2. Filter by consequence type or search for "suspension"
3. View list of all suspensions

### **To End Suspension Early:**

1. Go to **Consequences** page
2. Find the suspension
3. Click to edit
4. Change **Due Date** to today or earlier
5. Update **Status** to "completed"
6. Save changes

---

## 🎯 SUMMARY

**Current Suspension Process:**
- Admins use the **Consequences** system to assign suspensions
- Access via **Consequences** page or **Behaviour Dashboard**
- Use `AssignConsequenceModal` component
- Select suspension consequence, set dates, add notes
- Parent automatically notified
- No dedicated suspension interface (uses general consequences)

**Recommendation:**
Create a dedicated **Suspensions** page with quick suspend actions, calendar view, and workflow management for better suspension handling.
