/**
 * Authentication Middleware for Multi-Tenant Architecture
 * 
 * Handles JWT verification and sets user + schema context on requests.
 * 
 * SECURITY: JWT secret is validated on server startup to ensure production security
 */

const jwt = require('jsonwebtoken');
const { dbGet } = require('../database/db');
const { getCachedSchool } = require('./schemaContext');
const { getValidatedJwtSecret } = require('../utils/jwtSecretValidator');

// Get validated JWT secret (will throw error if invalid in production)
const JWT_SECRET = getValidatedJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token with schema context
 * @param {object} user - User object from database
 * @param {object} school - School object (optional)
 * @returns {string} - JWT token
 */
const generateToken = (user, school = null) => {
    const payload = {
        version: 2, // Token version for migration tracking
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    };
    
    // School context is REQUIRED for v2 tokens
    if (school) {
        payload.schoolId = school.id;
        payload.schoolCode = school.code || school.school_code;
        payload.schemaName = school.schema_name;
    } else if (user.primary_school_id) {
        // If school object not provided, schoolId must be present
        payload.schoolId = user.primary_school_id;
        // Note: schemaName should be fetched and provided via school object
        // This fallback exists for backward compatibility during migration
    }
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate a platform admin token
 * @param {object} platformUser - Platform user object
 * @returns {string} - JWT token
 */
const generatePlatformToken = (platformUser) => {
    return jwt.sign({
        platformUserId: platformUser.id,
        email: platformUser.email,
        role: 'platform_admin',
        name: platformUser.name,
        isPlatformAdmin: true
    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Middleware: Authenticate JWT token and set user context
 */
const authenticateToken = async (req, res, next) => {
    console.log('🚀 authenticateToken CALLED for:', req.method, req.path);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔑 Token check:', {
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        path: req.path
    });

    if (!token) {
        console.log('❌ No token found, returning 401');
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token decoded:', {
            userId: decoded.userId,
            role: decoded.role,
            hasSchemaName: !!decoded.schemaName,
            schemaName: decoded.schemaName
        });
        
        // TEMPORARILY DISABLED: Token version check
        // Allow old tokens to work while users migrate
        // if (!decoded.version || decoded.version < 2) {
        //     return res.status(401).json({ 
        //         error: 'Token outdated',
        //         code: 'TOKEN_OUTDATED',
        //         message: 'Please log in again to continue'
        //     });
        // }
        
        // Handle platform admin
        if (decoded.isPlatformAdmin || decoded.role === 'platform_admin') {
            req.user = {
                id: decoded.platformUserId || 'platform',
                platformUserId: decoded.platformUserId,
                role: 'platform_admin',
                email: decoded.email || 'superadmin@pds.com',
                name: decoded.name || 'Super Admin',
                isPlatformAdmin: true
            };
            req.schemaName = 'public'; // Platform admins use public schema
            return next();
        }
        
        // Fetch user from public.users table
        const user = await dbGet(
            'SELECT id, email, name, role, primary_school_id, is_active, phone FROM public.users WHERE id = $1',
            [decoded.userId]
        );
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Get school context from token or fallback to database
        let schoolId = decoded.schoolId || user.primary_school_id;
        let schemaName = decoded.schemaName;
        
        // FALLBACK: If old token doesn't have schema context, fetch from database
        if (!schemaName && schoolId) {
            const school = await getCachedSchool(schoolId, 'id');
            if (school) {
                schemaName = school.schema_name;
                console.log(`📥 Fetched schema from DB for old token: ${schemaName}`);
            }
        }
        
        // If still no school context, try user_schools
        if (!schoolId || !schemaName) {
            const userSchool = await dbGet(`
                SELECT s.id, s.schema_name
                FROM public.schools s
                JOIN public.user_schools us ON s.id = us.school_id
                WHERE us.user_id = $1 AND us.is_primary = true
                LIMIT 1
            `, [user.id]);
            
            if (userSchool) {
                schoolId = userSchool.id;
                schemaName = userSchool.schema_name;
                console.log(`📥 Fetched schema from user_schools: ${schemaName}`);
            }
        }
        
        // Set user on request with school context from token
        req.user = {
            ...user,
            schoolId: schoolId,
            schemaName: schemaName
        };
        
        // CRITICAL: Set schema context on request BEFORE any route handlers
        // This ensures all DB queries have the correct schema context
        req.schemaName = schemaName;
        req.schoolId = schoolId;
        
        // ALWAYS log schema context for debugging
        console.log(`🔐 Auth: User ${user.id} (${user.email}) authenticated with schema context:`, {
            userId: user.id,
            email: user.email,
            role: user.role,
            schoolId: schoolId,
            schemaName: schemaName,
            'req.schemaName': req.schemaName,
            'req.schoolId': req.schoolId,
            tokenHadSchema: !!decoded.schemaName
        });
        
        // Warn if missing
        if (!schemaName || !schoolId) {
            console.warn(`⚠️  User ${user.id} authenticated but missing school context!`);
        }
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

/**
 * Middleware: Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.isPlatformAdmin) {
            req.user = {
                id: decoded.platformUserId,
                role: 'platform_admin',
                isPlatformAdmin: true
            };
        } else {
            const user = await dbGet(
                'SELECT id, email, name, role, primary_school_id, is_active FROM public.users WHERE id = $1',
                [decoded.userId]
            );
            
            if (user && user.is_active) {
                req.user = {
                    ...user,
                    schoolId: decoded.schoolId,
                    schemaName: decoded.schemaName
                };
                req.schemaName = decoded.schemaName;
                req.schoolId = decoded.schoolId;
            }
        }
    } catch (error) {
        // Ignore token errors for optional auth
    }
    
    next();
};

/**
 * Middleware: Require specific role(s)
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware: Require admin role (school admin or platform admin)
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'platform_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

/**
 * Middleware: Require teacher or admin role
 */
const requireTeacherOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['teacher', 'admin', 'platform_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Teacher or admin access required' });
    }

    next();
};

/**
 * Get school ID from request (for backward compatibility)
 */
const getSchoolId = (req) => {
    // Priority: req.schoolId > req.user.schoolId > req.user.primary_school_id
    if (req.schoolId) {
        return req.schoolId;
    }
    if (req.user && req.user.schoolId) {
        return req.user.schoolId;
    }
    if (req.user && req.user.primary_school_id) {
        return req.user.primary_school_id;
    }
    return null;
};

/**
 * Get schema name from request
 */
const getSchemaName = (req) => {
    if (req.schemaName && req.schemaName !== 'public') {
        return req.schemaName;
    }
    if (req.user && req.user.schemaName) {
        return req.user.schemaName;
    }
    return null;
};

/**
 * Verify password hash
 */
const bcrypt = require('bcryptjs');

const verifyPassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
};

module.exports = {
    // Token generation
    generateToken,
    generatePlatformToken,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    
    // Middleware
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireTeacherOrAdmin,
    
    // Helpers
    getSchoolId,
    getSchemaName,
    verifyPassword,
    hashPassword
};



