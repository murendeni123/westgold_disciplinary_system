/**
 * Schema Helper Utilities for Multi-Tenant Routes
 * 
 * Provides helper functions to make it easy for routes to work with
 * the schema context from the request object.
 * 
 * SECURITY: This module implements cross-schema access prevention
 * to ensure users can only access data within their authorized school schemas.
 */

const { dbRun, dbGet, dbAll, dbTransaction, dbQuery, pool } = require('../database/db');

// ============================================================================
// SCHEMA VALIDATION & SECURITY
// ============================================================================

// Valid schema name pattern: school_[alphanumeric_underscore]
const VALID_SCHEMA_PATTERN = /^school_[a-z0-9_]+$/;

// Cache for validated schemas (prevents repeated DB lookups)
const validatedSchemaCache = new Map();
const SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate schema name format (SQL injection prevention)
 * @param {string} schemaName - Schema name to validate
 * @returns {boolean} - True if valid format
 */
const isValidSchemaFormat = (schemaName) => {
    if (!schemaName || typeof schemaName !== 'string') {
        return false;
    }
    // Must match pattern and be reasonable length
    return VALID_SCHEMA_PATTERN.test(schemaName) && schemaName.length <= 63;
};

/**
 * Verify schema exists in database
 * @param {string} schemaName - Schema name to verify
 * @returns {Promise<boolean>} - True if schema exists
 */
const schemaExistsInDb = async (schemaName) => {
    // Check cache first
    const cached = validatedSchemaCache.get(schemaName);
    if (cached && Date.now() - cached.timestamp < SCHEMA_CACHE_TTL) {
        return cached.exists;
    }
    
    try {
        const result = await dbGet(
            `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) as exists`,
            [schemaName]
        );
        const exists = result?.exists || false;
        
        // Cache the result
        validatedSchemaCache.set(schemaName, { exists, timestamp: Date.now() });
        
        return exists;
    } catch (error) {
        console.error('Schema existence check failed:', error.message);
        return false;
    }
};

/**
 * Validate and verify schema name (format + existence)
 * @param {string} schemaName - Schema name to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
const validateSchema = async (schemaName) => {
    if (!schemaName) {
        return { valid: false, error: 'Schema name is required' };
    }
    
    if (!isValidSchemaFormat(schemaName)) {
        console.warn(`SECURITY: Invalid schema format attempted: ${schemaName}`);
        return { valid: false, error: 'Invalid schema name format' };
    }
    
    const exists = await schemaExistsInDb(schemaName);
    if (!exists) {
        console.warn(`SECURITY: Non-existent schema attempted: ${schemaName}`);
        return { valid: false, error: 'Schema does not exist' };
    }
    
    return { valid: true };
};

/**
 * Clear schema from validation cache (call when schema is created/deleted)
 * @param {string} schemaName - Schema name to clear
 */
const clearSchemaValidationCache = (schemaName) => {
    validatedSchemaCache.delete(schemaName);
};

// ============================================================================
// SCHEMA CONTEXT GETTERS
// ============================================================================

/**
 * Get the schema name from the request (with format validation)
 * @param {object} req - Express request object
 * @returns {string|null} - Schema name or null
 */
const getSchema = (req) => {
    let schemaName = null;
    
    // Priority: req.schemaName > req.user.schemaName
    if (req.schemaName && req.schemaName !== 'public') {
        schemaName = req.schemaName;
    } else if (req.user && req.user.schemaName && req.user.schemaName !== 'public') {
        schemaName = req.user.schemaName;
    }
    
    // DEBUG: Log what we found
    console.log(`📋 getSchema called:`, {
        'req.schemaName': req.schemaName,
        'req.user?.schemaName': req.user?.schemaName,
        'extracted': schemaName,
        'req.user exists': !!req.user,
        'req.path': req.path,
        'req.method': req.method
    });
    
    // Validate format before returning (SQL injection prevention)
    if (schemaName && !isValidSchemaFormat(schemaName)) {
        console.error(`SECURITY: Invalid schema format in request: ${schemaName}`);
        return null;
    }
    
    if (!schemaName) {
        console.error(`❌ getSchema returned NULL - no schema context found in request!`);
    }
    
    return schemaName;
};

/**
 * Get validated schema name (async - verifies existence)
 * @param {object} req - Express request object
 * @returns {Promise<string|null>} - Validated schema name or null
 */
const getValidatedSchema = async (req) => {
    const schemaName = getSchema(req);
    if (!schemaName) return null;
    
    const validation = await validateSchema(schemaName);
    return validation.valid ? schemaName : null;
};

/**
 * Get the school ID from the request
 * @param {object} req - Express request object
 * @returns {number|null} - School ID or null
 */
const getSchoolId = (req) => {
    if (req.schoolId) return req.schoolId;
    if (req.user && req.user.schoolId) return req.user.schoolId;
    if (req.user && req.user.primary_school_id) return req.user.primary_school_id;
    return null;
};

/**
 * Execute a query in the school's schema context
 * @param {object} req - Express request object
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<{id: number|null, changes: number}>}
 */
const schemaRun = async (req, sql, params = []) => {
    const schema = getSchema(req);
    return dbRun(sql, params, schema);
};

