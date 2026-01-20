/**
 * Schema Context Middleware for Multi-Tenant Architecture
 * 
 * This middleware handles automatic schema detection and context setting
 * based on subdomain, JWT token, or explicit school selection.
 */

const { dbGet } = require('../database/db');

// Cache for school lookups (reduces database queries)
const schoolCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get school from cache or database
 * @param {string} key - Cache key (subdomain or school_id)
 * @param {string} type - 'subdomain' or 'id'
 * @returns {Promise<object|null>}
 */
const getCachedSchool = async (key, type = 'subdomain') => {
    const cacheKey = `${type}:${key}`;
    const cached = schoolCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.school;
    }
    
    let school = null;
    
    if (type === 'subdomain') {
        school = await dbGet(
            'SELECT id, name, code, subdomain, schema_name, status FROM public.schools WHERE subdomain = $1 AND status = $2',
            [key, 'active']
        );
    } else if (type === 'id') {
        school = await dbGet(
            'SELECT id, name, code, subdomain, schema_name, status FROM public.schools WHERE id = $1',
            [key]
        );
    } else if (type === 'code') {
        school = await dbGet(
            'SELECT id, name, code, subdomain, schema_name, status FROM public.schools WHERE code = $1 AND status = $2',
            [key, 'active']
        );
    }
    
    if (school) {
        schoolCache.set(cacheKey, { school, timestamp: Date.now() });
    }
    
    return school;
};

/**
 * Clear school from cache (call when school is updated)
 * @param {number} schoolId - School ID to clear
 */
const clearSchoolCache = (schoolId) => {
    for (const [key, value] of schoolCache.entries()) {
        if (value.school && value.school.id === schoolId) {
            schoolCache.delete(key);
        }
    }
};

/**
 * Extract subdomain from request host
 * @param {object} req - Express request object
 * @returns {string|null} - Subdomain or null
 */
const extractSubdomain = (req) => {
    const host = req.get('host') || req.hostname || '';
    
    // Handle localhost development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // Check for X-School-Subdomain header (for development)
        const devSubdomain = req.get('X-School-Subdomain');
        if (devSubdomain) {
            return devSubdomain.toLowerCase();
        }
        
        // Check query parameter (for development)
        if (req.query.school_subdomain) {
            return req.query.school_subdomain.toLowerCase();
        }
        
        return null;
    }
    
    // Extract subdomain from host
    const parts = host.split('.');
    
    // Expect format: subdomain.domain.tld or subdomain.domain.co.za
    if (parts.length >= 3) {
        const subdomain = parts[0].toLowerCase();
        
        // Skip common non-school subdomains
        if (['www', 'api', 'admin', 'platform', 'app'].includes(subdomain)) {
            return null;
        }
        
        return subdomain;
    }
    
    return null;
};

/**
 * Middleware: Set schema context from subdomain
 * Use this for subdomain-based multi-tenancy
 */
const setSchemaFromSubdomain = async (req, res, next) => {
    try {
        const subdomain = extractSubdomain(req);
        
        if (!subdomain) {
            // No subdomain - use public schema (platform admin or main site)
            req.schemaName = 'public';
            req.schoolId = null;
            req.school = null;
            return next();
        }
        
        // Look up school by subdomain
        const school = await getCachedSchool(subdomain, 'subdomain');
        
        if (!school) {
            return res.status(404).json({
                error: 'School not found',
                message: `No school found for subdomain: ${subdomain}`
            });
        }
        
        if (school.status !== 'active') {
            return res.status(403).json({
                error: 'School inactive',
                message: 'This school account is currently inactive. Please contact support.'
            });
        }
        
        // Set schema context on request
        req.schemaName = school.schema_name;
        req.schoolId = school.id;
        req.school = school;
        
        next();
    } catch (error) {
        console.error('Schema context error:', error);
        next(error);
    }
};

/**
 * Middleware: Set schema context from JWT token
 * Use this after authentication middleware
 */
