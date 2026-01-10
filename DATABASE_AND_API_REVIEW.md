# Database and API Review - Westgold Disciplinary System

## Executive Summary

This document outlines critical issues, inconsistencies, and recommended improvements for the database schema and API routes in the Positive Discipline System (PDS).

---

## 🔴 CRITICAL ISSUES

### 1. **Schema Mismatch Between SQLite and PostgreSQL**

**Problem:** Your system has TWO different database schemas that are out of sync:
- `init.sql` (SQLite) - Missing critical tables
- `init_postgres.sql` (PostgreSQL) - Has complete schema

**Missing Tables in SQLite Schema:**
- ❌ `class_students` (many-to-many junction table)
- ❌ `interventions`
- ❌ `intervention_types`
- ❌ `intervention_sessions`
- ❌ `consequences`
- ❌ `student_consequences`
- ❌ `user_schools`
- ❌ `platform_users`
- ❌ `platform_settings`
- ❌ `subscription_plans`
- ❌ `school_subscriptions`
- ❌ `platform_logs`
- ❌ `push_subscriptions`

**Impact:**
- APIs reference tables that don't exist in SQLite
- Code uses `class_students` junction table but SQLite schema uses deprecated `students.class_id`
- Runtime errors when running on SQLite database

**Recommendation:**
```sql
-- Add to init.sql immediately:

-- Class-Student Many-to-Many Junction Table
CREATE TABLE IF NOT EXISTS class_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(class_id, student_id)
);

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    assigned_by INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    school_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Intervention Types table
CREATE TABLE IF NOT EXISTS intervention_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    default_duration INTEGER,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, school_id)
);

-- Intervention Sessions table
CREATE TABLE IF NOT EXISTS intervention_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intervention_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME,
    duration INTEGER,
    facilitator_id INTEGER,
    notes TEXT,
    outcome TEXT,
    next_steps TEXT,
    school_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (facilitator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Consequences table (definitions)
CREATE TABLE IF NOT EXISTS consequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    default_duration TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, school_id)
);

-- Student Consequences table (assignments)
CREATE TABLE IF NOT EXISTS student_consequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    consequence_id INTEGER,
    incident_id INTEGER,
    assigned_by INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    parent_acknowledged INTEGER DEFAULT 0,
    parent_acknowledged_at DATETIME,
    parent_notes TEXT,
    completion_verified INTEGER DEFAULT 0,
    completion_verified_by INTEGER,
    completion_verified_at DATETIME,
    school_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (consequence_id) REFERENCES consequences(id) ON DELETE SET NULL,
    FOREIGN KEY (incident_id) REFERENCES behaviour_incidents(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_school ON interventions(school_id);
CREATE INDEX IF NOT EXISTS idx_student_consequences_student ON student_consequences(student_id);
CREATE INDEX IF NOT EXISTS idx_student_consequences_incident ON student_consequences(incident_id);
```

---

### 2. **Inconsistent Multi-Tenancy Implementation**

**Problem:** `school_id` column is missing from SQLite schema but referenced everywhere in code.

**Tables Missing `school_id` in SQLite:**
- `users`
- `students`
- `classes`
- `teachers`
- `behaviour_incidents`
- `merits`
- `attendance`
- `messages`
- `detention_rules`
- `detentions`
- `detention_assignments`
- `timetables`
- `notifications`
- `incident_types`
- `merit_types`

**Recommendation:**
```sql
-- Add school_id to all tables in init.sql
ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE students ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE classes ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE teachers ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE behaviour_incidents ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE merits ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE attendance ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE messages ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE detention_rules ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE detentions ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE detention_assignments ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE timetables ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE notifications ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE incident_types ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE merit_types ADD COLUMN school_id INTEGER REFERENCES schools(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_school ON behaviour_incidents(school_id);
CREATE INDEX IF NOT EXISTS idx_merits_school ON merits(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_school ON messages(school_id);
CREATE INDEX IF NOT EXISTS idx_detentions_school ON detentions(school_id);
CREATE INDEX IF NOT EXISTS idx_timetables_school ON timetables(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school ON notifications(school_id);
```

---

### 3. **Deprecated `students.class_id` Column**

**Problem:** 
- SQLite schema has `students.class_id` (one-to-many)
- Code uses `class_students` junction table (many-to-many)
- This causes students not to appear in class lists

**Current Broken Query in `classes.js`:**
```javascript
// OLD - doesn't work with class_students table
SELECT s.* FROM students s WHERE s.class_id = ?
```

**Fixed Query (already applied):**
```javascript
// NEW - works with class_students junction table
SELECT s.* 
FROM students s
JOIN class_students cs ON s.id = cs.student_id
WHERE cs.class_id = ?
```

