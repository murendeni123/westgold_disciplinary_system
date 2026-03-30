# Grade Head Role - Implementation Guide

## Admin Portal Pages Summary

### ✅ HIGH PRIORITY - Grade Head Access (Filtered by Grade)
1. **Admin Dashboard** - Overview stats, alerts, trends
2. **Students** - Student list and management
3. **Student Profile** - Individual student details with analytics
4. **Classes** - Class management for their grade
5. **Class Detail** - Detailed class view
6. **Behaviour Dashboard** - Incident analytics and trends
7. **Discipline Center** - Approve incidents, manage discipline
8. **Consequences** - Track assigned consequences
9. **Merits/Demerits** - Positive/negative behaviour tracking
10. **Reports & Analytics** - Critical for grade-level reporting
11. **Detention Sessions** - Manage detention for grade

### ⚠️ PARTIAL ACCESS - Filtered Data
12. **Teachers** - Only teachers in their grade
13. **Teacher Profile** - Only if teaches in their grade
14. **Parents** - Only parents of their grade's students

### ✅ PERSONAL ACCESS - No Filtering Needed
15. **Admin Settings** - Personal account settings
16. **Notifications** - Filtered to grade activities
17. **Log Incident** - Can log for their grade
18. **Award Merit** - Can award to their grade

### ❌ NO ACCESS - Admin Only
19. **User Management** - Security risk
20. **Bulk Import** - Data integrity risk
21. **Smart Import V2** - Data integrity risk
22. **Discipline Rules** - School-wide policy

---

## Two Types of Grade Heads

**Type A: Teaching Grade Head**
- Has assigned class (e.g., teaches Grade 8A, heads all Grade 8)
- Needs: Teacher portal for class + Admin portal for grade

**Type B: Non-Teaching Grade Head**
- No class (dedicated admin role)
- Needs: Admin portal for grade only

---

## Implementation Steps

### 1. Database Schema
```sql
ALTER TABLE teachers 
ADD COLUMN is_grade_head BOOLEAN DEFAULT FALSE,
ADD COLUMN grade_head_for VARCHAR(10);

-- Example
UPDATE teachers SET is_grade_head = TRUE, grade_head_for = '8' WHERE id = 5;
```

### 2. Backend Middleware (`backend/middleware/gradeHeadAuth.js`)
```javascript
const requireGradeHeadOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.isGradeHead) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};

const applyGradeFilter = (query, params, req) => {
  if (req.user.isGradeHead && req.user.role !== 'admin') {
    query += ` AND (c.grade_level = $${params.length + 1} OR s.grade_level = $${params.length + 1})`;
    params.push(req.user.gradeHeadFor);
  }
  return { query, params };
};
```

### 3. Enhanced Auth Middleware (`backend/middleware/auth.js`)
```javascript
// In authenticateToken, after JWT verification:
if (req.user.role === 'teacher') {
  const teacher = await schemaGet(req, 
    'SELECT id, is_grade_head, grade_head_for FROM teachers WHERE user_id = $1',
    [req.user.id]
  );
  if (teacher?.is_grade_head) {
    req.user.isGradeHead = true;
    req.user.gradeHeadFor = teacher.grade_head_for;
  }
}
```

### 4. Route Protection Example
```javascript
// backend/routes/students.js
router.get('/', authenticateToken, requireGradeHeadOrAdmin, async (req, res) => {
  let query = 'SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE 1=1';
  let params = [];
  
  ({ query, params } = applyGradeFilter(query, params, req));
  
  const students = await schemaAll(req, query, params);
  res.json(students);
});
```

### 5. Frontend Auth Context
```typescript
interface User {
  role: 'admin' | 'teacher' | 'parent';
  isGradeHead?: boolean;
  gradeHeadFor?: string;
  effectiveRole?: 'admin' | 'teacher' | 'grade_head';
}
```

### 6. App.tsx Routes
```typescript
<Route path="/grade-head" element={
  <ProtectedRoute allowedRoles={['grade_head', 'admin']}>
    <GradeHeadLayout />
  </ProtectedRoute>
}>
  <Route index element={<AdminDashboard />} />
  <Route path="students" element={<Students />} />
  {/* ... other admin routes with grade filtering */}
</Route>
```

### 7. Login Redirect Logic
```typescript
// After login, redirect based on role
if (user.isGradeHead) {
  navigate('/grade-head');
} else if (user.role === 'teacher') {
  navigate('/teacher');
} else if (user.role === 'admin') {
  navigate('/admin');
}
```

---

## Key Benefits

✅ Teaching grade heads access both portals seamlessly
✅ Non-teaching grade heads get admin tools without teacher clutter
✅ Automatic grade-level filtering on all queries
✅ No code duplication - reuse existing admin pages
✅ Secure - middleware enforces data boundaries
✅ Scalable - easy to add more grade heads