const setSchemaFromToken = async (req, res, next) => {
    try {
        // Check if user has schema info in token
        if (req.user && req.user.schemaName) {
            req.schemaName = req.user.schemaName;
            req.schoolId = req.user.schoolId;
            
            // Optionally fetch full school info
            if (req.user.schoolId && !req.school) {
                req.school = await getCachedSchool(req.user.schoolId, 'id');
            }
        }
        
        next();
    } catch (error) {
        console.error('Schema from token error:', error);
        next(error);
    }
};

/**
 * Middleware: Require school context
 * Use this to ensure a school is selected before accessing school-specific routes
 */
const requireSchoolContext = (req, res, next) => {
    if (!req.schemaName || req.schemaName === 'public') {
        return res.status(400).json({
            error: 'School context required',
            message: 'This endpoint requires a school context. Please access via school subdomain or select a school.'
        });
    }
    
    if (!req.schoolId) {
        return res.status(400).json({
            error: 'School not identified',
            message: 'Unable to identify the school for this request.'
        });
    }
    
    next();
};

/**
 * Middleware: Verify user belongs to school
 * Use this to ensure the authenticated user has access to the current school
 */
const verifySchoolAccess = async (req, res, next) => {
    try {
        if (!req.user || !req.schoolId) {
            return next();
        }
        
        // Check if user has access to this school
        const access = await dbGet(
            'SELECT * FROM public.user_schools WHERE user_id = $1 AND school_id = $2',
            [req.user.id, req.schoolId]
        );
        
        if (!access) {
            // Check if user's primary school matches
            const user = await dbGet(
                'SELECT primary_school_id FROM public.users WHERE id = $1',
                [req.user.id]
            );
            
            if (!user || user.primary_school_id !== req.schoolId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have access to this school.'
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('School access verification error:', error);
        next(error);
    }
};

/**
 * Middleware: Platform admin only
 * Allows access only for platform administrators (no school context needed)
 */
const platformAdminOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if user is a platform admin
        const platformUser = await dbGet(
            'SELECT * FROM public.platform_users WHERE id = $1 AND is_active = true',
            [req.user.platformUserId]
        );
        
        if (!platformUser) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'This endpoint is restricted to platform administrators.'
            });
        }
        
        req.platformUser = platformUser;
        next();
    } catch (error) {
        console.error('Platform admin check error:', error);
        next(error);
    }
};

/**
 * Middleware: Set schema from school code in request body or params
 * Useful for API endpoints that specify school by code
 */
const setSchemaFromCode = async (req, res, next) => {
    try {
        const schoolCode = req.params.schoolCode || req.body.schoolCode || req.query.schoolCode;
        
        if (!schoolCode) {
            return next();
        }
        
        const school = await getCachedSchool(schoolCode, 'code');
        
        if (!school) {
            return res.status(404).json({
                error: 'School not found',
                message: `No school found with code: ${schoolCode}`
            });
        }
        
        req.schemaName = school.schema_name;
        req.schoolId = school.id;
        req.school = school;
        
        next();
    } catch (error) {
        console.error('Schema from code error:', error);
        next(error);
    }
};

/**
 * Helper: Get schema name for a school ID
 * @param {number} schoolId - School ID
 * @returns {Promise<string|null>}
 */
const getSchemaForSchool = async (schoolId) => {
    const school = await getCachedSchool(schoolId, 'id');
    return school ? school.schema_name : null;
};

/**
 * Helper: Attach schema to database query options
 * @param {object} req - Express request object
 * @returns {string|null} - Schema name or null
 */
const getRequestSchema = (req) => {
    return req.schemaName && req.schemaName !== 'public' ? req.schemaName : null;
};

module.exports = {
    // Middleware
    setSchemaFromSubdomain,
    setSchemaFromToken,
    requireSchoolContext,
    verifySchoolAccess,
    platformAdminOnly,
    setSchemaFromCode,
    
    // Helpers
    extractSubdomain,
    getCachedSchool,
    clearSchoolCache,
    getSchemaForSchool,
    getRequestSchema
};
