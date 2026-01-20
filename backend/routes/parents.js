const express = require('express');
const { dbGet, dbRun, dbAll } = require('../database/db');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get parent profile (current user)
router.get('/profile/me', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const profile = await dbGet(
            `SELECT id, email, name, role FROM users WHERE id = $1 AND role = 'parent'`,
            [req.user.id]
        );

        if (!profile) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching parent profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update parent profile (current user)
router.put('/profile/me', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        const existingUser = await dbGet('SELECT id FROM public.users WHERE email = $1 AND id != $2', [email, req.user.id]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        await dbRun('UPDATE public.users SET name = $1, email = $2 WHERE id = $3', [name, email, req.user.id]);

        const updatedProfile = await dbGet(
            `SELECT id, email, name, role FROM public.users WHERE id = $1 AND role = 'parent'`,
            [req.user.id]
        );

        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating parent profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all parents (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Get parents who have children in this school's schema
        const parents = await schemaAll(req, `
            SELECT DISTINCT u.id, u.email, u.name, u.role, u.created_at,
                   (SELECT COUNT(*) FROM students WHERE parent_id = u.id) as children_count
            FROM public.users u
            INNER JOIN students s ON s.parent_id = u.id
            WHERE u.role = 'parent'
            ORDER BY u.name
        `);
        
        // Get children for each parent
        for (const parent of parents) {
            const children = await schemaAll(req, `
                SELECT s.*, c.class_name 
                FROM students s 
                LEFT JOIN classes c ON s.class_id = c.id 
                WHERE s.parent_id = $1 AND s.is_active = true
            `, [parent.id]);
            parent.children = children;
        }
        
        res.json(parents);
    } catch (error) {
        console.error('Error fetching parents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get parent by ID (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const parent = await dbGet("SELECT * FROM public.users WHERE id = $1 AND role = 'parent'", [req.params.id]);
        
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        // Check if parent has children in this school
        const children = await schemaAll(req, `
            SELECT s.*, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id 
            WHERE s.parent_id = $1 AND s.is_active = true
        `, [req.params.id]);

        if (children.length === 0) {
            return res.status(404).json({ error: 'Parent not found in this school' });
        }
        
        parent.children = children;
        res.json(parent);
    } catch (error) {
        console.error('Error fetching parent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Link child using parent link code
router.post('/link-child', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const { link_code } = req.body;

        if (!link_code) {
            return res.status(400).json({ error: 'Link code is required' });
        }

        const student = await schemaGet(req,
            'SELECT * FROM students WHERE parent_link_code = $1',
            [link_code]
        );

        if (!student) {
            return res.status(404).json({ error: 'Invalid link code' });
        }

        // Update student's parent_id
        await schemaRun(req,
            'UPDATE students SET parent_id = $1 WHERE id = $2',
            [req.user.id, student.id]
        );

        const updatedStudent = await schemaGet(req, 'SELECT * FROM students WHERE id = $1', [student.id]);
        res.json({ message: 'Child linked successfully', student: updatedStudent });
    } catch (error) {
        console.error('Error linking child:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Link school by code
router.post('/link-school', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { school_code } = req.body;

        if (!school_code) {
            return res.status(400).json({ error: 'School code is required' });
        }

        // Try to find school by subdomain or schema_name
        let school = await dbGet('SELECT * FROM public.schools WHERE subdomain = $1 OR schema_name = $1', [school_code]);

        // If not found, try by ID
        if (!school) {
            const numericCode = parseInt(school_code, 10);
            if (!isNaN(numericCode)) {
                school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [numericCode]);
            }
        }

        // Try by name pattern
        if (!school) {
            school = await dbGet('SELECT * FROM public.schools WHERE name ILIKE $1', [`%${school_code}%`]);
        }

        if (!school) {
            return res.status(404).json({ error: 'Invalid school code. Please check and try again.' });
        }

        // Check if user is already linked to this school
        const existingLink = await dbGet(
            'SELECT * FROM public.user_schools WHERE user_id = $1 AND school_id = $2',
            [req.user.id, school.id]
        );

        if (!existingLink) {
            // Create link in user_schools table
            await dbRun(
                'INSERT INTO public.user_schools (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [req.user.id, school.id]
            );
        }

        // Update user's primary school
        await dbRun(
            'UPDATE public.users SET primary_school_id = $1 WHERE id = $2',
            [school.id, req.user.id]
        );

        res.json({ message: 'School linked successfully', school });
    } catch (error) {
        console.error('Error linking school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all schools linked to parent
router.get('/linked-schools', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const schools = await dbAll(
            `SELECT s.id, s.name, s.subdomain, s.schema_name
             FROM public.schools s 
             INNER JOIN public.user_schools us ON s.id = us.school_id 
             WHERE us.user_id = $1`,
            [req.user.id]
        );

        res.json(schools);
    } catch (error) {
        console.error('Error fetching linked schools:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Switch active school
router.post('/switch-school', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { school_id } = req.body;

        if (!school_id) {
            return res.status(400).json({ error: 'School ID is required' });
        }

        // Verify the school exists
        const school = await dbGet('SELECT * FROM public.schools WHERE id = $1', [school_id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Check if user is linked to this school
        const link = await dbGet(
            'SELECT * FROM public.user_schools WHERE user_id = $1 AND school_id = $2',
            [req.user.id, school_id]
        );

        if (!link) {
            return res.status(403).json({ error: 'You are not linked to this school' });
        }

        // Update user's primary school
        await dbRun(
            'UPDATE public.users SET primary_school_id = $1 WHERE id = $2',
            [school_id, req.user.id]
        );

        res.json({ message: 'School switched successfully', school });
    } catch (error) {
        console.error('Error switching school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
