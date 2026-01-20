/**
 * School Onboarding Routes for Platform Admins
 * 
 * Handles the complete school onboarding process including:
 * - Creating new schools with their own schemas
 * - Setting up school admin accounts
 * - Managing school subscriptions
 * - School status management
 */

const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll, dbTransaction } = require('../database/db');
const { createSchoolSchema, generateSchemaName, dropSchoolSchema, getSchemaStats } = require('../database/schemaManager');
const { authenticateToken, generateToken, hashPassword } = require('../middleware/auth');
const { platformAdminOnly } = require('../middleware/schemaContext');

/**
 * POST /api/schools/onboard
 * Create a new school with its own schema
 * Platform admin only
 */
router.post('/onboard', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const {
            name,
            code,
            subdomain,
            email,
            phone,
            address,
            city,
            state,
            postalCode,
            country,
            subscriptionTier,
            maxStudents,
            maxTeachers,
            // Admin user details
            adminName,
            adminEmail,
            adminPassword
        } = req.body;

        // Validate required fields
        if (!name || !code || !adminEmail || !adminName) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'code', 'adminEmail', 'adminName']
            });
        }

        // Validate code format (alphanumeric, 2-10 chars)
        if (!/^[A-Z0-9]{2,10}$/i.test(code)) {
            return res.status(400).json({
                error: 'Invalid school code',
                message: 'Code must be 2-10 alphanumeric characters'
            });
        }

        // Check if code already exists
        const existingCode = await dbGet(
            'SELECT id FROM public.schools WHERE code = $1',
            [code.toUpperCase()]
        );
        if (existingCode) {
            return res.status(409).json({
                error: 'School code already exists',
                message: `A school with code ${code.toUpperCase()} already exists`
            });
        }

        // Check if subdomain already exists
        if (subdomain) {
            const existingSubdomain = await dbGet(
                'SELECT id FROM public.schools WHERE subdomain = $1',
                [subdomain.toLowerCase()]
            );
            if (existingSubdomain) {
                return res.status(409).json({
                    error: 'Subdomain already exists',
                    message: `Subdomain ${subdomain} is already in use`
                });
            }
        }

        // Check if admin email already exists
        const existingUser = await dbGet(
            'SELECT id FROM public.users WHERE email = $1',
            [adminEmail.toLowerCase()]
        );
        if (existingUser) {
            return res.status(409).json({
                error: 'Admin email already exists',
                message: `A user with email ${adminEmail} already exists`
            });
        }

        // Generate schema name
        const schemaName = generateSchemaName(code);

        // Start transaction for school creation
        const result = await dbTransaction(async (client) => {
            // 1. Create school record in public.schools
            const schoolResult = await client.query(`
                INSERT INTO public.schools (
                    name, code, subdomain, email, phone, address, city, state, 
                    postal_code, country, status, schema_name, max_students, 
                    max_teachers, subscription_tier
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id
            `, [
                name,
                code.toUpperCase(),
                subdomain ? subdomain.toLowerCase() : null,
                email,
                phone,
                address,
                city,
                state,
                postalCode,
                country || 'South Africa',
                'active',
                schemaName,
                maxStudents || 1000,
                maxTeachers || 100,
                subscriptionTier || 'trial'
            ]);

            const schoolId = schoolResult.rows[0].id;

            // 2. Create admin user in public.users
            const hashedPassword = await hashPassword(adminPassword || 'ChangeMe123!');
            
            const userResult = await client.query(`
                INSERT INTO public.users (
                    email, password_hash, name, role, primary_school_id, is_active, email_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [
                adminEmail.toLowerCase(),
                hashedPassword,
                adminName,
                'admin',
                schoolId,
                true,
                false
            ]);

            const adminUserId = userResult.rows[0].id;

            // 3. Link admin to school in user_schools
            await client.query(`
                INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
                VALUES ($1, $2, $3, $4)
            `, [adminUserId, schoolId, 'admin', true]);

            // 4. Log the action
            await client.query(`
                INSERT INTO public.platform_logs (
                    action_type, entity_type, entity_id, platform_user_id, school_id, description
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                'school_created',
                'school',
                schoolId,
                req.user.platformUserId || req.user.id,
                schoolId,
                `School "${name}" (${code}) created with admin ${adminEmail}`
            ]);

            return { schoolId, adminUserId, schemaName };
        });

        // 5. Create the school schema (outside transaction for better error handling)
        const schemaResult = await createSchoolSchema(code);
        
        if (!schemaResult.success) {
            // Rollback school creation if schema fails
            await dbRun('DELETE FROM public.schools WHERE id = $1', [result.schoolId]);
            await dbRun('DELETE FROM public.users WHERE id = $1', [result.adminUserId]);
            
            return res.status(500).json({
                error: 'Failed to create school schema',
                message: schemaResult.error
            });
        }

        // 6. Create admin record in school schema
        await dbRun(`
            INSERT INTO teachers (user_id, is_active)
            VALUES ($1, $2)
        `, [result.adminUserId, true], schemaName);

        res.status(201).json({
            success: true,
            message: 'School onboarded successfully',
            school: {
                id: result.schoolId,
                name,
                code: code.toUpperCase(),
                subdomain: subdomain ? subdomain.toLowerCase() : null,
                schemaName: result.schemaName
            },
            admin: {
                id: result.adminUserId,
                email: adminEmail.toLowerCase(),
                name: adminName,
                temporaryPassword: adminPassword ? undefined : 'ChangeMe123!'
            }
        });

    } catch (error) {
        console.error('School onboarding error:', error);
        res.status(500).json({
            error: 'Failed to onboard school',
            message: error.message
        });
    }
});