**Recommendation:**
- Remove `class_id` column from `students` table after migrating data to `class_students`
- Or keep it for backward compatibility but always use `class_students` in queries

---

## ⚠️ SECURITY ISSUES

### 1. **Hardcoded JWT Secret**

**Location:** `backend/routes/auth.js:8`
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```

**Problem:** Default secret is exposed in code repository.

**Recommendation:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
```

---

### 2. **Missing School Isolation in Queries**

**Problem:** Many API routes don't filter by `school_id`, allowing cross-school data access.

**Affected Routes:**
- `GET /api/students` - Returns ALL students across all schools
- `GET /api/classes` - Returns ALL classes across all schools
- `GET /api/behaviour` - Returns ALL incidents across all schools
- `GET /api/merits` - Returns ALL merits across all schools
- `GET /api/attendance` - Returns ALL attendance across all schools

**Example Fix for `students.js`:**
```javascript
// BEFORE
router.get('/', authenticateToken, async (req, res) => {
    const students = await dbAll(`
        SELECT s.*, c.class_name, u.name as parent_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON s.parent_id = u.id
        ORDER BY s.last_name, s.first_name
    `);
    res.json(students);
});

// AFTER
router.get('/', authenticateToken, async (req, res) => {
    const schoolId = req.user.school_id;
    const students = await dbAll(`
        SELECT s.*, c.class_name, u.name as parent_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON s.parent_id = u.id
        WHERE s.school_id = ?
        ORDER BY s.last_name, s.first_name
    `, [schoolId]);
    res.json(students);
});
```

**Apply to ALL routes that fetch data.**

---

### 3. **SQL Injection Vulnerabilities**

**Problem:** Some routes build dynamic SQL without proper parameterization.

**Example in `behaviour.js`:**
```javascript
// VULNERABLE - string concatenation
let query = `SELECT * FROM behaviour_incidents WHERE 1=1`;
if (student_id) {
    query += ' AND student_id = ' + student_id; // ❌ DANGEROUS
}
```

**Current code uses parameterized queries (✅ GOOD):**
```javascript
if (student_id) {
    query += ' AND bi.student_id = ?';
    params.push(student_id);
}
```

**Recommendation:** Continue using parameterized queries everywhere. Never concatenate user input into SQL.

---

### 4. **Missing Input Validation**

**Problem:** Many routes don't validate input types or ranges.

**Example Issues:**
- No email format validation
- No phone number format validation
- No date range validation
- No enum validation before database insert

**Recommendation:**
```javascript
// Add validation middleware
const { body, param, query, validationResult } = require('express-validator');

router.post('/students', 
    authenticateToken,
    requireRole('admin'),
    [
        body('email').isEmail().normalizeEmail(),
        body('first_name').trim().isLength({ min: 1, max: 100 }),
        body('last_name').trim().isLength({ min: 1, max: 100 }),
        body('date_of_birth').optional().isISO8601(),
        body('grade_level').optional().isIn(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // ... rest of handler
    }
);
```

---

## 🔧 API IMPROVEMENTS

### 1. **Inconsistent Error Responses**

**Problem:** Error responses vary across routes.

**Examples:**
```javascript
// Route 1
res.status(400).json({ error: 'Student ID required' });

// Route 2
res.status(400).json({ message: 'Student ID required' });

// Route 3
res.status(400).json({ errors: ['Student ID required'] });
```

**Recommendation:** Standardize error format:
```javascript
// Standard error response format
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Student ID is required",
        "field": "student_id"
    }
}

// Standard success response format
{
    "success": true,
    "data": { ... }
}
```

---

### 2. **Missing Pagination**

**Problem:** Routes like `GET /api/students` return ALL records without pagination.

**Impact:** Performance issues with large datasets (1000+ students).

**Recommendation:**
```javascript
router.get('/', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const schoolId = req.user.school_id;

    const students = await dbAll(`
        SELECT s.*, c.class_name, u.name as parent_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON s.parent_id = u.id
        WHERE s.school_id = ?
        ORDER BY s.last_name, s.first_name
        LIMIT ? OFFSET ?
    `, [schoolId, limit, offset]);

    const total = await dbGet(
        'SELECT COUNT(*) as count FROM students WHERE school_id = ?',
        [schoolId]
    );

    res.json({
        success: true,
        data: students,
        pagination: {
            page,
            limit,
            total: total.count,
            totalPages: Math.ceil(total.count / limit)
        }
    });
});
```

---

### 3. **No Rate Limiting**

**Problem:** No protection against brute force attacks or API abuse.

