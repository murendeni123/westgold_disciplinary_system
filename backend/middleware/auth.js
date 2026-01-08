const jwt = require('jsonwebtoken');
const { dbGet } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Handle platform admin (no database lookup needed)
        if (decoded.role === 'platform_admin') {
            req.user = {
                id: 'platform',
                role: 'platform_admin',
                email: 'superadmin@pds.com',
                name: 'Super Admin'
            };
            return next();
        }
        
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

const getSchoolId = (req) => {
    // school_id is stored in user object or defaults to null
    // For multi-tenancy, extract from user or request
    if (req.user && req.user.school_id) {
        return req.user.school_id;
    }
    // If no school_id, return null (for single-tenant or testing)
    return null;
};

module.exports = {
    authenticateToken,
    requireRole,
    getSchoolId
};



