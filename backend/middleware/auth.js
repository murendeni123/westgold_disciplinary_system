const jwt = require('jsonwebtoken');
const { dbGet } = require('../database/db');
const { supabaseAdmin } = require('../lib/supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // First, try to verify as a Supabase token
        if (supabaseAdmin) {
            try {
                const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
                
                if (error) {
                    console.log('Supabase getUser error:', error.message);
                }
                
                if (supabaseUser && !error) {
                    console.log('Supabase auth successful for:', supabaseUser.email);
                    // Supabase token is valid, get user from users table by email
                    const user = await dbGet('SELECT * FROM users WHERE email = $1', [supabaseUser.email]);
                    
                    if (user) {
                        req.user = {
                            ...user,
                            supabase_id: supabaseUser.id  // Store Supabase UUID for reference
                        };
                        return next();
                    }
                    
                    // User authenticated with Supabase but not in users table
                    // Create a minimal user object from Supabase data
                    console.log('User not in users table, using Supabase metadata');
                    req.user = {
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        role: supabaseUser.user_metadata?.role || 'parent',
                        name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
                        school_id: supabaseUser.user_metadata?.school_id || null
                    };
                    return next();
                }
            } catch (supabaseError) {
                // Supabase verification failed, try legacy JWT
                console.log('Supabase auth exception:', supabaseError.message);
            }
        } else {
            console.log('supabaseAdmin not available');
        }
        
        // Fallback: Try legacy JWT verification
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
        
        const user = await dbGet('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
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



