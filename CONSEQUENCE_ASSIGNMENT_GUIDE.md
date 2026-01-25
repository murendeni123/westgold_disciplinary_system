# Consequence Assignment & Suspension Approval Workflow

## Overview

This guide explains how consequences (verbal warnings, written warnings, suspensions) are assigned in the system and how the suspension approval workflow works.

---

## 🎯 Who Can Assign Consequences

### **Teachers:**
- ✅ Can assign verbal warnings (no approval needed)
- ✅ Can assign written warnings (no approval needed)
- ✅ Can assign detentions (no approval needed)
- ⚠️ Can assign suspensions (requires admin approval)

### **Admins:**
- ✅ Can assign all consequence types
- ✅ Suspensions assigned by admins are **immediate** (no approval needed)
- ✅ Can approve/deny suspensions assigned by teachers

---

## 📝 How to Assign Consequences

### **Step 1: Navigate to Consequences Page**
- **Teacher:** Teacher Portal → Consequences
- **Admin:** Admin Portal → Consequences

### **Step 2: Click "Assign Consequence"**
Opens the assignment modal

### **Step 3: Fill in the Form**
- **Student:** Select from dropdown
- **Consequence Type:** Select (verbal warning, written warning, suspension, etc.)
- **Assigned Date:** When the consequence is given (defaults to today)
- **Due Date:** When it should be completed (optional)
- **Notes:** Additional details
- **Link to Incident:** Optional - creates audit trail

### **Step 4: Submit**
- Consequence is assigned
- Parent gets notified automatically
- Admin gets notified if it's a suspension

---

## ⚠️ Suspension Approval Workflow

### **When Teacher Assigns a Suspension:**

```
1. Teacher assigns suspension
   ↓
2. Status: "pending" (not active yet)
   ↓
3. Admin receives notification: "⚠️ Suspension Pending Approval"
   ↓
4. Admin reviews and decides:
   - Approve → Status becomes "active", student is suspended
   - Deny → Status becomes "cancelled", suspension doesn't happen
   ↓
5. Teacher receives notification of decision
   ↓
6. Parent is notified of final decision
```

### **When Admin Assigns a Suspension:**

```
1. Admin assigns suspension
   ↓
2. Status: "active" (immediate effect)
   ↓
3. Student is suspended immediately
   ↓
4. Parent receives notification
   ↓
5. No approval needed
```

---

## 🔔 Automatic Notifications

### **For All Consequences:**
- **Parent Notification:** "Consequence Assigned - A consequence has been assigned to your child"

### **For Teacher-Assigned Suspensions (Pending Approval):**
- **Admin Notification:** "⚠️ Suspension Pending Approval - Teacher [Name] assigned suspension to [Student] - Requires approval"

### **For Admin-Assigned Suspensions (Immediate):**
- **Admin Notification:** "⚠️ Suspension Assigned - Suspension assigned to [Student]"

### **After Admin Decision:**
- **Teacher Notification (Approved):** "✅ Suspension Approved - Your suspension for [Student] has been approved by admin"
- **Teacher Notification (Denied):** "❌ Suspension Denied - Your suspension for [Student] has been denied by admin: [reason]"

---

## 🎛️ Admin Consequences Page Features

### **View All Consequences**
- Filter by student, status, consequence type
- See pending suspensions requiring approval
- View analytics and trends

### **Approve/Deny Suspensions**
1. Find suspension with status "pending"
2. Click "Review" or "Approve/Deny" button
3. Add notes (optional for approval, recommended for denial)
4. Click "Approve" or "Deny"
5. Teacher and parent are notified

### **Assign Consequences Directly**
- Same as teacher workflow
- Suspensions are immediate (no approval needed)

---

## 📊 Consequence Types & Severity Levels

### **Recommended Consequence Types:**

