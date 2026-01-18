const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

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
                'SELECT * FROM platform_users WHERE email = ? AND is_active = 1',
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
            max_students_per_school: 10000,
            goldie_badge_enabled: 1,
            goldie_badge_threshold: 10
        });
    } catch (error) {
        console.error('Error fetching platform settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update platform settings
router.put('/settings', requirePlatformAdmin, async (req, res) => {
    try {
        const { platform_name, support_email, max_schools, max_students_per_school, goldie_badge_enabled, goldie_badge_threshold } = req.body;

        const existing = await dbGet('SELECT id FROM platform_settings WHERE id = 1');
        
        if (existing) {
            await dbRun(
                `UPDATE platform_settings 
                 SET platform_name = ?, support_email = ?, max_schools = ?, max_students_per_school = ?,
                     goldie_badge_enabled = ?, goldie_badge_threshold = ?
                 WHERE id = 1`,
                [platform_name, support_email, max_schools, max_students_per_school, 
                 goldie_badge_enabled !== undefined ? (goldie_badge_enabled ? 1 : 0) : 1,
                 goldie_badge_threshold || 10]
            );
        } else {
            await dbRun(
                `INSERT INTO platform_settings (id, platform_name, support_email, max_schools, max_students_per_school, goldie_badge_enabled, goldie_badge_threshold)
                 VALUES (1, ?, ?, ?, ?, ?, ?)`,
                [platform_name, support_email, max_schools, max_students_per_school,
                 goldie_badge_enabled !== undefined ? (goldie_badge_enabled ? 1 : 0) : 1,
                 goldie_badge_threshold || 10]
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
                   (SELECT COUNT(*) FROM users WHERE school_id = s.id) as user_count,
                   (SELECT COUNT(*) FROM students WHERE school_id = s.id) as student_count
            FROM schools s
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        if (search) {
            query += ' AND (s.name LIKE ? OR s.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (start_date) {
            query += ' AND s.created_at >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND s.created_at <= ?';
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
        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [req.params.id]);
        
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

// Create school
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

        const result = await dbRun(
            `INSERT INTO schools (name, email, status, created_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [name, email, status]
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
            const totalSchoolsResult = await dbGet('SELECT COUNT(*) as count FROM schools');
            totalSchools = parseInt(totalSchoolsResult?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching total schools:', err.message);
        }

        try {
            const activeSchoolsResult = await dbGet("SELECT COUNT(*) as count FROM schools WHERE status = 'active'");
            activeSchools = parseInt(activeSchoolsResult?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching active schools:', err.message);
        }

        try {
            const totalUsersResult = await dbGet('SELECT COUNT(*) as count FROM users');
            totalUsers = parseInt(totalUsersResult?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching total users:', err.message);
        }

        try {
            const totalStudentsResult = await dbGet('SELECT COUNT(*) as count FROM students');
            totalStudents = parseInt(totalStudentsResult?.count || 0, 10);
        } catch (err) {
            console.error('Error fetching total students:', err.message);
        }

        try {
            const totalRevenueResult = await dbGet(`
                SELECT COALESCE(SUM(sp.price), 0) as total 
                FROM school_subscriptions ss
                INNER JOIN subscription_plans sp ON ss.plan_id = sp.id
                WHERE ss.status = 'active'
            `);
            totalRevenue = parseFloat(totalRevenueResult?.total || 0);
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

            const revenueByMonthRaw = await dbAll(revenueQuery, params);
            revenueByMonth = (revenueByMonthRaw || []).map((item) => ({
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
            const schoolsByStatusRaw = await dbAll(`
                SELECT status, COUNT(*) as count
                FROM schools
                GROUP BY status
            `);
            schoolsByStatus = (schoolsByStatusRaw || []).map((item) => ({
                status: item.status || '',
                count: parseInt(String(item.count || 0), 10)
            }));
        } catch (err) {
            console.error('Error fetching schools by status:', err.message);
            schoolsByStatus = [];
        }

        // Users by role
        try {
            const usersByRoleRaw = await dbAll(`
                SELECT role, COUNT(*) as count
                FROM users
                GROUP BY role
            `);
            usersByRole = (usersByRoleRaw || []).map((item) => ({
                role: item.role || '',
                count: parseInt(String(item.count || 0), 10)
            }));
        } catch (err) {
            console.error('Error fetching users by role:', err.message);
            usersByRole = [];
        }

        res.json({
            total_schools: totalSchools,
            active_schools: activeSchools,
            total_users: totalUsers,
            total_students: totalStudents,
            total_revenue: totalRevenue,
            revenue_by_month: revenueByMonth,
            schools_by_status: schoolsByStatus,
            users_by_role: usersByRole
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

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
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

// ==================== FEATURE FLAGS ====================

// Get all feature flags for all schools
router.get('/feature-flags', requirePlatformAdmin, async (req, res) => {
    try {
        const flags = await dbAll(`
            SELECT sff.*, s.name as school_name, s.code as school_code
            FROM school_feature_flags sff
            INNER JOIN schools s ON sff.school_id = s.id
            ORDER BY s.name, sff.feature_name
        `);
        res.json(flags);
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get feature flags for a specific school
router.get('/feature-flags/:schoolId', requirePlatformAdmin, async (req, res) => {
    try {
        const flags = await dbAll(
            'SELECT * FROM school_feature_flags WHERE school_id = ? ORDER BY feature_name',
            [req.params.schoolId]
        );
        res.json(flags);
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific feature flag for a school
router.get('/feature-flags/:schoolId/:featureName', requirePlatformAdmin, async (req, res) => {
    try {
        const flag = await dbGet(
            'SELECT * FROM school_feature_flags WHERE school_id = ? AND feature_name = ?',
            [req.params.schoolId, req.params.featureName]
        );
        
        if (!flag) {
            // Return default (disabled) if not found
            return res.json({ 
                school_id: parseInt(req.params.schoolId), 
                feature_name: req.params.featureName, 
                is_enabled: false 
            });
        }
        
        res.json(flag);
    } catch (error) {
        console.error('Error fetching feature flag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle feature flag for a school
router.post('/feature-flags/:schoolId/:featureName', requirePlatformAdmin, async (req, res) => {
    try {
        const { is_enabled } = req.body;
        const schoolId = req.params.schoolId;
        const featureName = req.params.featureName;

        if (is_enabled === undefined) {
            return res.status(400).json({ error: 'is_enabled is required' });
        }

        // Check if school exists
        const school = await dbGet('SELECT id FROM schools WHERE id = ?', [schoolId]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Check if flag exists
        const existingFlag = await dbGet(
            'SELECT * FROM school_feature_flags WHERE school_id = ? AND feature_name = ?',
            [schoolId, featureName]
        );

        if (existingFlag) {
            // Update existing flag
            await dbRun(
                'UPDATE school_feature_flags SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [is_enabled, existingFlag.id]
            );
        } else {
            // Create new flag
            await dbRun(
                'INSERT INTO school_feature_flags (school_id, feature_name, is_enabled) VALUES (?, ?, ?)',
                [schoolId, featureName, is_enabled]
            );
        }

        const updatedFlag = await dbGet(
            'SELECT * FROM school_feature_flags WHERE school_id = ? AND feature_name = ?',
            [schoolId, featureName]
        );

        res.json(updatedFlag);
    } catch (error) {
        console.error('Error toggling feature flag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk toggle feature for all schools
router.post('/feature-flags/bulk/:featureName', requirePlatformAdmin, async (req, res) => {
    try {
        const { is_enabled, school_ids } = req.body;
        const featureName = req.params.featureName;

        if (is_enabled === undefined) {
            return res.status(400).json({ error: 'is_enabled is required' });
        }

        let schoolsToUpdate = [];
        
        if (school_ids && Array.isArray(school_ids)) {
            // Update specific schools
            schoolsToUpdate = school_ids;
        } else {
            // Update all schools
            const schools = await dbAll('SELECT id FROM schools');
            schoolsToUpdate = schools.map(s => s.id);
        }

        let updatedCount = 0;
        for (const schoolId of schoolsToUpdate) {
            const existingFlag = await dbGet(
                'SELECT * FROM school_feature_flags WHERE school_id = ? AND feature_name = ?',
                [schoolId, featureName]
            );

            if (existingFlag) {
                await dbRun(
                    'UPDATE school_feature_flags SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [is_enabled, existingFlag.id]
                );
            } else {
                await dbRun(
                    'INSERT INTO school_feature_flags (school_id, feature_name, is_enabled) VALUES (?, ?, ?)',
                    [schoolId, featureName, is_enabled]
                );
            }
            updatedCount++;
        }

        res.json({ 
            message: `Feature ${featureName} ${is_enabled ? 'enabled' : 'disabled'} for ${updatedCount} schools`,
            updated_count: updatedCount 
        });
    } catch (error) {
        console.error('Error bulk toggling feature:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

