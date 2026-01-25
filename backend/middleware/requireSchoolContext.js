/**
 * Middleware to ensure school context is set before any DB queries
 * This middleware MUST be used after authenticateToken middleware
 * and BEFORE any route handlers that need school context
 */

const { getSchema, getSchoolId } = require('../utils/schemaHelper');

/**
 * Require school context middleware
 * Ensures req.schemaName and req.schoolId are set before proceeding
 * Returns 403 if school context is missing
 */
const requireSchoolContext = (req, res, next) => {
    // Skip for platform admins
    if (req.user && req.user.isPlatformAdmin) {
        return next();
    }
    
    const schemaName = getSchema(req);
    const schoolId = getSchoolId(req);
    
    if (!schemaName || !schoolId) {
        console.error(`School context missing for user ${req.user?.id}:`, {
            schemaName,
            schoolId,
            userId: req.user?.id,
            path: req.path
        });
        
        return res.status(403).json({
            error: 'School context required',
            message: 'This endpoint requires a valid school context. Please ensure you are logged in with a school account.',
            code: 'MISSING_SCHOOL_CONTEXT'
        });
    }
    
    // Ensure schema and schoolId are set on request for downstream use
    req.schemaName = schemaName;
    req.schoolId = schoolId;
    
    // Mark that school context has been validated
    req.hasSchoolContext = true;
    
    next();
};

/**
 * Optional school context middleware
 * Sets school context if available but doesn't fail if missing
 * Useful for routes that can work with or without school context
 */
const optionalSchoolContext = (req, res, next) => {
    // Skip for platform admins
    if (req.user && req.user.isPlatformAdmin) {
        return next();
    }
    
    const schemaName = getSchema(req);
    const schoolId = getSchoolId(req);
    
    if (schemaName && schoolId) {
        req.schemaName = schemaName;
        req.schoolId = schoolId;
        req.hasSchoolContext = true;
    }
    
    next();
};

module.exports = {
    requireSchoolContext,
    optionalSchoolContext
};
