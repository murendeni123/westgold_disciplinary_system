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
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    };
    
    // Add school context if available
    if (school) {
        payload.schoolId = school.id;
        payload.schoolCode = school.code;
        payload.schemaName = school.schema_name;
    } else if (user.primary_school_id) {
        payload.schoolId = user.primary_school_id;
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
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

        // Set user on request
        req.user = {
            ...user,
            schoolId: decoded.schoolId || user.primary_school_id,
            schemaName: decoded.schemaName
        };
        
        // Set schema context from token if available
        if (decoded.schemaName) {
            req.schemaName = decoded.schemaName;
            req.schoolId = decoded.schoolId;
        } else if (decoded.schoolId) {
            // Fetch school info if only ID is in token
            const school = await getCachedSchool(decoded.schoolId, 'id');
            if (school) {
                req.schemaName = school.schema_name;
                req.schoolId = school.id;
                req.school = school;
            }
        } else if (user.primary_school_id) {
            // Fallback to user's primary school
            const school = await getCachedSchool(user.primary_school_id, 'id');
            if (school) {
                req.schemaName = school.schema_name;
                req.schoolId = school.id;
                req.school = school;
            }
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



