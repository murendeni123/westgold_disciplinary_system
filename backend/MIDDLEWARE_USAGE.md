# Middleware Usage Guide

## Schema Context & Security Middleware

This document explains how to properly use middleware to ensure schema context is set before any DB queries.

---

## Middleware Execution Order

**CRITICAL:** Middleware must be applied in this exact order:

```javascript
const { authenticateToken } = require('./middleware/auth');
const { requireSchoolContext } = require('./middleware/requireSchoolContext');
const { enforceSchemaAccess } = require('./utils/schemaHelper');

// 1. Authentication (sets req.user, req.schemaName, req.schoolId)
router.use(authenticateToken);

// 2. School context validation (ensures schema is set)
router.use(requireSchoolContext);

// 3. Schema access enforcement (validates schema exists and user has access)
router.use(enforceSchemaAccess);

// 4. Your route handlers
router.get('/students', async (req, res) => {
    // req.schemaName and req.schoolId are guaranteed to be set here
    const students = await schemaAll(req, 'SELECT * FROM students');
    res.json(students);
});
```

---

## Available Middleware

### 1. `authenticateToken` (from `middleware/auth.js`)

**Purpose:** Validates JWT token and sets user context

**Sets:**
- `req.user` - User object with role, email, etc.
- `req.schemaName` - School schema name from token or DB
- `req.schoolId` - School ID from token or DB

**When to use:** ALL protected routes (always first)

**Example:**
```javascript
router.use(authenticateToken);
```

---

### 2. `requireSchoolContext` (from `middleware/requireSchoolContext.js`)

**Purpose:** Ensures school context is set before any DB queries

**Validates:**
- `req.schemaName` exists
- `req.schoolId` exists
- Returns 403 if either is missing

**When to use:** Routes that REQUIRE school context (students, classes, behaviour, etc.)

**Example:**
```javascript
const { requireSchoolContext } = require('../middleware/requireSchoolContext');

router.use(authenticateToken);
router.use(requireSchoolContext); // Ensures school context is set

router.get('/students', async (req, res) => {
    // Safe to query - schema is guaranteed to be set
    const students = await schemaAll(req, 'SELECT * FROM students');
    res.json(students);
});
```

---

### 3. `optionalSchoolContext` (from `middleware/requireSchoolContext.js`)

**Purpose:** Sets school context if available, but doesn't fail if missing

**When to use:** Routes that can work with OR without school context

**Example:**
```javascript
const { optionalSchoolContext } = require('../middleware/requireSchoolContext');

router.use(authenticateToken);
router.use(optionalSchoolContext); // Sets context if available

router.get('/profile', async (req, res) => {
    // May or may not have school context
    if (req.hasSchoolContext) {
        // Query school-specific data
    } else {
        // Return user-only data
    }
});
```

---

### 4. `enforceSchemaAccess` (from `utils/schemaHelper.js`)

**Purpose:** Validates schema exists and user has access

**Validates:**
- Schema name format (SQL injection prevention)
- Schema exists in database
- User has access to the school

**When to use:** High-security routes (optional, adds extra validation)

**Example:**
```javascript
const { enforceSchemaAccess } = require('../utils/schemaHelper');

router.use(authenticateToken);
router.use(requireSchoolContext);
router.use(enforceSchemaAccess); // Extra security validation

router.delete('/students/:id', async (req, res) => {
    // Highly secure - schema validated and access confirmed
});
```

---

## Route Patterns

### Pattern 1: Standard School Route (Most Common)

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireSchoolContext } = require('../middleware/requireSchoolContext');
const { schemaAll, schemaGet, schemaRun } = require('../utils/schemaHelper');

// Apply middleware to ALL routes in this file
router.use(authenticateToken);
router.use(requireSchoolContext);

router.get('/', async (req, res) => {
    // req.schemaName and req.schoolId are guaranteed to be set
    const data = await schemaAll(req, 'SELECT * FROM table_name');
    res.json(data);
});

module.exports = router;
```

---

### Pattern 2: Mixed Routes (Some Require School, Some Don't)

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireSchoolContext } = require('../middleware/requireSchoolContext');

// Auth required for all routes
router.use(authenticateToken);

// Route that doesn't need school context
router.get('/profile', async (req, res) => {
    res.json({ user: req.user });
});

// Routes that need school context
router.get('/students', requireSchoolContext, async (req, res) => {
    const students = await schemaAll(req, 'SELECT * FROM students');
    res.json(students);
});

module.exports = router;
```

---

### Pattern 3: Platform Admin Routes (No School Context)

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, requirePlatformAdmin } = require('../middleware/auth');

// Only platform admins can access
router.use(authenticateToken);
router.use(requirePlatformAdmin);

router.get('/schools', async (req, res) => {
    // No school context needed - queries public schema
    const schools = await dbAll('SELECT * FROM public.schools');
    res.json(schools);
});

module.exports = router;
```

---

## Security Checklist

Before deploying any route, ensure:

- [ ] `authenticateToken` is applied first
- [ ] `requireSchoolContext` is applied for school-specific routes
- [ ] Never construct SQL queries with string concatenation
- [ ] Always use parameterized queries
- [ ] Use `schemaAll`, `schemaGet`, `schemaRun` helpers (not raw `dbAll`)
- [ ] Validate user input before queries
- [ ] Check `req.hasSchoolContext` before school-specific logic

---

## Common Mistakes to Avoid

### ❌ BAD: No school context validation
```javascript
router.get('/students', authenticateToken, async (req, res) => {
    // req.schemaName might be undefined!
    const students = await schemaAll(req, 'SELECT * FROM students');
});
```

### ✅ GOOD: Proper validation
```javascript
router.get('/students', authenticateToken, requireSchoolContext, async (req, res) => {
    // req.schemaName is guaranteed to be set
    const students = await schemaAll(req, 'SELECT * FROM students');
});
```

---

### ❌ BAD: Wrong middleware order
```javascript
router.use(requireSchoolContext); // Will fail - no user yet
router.use(authenticateToken);
```

### ✅ GOOD: Correct order
```javascript
router.use(authenticateToken); // Sets user first
router.use(requireSchoolContext); // Then validates school context
```

---

## Testing Schema Context

To verify schema context is properly set:

```javascript
router.get('/debug', authenticateToken, requireSchoolContext, (req, res) => {
    res.json({
        hasSchoolContext: req.hasSchoolContext,
        schemaName: req.schemaName,
        schoolId: req.schoolId,
        userId: req.user.id,
        userRole: req.user.role
    });
});
```

---

## Summary

1. **Always use `authenticateToken` first**
2. **Use `requireSchoolContext` for school-specific routes**
3. **Schema context is set in `req.schemaName` and `req.schoolId`**
4. **Use helper functions (`schemaAll`, `schemaGet`, etc.) for queries**
5. **Never skip middleware - it prevents security vulnerabilities**