/**
 * GET /api/schools
 * List all schools (platform admin only)
 */
router.get('/', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM public.user_schools us WHERE us.school_id = s.id) as user_count,
                (SELECT name FROM public.subscription_plans sp WHERE sp.id = 
                    (SELECT plan_id FROM public.school_subscriptions ss WHERE ss.school_id = s.id ORDER BY ss.created_at DESC LIMIT 1)
                ) as plan_name
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
            query += ` AND (s.name ILIKE $${paramIndex} OR s.code ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const schools = await dbAll(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM public.schools WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (status) {
            countQuery += ` AND status = $${countParamIndex++}`;
            countParams.push(status);
        }
        if (search) {
            countQuery += ` AND (name ILIKE $${countParamIndex} OR code ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await dbGet(countQuery, countParams);

        res.json({
            schools,
            pagination: {
                total: parseInt(countResult.total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('List schools error:', error);
        res.status(500).json({ error: 'Failed to list schools' });
    }
});

/**
 * GET /api/schools/:id
 * Get school details with stats
 */
router.get('/:id', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const school = await dbGet(
            'SELECT * FROM public.schools WHERE id = $1',
            [id]
        );

        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Get school stats from schema
        const stats = await getSchemaStats(school.schema_name);

        // Get admin users
        const admins = await dbAll(`
            SELECT u.id, u.email, u.name, u.last_login
            FROM public.users u
            JOIN public.user_schools us ON u.id = us.user_id
            WHERE us.school_id = $1 AND us.role_in_school = 'admin'
        `, [id]);

        // Get subscription info
        const subscription = await dbGet(`
            SELECT ss.*, sp.name as plan_name, sp.features
            FROM public.school_subscriptions ss
            JOIN public.subscription_plans sp ON ss.plan_id = sp.id
            WHERE ss.school_id = $1 AND ss.status = 'active'
            ORDER BY ss.created_at DESC
            LIMIT 1
        `, [id]);

        res.json({
            school,
            stats,
            admins,
            subscription
        });

    } catch (error) {
        console.error('Get school error:', error);
        res.status(500).json({ error: 'Failed to get school details' });
    }
});

/**
 * PATCH /api/schools/:id
 * Update school details
 */
router.patch('/:id', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            phone,
            address,
            city,
            state,
            postalCode,
            country,
            status,
            maxStudents,
            maxTeachers,
            subscriptionTier
        } = req.body;

        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(name); }
        if (email !== undefined) { updates.push(`email = $${paramIndex++}`); params.push(email); }
        if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); params.push(phone); }
        if (address !== undefined) { updates.push(`address = $${paramIndex++}`); params.push(address); }
        if (city !== undefined) { updates.push(`city = $${paramIndex++}`); params.push(city); }
        if (state !== undefined) { updates.push(`state = $${paramIndex++}`); params.push(state); }
        if (postalCode !== undefined) { updates.push(`postal_code = $${paramIndex++}`); params.push(postalCode); }
        if (country !== undefined) { updates.push(`country = $${paramIndex++}`); params.push(country); }
        if (status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(status); }
        if (maxStudents !== undefined) { updates.push(`max_students = $${paramIndex++}`); params.push(maxStudents); }
        if (maxTeachers !== undefined) { updates.push(`max_teachers = $${paramIndex++}`); params.push(maxTeachers); }
        if (subscriptionTier !== undefined) { updates.push(`subscription_tier = $${paramIndex++}`); params.push(subscriptionTier); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        await dbRun(
            `UPDATE public.schools SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            params
        );

        // Log the action
        await dbRun(`
            INSERT INTO public.platform_logs (action_type, entity_type, entity_id, platform_user_id, school_id, description)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'school_updated',
            'school',
            id,
            req.user.platformUserId || req.user.id,
            id,
            `School ${school.name} updated`
        ]);

        const updatedSchool = await dbGet('SELECT * FROM public.schools WHERE id = $1', [id]);
        res.json({ success: true, school: updatedSchool });

    } catch (error) {
        console.error('Update school error:', error);
        res.status(500).json({ error: 'Failed to update school' });
    }
});

