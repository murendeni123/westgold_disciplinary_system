const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbAll, dbGet, dbRun, pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { createSchoolSchema, generateSchemaName } = require('../database/schemaManager');
const { seedDefaultTypes } = require('../database/seedDefaultTypes');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL || 'superadmin@pds.com';
const PLATFORM_ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD || 'superadmin123';

// Platform login (separate from regular auth)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // First, try to find platform user in database
        let platformUser = null;
        try {
            platformUser = await dbGet(
                'SELECT * FROM platform_users WHERE email = ? AND is_active = true',
                [email]
            );
        } catch (dbError) {
            // If platform_users table doesn't exist yet, fall back to env vars
            console.log('platform_users table not found, using environment variables');
        }

        if (platformUser) {
            // Verify password from database
            const passwordMatch = await bcrypt.compare(password, platformUser.password_hash);
            if (passwordMatch) {
                // Update last login
                await dbRun(
                    'UPDATE platform_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                    [platformUser.id]
                );

                const token = jwt.sign(
                    { userId: platformUser.id, role: 'platform_admin' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    token,
                    user: {
                        id: platformUser.id,
                        email: platformUser.email,
                        role: 'platform_admin',
                        name: platformUser.name
                    }
                });
            }
        } else {
            // Fallback to environment variables for backward compatibility
            if (email === PLATFORM_ADMIN_EMAIL && password === PLATFORM_ADMIN_PASSWORD) {
                const token = jwt.sign(
                    { userId: 'platform', role: 'platform_admin' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    token,
                    user: {
                        id: 'platform',
                        email: PLATFORM_ADMIN_EMAIL,
                        role: 'platform_admin',
                        name: 'Super Admin'
                    }
                });
            }
        }

        res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Platform login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to check platform admin
const requirePlatformAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Platform admin access required' });
        }
        req.platformAdmin = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Get platform settings
