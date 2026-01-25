# Admin Notifications Guide
**When Do Admins Get Notifications?**

---

## 🔔 CURRENT NOTIFICATION SYSTEM

Based on the codebase analysis, here's when notifications are sent in your system:

---

## 📊 NOTIFICATION TRIGGERS

### **Currently Implemented:**

#### **1. Parents Get Notified When:**
- ✅ **Behaviour Incident Created** - Parent notified when their child has a behaviour incident
- ✅ **Merit Awarded** - Parent notified when their child receives a merit
- ✅ **Detention Assigned** - Parent notified when their child is assigned detention
- ✅ **Detention Attendance** - Parent notified if child is late/absent from detention
- ✅ **Intervention Assigned** - Parent notified when intervention is assigned to their child
- ✅ **Consequence Assigned** - Parent notified when consequence is assigned to their child

---

## ⚠️ ADMINS DO NOT CURRENTLY RECEIVE NOTIFICATIONS

**Current Status:** Admins are **NOT** automatically notified of any events in the system.

The notification system currently only sends notifications to:
- **Parents** - When their child has behaviour events (incidents, merits, detentions, interventions, consequences)

---

## 🎯 RECOMMENDED ADMIN NOTIFICATIONS

### **Critical Events (Should Notify Admin):**

#### **1. Serious Behaviour Incidents**
- High severity incidents (fighting, weapons, substance abuse)
- Multiple incidents by same student in short time
- Incidents requiring immediate attention

#### **2. Detention Issues**
- Student missed detention
- Multiple detention assignments
- Detention capacity reached

#### **3. Intervention Alerts**
- Intervention marked as unsuccessful
- Follow-up required
- Student not showing progress

#### **4. Consequence Escalations**
- Suspension triggered
- Expulsion review required
- Parent meeting required

#### **5. System Alerts**
- New teacher registered
- New parent onboarding
- Bulk import completed/failed
- Feature flag changes (if platform admin)

#### **6. Threshold Alerts**
- Student reaches X demerit points
- Student has X incidents in Y days
- Automatic detention rule triggered
- Automatic consequence rule triggered

---

## 💡 IMPLEMENTATION NEEDED

To add admin notifications, you need to:

### **1. Modify Notification Logic**

Add admin notification calls in these routes:

#### **Behaviour Incidents** (`routes/behaviour.js`)
```javascript
// After creating incident, check severity
if (severity === 'high' || severity === 'critical') {
  // Get all admins for this school
  const admins = await schemaAll(req, 
    'SELECT u.id FROM public.users u WHERE u.role = $1 AND u.school_id = $2',
    ['admin', req.schoolId]
  );
  
  // Notify each admin
  for (const admin of admins) {
    await createNotification(
      req,
      admin.id,
      'incident_alert',
      'Serious Incident Reported',
      `High severity incident: ${incident_type} - ${student_name}`,
      result.id,
      'incident'
    );
  }
}
```

#### **Detentions** (`routes/detentions.js`)
```javascript
// When student misses detention
if (status === 'absent') {
  const admins = await getSchoolAdmins(req);
  for (const admin of admins) {
    await createNotification(
      req,
      admin.id,
      'detention_missed',
      'Student Missed Detention',
      `${student_name} was absent from detention on ${detention_date}`,
      detentionId,
      'detention'
    );
  }
}
```

#### **Interventions** (`routes/interventions.js`)
```javascript
// When outcome is unsuccessful
if (outcome === 'unsuccessful') {
  const admins = await getSchoolAdmins(req);
  for (const admin of admins) {
    await createNotification(
      req,
      admin.id,
      'intervention_unsuccessful',
      'Intervention Unsuccessful',
      `Intervention for ${student_name} was unsuccessful`,
      interventionId,
      'intervention'
    );
  }
}
```

### **2. Create Helper Function**

Add to `routes/notifications.js`:
```javascript
const getSchoolAdmins = async (req) => {
  const schema = getSchema(req);
  if (!schema) return [];
  
  return await dbAll(
    'SELECT id FROM public.users WHERE role = $1 AND school_id = $2',
    ['admin', req.schoolId]
  );
};

module.exports = { router, createNotification, getSchoolAdmins };
```

### **3. Add Notification Preferences**

Allow admins to configure which notifications they want:
- Create `notification_preferences` table
- Add settings page for admins
- Check preferences before sending notifications

---

## 📋 NOTIFICATION TYPES TO ADD

### **High Priority:**
1. ✅ Serious incidents (high/critical severity)
2. ✅ Student missed detention
3. ✅ Intervention unsuccessful
4. ✅ Consequence escalation (suspension/expulsion)
5. ✅ Student reaches point threshold

### **Medium Priority:**
6. ⚠️ Multiple incidents by same student
7. ⚠️ Follow-up required on intervention
8. ⚠️ Parent meeting required
9. ⚠️ Detention rule triggered
10. ⚠️ Consequence rule triggered

### **Low Priority:**
11. ℹ️ New teacher registered
12. ℹ️ New parent onboarded
13. ℹ️ Bulk import completed
14. ℹ️ Weekly summary reports

---

## 🔧 NOTIFICATION SETTINGS EXAMPLE

```javascript
// Admin notification preferences
{
  "serious_incidents": true,
  "detention_issues": true,
  "intervention_alerts": true,
  "consequence_escalations": true,
  "threshold_alerts": true,
  "daily_summary": false,
  "weekly_summary": true
}
```

---

## 📊 NOTIFICATION DASHBOARD

Admins should have:
- **Notification Center** - View all notifications
- **Notification Preferences** - Configure what they receive
- **Notification History** - View past notifications
- **Mark as Read/Unread** - Manage notification status
- **Notification Filters** - Filter by type, date, student

---

## 🚀 QUICK IMPLEMENTATION STEPS

1. **Add `getSchoolAdmins()` helper function**
2. **Modify behaviour.js** - Add admin notifications for high severity incidents
3. **Modify detentions.js** - Add admin notifications for missed detentions
4. **Modify interventions.js** - Add admin notifications for unsuccessful outcomes
5. **Modify consequences.js** - Add admin notifications for escalations
6. **Test notification delivery**
7. **Add notification preferences UI**

---

## 📝 CURRENT NOTIFICATION FLOW

```
Event Occurs (Incident/Merit/Detention/etc.)
    ↓
Check if student has parent
    ↓
If parent exists → Send notification to parent
    ↓
Admin NOT notified (missing implementation)
```

## 📝 RECOMMENDED NOTIFICATION FLOW

```
Event Occurs (Incident/Merit/Detention/etc.)
    ↓
Check if student has parent
    ↓
If parent exists → Send notification to parent
    ↓
Check event severity/type
    ↓
If meets admin criteria → Send notification to all school admins
    ↓
Check admin preferences
    ↓
Send notification if enabled in preferences
```

---

## ✅ SUMMARY

**Current State:**
- ❌ Admins receive NO automatic notifications
- ✅ Parents receive notifications for all child events

**Recommended State:**
- ✅ Admins notified of serious incidents
- ✅ Admins notified of detention issues
- ✅ Admins notified of intervention problems
- ✅ Admins notified of consequence escalations
- ✅ Admins can configure notification preferences

**Action Required:**
Implement admin notification logic in behaviour, detention, intervention, and consequence routes.
