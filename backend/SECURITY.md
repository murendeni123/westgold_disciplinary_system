# Security Implementation Guide

## Cross-Schema Access Prevention

This document outlines the security measures implemented to prevent cross-schema access attacks in the multi-tenant architecture.

---

## Overview

The system uses a **schema-per-school** approach where each school's data is isolated in its own PostgreSQL schema. This provides strong data isolation, but requires careful security measures to prevent unauthorized cross-schema access.

---

## Security Layers

### 1. Schema Name Validation (SQL Injection Prevention)

**Location**: `/backend/utils/schemaHelper.js`

**Purpose**: Prevent SQL injection attacks through malicious schema names.

**Implementation**:
```javascript
// Valid schema pattern: school_[alphanumeric_underscore]
const VALID_SCHEMA_PATTERN = /^school_[a-z0-9_]+$/;

// Validates format and length (max 63 chars)
const isValidSchemaFormat = (schemaName) => {
    if (!schemaName || typeof schemaName !== 'string') return false;
    return VALID_SCHEMA_PATTERN.test(schemaName) && schemaName.length <= 63;
};
```

**Protection Against**:
- SQL injection via schema names (e.g., `school_test; DROP TABLE students--`)
- Invalid characters in schema names
- Excessively long schema names

---

### 2. Schema Existence Verification

**Location**: `/backend/utils/schemaHelper.js`

**Purpose**: Verify schema exists in database before allowing access.

**Implementation**:
```javascript
const schemaExistsInDb = async (schemaName) => {
    // Check cache first (5-minute TTL)
    const cached = validatedSchemaCache.get(schemaName);
    if (cached && Date.now() - cached.timestamp < SCHEMA_CACHE_TTL) {
        return cached.exists;
    }
    
    // Query database
    const result = await dbGet(
        `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1)`,
        [schemaName]
    );
    
    // Cache result
    validatedSchemaCache.set(schemaName, { exists: result?.exists, timestamp: Date.now() });
    return result?.exists || false;
};
```

**Protection Against**:
- Access to non-existent schemas
- Schema enumeration attacks
- Performance issues (via caching)

---

### 3. User-School Access Verification

**Location**: `/backend/utils/schemaHelper.js`

**Purpose**: Verify authenticated user has permission to access the requested school.

**Implementation**:
```javascript
const validateSchoolAccess = async (req, schoolId) => {
    if (!req.user) return false;
    
    // Platform admins have access to all schools
    if (req.user.isPlatformAdmin) return true;
    
    // Check if user's current school matches
    if (req.schoolId === schoolId) return true;
    if (req.user.schoolId === schoolId) return true;
    if (req.user.primary_school_id === schoolId) return true;
    
    // Check user_schools table for multi-school access
    const access = await dbGet(
        'SELECT id FROM public.user_schools WHERE user_id = $1 AND school_id = $2',
        [req.user.id, schoolId]
    );
    
    return !!access;
};
```

**Protection Against**:
- Cross-school data access
- Unauthorized schema switching
- Token manipulation attacks

---

### 4. Schema Access Enforcement Middleware

**Location**: `/backend/utils/schemaHelper.js`

**Purpose**: Comprehensive middleware that enforces all security checks.