/**
 * Get a single row from the school's schema
 * @param {object} req - Express request object
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object|null>}
 */
const schemaGet = async (req, sql, params = []) => {
    const schema = getSchema(req);
    return dbGet(sql, params, schema);
};

/**
 * Get all rows from the school's schema
 * @param {object} req - Express request object
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<array>}
 */
const schemaAll = async (req, sql, params = []) => {
    const schema = getSchema(req);
    return dbAll(sql, params, schema);
};

/**
 * Execute a transaction in the school's schema context
 * @param {object} req - Express request object
 * @param {function} callback - Transaction callback
 * @returns {Promise<any>}
 */
const schemaTransaction = async (req, callback) => {
    const schema = getSchema(req);
    return dbTransaction(callback, schema);
};

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Require schema context middleware
 * Returns 400 if no schema context is available
 */
const requireSchema = (req, res, next) => {
    const schema = getSchema(req);
    if (!schema) {
        return res.status(400).json({
            error: 'School context required',
            message: 'This endpoint requires a school context. Please log in with a school account.'
        });
    }
    next();
};

/**
 * SECURITY MIDDLEWARE: Verify user has access to the current schema
 * This prevents cross-schema access attacks
 * Use after authenticateToken middleware
 */
const enforceSchemaAccess = async (req, res, next) => {
    try {
        // Skip for platform admins
        if (req.user && req.user.isPlatformAdmin) {
            return next();
        }
        
        const schema = getSchema(req);
        if (!schema) {
            // No schema context - let other middleware handle this
            return next();
        }
        
        // Validate schema format (SQL injection prevention)
        if (!isValidSchemaFormat(schema)) {
            console.error(`SECURITY VIOLATION: Invalid schema format: ${schema}, User: ${req.user?.id}, IP: ${req.ip}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Invalid school context'
            });
        }
        
        // Verify schema exists
        const exists = await schemaExistsInDb(schema);
        if (!exists) {
            console.error(`SECURITY VIOLATION: Non-existent schema: ${schema}, User: ${req.user?.id}, IP: ${req.ip}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'School not found'
            });
        }
        
        // Verify user has access to this school
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

/**
 * SECURITY MIDDLEWARE: Strict schema enforcement
 * Combines requireSchema + enforceSchemaAccess
 * Use for routes that absolutely require valid school context
 */
const requireSecureSchema = async (req, res, next) => {
    const schema = getSchema(req);
    if (!schema) {
        return res.status(403).json({
            error: 'School context required',
            message: 'This endpoint requires a valid school context.'
        });
    }
    
    // Run access enforcement
    return enforceSchemaAccess(req, res, next);
};

// ============================================================================
// ACCESS VALIDATION
// ============================================================================

/**
 * Validate that user has access to the requested school
 * @param {object} req - Express request object
 * @param {number} schoolId - School ID to check
 * @returns {Promise<boolean>}
 */
const validateSchoolAccess = async (req, schoolId) => {
    if (!req.user) return false;
    
    // Platform admins have access to all schools
    if (req.user.isPlatformAdmin) return true;
    
    // Check if user's current school matches
    if (req.schoolId === schoolId) return true;
    if (req.user.schoolId === schoolId) return true;
    if (req.user.primary_school_id === schoolId) return true;
    
    // Check user_schools table
    const access = await dbGet(
        'SELECT id FROM public.user_schools WHERE user_id = $1 AND school_id = $2',
        [req.user.id, schoolId]
    );
    
    return !!access;
};

/**
 * Validate user can access a specific student
 * @param {object} req - Express request object
 * @param {number} studentId - Student ID to check
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const validateStudentAccess = async (req, studentId) => {
    if (!req.user) return { allowed: false, reason: 'Not authenticated' };
    
    const schema = getSchema(req);
    if (!schema) return { allowed: false, reason: 'No school context' };
    
    // Admins and platform admins can access all students in their school
    if (req.user.isPlatformAdmin || req.user.role === 'admin') {
        return { allowed: true };
    }
    
    // Teachers can access students in their classes
    if (req.user.role === 'teacher') {
        const teacherAccess = await dbGet(`
            SELECT 1 FROM students s
            INNER JOIN classes c ON s.class_id = c.id
            INNER JOIN teachers t ON c.teacher_id = t.id
            WHERE s.id = $1 AND t.user_id = $2
        `, [studentId, req.user.id], schema);
        
        if (teacherAccess) return { allowed: true };
        
        // Also check if teacher is assigned to any class the student is in
        const classAccess = await dbGet(`
            SELECT 1 FROM students s
            INNER JOIN class_students cs ON s.id = cs.student_id
            INNER JOIN classes c ON cs.class_id = c.id
            INNER JOIN teachers t ON c.teacher_id = t.id
            WHERE s.id = $1 AND t.user_id = $2
        `, [studentId, req.user.id], schema);
        
        if (classAccess) return { allowed: true };
        
        return { allowed: false, reason: 'Student not in your classes' };
    }
    
    // Parents can only access their own children
    if (req.user.role === 'parent') {
        const parentAccess = await dbGet(
            'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
            [studentId, req.user.id],
            schema
        );
        
        if (parentAccess) return { allowed: true };
        return { allowed: false, reason: 'Not your child' };
    }
    
    return { allowed: false, reason: 'Insufficient permissions' };
};

/**
 * Validate user can access a specific class
 * @param {object} req - Express request object
 * @param {number} classId - Class ID to check
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const validateClassAccess = async (req, classId) => {
    if (!req.user) return { allowed: false, reason: 'Not authenticated' };
    
    const schema = getSchema(req);
    if (!schema) return { allowed: false, reason: 'No school context' };
    
    // Admins can access all classes
    if (req.user.isPlatformAdmin || req.user.role === 'admin') {
        return { allowed: true };
    }
    
    // Teachers can access their own classes
    if (req.user.role === 'teacher') {
        const teacherAccess = await dbGet(`
            SELECT 1 FROM classes c
            INNER JOIN teachers t ON c.teacher_id = t.id
            WHERE c.id = $1 AND t.user_id = $2
        `, [classId, req.user.id], schema);
        
        if (teacherAccess) return { allowed: true };
        return { allowed: false, reason: 'Not your class' };
    }
    
    // Parents can access classes their children are in
    if (req.user.role === 'parent') {
        const parentAccess = await dbGet(`
            SELECT 1 FROM classes c
            INNER JOIN students s ON s.class_id = c.id
            WHERE c.id = $1 AND s.parent_id = $2
        `, [classId, req.user.id], schema);
        
        if (parentAccess) return { allowed: true };
        return { allowed: false, reason: 'No children in this class' };
    }
    
    return { allowed: false, reason: 'Insufficient permissions' };
};

/**
 * Get user's teacher record from current school schema
 * @param {object} req - Express request object
 * @returns {Promise<object|null>}
 */
const getTeacherRecord = async (req) => {
    if (!req.user || !getSchema(req)) return null;
    return schemaGet(req, 'SELECT * FROM teachers WHERE user_id = $1', [req.user.id]);
};

/**
 * Get user's parent record from current school schema
 * @param {object} req - Express request object
 * @returns {Promise<object|null>}
 */
const getParentRecord = async (req) => {
    if (!req.user || !getSchema(req)) return null;
    return schemaGet(req, 'SELECT * FROM parents WHERE user_id = $1', [req.user.id]);
};

/**
 * Get parent's children from current school schema
 * @param {object} req - Express request object
 * @returns {Promise<array>}
 */
const getParentChildren = async (req) => {
    if (!req.user || !getSchema(req)) return [];
    return schemaAll(req, `
        SELECT s.*, c.class_name 
        FROM students s 
        LEFT JOIN classes c ON s.class_id = c.id 
        WHERE s.parent_id = $1 AND s.is_active = true
    `, [req.user.id]);
};

/**
 * Log an action to the school's audit log
 * @param {object} req - Express request object
 * @param {string} action - Action type
 * @param {string} entityType - Entity type (student, incident, etc.)
 * @param {number} entityId - Entity ID
 * @param {object} oldValues - Previous values (for updates)
 * @param {object} newValues - New values
 */
const logAudit = async (req, action, entityType, entityId, oldValues = null, newValues = null) => {
    const schema = getSchema(req);
    if (!schema) return;
    
    try {
        await dbRun(`
            INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            req.user?.id,
            action,
            entityType,
            entityId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            req.ip
        ], schema);
    } catch (error) {
        console.error('Audit log error:', error.message);
    }
};

/**
 * Generate a unique parent link code for a student
 * @param {string} schoolCode - School code
 * @param {string} studentName - Student's first name
 * @returns {string} - Link code
 */
const generateLinkCode = (schoolCode, studentName) => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const namePrefix = studentName.substring(0, 3).toUpperCase();
    return `${schoolCode}-${namePrefix}-${random}`;
};

/**
 * Check if user is admin or teacher
 * @param {object} req - Express request object
 * @returns {boolean}
 */
const isStaff = (req) => {
    if (!req.user) return false;
    return ['admin', 'teacher', 'platform_admin'].includes(req.user.role);
};

/**
 * Check if user is admin
 * @param {object} req - Express request object
 * @returns {boolean}
 */
const isAdmin = (req) => {
    if (!req.user) return false;
    return ['admin', 'platform_admin'].includes(req.user.role);
};

module.exports = {
    // Schema validation (security)
    isValidSchemaFormat,
    validateSchema,
    schemaExistsInDb,
    clearSchemaValidationCache,
    
    // Schema getters
    getSchema,
    getValidatedSchema,
    getSchoolId,
    
    // Schema-aware database operations
    schemaRun,
    schemaGet,
    schemaAll,
    schemaTransaction,
    
    // Security middleware
    requireSchema,
    enforceSchemaAccess,
    requireSecureSchema,
    
    // Access validation
    validateSchoolAccess,
    validateStudentAccess,
    validateClassAccess,
    
    // User helpers
    getTeacherRecord,
    getParentRecord,
    getParentChildren,
    isStaff,
    isAdmin,
    
    // Utilities
    logAudit,
    generateLinkCode
};
