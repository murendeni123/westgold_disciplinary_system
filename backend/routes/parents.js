const express = require('express');
const { dbGet, dbRun, dbAll } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all parents (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const parents = await dbAll(`
            SELECT u.id, u.email, u.name, u.role, u.created_at,
                   (SELECT COUNT(*) FROM students WHERE parent_id = u.id) as children_count
            FROM users u
            WHERE u.role = 'parent'
            ORDER BY u.name
        `);
        
        // Get children for each parent
        for (const parent of parents) {
            const children = await dbAll(`
                SELECT s.*, c.class_name 
                FROM students s 
                LEFT JOIN classes c ON s.class_id = c.id 
                WHERE s.parent_id = ?
            `, [parent.id]);
            parent.children = children;
        }
        
        res.json(parents);
    } catch (error) {
        console.error('Error fetching parents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current linked school for debugging
router.get('/my-school', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        if (!req.user.school_id) {
            return res.json({ school: null, message: 'No school linked yet' });
        }

        const school = await dbGet(
            'SELECT id, name, code FROM schools WHERE id = $1',
            [req.user.school_id]
        );

        res.json({ school });
    } catch (error) {
        console.error('Error fetching my school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all schools linked to parent - MUST BE BEFORE /:id route
router.get('/linked-schools', authenticateToken, async (req, res) => {
    try {
        console.log('✅ Linked-schools endpoint reached - User:', req.user.email, 'Role:', req.user.role);
        
        // Check role manually
        if (req.user.role !== 'parent') {
            console.log('❌ Role check failed - Expected: parent, Got:', req.user.role);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        let schools = [];
        // Simplified: just return empty array for now to avoid errors
        // TODO: Implement proper school linking logic when user_schools table is ready
        res.json(schools);
    } catch (error) {
        console.error('Error fetching linked schools:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get parent by ID (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const parent = await dbGet('SELECT * FROM users WHERE id = ? AND role = ?', [req.params.id, 'parent']);
        
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }
        
        const children = await dbAll(`
            SELECT s.*, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id 
            WHERE s.parent_id = ?
        `, [req.params.id]);
        
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
        const { link_code } = req.body;

        if (!link_code) {
            return res.status(400).json({ error: 'Link code is required' });
        }

        // Find student by link code (case-insensitive)
        const student = await dbGet(
            'SELECT id, student_number, first_name, last_name, school_id FROM students WHERE LOWER(parent_link_code) = LOWER($1)',
            [link_code]
        );

        if (!student) {
            return res.status(404).json({ error: 'Invalid link code. Please check and try again.' });
        }

        // Check if parent has linked a school
        if (!req.user.school_id) {
            return res.status(400).json({ 
                error: 'You must link a school first before linking a child. Please go to "Link School" and link your school.' 
            });
        }

        // Check if student belongs to the same school as the parent
        if (student.school_id && student.school_id !== req.user.school_id) {
            return res.status(403).json({ 
                error: 'This child belongs to a different school. Please link that school first before linking this child.' 
            });
        }

        // Create parent-student link in junction table (ON CONFLICT DO NOTHING)
        await dbRun(
            `INSERT INTO parent_students (parent_id, student_id, created_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (parent_id, student_id) DO NOTHING`,
            [req.user.id, student.id]
        );

        res.json({ 
            success: true, 
            message: 'Child linked successfully', 
            student: {
                id: student.id,
                student_number: student.student_number,
                first_name: student.first_name,
                last_name: student.last_name
            }
        });
    } catch (error) {
        console.error('Link child failed:', error);
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? `Internal server error: ${error.message}` 
            : 'Internal server error';
        res.status(500).json({ error: errorMessage });
    }
});

// Link school by code
router.post('/link-school', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'School code is required' });
        }

        // Lookup school by code (case-insensitive)
        const school = await dbGet(
            'SELECT id, name, code FROM schools WHERE code ILIKE $1',
            [code]
        );

        if (!school) {
            console.error('School not found for code:', code);
            return res.status(404).json({ error: 'Invalid school code' });
        }

        console.log('✅ School found:', school.name, '(ID:', school.id, ') for code:', code);

        // Insert membership into user_schools (ON CONFLICT DO NOTHING)
        console.log('📝 Inserting into user_schools - user_id:', req.user.id, 'school_id:', school.id);
        await dbRun(
            `INSERT INTO user_schools (user_id, school_id, created_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (user_id, school_id) DO NOTHING`,
            [req.user.id, school.id]
        );
        console.log('✅ user_schools insert successful');

        // Update user_profiles.school_id
        console.log('📝 Updating user_profiles.school_id for user:', req.user.id);
        await dbRun(
            'UPDATE user_profiles SET school_id = $1 WHERE id = $2',
            [school.id, req.user.id]
        );
        console.log('✅ user_profiles.school_id updated successfully');

        console.log('🎉 School linked successfully for user:', req.user.id);

        res.json({ 
            success: true, 
            school: {
                id: school.id,
                name: school.name,
                code: school.code
            }
        });
    } catch (error) {
        console.error('Link school failed:', error);
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? `Internal server error: ${error.message}` 
            : 'Internal server error';
        res.status(500).json({ error: errorMessage });
    }
});

// Switch active school
router.post('/switch-school', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { school_id } = req.body;

        if (!school_id) {
            return res.status(400).json({ error: 'School ID is required' });
        }

        // Verify the school exists and user has access to it
        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [school_id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        // Check if user is linked to this school
        let hasAccess = false;
        try {
            const link = await dbGet(
                'SELECT * FROM user_schools WHERE user_id = ? AND school_id = ?',
                [req.user.id, school_id]
            );
            hasAccess = !!link;
        } catch (err) {
            // If user_schools doesn't exist, check via children
            const child = await dbGet(
                'SELECT * FROM students WHERE parent_id = ? AND school_id = ? LIMIT 1',
                [req.user.id, school_id]
            );
            hasAccess = !!child;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'You are not linked to this school' });
        }

        // Update user's current school_id
        await dbRun(
            'UPDATE users SET school_id = ? WHERE id = ?',
            [school_id, req.user.id]
        );

        res.json({ message: 'School switched successfully', school });
    } catch (error) {
        console.error('Error switching school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;



