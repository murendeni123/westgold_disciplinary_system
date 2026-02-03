/**
 * Authentication Routes for Multi-Tenant Architecture
 * 
 * Handles login, signup, and authentication for all user types
 * with proper schema context for multi-school support.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll, dbRun } = require('../database/db');
const { authenticateToken, generateToken, generatePlatformToken, verifyPassword, hashPassword, JWT_SECRET } = require('../middleware/auth');
const { getCachedSchool } = require('../middleware/schemaContext');
const { 
    loginLimiter, 
    signupLimiter, 
    linkStudentLimiter,
    trackFailedLogin,
    resetFailedLogins,
    isAccountLocked
} = require('../middleware/rateLimiter');
const { 
    validateLogin, 
    validateSignup, 
    validateLinkStudent 
} = require('../middleware/validationSchemas');

const router = express.Router();

/**
 * GET /api/auth/debug-context
 * Debug endpoint to check current authentication state
 */
router.get('/debug-context', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role,
                schoolId: req.user?.schoolId,
                schemaName: req.user?.schemaName,
                primary_school_id: req.user?.primary_school_id
            },
            request: {
                schemaName: req.schemaName,
                schoolId: req.schoolId
            },
            school: req.school ? {
                id: req.school.id,
                name: req.school.name,
                schema_name: req.school.schema_name
            } : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Multi-tenant login with school context
 * SECURITY: Rate limited to prevent brute force attacks
 */
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
    try {
        const { email, password, schoolCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Check if account is locked due to too many failed attempts
        if (isAccountLocked(email.toLowerCase())) {
            const lockStatus = trackFailedLogin(email.toLowerCase());
            return res.status(429).json({
                error: 'Account locked',
                message: lockStatus.message
            });
        }

        // First, check if this is a platform admin login
        let platformUser = null;
        try {
            platformUser = await dbGet(
                'SELECT * FROM public.platform_users WHERE email = $1 AND is_active = 1',
                [email.toLowerCase()]
            );
        } catch (e) {
            // Table might not exist or have different structure, continue to regular login
            console.log('Platform user check skipped:', e.message);
        }

        if (platformUser) {
            const isValid = await verifyPassword(password, platformUser.password_hash);
            if (!isValid) {
                // Track failed login attempt
                const lockStatus = trackFailedLogin(email.toLowerCase());
                if (lockStatus.locked) {
                    return res.status(429).json({
                        error: 'Account locked',
                        message: lockStatus.message
                    });
                }
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Reset failed login attempts on successful login
            resetFailedLogins(email.toLowerCase());

            // Update last login
            await dbRun(
                'UPDATE public.platform_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [platformUser.id]
            );

            const token = generatePlatformToken(platformUser);

            return res.json({
                token,
                user: {
                    id: platformUser.id,
                    email: platformUser.email,
                    name: platformUser.name,
                    role: 'platform_admin',
                    isPlatformAdmin: true
                }
            });
        }

        // Regular user login - check public.users
        const user = await dbGet(
            'SELECT * FROM public.users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (!user) {
            // Track failed login attempt (user not found)
            const lockStatus = trackFailedLogin(email.toLowerCase());
            if (lockStatus.locked) {
                return res.status(429).json({
                    error: 'Account locked',
                    message: lockStatus.message
                });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Check if user has a password set
        if (!user.password) {
            return res.status(401).json({ 
                error: 'Password not set',
                message: 'Please contact your administrator to set up your password'
            });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            // Track failed login attempt
            const lockStatus = trackFailedLogin(email.toLowerCase());
            if (lockStatus.locked) {
                return res.status(429).json({
                    error: 'Account locked',
                    message: lockStatus.message
                });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Reset failed login attempts on successful login
        resetFailedLogins(email.toLowerCase());

        // Get user's schools
        const userSchools = await dbAll(`
            SELECT s.id, s.name, s.code, s.subdomain, s.schema_name, us.role_in_school, us.is_primary
            FROM public.schools s
            JOIN public.user_schools us ON s.id = us.school_id
            WHERE us.user_id = $1 AND s.status = 'active'
            ORDER BY us.is_primary DESC, s.name ASC
        `, [user.id]);

        // Also check primary_school_id if no user_schools entries
        if (userSchools.length === 0 && user.primary_school_id) {
            const primarySchool = await dbGet(
                'SELECT id, name, code, subdomain, schema_name FROM public.schools WHERE id = $1 AND status = $2',
                [user.primary_school_id, 'active']
            );
            if (primarySchool) {
                userSchools.push({ ...primarySchool, role_in_school: user.role, is_primary: true });
            }
        }

        // Determine which school to use
        let selectedSchool = null;

        if (schoolCode) {
            // School code provided - use that school
            selectedSchool = userSchools.find(s => s.code.toLowerCase() === schoolCode.toLowerCase());
            if (!selectedSchool) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have access to this school'
                });
            }
        } else if (userSchools.length === 1) {
            // Only one school - auto-select
            selectedSchool = userSchools[0];
        } else if (userSchools.length > 1) {
            // Multiple schools - return list for selection
            return res.json({
                needsSchoolSelection: true,
                schools: userSchools.map(s => ({
                    id: s.id,
                    name: s.name,
                    code: s.code,
                    subdomain: s.subdomain
                })),
                tempToken: jwt.sign(
                    { userId: user.id, email: user.email, needsSchoolSelection: true },
                    JWT_SECRET,
                    { expiresIn: '5m' }
                )
            });
        } else {
            // No schools - user not linked to any school
            return res.status(403).json({
                error: 'No school access',
                message: 'Your account is not linked to any school. Please contact your school administrator.'
            });
        }

        // Update last login
        await dbRun(
            'UPDATE public.users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Reset failed login attempts on successful login
        resetFailedLogins(email.toLowerCase());

        // Generate token with school context
        const token = generateToken(user, selectedSchool);

        // Get additional user info based on role
        let userInfo = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            schoolId: selectedSchool.id,
            schoolName: selectedSchool.name,
            schoolCode: selectedSchool.code,
            schemaName: selectedSchool.schema_name
        };

        // Get role-specific info from school schema
        try {
            if (user.role === 'teacher' || user.role === 'admin') {
                const teacher = await dbGet(
                    'SELECT * FROM teachers WHERE user_id = $1',
                    [user.id],
                    selectedSchool.schema_name
                );
                userInfo.teacher = teacher;
            }
        } catch (error) {
            console.log('Could not fetch teacher data:', error.message);
            userInfo.teacher = null;
        }

        try {
            if (user.role === 'parent') {
                const children = await dbAll(
                    `SELECT s.*, c.class_name 
                     FROM students s 
                     LEFT JOIN classes c ON s.class_id = c.id 
                     WHERE s.parent_id = $1`,
                    [user.id],
                    selectedSchool.schema_name
                );
                userInfo.children = children;
            }
        } catch (error) {
            console.log('Could not fetch children data:', error.message);
            userInfo.children = [];
        }

        res.json({
            token,
            user: userInfo,
            school: {
                id: selectedSchool.id,
                name: selectedSchool.name,
                code: selectedSchool.code,
                subdomain: selectedSchool.subdomain
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/select-school
 * Select a school after login (for users with multiple schools)
 */
router.post('/select-school', async (req, res) => {
    try {
        const { schoolId } = req.body;
        const authHeader = req.headers['authorization'];
        const tempToken = authHeader && authHeader.split(' ')[1];

        if (!tempToken) {
            return res.status(401).json({ error: 'Temporary token required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(tempToken, JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (!decoded.needsSchoolSelection) {
            return res.status(400).json({ error: 'Invalid token type' });
        }

        // Get user
        const user = await dbGet(
            'SELECT * FROM public.users WHERE id = $1 AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Verify user has access to this school
        const access = await dbGet(`
            SELECT s.*, us.role_in_school
            FROM public.schools s
            JOIN public.user_schools us ON s.id = us.school_id
            WHERE us.user_id = $1 AND s.id = $2 AND s.status = 'active'
        `, [user.id, schoolId]);

        if (!access) {
            return res.status(403).json({ error: 'Access denied to this school' });
        }

        // Generate full token with school context
        const token = generateToken(user, access);

        // Get user info
        let userInfo = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: access.id,
            schoolName: access.name,
            schemaName: access.schema_name
        };

        if (user.role === 'parent') {
            const children = await dbAll(
                `SELECT s.*, c.class_name 
                 FROM students s 
                 LEFT JOIN classes c ON s.class_id = c.id 
                 WHERE s.parent_id = $1`,
                [user.id],
                access.schema_name
            );
            userInfo.children = children;
        }

        res.json({
            token,
            user: userInfo,
            school: {
                id: access.id,
                name: access.name,
                code: access.code,
                subdomain: access.subdomain
            }
        });

    } catch (error) {
        console.error('Select school error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/auth/me
 * Get current user with school context
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

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
        if (decoded.isPlatformAdmin) {
            const platformUser = await dbGet(
                'SELECT id, email, name, role FROM public.platform_users WHERE id = $1',
                [decoded.platformUserId]
            );
            return res.json({
                user: {
                    ...platformUser,
                    isPlatformAdmin: true
                }
            });
        }

        // Regular user
        const user = await dbGet(
            'SELECT id, email, role, name, primary_school_id, phone FROM public.users WHERE id = $1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get school context from token or fallback to database
        let schoolId = decoded.schoolId || user.primary_school_id;
        let schemaName = decoded.schemaName;
        let school = null;

        // FALLBACK: If old token doesn't have schema context, fetch from database
        if (!schemaName && schoolId) {
            school = await getCachedSchool(schoolId, 'id');
            if (school) {
                schemaName = school.schema_name;
            }
        }

        // If still no school context, try user_schools
        if (!schoolId || !schemaName) {
            const userSchool = await dbGet(`
                SELECT s.id, s.schema_name, s.name, s.code, s.school_code
                FROM public.schools s
                JOIN public.user_schools us ON s.id = us.school_id
                WHERE us.user_id = $1 AND us.is_primary = true
                LIMIT 1
            `, [user.id]);
            
            if (userSchool) {
                schoolId = userSchool.id;
                schemaName = userSchool.schema_name;
                school = userSchool;
            }
        }

        // Get full school info if we have schoolId but not school object
        if (schoolId && !school) {
            school = await getCachedSchool(schoolId, 'id');
        }

        let userInfo = {
            ...user,
            schoolId: schoolId,
            schemaName: schemaName,
            schoolName: school?.name,
            schoolCode: school?.code || school?.school_code || decoded.schoolCode
        };

        if ((user.role === 'teacher' || user.role === 'admin') && schemaName) {
            const teacher = await dbGet(
                'SELECT * FROM teachers WHERE user_id = $1',
                [user.id],
                schemaName
            );
            userInfo.teacher = teacher;
        }

        if (user.role === 'parent' && schemaName) {
            const children = await dbAll(
                `SELECT s.*, c.class_name 
                 FROM students s 
                 LEFT JOIN classes c ON s.class_id = c.id 
                 WHERE s.parent_id = $1`,
                [user.id],
                schemaName
            );
            userInfo.children = children;
        }

        // Get all schools user has access to
        const userSchools = await dbAll(`
            SELECT s.id, s.name, s.code, s.subdomain
            FROM public.schools s
            JOIN public.user_schools us ON s.id = us.school_id
            WHERE us.user_id = $1 AND s.status = 'active'
        `, [user.id]);

        userInfo.schools = userSchools;

        res.json({ user: userInfo });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        const existingUser = await dbGet(
            'SELECT id FROM public.users WHERE email = $1 AND id != $2',
            [email.toLowerCase(), req.user.id]
        );
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        await dbRun(
            'UPDATE public.users SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
            [name, email.toLowerCase(), phone, req.user.id]
        );

        // Get updated user info
        const updatedUser = await dbGet(
            'SELECT id, email, role, name, primary_school_id, phone FROM public.users WHERE id = $1',
            [req.user.id]
        );
        
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        console.log('🔍 Looking up user with ID from token:', req.user.id);
        
        const user = await dbGet('SELECT * FROM public.users WHERE id = $1', [req.user.id]);

        if (!user) {
            console.error('❌ User not found in database with ID:', req.user.id);
            console.error('Token might be stale or invalid. User should logout and login again.');
            return res.status(404).json({ 
                error: 'User not found. Please logout and login again to refresh your session.' 
            });
        }
        
        console.log('✅ Found user:', { id: user.id, email: user.email, name: user.name });

        console.log('🔐 Starting password verification...');
        console.log('Current password length:', currentPassword.length);
        
        // DUAL PASSWORD VERIFICATION: Check both normal and HTML-escaped versions
        // This handles passwords that were stored during the HTML escaping bug period
        // Once user changes password, new one will be stored correctly (no escaping)
        console.log('Trying normal password verification...');
        const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
        console.log('Normal password verification result:', isValidPassword);
        
        // If normal verification fails, try escaped version (backward compatibility)
        let isValidEscaped = false;
        if (!isValidPassword) {
            console.log('Normal verification failed, trying escaped version...');
            const validator = require('validator');
            const escapedPassword = validator.escape(currentPassword);
            console.log('Escaped password:', escapedPassword);
            console.log('Is different from original?', escapedPassword !== currentPassword);
            
            // Only try escaped version if it's different from original
            if (escapedPassword !== currentPassword) {
                isValidEscaped = await verifyPassword(escapedPassword, user.password_hash);
                console.log('Escaped password verification result:', isValidEscaped);
            }
        }

        if (!isValidPassword && !isValidEscaped) {
            console.log('❌ Both password verifications failed');
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        console.log('✅ Password verification successful!');

        const hashedPassword = await hashPassword(newPassword);
        
        console.log('🔐 Updating password for user:', {
            userId: req.user.id,
            email: req.user.email,
            hashedPasswordLength: hashedPassword.length
        });
        
        const updateResult = await dbRun(
            'UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, req.user.id]
        );
        
        console.log('✅ Password update result:', {
            rowsAffected: updateResult.changes,
            userId: req.user.id
        });
        
        if (updateResult.changes === 0) {
            console.error('⚠️ WARNING: Password update affected 0 rows!');
            return res.status(500).json({ error: 'Failed to update password - user not found' });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/signup
 * Parent signup - creates account without school link initially
 * Parent must link to school using student link code after signup
 * SECURITY: Rate limited to prevent mass account creation
 */
router.post('/signup', signupLimiter, validateSignup, async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            work_phone,
            relationship_to_child,
            emergency_contact_1_name,
            emergency_contact_1_phone,
            emergency_contact_2_name,
            emergency_contact_2_phone,
            home_address,
            city,
            postal_code,
        } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if email already exists
        const existingUser = await dbGet(
            'SELECT id, password, supabase_user_id FROM public.users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        let userId;
        
        if (existingUser) {
            // User exists (likely from Supabase sync) - update password if it's NULL
            if (!existingUser.password && existingUser.supabase_user_id) {
                // This is a Supabase user without local password - update it
                await dbRun(
                    'UPDATE public.users SET password = $1, name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
                    [hashedPassword, name, phone, existingUser.id]
                );
                userId = existingUser.id;
            } else {
                // User already has a password - reject duplicate signup
                return res.status(400).json({ error: 'Email already registered' });
            }
        } else {
            // Create new parent user in public.users (no school link yet)
            const userResult = await dbRun(
                `INSERT INTO public.users (email, password, role, name, phone, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [email.toLowerCase(), hashedPassword, 'parent', name, phone, true]
            );
            userId = userResult.id;
        }

        // Generate token (without school context - parent needs to link to school)
        const token = jwt.sign(
            { 
                userId: userId, 
                email: email.toLowerCase(),
                role: 'parent',
                needsSchoolLink: true 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Account created successfully. Please link your child using the student link code.',
            token,
            user: {
                id: userId,
                email: email.toLowerCase(),
                name,
                role: 'parent',
                needsSchoolLink: true
            },
            nextStep: 'link-student'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/link-student
 * Link parent to student using link code
 * This also links the parent to the school
 * SECURITY: Rate limited to prevent link code enumeration
 */
router.post('/link-student', authenticateToken, linkStudentLimiter, validateLinkStudent, async (req, res) => {
    try {
        const { linkCode } = req.body;

        if (!linkCode) {
            return res.status(400).json({ error: 'Student link code is required' });
        }

        if (req.user.role !== 'parent') {
            return res.status(403).json({ error: 'Only parents can link to students' });
        }

        // Find student with this link code across all school schemas
        // First, get all schools to search
        const schools = await dbAll('SELECT id, schema_name FROM public.schools WHERE status = $1', ['active']);

        let foundStudent = null;
        let foundSchool = null;

        for (const school of schools) {
            const student = await dbGet(
                'SELECT * FROM students WHERE parent_link_code = $1',
                [linkCode],
                school.schema_name
            );

            if (student) {
                foundStudent = student;
                foundSchool = await dbGet('SELECT * FROM public.schools WHERE id = $1', [school.id]);
                break;
            }
        }

        if (!foundStudent || !foundSchool) {
            return res.status(404).json({ error: 'Invalid link code. Please check and try again.' });
        }

        // Check if student already has a parent linked
        if (foundStudent.parent_id && foundStudent.parent_id !== req.user.id) {
            return res.status(409).json({ 
                error: 'This student is already linked to another parent account',
                message: 'Please contact the school administrator if you believe this is an error.'
            });
        }

        // Link parent to school
        await dbRun(`
            INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, school_id) DO NOTHING
        `, [req.user.id, foundSchool.id, 'parent', true]);

        // Update user's primary school if not set
        await dbRun(`
            UPDATE public.users 
            SET primary_school_id = COALESCE(primary_school_id, $1), updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [foundSchool.id, req.user.id]);

        // Link parent to student in school schema
        await dbRun(
            'UPDATE students SET parent_id = $1 WHERE id = $2',
            [req.user.id, foundStudent.id],
            foundSchool.schema_name
        );

        // Create parent profile in school schema if not exists
        const existingParent = await dbGet(
            'SELECT id FROM parents WHERE user_id = $1',
            [req.user.id],
            foundSchool.schema_name
        );

        if (!existingParent) {
            const user = await dbGet('SELECT * FROM public.users WHERE id = $1', [req.user.id]);
            await dbRun(`
                INSERT INTO parents (user_id, phone, preferred_contact_method)
                VALUES ($1, $2, $3)
            `, [req.user.id, user.phone, 'email'], foundSchool.schema_name);
        }

        // Clear the link code (one-time use)
        await dbRun(
            'UPDATE students SET parent_link_code = NULL WHERE id = $1',
            [foundStudent.id],
            foundSchool.schema_name
        );

        // Generate new token with school context
        const token = generateToken(req.user, foundSchool);

        res.json({
            success: true,
            message: 'Successfully linked to student',
            token,
            student: {
                id: foundStudent.id,
                firstName: foundStudent.first_name,
                lastName: foundStudent.last_name,
                studentId: foundStudent.student_id
            },
            school: {
                id: foundSchool.id,
                name: foundSchool.name,
                code: foundSchool.code
            }
        });

    } catch (error) {
        console.error('Link student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Supabase user sync endpoint - handles OAuth users from Supabase Auth
router.post('/supabase-sync', async (req, res) => {
    try {
        const { supabase_user_id, email, name, auth_provider } = req.body;

        console.log('Supabase sync request:', { supabase_user_id, email, name, auth_provider });

        if (!supabase_user_id || !email) {
            return res.status(400).json({ error: 'Supabase user ID and email required' });
        }

        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

        try {
            // Check if user already exists by supabase_user_id
            let userResult = await pool.query(
                'SELECT * FROM public.users WHERE supabase_user_id = $1',
                [supabase_user_id]
            );
            let user = userResult.rows[0];

            console.log('User by supabase_user_id:', user);

            if (!user) {
                // Check if user exists by email (for linking existing accounts)
                userResult = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
                user = userResult.rows[0];
                console.log('User by email:', user);
                
                if (user) {
                    // Link existing account to Supabase
                    await pool.query(
                        'UPDATE public.users SET supabase_user_id = $1, auth_provider = $2, last_sign_in = CURRENT_TIMESTAMP WHERE id = $3',
                        [supabase_user_id, auth_provider || 'google', user.id]
                    );
                    // Refresh user data
                    userResult = await pool.query('SELECT * FROM public.users WHERE id = $1', [user.id]);
                    user = userResult.rows[0];
                } else {
                    // Create new parent user (password is NULL for OAuth users)
                    const insertResult = await pool.query(
                        `INSERT INTO public.users (email, name, role, supabase_user_id, auth_provider, password, created_at, last_sign_in)
                         VALUES ($1, $2, 'parent', $3, $4, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                         RETURNING id`,
                        [email, name || email.split('@')[0], supabase_user_id, auth_provider || 'google']
                    );
                    
                    console.log('Insert result:', insertResult.rows[0]);
                    
                    if (!insertResult.rows[0] || !insertResult.rows[0].id) {
                        console.error('Failed to get user ID from insert');
                        return res.status(500).json({ error: 'Failed to create user account' });
                    }
                    
                    userResult = await pool.query('SELECT * FROM public.users WHERE id = $1', [insertResult.rows[0].id]);
                    user = userResult.rows[0];
                }
            } else {
                // Update last sign in
                await pool.query(
                    'UPDATE public.users SET last_sign_in = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
            }

            if (!user) {
                console.error('Failed to create or find user');
                await pool.end();
                return res.status(500).json({ error: 'Failed to create user account' });
            }

            // Get user's school and schema
            let schoolInfo = null;
            let schemaName = null;
            
            // First check user_schools table
            const userSchoolsResult = await pool.query(
                `SELECT s.id, s.name, s.code, s.schema_name 
                 FROM public.schools s 
                 JOIN public.user_schools us ON s.id = us.school_id 
                 WHERE us.user_id = $1 AND s.status = 'active'
                 ORDER BY us.is_primary DESC
                 LIMIT 1`,
                [user.id]
            );
            
            if (userSchoolsResult.rows.length > 0) {
                schoolInfo = userSchoolsResult.rows[0];
                schemaName = schoolInfo.schema_name;
            } else if (user.primary_school_id) {
                // Fall back to primary_school_id
                const primarySchoolResult = await pool.query(
                    'SELECT id, name, code, schema_name FROM public.schools WHERE id = $1 AND status = $2',
                    [user.primary_school_id, 'active']
                );
                if (primarySchoolResult.rows.length > 0) {
                    schoolInfo = primarySchoolResult.rows[0];
                    schemaName = schoolInfo.schema_name;
                }
            }

            // Generate JWT token for the user with school context
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    role: user.role,
                    schoolId: schoolInfo?.id,
                    schemaName: schemaName
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Get additional user info based on role
            let userInfo = { ...user };
            delete userInfo.password;
            delete userInfo.password_hash;
            
            // Add school info
            if (schoolInfo) {
                userInfo.schoolId = schoolInfo.id;
                userInfo.schoolName = schoolInfo.name;
                userInfo.schoolCode = schoolInfo.code;
                userInfo.schemaName = schemaName;
            }

            if (user.role === 'teacher' && schemaName) {
                const teacherResult = await pool.query(
                    `SELECT * FROM ${schemaName}.teachers WHERE user_id = $1`,
                    [user.id]
                );
                userInfo.teacher = teacherResult.rows[0];
            }

            if (user.role === 'parent' && schemaName) {
                const childrenResult = await pool.query(
                    `SELECT s.*, c.class_name 
                     FROM ${schemaName}.students s 
                     LEFT JOIN ${schemaName}.classes c ON s.class_id = c.id 
                     WHERE s.parent_id = $1`,
                    [user.id]
                );
                userInfo.children = childrenResult.rows;
            }

            console.log('Supabase sync successful, returning user:', userInfo.email, 'schema:', schemaName);

            await pool.end();

            res.json({
                token,
                user: userInfo
            });
        } catch (poolError) {
            console.error('Supabase sync pool error:', poolError);
            await pool.end();
            throw poolError;
        }
    } catch (error) {
        console.error('Supabase sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token even if expired
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check if token is too old (more than 7 days)
        const tokenAge = Date.now() - (decoded.iat * 1000);
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (tokenAge > maxAge) {
            return res.status(401).json({ error: 'Token too old, please login again' });
        }

        // Handle platform admin
        if (decoded.isPlatformAdmin) {
            const platformUser = await dbGet(
                'SELECT * FROM public.platform_users WHERE id = $1 AND is_active = 1',
                [decoded.platformUserId]
            );

            if (!platformUser) {
                return res.status(401).json({ error: 'User not found' });
            }

            const newToken = generatePlatformToken(platformUser);
            return res.json({ token: newToken });
        }

        // Regular user
        const user = await dbGet(
            'SELECT * FROM public.users WHERE id = $1 AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Get school info
        let school = null;
        if (decoded.schoolId) {
            school = await dbGet(
                'SELECT id, name, code, subdomain, schema_name FROM public.schools WHERE id = $1 AND status = $2',
                [decoded.schoolId, 'active']
            );
        }

        // Generate new token
        const newToken = generateToken(user, school);
        res.json({ token: newToken });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;