/**
 * POST /api/schools/:id/suspend
 * Suspend a school
 */
router.post('/:id/suspend', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        await dbRun(
            'UPDATE public.schools SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['suspended', id]
        );

        // Log the action
        await dbRun(`
            INSERT INTO public.platform_logs (action_type, entity_type, entity_id, platform_user_id, school_id, description, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            'school_suspended',
            'school',
            id,
            req.user.platformUserId || req.user.id,
            id,
            `School ${school.name} suspended`,
            JSON.stringify({ reason })
        ]);

        res.json({ success: true, message: 'School suspended' });

    } catch (error) {
        console.error('Suspend school error:', error);
        res.status(500).json({ error: 'Failed to suspend school' });
    }
});

/**
 * POST /api/schools/:id/activate
 * Activate a suspended school
 */
router.post('/:id/activate', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        await dbRun(
            'UPDATE public.schools SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['active', id]
        );

        // Log the action
        await dbRun(`
            INSERT INTO public.platform_logs (action_type, entity_type, entity_id, platform_user_id, school_id, description)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'school_activated',
            'school',
            id,
            req.user.platformUserId || req.user.id,
            id,
            `School ${school.name} activated`
        ]);

        res.json({ success: true, message: 'School activated' });

    } catch (error) {
        console.error('Activate school error:', error);
        res.status(500).json({ error: 'Failed to activate school' });
    }
});

/**
 * DELETE /api/schools/:id
 * Delete a school and its schema (DANGEROUS - use with caution)
 */
router.delete('/:id', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmCode, forceDelete } = req.body;

        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Require confirmation code (school code)
        if (confirmCode !== school.code) {
            return res.status(400).json({
                error: 'Confirmation required',
                message: 'Please provide the school code to confirm deletion'
            });
        }

        // Drop the schema
        const dropResult = await dropSchoolSchema(school.schema_name, forceDelete);
        if (!dropResult.success) {
            return res.status(400).json({
                error: 'Failed to delete school schema',
                message: dropResult.error
            });
        }

        // Delete related records
        await dbRun('DELETE FROM public.user_schools WHERE school_id = $1', [id]);
        await dbRun('DELETE FROM public.school_subscriptions WHERE school_id = $1', [id]);
        
        // Delete users who only belong to this school
        await dbRun(`
            DELETE FROM public.users 
            WHERE primary_school_id = $1 
            AND id NOT IN (SELECT user_id FROM public.user_schools WHERE school_id != $1)
        `, [id]);

        // Delete the school
        await dbRun('DELETE FROM public.schools WHERE id = $1', [id]);

        // Log the action
        await dbRun(`
            INSERT INTO public.platform_logs (action_type, entity_type, entity_id, platform_user_id, description, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'school_deleted',
            'school',
            id,
            req.user.platformUserId || req.user.id,
            `School ${school.name} (${school.code}) permanently deleted`,
            JSON.stringify({ schoolName: school.name, schoolCode: school.code })
        ]);

        res.json({ success: true, message: 'School permanently deleted' });

    } catch (error) {
        console.error('Delete school error:', error);
        res.status(500).json({ error: 'Failed to delete school' });
    }
});

/**
 * POST /api/schools/:id/add-admin
 * Add an additional admin to a school
 */
router.post('/:id/add-admin', authenticateToken, platformAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, password } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Check if user already exists
        let user = await dbGet('SELECT * FROM public.users WHERE email = $1', [email.toLowerCase()]);
        
        if (user) {
            // Check if already linked to this school
            const existingLink = await dbGet(
                'SELECT * FROM public.user_schools WHERE user_id = $1 AND school_id = $2',
                [user.id, id]
            );
            if (existingLink) {
                return res.status(409).json({ error: 'User is already linked to this school' });
            }
        } else {
            // Create new user
            const hashedPassword = await hashPassword(password || 'ChangeMe123!');
            const userResult = await dbRun(`
                INSERT INTO public.users (email, password_hash, name, role, primary_school_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [email.toLowerCase(), hashedPassword, name, 'admin', id, true]);
            
            user = { id: userResult.id };
        }

        // Link user to school as admin
        await dbRun(`
            INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, school_id) DO UPDATE SET role_in_school = 'admin'
        `, [user.id, id, 'admin', false]);

        // Create teacher record in school schema
        await dbRun(`
            INSERT INTO teachers (user_id, is_active)
            VALUES ($1, $2)
            ON CONFLICT (user_id) DO NOTHING
        `, [user.id, true], school.schema_name);

        res.json({
            success: true,
            message: 'Admin added to school',
            admin: { id: user.id, email: email.toLowerCase(), name }
        });

    } catch (error) {
        console.error('Add admin error:', error);
        res.status(500).json({ error: 'Failed to add admin' });
    }
});

module.exports = router;