**Recommendation:**
```javascript
const rateLimit = require('express-rate-limit');

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later'
});

router.post('/login', loginLimiter, async (req, res) => {
    // ... login logic
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100 // 100 requests per 15 minutes
});

app.use('/api/', apiLimiter);
```

---

### 4. **Missing Transaction Support**

**Problem:** Complex operations aren't wrapped in transactions.

**Example:** Creating a student with parent link should be atomic.

**Recommendation:**
```javascript
// Add transaction support to db.js
const beginTransaction = async () => {
    await dbRun('BEGIN TRANSACTION');
};

const commit = async () => {
    await dbRun('COMMIT');
};

const rollback = async () => {
    await dbRun('ROLLBACK');
};

// Use in routes
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await beginTransaction();
        
        // Create student
        const studentResult = await dbRun(
            'INSERT INTO students (...) VALUES (...)',
            [...]
        );
        
        // Create class_students entry
        await dbRun(
            'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)',
            [class_id, studentResult.id]
        );
        
        await commit();
        res.status(201).json({ success: true, data: student });
    } catch (error) {
        await rollback();
        res.status(500).json({ error: 'Failed to create student' });
    }
});
```

---

## 📊 DATABASE IMPROVEMENTS

### 1. **Missing Indexes**

**Problem:** Queries on frequently filtered columns lack indexes.

**Recommendation:**
```sql
-- Add these indexes to init.sql

-- Email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Student lookups by student_id
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- Behaviour incidents by status (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_behaviour_status ON behaviour_incidents(status);

-- Merits by date (for reports)
CREATE INDEX IF NOT EXISTS idx_merits_date ON merits(merit_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_behaviour_student_date ON behaviour_incidents(student_id, incident_date);

-- Parent link code lookups
CREATE INDEX IF NOT EXISTS idx_students_link_code ON students(parent_link_code);
```

---

### 2. **Missing Constraints**

**Problem:** Data integrity not enforced at database level.

**Recommendation:**
```sql
-- Add CHECK constraints
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email LIKE '%_@_%._%');

ALTER TABLE students ADD CONSTRAINT check_grade_level 
    CHECK (grade_level IN ('1','2','3','4','5','6','7','8','9','10','11','12') OR grade_level IS NULL);

-- Add NOT NULL constraints where appropriate
ALTER TABLE behaviour_incidents ALTER COLUMN incident_date SET NOT NULL;
ALTER TABLE merits ALTER COLUMN merit_date SET NOT NULL;
ALTER TABLE attendance ALTER COLUMN attendance_date SET NOT NULL;
```

---

### 3. **No Soft Deletes**

**Problem:** Deleting records permanently loses historical data.

**Recommendation:**
```sql
-- Add deleted_at column to important tables
ALTER TABLE students ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE behaviour_incidents ADD COLUMN deleted_at DATETIME DEFAULT NULL;
ALTER TABLE merits ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_deleted ON students(deleted_at);

-- Update queries to filter out soft-deleted records
SELECT * FROM students WHERE deleted_at IS NULL;

-- Soft delete instead of hard delete
UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?;
```

---

### 4. **Missing Audit Trail**

**Problem:** No tracking of who modified records and when.

**Recommendation:**
```sql
-- Add audit columns to all tables
ALTER TABLE students ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE students ADD COLUMN updated_by INTEGER REFERENCES users(id);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
```

---

## 🚀 PERFORMANCE IMPROVEMENTS

### 1. **N+1 Query Problems**

**Problem:** Routes fetch related data in loops.

**Example in `classes.js`:**
```javascript
// BAD - N+1 queries
const classes = await dbAll('SELECT * FROM classes');
for (const cls of classes) {
    cls.students = await dbAll('SELECT * FROM students WHERE class_id = ?', [cls.id]);
}
```

**Recommendation:**
```javascript
// GOOD - Single query with JOIN
const classes = await dbAll(`
    SELECT 
        c.*,
        COUNT(cs.student_id) as student_count
    FROM classes c
    LEFT JOIN class_students cs ON c.id = cs.class_id
    GROUP BY c.id
`);
```

---

### 2. **Missing Database Connection Pooling**

**Problem:** Each request creates a new database connection.

**Recommendation:**
```javascript
// In db.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let db;

const initDatabase = async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });
    
    // Enable WAL mode for better concurrency
    await db.run('PRAGMA journal_mode = WAL');
    await db.run('PRAGMA foreign_keys = ON');
    
    return db;
};

module.exports = { initDatabase, getDb: () => db };
```

---

### 3. **No Caching**

**Problem:** Frequently accessed data (school customizations, incident types) queried repeatedly.

**Recommendation:**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