**Implementation**:
```javascript
const enforceSchemaAccess = async (req, res, next) => {
    try {
        // Skip for platform admins
        if (req.user && req.user.isPlatformAdmin) {
            return next();
        }
        
        const schema = getSchema(req);
        if (!schema) {
            return next(); // Let other middleware handle missing schema
        }
        
        // 1. Validate schema format (SQL injection prevention)
        if (!isValidSchemaFormat(schema)) {
            console.error(`SECURITY VIOLATION: Invalid schema format: ${schema}, User: ${req.user?.id}, IP: ${req.ip}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Invalid school context'
            });
        }
        
        // 2. Verify schema exists
        const exists = await schemaExistsInDb(schema);
        if (!exists) {
            console.error(`SECURITY VIOLATION: Non-existent schema: ${schema}, User: ${req.user?.id}, IP: ${req.ip}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'School not found'
            });
        }
        
        // 3. Verify user has access to this school
        if (req.user && req.schoolId) {
            const hasAccess = await validateSchoolAccess(req, req.schoolId);
            if (!hasAccess) {
                console.error(`SECURITY VIOLATION: Unauthorized schema access: ${schema}, User: ${req.user.id}, IP: ${req.ip}`);
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have access to this school'
                });
            }
        }
        
        // Mark request as verified
        req.schemaVerified = true;
        next();
    } catch (error) {
        console.error('Schema access verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
```

**Applied To**: All school-specific routes in `/backend/server.js`

**Protection Against**:
- All cross-schema access attempts
- SQL injection via schema names
- Token manipulation
- Unauthorized access

---

### 5. Entity-Level Access Control

**Location**: `/backend/utils/schemaHelper.js`

**Purpose**: Fine-grained access control for specific entities (students, classes).

**Functions**:

#### Student Access Validation
```javascript
const validateStudentAccess = async (req, studentId) => {
    // Admins: Full access to all students in their school
    // Teachers: Access to students in their classes
    // Parents: Access only to their own children
};
```

#### Class Access Validation
```javascript
const validateClassAccess = async (req, classId) => {
    // Admins: Full access to all classes
    // Teachers: Access to their own classes
    // Parents: Access to classes their children are in
};
```

**Usage Example**:
```javascript
router.get('/students/:id', authenticateToken, async (req, res) => {
    const access = await validateStudentAccess(req, req.params.id);
    if (!access.allowed) {
        return res.status(403).json({ error: access.reason });
    }
    // Proceed with request...
});
```

---

## Security Flow

### Request Flow with Security Checks

```
1. Client Request
   ↓
2. authenticateToken (verify JWT)
   ↓
3. setSchemaFromToken (extract schema from JWT)
   ↓
4. enforceSchemaAccess (SECURITY CHECKPOINT)
   ├─ Validate schema format
   ├─ Verify schema exists
   └─ Verify user has access
   ↓
5. Route Handler
   ├─ Use schemaAll/schemaGet/schemaRun (auto-applies schema)
   └─ Optional: validateStudentAccess/validateClassAccess
   ↓
6. Response
```

---

## Security Logging

All security violations are logged with:
- Schema name attempted
- User ID
- IP address
- Timestamp
- Violation type

**Example Log**:
```
SECURITY VIOLATION: Unauthorized schema access: school_abc123, User: 42, IP: 192.168.1.100
```

---

## Best Practices for Developers

### 1. Always Use Schema-Aware Functions

✅ **CORRECT**:
```javascript
const students = await schemaAll(req, 'SELECT * FROM students');
```

❌ **INCORRECT**:
```javascript
const students = await dbAll('SELECT * FROM students', [], req.schemaName);
```

### 2. Never Construct Schema Names Manually

✅ **CORRECT**:
```javascript
const schema = getSchema(req);
```

❌ **INCORRECT**:
```javascript
const schema = `school_${req.params.schoolCode}`;
```

### 3. Apply Security Middleware to All School Routes

✅ **CORRECT**:
```javascript
app.use('/api/students', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/students'));
```

❌ **INCORRECT**:
```javascript
app.use('/api/students', require('./routes/students'));
```

### 4. Validate Entity Access for Sensitive Operations

✅ **CORRECT**:
```javascript
router.delete('/students/:id', async (req, res) => {
    const access = await validateStudentAccess(req, req.params.id);
    if (!access.allowed) {
        return res.status(403).json({ error: access.reason });
    }
    // Proceed with deletion
});
```

### 5. Use Parameterized Queries

✅ **CORRECT**:
```javascript
await schemaGet(req, 'SELECT * FROM students WHERE id = $1', [studentId]);
```

❌ **INCORRECT**:
```javascript
await schemaGet(req, `SELECT * FROM students WHERE id = ${studentId}`);
```

---

## Testing Security

### Manual Testing

1. **Test Invalid Schema Format**:
```bash
# Attempt SQL injection via schema name
curl -H "Authorization: Bearer <token_with_malicious_schema>" \
  http://localhost:5000/api/students
# Expected: 403 Forbidden
```

2. **Test Cross-School Access**:
```bash
# User from School A tries to access School B's data
# Login as School A user, modify JWT to School B's schema
curl -H "Authorization: Bearer <modified_token>" \
  http://localhost:5000/api/students
# Expected: 403 Forbidden
```

3. **Test Non-Existent Schema**:
```bash
# Attempt to access non-existent schema
curl -H "Authorization: Bearer <token_with_fake_schema>" \
  http://localhost:5000/api/students
# Expected: 403 Forbidden
```

---

## Security Checklist

- [x] Schema name validation (SQL injection prevention)
- [x] Schema existence verification
- [x] User-school access verification
- [x] Middleware applied to all school routes
- [x] Entity-level access control (students, classes)
- [x] Security violation logging
- [x] Parameterized queries throughout codebase
- [ ] Rate limiting on authentication endpoints (TODO)
- [ ] JWT secret validation on startup (TODO)
- [ ] Input sanitization middleware (TODO)
- [ ] CORS configuration for production (TODO)
- [ ] Database SSL/TLS configuration (TODO)

---

## Incident Response

If a security violation is detected:

1. **Immediate**: Request is blocked with 403 Forbidden
2. **Logging**: Violation logged with user ID, IP, and details
3. **Monitoring**: Check logs for patterns of attacks
4. **Investigation**: Review user account for compromise
5. **Action**: Suspend account if necessary, rotate JWT secret if tokens compromised

---

## Additional Security Measures Recommended

1. **Rate Limiting**: Implement on `/api/auth/*` endpoints
2. **JWT Secret**: Validate on startup, fail if using default
3. **Input Validation**: Add express-validator middleware
4. **CORS**: Restrict to specific origins in production
5. **Database SSL**: Enable for production connections
6. **Audit Logging**: Log all sensitive operations
7. **Password Policy**: Strengthen requirements
8. **Token Refresh**: Implement refresh token mechanism

---

## Contact

For security concerns or to report vulnerabilities, contact the development team immediately.

**Last Updated**: January 17, 2026