| Type | Severity | Requires Approval | Description |
|------|----------|-------------------|-------------|
| Verbal Warning | Low | No | Verbal reminder about behavior |
| Written Warning | Medium | No | Formal written notice |
| Detention | Medium | No | After-school or lunchtime detention |
| Parent Conference | Medium | No | Required meeting with parent |
| In-School Suspension | High | Teacher: Yes, Admin: No | Removed from class, stays on campus |
| Out-of-School Suspension | Suspension | Teacher: Yes, Admin: No | Student sent home |

---

## 🔧 Database Schema

### **New Fields Added for Approval Workflow:**

```sql
student_consequences table:
- requires_approval (BOOLEAN) - TRUE if teacher-assigned suspension
- approval_status (TEXT) - 'pending', 'approved', 'denied'
- approved_by (INTEGER) - Admin who approved/denied
- approved_at (TIMESTAMP) - When decision was made
- approval_notes (TEXT) - Admin notes on decision
```

---

## 🚀 Backend API Endpoints

### **Assign Consequence:**
```
POST /api/consequences/assign
Body: {
  student_id, consequence_id, incident_id,
  assigned_date, due_date, notes
}
```

**Logic:**
- If consequence is suspension AND user is teacher:
  - `requires_approval = true`
  - `approval_status = 'pending'`
  - `status = 'pending'`
- If consequence is suspension AND user is admin:
  - `requires_approval = false`
  - `approval_status = null`
  - `status = 'active'`

### **Approve/Deny Suspension:**
```
PUT /api/consequences/:id/approval
Body: {
  approval_status: 'approved' | 'denied',
  approval_notes: 'optional notes'
}
```

**Logic:**
- Validates consequence requires approval
- Updates approval_status, approved_by, approved_at
- Sets status to 'active' (approved) or 'cancelled' (denied)
- Notifies teacher of decision

---

## 📱 Frontend Components

### **Teacher Consequences Page:**
- View all consequences for their students
- Assign consequences (suspensions go to pending)
- Filter and search

### **Admin Consequences Page:**
- View all consequences school-wide
- Approve/deny pending suspensions
- Assign consequences (suspensions are immediate)
- Analytics and reporting

---

## ✅ Testing the Workflow

### **Test 1: Teacher Assigns Suspension**
1. Login as teacher
2. Go to Consequences → Assign Consequence
3. Select student and suspension type
4. Submit
5. ✅ Check: Status should be "pending"
6. ✅ Check: Admin should receive notification
7. Login as admin
8. Go to Consequences
9. Find pending suspension
10. Approve or deny
11. ✅ Check: Teacher receives notification
12. ✅ Check: Status updates to "active" or "cancelled"

### **Test 2: Admin Assigns Suspension**
1. Login as admin
2. Go to Consequences → Assign Consequence
3. Select student and suspension type
4. Submit
5. ✅ Check: Status should be "active" immediately
6. ✅ Check: No approval needed
7. ✅ Check: Parent receives notification

---

## 🎯 Key Differences

| Action | Teacher | Admin |
|--------|---------|-------|
| Verbal Warning | Immediate | Immediate |
| Written Warning | Immediate | Immediate |
| Detention | Immediate | Immediate |
| Suspension | **Pending Approval** | **Immediate** |
| Can Approve Suspensions | ❌ No | ✅ Yes |

---

## 💡 Best Practices

1. **Teachers:** Always provide detailed notes when assigning suspensions to help admin make informed decisions
2. **Admins:** Provide clear notes when denying suspensions so teachers understand the reasoning
3. **Both:** Link consequences to specific incidents for better audit trails
4. **Admins:** Review pending suspensions promptly to avoid delays
5. **Both:** Ensure parent contact information is up-to-date for notifications

---

## 🔐 Security & Permissions

- Teachers can only view consequences for students in their classes
- Admins can view all consequences school-wide
- Only admins can approve/deny suspensions
- All actions are logged with timestamps and user IDs
- Audit trail maintained for compliance

---

## 📞 Support

If you encounter issues with the consequence assignment or approval workflow, check:
1. User role permissions
2. Consequence type definitions exist
3. Backend server is running
4. Database migrations have been applied
5. Notifications are configured correctly