router.get('/settings', requirePlatformAdmin, async (req, res) => {
    try {
        const settings = await dbGet('SELECT * FROM platform_settings WHERE id = 1');
        res.json(settings || {
            platform_name: 'Positive Discipline System',
            support_email: 'support@pds.com',
            max_schools: 1000,
            max_students_per_school: 10000
        });
    } catch (error) {
        console.error('Error fetching platform settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update platform settings
router.put('/settings', requirePlatformAdmin, async (req, res) => {
    try {
        const { platform_name, support_email, max_schools, max_students_per_school } = req.body;

        const existing = await dbGet('SELECT id FROM platform_settings WHERE id = 1');
        
        if (existing) {
            await dbRun(
                `UPDATE platform_settings 
                 SET platform_name = ?, support_email = ?, max_schools = ?, max_students_per_school = ?
                 WHERE id = 1`,
                [platform_name, support_email, max_schools, max_students_per_school]
            );
        } else {
            await dbRun(
                `INSERT INTO platform_settings (id, platform_name, support_email, max_schools, max_students_per_school)
                 VALUES (1, ?, ?, ?, ?)`,
                [platform_name, support_email, max_schools, max_students_per_school]
            );
        }

        const settings = await dbGet('SELECT * FROM platform_settings WHERE id = 1');
        res.json(settings);
    } catch (error) {
        console.error('Error updating platform settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get subscription plans
router.get('/plans', requirePlatformAdmin, async (req, res) => {
    try {
        const plans = await dbAll('SELECT * FROM subscription_plans ORDER BY price ASC');
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create subscription plan
router.post('/plans', requirePlatformAdmin, async (req, res) => {
    try {
        const { name, description, price, max_students, max_teachers, features, is_active } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const result = await dbRun(
            `INSERT INTO subscription_plans (name, description, price, max_students, max_teachers, features, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description || null, price, max_students || null, max_teachers || null, JSON.stringify(features || []), is_active !== undefined ? is_active : 1]
        );

        const plan = await dbGet('SELECT * FROM subscription_plans WHERE id = ?', [result.id]);
        res.status(201).json(plan);
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update subscription plan
router.put('/plans/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { name, description, price, max_students, max_teachers, features, is_active } = req.body;

        await dbRun(
            `UPDATE subscription_plans 
             SET name = ?, description = ?, price = ?, max_students = ?, max_teachers = ?, features = ?, is_active = ?
             WHERE id = ?`,
            [name, description || null, price, max_students || null, max_teachers || null, JSON.stringify(features || []), is_active !== undefined ? is_active : 1, req.params.id]
        );

        const plan = await dbGet('SELECT * FROM subscription_plans WHERE id = ?', [req.params.id]);
        res.json(plan);
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all schools (with filters)
router.get('/schools', requirePlatformAdmin, async (req, res) => {
    try {
        const { status, search, start_date, end_date } = req.query;
        
        let query = `
            SELECT s.*, 
                   (SELECT COUNT(*) FROM public.user_schools us WHERE us.school_id = s.id) as user_count
            FROM public.schools s
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND s.status = $${paramIndex++}`;
            params.push(status);
        }
        if (search) {
            query += ` AND (s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (start_date) {
            query += ` AND s.created_at >= $${paramIndex++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND s.created_at <= $${paramIndex++}`;
            params.push(end_date);
        }

        query += ' ORDER BY s.created_at DESC';

        const schools = await dbAll(query, params);
        res.json(schools);
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get school details
router.get('/schools/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [req.params.id]);
        
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Get subscription info
        const subscription = await dbGet(
            'SELECT * FROM school_subscriptions WHERE school_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.params.id]
        );

        school.subscription = subscription;
        res.json(school);
    } catch (error) {
        console.error('Error fetching school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get school statistics
router.get('/schools/:id/stats', requirePlatformAdmin, async (req, res) => {
    try {
        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [req.params.id]);
        
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Get user count from user_schools junction table
        const userCount = await dbGet('SELECT COUNT(*) as count FROM public.user_schools WHERE school_id = $1', [req.params.id]);
        
        // For school-specific data, query the school's schema
        const schemaName = school.schema_name;
        let studentCount = { count: 0 };
        let classCount = { count: 0 };
        let teacherCount = { count: 0 };
        let incidentCount = { count: 0 };
        let meritCount = { count: 0 };
        
        if (schemaName) {
            try {
                studentCount = await dbGet('SELECT COUNT(*) as count FROM students', [], schemaName);
                classCount = await dbGet('SELECT COUNT(*) as count FROM classes', [], schemaName);
                teacherCount = await dbGet('SELECT COUNT(*) as count FROM teachers', [], schemaName);
                incidentCount = await dbGet('SELECT COUNT(*) as count FROM behaviour_incidents', [], schemaName);
                meritCount = await dbGet('SELECT COUNT(*) as count FROM merits', [], schemaName);
            } catch (err) {
                console.error('Error fetching school schema stats:', err);
            }
        }

        res.json({
            school_id: school.id,
            school_name: school.name,
            total_users: parseInt(userCount?.count || 0),
            total_students: parseInt(studentCount?.count || 0),
            total_classes: parseInt(classCount?.count || 0),
            total_teachers: parseInt(teacherCount?.count || 0),
            total_admins: 0, // Would need to query users by role
            total_parents: 0, // Would need to query users by role
            total_incidents: parseInt(incidentCount?.count || 0),
            total_merits: parseInt(meritCount?.count || 0),
            last_activity: null,
            status: school.status,
            created_at: school.created_at
        });
    } catch (error) {
        console.error('Error fetching school stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// School Onboarding Wizard - Complete setup in one transaction
router.post('/schools/onboard', requirePlatformAdmin, async (req, res) => {
    try {
        const {
            // Step 1: School details
            school_name,
            school_code: providedSchoolCode, // Optional - will auto-generate if not provided
            school_email,
            school_phone,
            school_address,
            school_city,
            school_province,
            school_postal_code,
            
            // Step 2: Initial admin
            admin_name,
            admin_email,
            admin_password,
            
            // Step 3: Trial/Subscription
            trial_days = 30,
            plan_id,
            
            // Step 4: Branding
            primary_color,
            secondary_color,
            logo_url
        } = req.body;

        // Validation
        if (!school_name || !school_email) {
            return res.status(400).json({ error: 'School name and email are required' });
        }
        if (!admin_name || !admin_email || !admin_password) {
            return res.status(400).json({ error: 'Admin name, email, and password are required' });
        }

        // Check if school email already exists
        const existingSchool = await dbGet('SELECT id FROM public.schools WHERE email = $1', [school_email]);
        if (existingSchool) {
            return res.status(400).json({ error: 'School with this email already exists' });
        }

        // Check if admin email already exists
        const existingAdmin = await dbGet('SELECT id FROM public.users WHERE email = $1', [admin_email]);
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin email already in use' });
        }

        // Generate unique school code (e.g., WEST-4831) if not provided
        const generateSchoolCodeFn = () => {
            const prefix = school_name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
            const suffix = Math.floor(1000 + Math.random() * 9000);
            return `${prefix}-${suffix}`;
        };
        
        let school_code = providedSchoolCode ? providedSchoolCode.toUpperCase() : generateSchoolCodeFn();
        
        // Check if provided code already exists
        let codeExists = await dbGet('SELECT id FROM public.schools WHERE school_code = $1', [school_code]);
        
        if (providedSchoolCode && codeExists) {
            return res.status(400).json({ error: 'School code already exists. Please choose a different code or leave empty for auto-generation.' });
        }
        
        // If auto-generating, ensure uniqueness
        while (codeExists) {
            school_code = generateSchoolCodeFn();
            codeExists = await dbGet('SELECT id FROM public.schools WHERE school_code = $1', [school_code]);
        }

        // Generate schema name from school code
        const schemaName = generateSchemaName(school_code);

        // 1. Create school with schema_name
        const schoolResult = await dbRun(
            `INSERT INTO public.schools (name, email, phone, address, city, postal_code, code, school_code, schema_name, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'trial', CURRENT_TIMESTAMP) RETURNING id`,
            [school_name, school_email, school_phone || null, school_address || null, school_city || null, school_postal_code || null, school_code, school_code, schemaName]
        );
        const school_id = schoolResult.id;
        
        if (!school_id) {
            throw new Error('Failed to create school - no ID returned');
        }

        // 2. Create the database schema for the school
        const schemaResult = await createSchoolSchema(school_code);
        if (!schemaResult.success) {
            // Rollback: delete the school record
            await dbRun('DELETE FROM public.schools WHERE id = $1', [school_id]);
            throw new Error(`Failed to create school schema: ${schemaResult.error}`);
        }
        console.log(`✅ Created schema: ${schemaName} for school: ${school_name}`);

        // 3. Seed default incident types, merit types, and interventions
        try {
            const seedResult = await seedDefaultTypes(school_id, schemaName);
            if (!seedResult.success) {
                console.warn('⚠️ Warning: Could not seed default types:', seedResult.error);
            } else {
                console.log('✅ Seeded default types for new school:', seedResult.counts);
            }
        } catch (seedError) {
            console.warn('⚠️ Warning: Error seeding default types:', seedError.message);
            // Non-fatal - admin can add types manually
        }

        // 4. Create initial admin account
        const hashedPassword = await bcrypt.hash(admin_password, 10);
        const adminResult = await dbRun(
            `INSERT INTO public.users (email, password_hash, name, role, primary_school_id, created_at)
             VALUES ($1, $2, $3, 'admin', $4, CURRENT_TIMESTAMP) RETURNING id`,
            [admin_email, hashedPassword, admin_name, school_id]
        );
        
        if (!adminResult.id) {
            throw new Error('Failed to create admin user - no ID returned');
        }

        // 5. Link admin to school in user_schools
        await dbRun(
            `INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
             VALUES ($1, $2, 'admin', true)`,
            [adminResult.id, school_id]
        );

        // 6. Create admin record in school schema teachers table
        try {
            await dbRun(`
                INSERT INTO teachers (user_id, is_active, department)
                VALUES ($1, $2, $3)
            `, [adminResult.id, true, 'Administration'], schemaName);
        } catch (teacherError) {
            console.warn('Warning: Could not create teacher record in schema:', teacherError.message);
            // Non-fatal - admin can still log in
        }

        // 8. Set trial/subscription
        const trial_end_date = new Date();
        trial_end_date.setDate(trial_end_date.getDate() + trial_days);
        
        if (plan_id) {
            await dbRun(
                `INSERT INTO public.school_subscriptions (school_id, plan_id, start_date, end_date, status, created_at)
                 VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'trial', CURRENT_TIMESTAMP)`,
                [school_id, plan_id, trial_end_date.toISOString()]
            );
        }

        // 9. Apply default branding (skip if table doesn't exist)
        try {
            await dbRun(
                `INSERT INTO public.school_branding (school_id, primary_color, secondary_color, logo_url, updated_at, updated_by)
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
                [
                    school_id,
                    primary_color || '#3B82F6',
                    secondary_color || '#8B5CF6',
                    logo_url || null,
                    req.platformAdmin?.userId || adminResult.id
                ]
            );
        } catch (brandingError) {
            console.warn('Warning: Could not create branding record:', brandingError.message);
        }

        // 10. Create activity log (skip if table doesn't exist)
        try {
            await dbRun(
                `INSERT INTO public.activity_logs (school_id, user_id, action, details, created_at)
                 VALUES ($1, $2, 'school_onboarded', $3, CURRENT_TIMESTAMP)`,
                [
                    school_id,
                    adminResult.id,
                    JSON.stringify({
                        school_name,
                        admin_email,
                        school_code,
                        schema_name: schemaName,
                        trial_days,
                        onboarded_by: req.platformAdmin?.userId
                    })
                ]
            );
        } catch (logError) {
            console.warn('Warning: Could not create activity log:', logError.message);
        }

        // Fetch complete school data
        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [school_id]);
        const admin = await dbGet('SELECT id, name, email, role FROM public.users WHERE id = $1', [adminResult.id]);

        res.status(201).json({
            success: true,
            message: 'School onboarded successfully',
            school: {
                ...school,
                school_code,
                schema_name: schemaName
            },
            admin,
            next_steps: [
                `Share school code ${school_code} with teachers and parents for registration`,
                'Admin should login and customize school settings',
                'Import students and create classes',
                'Set up behaviour policies and merit systems',
                `Trial expires in ${trial_days} days`
            ]
        });
    } catch (error) {
        console.error('Error onboarding school:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Create school (simple version - kept for backward compatibility)
router.post('/schools', requirePlatformAdmin, async (req, res) => {
    try {
        const { name, email, status = 'active' } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email already exists
        const existing = await dbGet('SELECT id FROM schools WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'School with this email already exists' });
        }

        // Auto-generate unique school code (e.g., WEST-4831)
        const generateSchoolCode = () => {
            const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
            const suffix = Math.floor(1000 + Math.random() * 9000);
            return `${prefix}-${suffix}`;
        };
        
        let school_code = generateSchoolCode();
        let codeExists = await dbGet('SELECT id FROM schools WHERE school_code = ?', [school_code]);
        while (codeExists) {
            school_code = generateSchoolCode();
            codeExists = await dbGet('SELECT id FROM schools WHERE school_code = ?', [school_code]);
        }

        const result = await dbRun(
            `INSERT INTO schools (name, email, code, school_code, status, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [name, email, school_code, school_code, status]
        );

        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [result.id]);
        res.status(201).json(school);
    } catch (error) {
        console.error('Error creating school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update school
router.put('/schools/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { name, email, status } = req.body;

        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [req.params.id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== school.email) {
            const existing = await dbGet('SELECT id FROM schools WHERE email = ? AND id != ?', [email, req.params.id]);
            if (existing) {
                return res.status(400).json({ error: 'School with this email already exists' });
            }
        }

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);
        await dbRun(
            `UPDATE schools SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const updatedSchool = await dbGet('SELECT * FROM schools WHERE id = ?', [req.params.id]);
        res.json(updatedSchool);
    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete school
router.delete('/schools/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [req.params.id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Check if school has users or students
        const userCount = await dbGet('SELECT COUNT(*) as count FROM users WHERE school_id = ?', [req.params.id]);
        const studentCount = await dbGet('SELECT COUNT(*) as count FROM students WHERE school_id = ?', [req.params.id]);

        if (userCount?.count > 0 || studentCount?.count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete school with existing users or students. Please deactivate instead.' 
            });
        }

        await dbRun('DELETE FROM schools WHERE id = ?', [req.params.id]);
        res.json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get school analytics with engagement metrics
router.get('/schools/:id/analytics', requirePlatformAdmin, async (req, res) => {
    try {
        const { range = '30d' } = req.query;
        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [req.params.id]);
        
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Calculate date range
        const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
        const days = daysMap[range] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get login activity
        const loginLast7Days = await dbGet(
            `SELECT COUNT(DISTINCT user_id) as count FROM activity_logs 
             WHERE school_id = ? AND action = 'login' AND created_at >= ?`,
            [req.params.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()]
        );

        const loginLast30Days = await dbGet(
            `SELECT COUNT(DISTINCT user_id) as count FROM activity_logs 
             WHERE school_id = ? AND action = 'login' AND created_at >= ?`,
            [req.params.id, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()]
        );

        // Get last activity timestamp
        const lastActivity = await dbGet(
            `SELECT MAX(created_at) as last_activity FROM activity_logs WHERE school_id = ?`,
            [req.params.id]
        );

        // Get engagement metrics for the range
        const incidentsInRange = await dbGet(
            `SELECT COUNT(*) as count FROM behaviour_incidents 
             WHERE school_id = ? AND created_at >= ?`,
            [req.params.id, startDate.toISOString()]
        );

        const meritsInRange = await dbGet(
            `SELECT COUNT(*) as count FROM merits 
             WHERE school_id = ? AND created_at >= ?`,
            [req.params.id, startDate.toISOString()]
        );

        const attendanceInRange = await dbGet(
            `SELECT COUNT(*) as count FROM attendance 
             WHERE school_id = ? AND date >= ?`,
            [req.params.id, startDate.toISOString()]
        );

        // Get active users (logged in within range)
        const activeUsers = await dbGet(
            `SELECT COUNT(DISTINCT user_id) as count FROM activity_logs 
             WHERE school_id = ? AND created_at >= ?`,
            [req.params.id, startDate.toISOString()]
        );

        // Calculate engagement score (0-100)
        const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users WHERE school_id = ?', [req.params.id]);
        const engagementRate = totalUsers?.count > 0 
            ? Math.round((activeUsers?.count || 0) / totalUsers.count * 100) 
            : 0;

        // Get daily activity trend
        const dailyActivity = await dbAll(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM activity_logs 
             WHERE school_id = ? AND created_at >= ?
             GROUP BY DATE(created_at)
             ORDER BY date DESC
             LIMIT 30`,
            [req.params.id, startDate.toISOString()]
        );

        res.json({
            school_id: school.id,
            school_name: school.name,
            range,
            last_activity: lastActivity?.last_activity || null,
            logins: {
                last_7_days: parseInt(loginLast7Days?.count || 0),
                last_30_days: parseInt(loginLast30Days?.count || 0)
            },
            engagement: {
                active_users: parseInt(activeUsers?.count || 0),
                total_users: parseInt(totalUsers?.count || 0),
                engagement_rate: engagementRate,
                score: engagementRate
            },
            activity: {
                incidents: parseInt(incidentsInRange?.count || 0),
                merits: parseInt(meritsInRange?.count || 0),
                attendance_records: parseInt(attendanceInRange?.count || 0)
            },
            daily_trend: dailyActivity || []
        });
    } catch (error) {
        console.error('Error fetching school analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk update school status
router.put('/schools/bulk/status', requirePlatformAdmin, async (req, res) => {
    try {
        const { school_ids, status } = req.body;

        if (!school_ids || !Array.isArray(school_ids) || school_ids.length === 0) {
            return res.status(400).json({ error: 'School IDs array is required' });
        }

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Valid status (active/inactive) is required' });
        }

        const placeholders = school_ids.map(() => '?').join(',');
        await dbRun(
            `UPDATE schools SET status = ? WHERE id IN (${placeholders})`,
            [status, ...school_ids]
        );

        res.json({ message: `Updated ${school_ids.length} schools to ${status}` });
    } catch (error) {
        console.error('Error bulk updating schools:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update school subscription
router.put('/schools/:id/subscription', requirePlatformAdmin, async (req, res) => {
    try {
        const { plan_id, start_date, end_date, status } = req.body;

        if (!plan_id) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        await dbRun(
            `INSERT INTO school_subscriptions (school_id, plan_id, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, plan_id, start_date || new Date().toISOString(), end_date || null, status || 'active']
        );

        const subscription = await dbGet(
            'SELECT * FROM school_subscriptions WHERE school_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.params.id]
        );

        res.json(subscription);
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get school branding
router.get('/schools/:id/branding', requirePlatformAdmin, async (req, res) => {
    try {
        const branding = await dbGet(
            'SELECT * FROM school_branding WHERE school_id = ? ORDER BY updated_at DESC LIMIT 1',
            [req.params.id]
        );

        if (!branding) {
            return res.json({
                school_id: req.params.id,
                primary_color: '#3B82F6',
                secondary_color: '#8B5CF6',
                logo_url: null,
                is_default: true
            });
        }

        res.json(branding);
    } catch (error) {
        console.error('Error fetching branding:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update school branding with versioning
router.put('/schools/:id/branding', requirePlatformAdmin, async (req, res) => {
    try {
        const { primary_color, secondary_color, logo_url } = req.body;

        // Get current branding for history
        const currentBranding = await dbGet(
            'SELECT * FROM school_branding WHERE school_id = ? ORDER BY updated_at DESC LIMIT 1',
            [req.params.id]
        );

        // Save current branding to history if it exists
        if (currentBranding) {
            await dbRun(
                `INSERT INTO school_branding_history (school_id, primary_color, secondary_color, logo_url, updated_by, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    currentBranding.primary_color,
                    currentBranding.secondary_color,
                    currentBranding.logo_url,
                    currentBranding.updated_by,
                    currentBranding.updated_at
                ]
            );
        }

        // Update or insert new branding
        if (currentBranding) {
            await dbRun(
                `UPDATE school_branding 
                 SET primary_color = ?, secondary_color = ?, logo_url = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE school_id = ?`,
                [primary_color, secondary_color, logo_url, req.platformAdmin.userId, req.params.id]
            );
        } else {
            await dbRun(
                `INSERT INTO school_branding (school_id, primary_color, secondary_color, logo_url, updated_by, updated_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [req.params.id, primary_color, secondary_color, logo_url, req.platformAdmin.userId]
            );
        }

        // Log the change
        await dbRun(
            `INSERT INTO activity_logs (school_id, user_id, action, details, created_at)
             VALUES (?, ?, 'branding_updated', ?, CURRENT_TIMESTAMP)`,
            [
                req.params.id,
                req.platformAdmin.userId,
                JSON.stringify({ primary_color, secondary_color, logo_url })
            ]
        );

        const updatedBranding = await dbGet(
            'SELECT * FROM school_branding WHERE school_id = ?',
            [req.params.id]
        );

        res.json(updatedBranding);
    } catch (error) {
        console.error('Error updating branding:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get branding history
router.get('/schools/:id/branding/history', requirePlatformAdmin, async (req, res) => {
    try {
        const history = await dbAll(
            `SELECT h.*, u.name as updated_by_name 
             FROM school_branding_history h
             LEFT JOIN platform_users u ON h.updated_by = u.id
             WHERE h.school_id = ?
             ORDER BY h.updated_at DESC
             LIMIT 20`,
            [req.params.id]
        );

        res.json(history || []);
    } catch (error) {
        console.error('Error fetching branding history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Revert to default branding
router.post('/schools/:id/branding/revert', requirePlatformAdmin, async (req, res) => {
    try {
        const defaultBranding = {
            primary_color: '#3B82F6',
            secondary_color: '#8B5CF6',
            logo_url: null
        };

        // Get current branding for history
        const currentBranding = await dbGet(
            'SELECT * FROM school_branding WHERE school_id = ?',
            [req.params.id]
        );

        if (currentBranding) {
            // Save to history
            await dbRun(
                `INSERT INTO school_branding_history (school_id, primary_color, secondary_color, logo_url, updated_by, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    currentBranding.primary_color,
                    currentBranding.secondary_color,
                    currentBranding.logo_url,
                    currentBranding.updated_by,
                    currentBranding.updated_at
                ]
            );

            // Update to default
            await dbRun(
                `UPDATE school_branding 
                 SET primary_color = ?, secondary_color = ?, logo_url = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE school_id = ?`,
                [defaultBranding.primary_color, defaultBranding.secondary_color, defaultBranding.logo_url, req.platformAdmin.userId, req.params.id]
            );
        }

        // Log the change
        await dbRun(
            `INSERT INTO activity_logs (school_id, user_id, action, details, created_at)
             VALUES (?, ?, 'branding_reverted', ?, CURRENT_TIMESTAMP)`,
            [req.params.id, req.platformAdmin.userId, JSON.stringify(defaultBranding)]
        );

        res.json({ ...defaultBranding, school_id: req.params.id, is_default: true });
    } catch (error) {
        console.error('Error reverting branding:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get platform analytics
router.get('/analytics', requirePlatformAdmin, async (req, res) => {
    try {
        const { start_date, end_date, school_id } = req.query;

        // Get basic counts
        let totalSchools = 0;
        let activeSchools = 0;
        let totalUsers = 0;
        let totalStudents = 0;
        let totalRevenue = 0;
        let revenueByMonth = [];
        let schoolsByStatus = [];
        let usersByRole = [];

        try {
            const totalSchoolsResult = await pool.query('SELECT COUNT(*) as count FROM public.schools');
            totalSchools = parseInt(totalSchoolsResult.rows[0]?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching total schools:', err.message);
        }

        try {
            const activeSchoolsResult = await pool.query("SELECT COUNT(*) as count FROM public.schools WHERE status = 'active'");
            activeSchools = parseInt(activeSchoolsResult.rows[0]?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching active schools:', err.message);
        }

        try {
            const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM public.users');
            totalUsers = parseInt(totalUsersResult.rows[0]?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching total users:', err.message);
        }

        try {
            // Get all active schools and count students from each schema
            const schools = await pool.query("SELECT schema_name FROM public.schools WHERE status = 'active'");
            let studentCount = 0;
            
            for (const school of schools.rows) {
                try {
                    const result = await pool.query(`SELECT COUNT(*) as count FROM ${school.schema_name}.students`);
                    studentCount += parseInt(result.rows[0]?.count || 0, 10);
                } catch (schemaErr) {
                    console.error(`Error counting students in ${school.schema_name}:`, schemaErr.message);
                }
            }
            totalStudents = studentCount;
        } catch (err) {
            console.error('Error fetching total students:', err.message);
        }

        try {
            const totalRevenueResult = await pool.query(`
                SELECT COALESCE(SUM(sp.price), 0) as total 
                FROM public.school_subscriptions ss
                INNER JOIN public.subscription_plans sp ON ss.plan_id = sp.id
                WHERE ss.status = 'active'
            `);
            totalRevenue = parseFloat(totalRevenueResult.rows[0]?.total || 0);
        } catch (err) {
            console.error('Error fetching total revenue:', err.message);
        }

        // Revenue by month - use a simpler approach
        try {
            let revenueQuery = `
                SELECT 
                    TO_CHAR(ss.created_at, 'YYYY-MM') as month, 
                    COALESCE(SUM(sp.price), 0) as revenue
                FROM school_subscriptions ss
                INNER JOIN subscription_plans sp ON ss.plan_id = sp.id
                WHERE 1=1
            `;
            const params = [];

            if (start_date) {
                revenueQuery += ' AND ss.created_at >= ?';
                params.push(start_date);
            }
            if (end_date) {
                revenueQuery += ' AND ss.created_at <= ?';
                params.push(end_date);
            }
            if (school_id) {
                revenueQuery += ' AND ss.school_id = ?';
                params.push(school_id);
            }

            revenueQuery += ' GROUP BY TO_CHAR(ss.created_at, \'YYYY-MM\') ORDER BY month';

            const revenueByMonthRaw = await pool.query(revenueQuery, params);
            revenueByMonth = (revenueByMonthRaw.rows || []).map((item) => ({
                month: item.month || '',
                revenue: parseFloat(String(item.revenue || 0))
            }));
        } catch (err) {
            console.error('Error fetching revenue by month:', err.message);
            console.error('SQL Error details:', err);
            revenueByMonth = [];
        }

        // Schools by status
        try {
            const schoolsByStatusRaw = await pool.query(`
                SELECT status, COUNT(*) as count
                FROM public.schools
                GROUP BY status
            `);
            schoolsByStatus = (schoolsByStatusRaw.rows || []).map((item) => ({
                status: item.status || '',
                count: parseInt(String(item.count || 0), 10)
            }));
        } catch (err) {
            console.error('Error fetching schools by status:', err.message);
            schoolsByStatus = [];
        }

        // Users by role
        try {
            const usersByRoleRaw = await pool.query(`
                SELECT role, COUNT(*) as count
                FROM public.users
                GROUP BY role
            `);
            usersByRole = (usersByRoleRaw.rows || []).map((item) => ({
                role: item.role || '',
                count: parseInt(String(item.count || 0), 10)
            }));
        } catch (err) {
            console.error('Error fetching users by role:', err.message);
            usersByRole = [];
        }

        // Get top schools by student count
        let topSchools = [];
        try {
            const schools = await pool.query("SELECT id, name, schema_name, status FROM public.schools WHERE status = 'active' ORDER BY created_at DESC");
            const schoolsWithStudents = [];
            
            for (const school of schools.rows) {
                try {
                    const result = await pool.query(`SELECT COUNT(*) as count FROM ${school.schema_name}.students`);
                    const studentCount = parseInt(result.rows[0]?.count || 0, 10);
                    schoolsWithStudents.push({
                        name: school.name,
                        students: studentCount,
                        plan: null, // No subscription data yet
                        growth: null
                    });
                } catch (schemaErr) {
                    console.error(`Error counting students in ${school.schema_name}:`, schemaErr.message);
                }
            }
            
            // Sort by student count and take top 4
            topSchools = schoolsWithStudents.sort((a, b) => b.students - a.students).slice(0, 4);
        } catch (err) {
            console.error('Error fetching top schools:', err.message);
        }

        res.json({
            total_schools: totalSchools,
            active_schools: activeSchools,
            total_users: totalUsers,
            total_students: totalStudents,
            total_revenue: totalRevenue,
            revenue_by_month: revenueByMonth,
            schools_by_status: schoolsByStatus,
            users_by_role: usersByRole,
            top_schools: topSchools,
            recent_activity: [] // No activity tracking yet
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get billing information
router.get('/billing', requirePlatformAdmin, async (req, res) => {
    try {
        const { school_id, start_date, end_date } = req.query;

        let query = `
            SELECT ss.*, s.name as school_name, sp.name as plan_name, sp.price
            FROM school_subscriptions ss
            INNER JOIN schools s ON ss.school_id = s.id
            INNER JOIN subscription_plans sp ON ss.plan_id = sp.id
            WHERE 1=1
        `;
        const params = [];

        if (school_id) {
            query += ' AND ss.school_id = ?';
            params.push(school_id);
        }
        if (start_date) {
            query += ' AND ss.created_at >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND ss.created_at <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY ss.created_at DESC';

        const subscriptions = await dbAll(query, params);

        // Calculate totals
        const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0);

        res.json({
            subscriptions,
            total_revenue: totalRevenue,
            count: subscriptions.length
        });
    } catch (error) {
        console.error('Error fetching billing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get activity logs
router.get('/logs', requirePlatformAdmin, async (req, res) => {
    try {
        const { action_type, entity_type, start_date, end_date, limit = 100 } = req.query;

        let query = `
            SELECT * FROM platform_logs
            WHERE 1=1
        `;
        const params = [];

        if (action_type) {
            query += ' AND action_type = ?';
            params.push(action_type);
        }
        if (entity_type) {
            query += ' AND entity_type = ?';
            params.push(entity_type);
        }
        if (start_date) {
            query += ' AND created_at >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND created_at <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const logs = await dbAll(query, params);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Platform User Management
// Get all platform users
router.get('/users', requirePlatformAdmin, async (req, res) => {
    try {
        const users = await dbAll('SELECT id, name, email, is_active, created_at, last_login FROM platform_users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error('Error fetching platform users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get platform user profile
router.get('/users/profile', requirePlatformAdmin, async (req, res) => {
    try {
        const userId = req.platformAdmin.userId;
        const user = await dbGet('SELECT id, name, email, created_at, last_login FROM platform_users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching platform user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update platform user profile
router.put('/users/profile', requirePlatformAdmin, async (req, res) => {
    try {
        const userId = req.platformAdmin.userId;
        const { name, email } = req.body;

        const user = await dbGet('SELECT * FROM platform_users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existing = await dbGet('SELECT id FROM platform_users WHERE email = ? AND id != ?', [email, userId]);
            if (existing) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(userId);
        await dbRun(
            `UPDATE platform_users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const updatedUser = await dbGet('SELECT id, name, email, created_at, last_login FROM platform_users WHERE id = ?', [userId]);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating platform user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change platform user password
router.put('/users/password', requirePlatformAdmin, async (req, res) => {
    try {
        const userId = req.platformAdmin.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const user = await dbGet('SELECT * FROM platform_users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // DUAL PASSWORD VERIFICATION: Check both normal and HTML-escaped versions
        // This handles passwords that were stored during the HTML escaping bug period
        // Once user changes password, new one will be stored correctly (no escaping)
        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        
        // If normal verification fails, try escaped version (backward compatibility)
        let escapedPasswordMatch = false;
        if (!passwordMatch) {
            const validator = require('validator');
            const escapedPassword = validator.escape(currentPassword);
            // Only try escaped version if it's different from original
            if (escapedPassword !== currentPassword) {
                escapedPasswordMatch = await bcrypt.compare(escapedPassword, user.password_hash);
            }
        }

        if (!passwordMatch && !escapedPasswordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await dbRun('UPDATE platform_users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create platform user
router.post('/users', requirePlatformAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const existing = await dbGet('SELECT id FROM platform_users WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await dbRun(
            `INSERT INTO platform_users (name, email, password_hash, is_active, created_at)
             VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [name, email, hashedPassword]
        );

        const user = await dbGet('SELECT id, name, email, is_active, created_at FROM platform_users WHERE id = ?', [result.id]);
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating platform user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update platform user
router.put('/users/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { name, email, is_active } = req.body;

        const user = await dbGet('SELECT * FROM platform_users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existing = await dbGet('SELECT id FROM platform_users WHERE email = ? AND id != ?', [email, req.params.id]);
            if (existing) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);
        await dbRun(
            `UPDATE platform_users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const updatedUser = await dbGet('SELECT id, name, email, is_active, created_at, last_login FROM platform_users WHERE id = ?', [req.params.id]);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating platform user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete platform user
router.delete('/users/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const userId = req.platformAdmin.userId;
        if (req.params.id === userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await dbGet('SELECT * FROM platform_users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await dbRun('DELETE FROM platform_users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting platform user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