router.get('/customizations/:schoolId', async (req, res) => {
    const cacheKey = `customizations_${req.params.schoolId}`;
    
    // Check cache first
    let customizations = cache.get(cacheKey);
    
    if (!customizations) {
        // Cache miss - fetch from database
        customizations = await dbGet(
            'SELECT * FROM school_customizations WHERE school_id = ?',
            [req.params.schoolId]
        );
        cache.set(cacheKey, customizations);
    }
    
    res.json(customizations);
});

// Invalidate cache on update
router.put('/customizations/:schoolId', async (req, res) => {
    // ... update logic
    cache.del(`customizations_${req.params.schoolId}`);
    res.json({ success: true });
});
```

---

## 📝 CODE QUALITY IMPROVEMENTS

### 1. **Inconsistent Error Handling**

**Problem:** Some routes have try-catch, others don't. Error messages vary.

**Recommendation:**
```javascript
// Create error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message
            }
        });
    }
    
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        }
    });
});

// Use in routes
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
    const students = await dbAll('SELECT * FROM students');
    res.json({ success: true, data: students });
}));
```

---

### 2. **No API Versioning**

**Problem:** Breaking changes will affect all clients.

**Recommendation:**
```javascript
// app.js
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/classes', classesRoutes);
app.use('/api/v1/behaviour', behaviourRoutes);

// When making breaking changes, create v2
app.use('/api/v2/students', studentsRoutesV2);
```

---

### 3. **Missing Request Logging**

**Problem:** No audit trail of API requests.

**Recommendation:**
```javascript
const morgan = require('morgan');

// Log all requests
app.use(morgan('combined', {
    stream: fs.createWriteStream('./logs/access.log', { flags: 'a' })
}));

// Custom logging for sensitive operations
const logSensitiveAction = async (userId, action, details) => {
    await dbRun(
        'INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)',
        [userId, action, JSON.stringify(details)]
    );
};

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    await logSensitiveAction(req.user.id, 'DELETE_STUDENT', { studentId: req.params.id });
    // ... delete logic
});
```

---

## 🎯 PRIORITY ACTION ITEMS

### Immediate (Critical - Do First)
1. ✅ **Sync SQLite schema with PostgreSQL** - Add missing tables
2. ✅ **Add `school_id` to all tables** - Enable multi-tenancy
3. ✅ **Fix student-class relationship** - Use `class_students` junction table
4. ✅ **Add school isolation to ALL queries** - Prevent cross-school data leaks
5. ✅ **Change JWT_SECRET to required env variable** - Security

### Short Term (High Priority)
6. Add input validation middleware
7. Implement pagination on list endpoints
8. Add rate limiting
9. Standardize error responses
10. Add missing indexes

### Medium Term
11. Implement soft deletes
12. Add audit logging
13. Add caching layer
14. Fix N+1 query problems
15. Add transaction support

### Long Term
16. API versioning
17. Comprehensive request logging
18. Performance monitoring
19. Database backup automation
20. Migration system for schema changes

---

## 📋 MIGRATION SCRIPT

Here's a migration script to fix the critical issues:

```sql
-- migration_001_sync_schemas.sql

-- 1. Add school_id to tables missing it
ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE students ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE classes ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE teachers ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE behaviour_incidents ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE merits ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE attendance ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE messages ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE detention_rules ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE detentions ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE detention_assignments ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE timetables ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE notifications ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE incident_types ADD COLUMN school_id INTEGER REFERENCES schools(id);
ALTER TABLE merit_types ADD COLUMN school_id INTEGER REFERENCES schools(id);

-- 2. Create class_students junction table
CREATE TABLE IF NOT EXISTS class_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(class_id, student_id)
);

-- 3. Migrate existing student-class relationships
INSERT INTO class_students (class_id, student_id)
SELECT class_id, id FROM students WHERE class_id IS NOT NULL;

-- 4. Create missing tables (interventions, consequences, etc.)
-- [Include all CREATE TABLE statements from above]

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);
-- [Include all other indexes from above]
```

---

## 🔍 TESTING RECOMMENDATIONS

1. **Add Integration Tests**
   - Test multi-tenancy isolation
   - Test student-class relationships
   - Test authentication and authorization

2. **Add Unit Tests**
   - Test input validation
   - Test error handling
   - Test business logic

3. **Add Load Tests**
   - Test with 1000+ students
   - Test concurrent requests
   - Test database performance

---

## 📞 NEXT STEPS

1. Review this document with your team
2. Prioritize fixes based on your deployment timeline
3. Create a migration plan for production database
4. Test migrations on a copy of production data
5. Implement fixes incrementally
6. Add monitoring to track improvements

---

**Document Version:** 1.0  
**Date:** January 8, 2026  
**Reviewed By:** AI Code Reviewer
