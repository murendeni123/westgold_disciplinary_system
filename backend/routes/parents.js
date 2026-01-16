const express = require('express');
const { dbGet, dbRun, dbAll } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');

const router = express.Router();

// Get parent profile (current user)
router.get('/profile/me', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        console.log('Fetching parent profile for user ID:', req.user.id);
        
        const profile = await dbGet(
            `SELECT u.id, u.email, u.name,
                    p.phone, p.work_phone, p.relationship_to_child,
                    p.emergency_contact_1_name, p.emergency_contact_1_phone,
                    p.emergency_contact_2_name, p.emergency_contact_2_phone,
                    p.home_address, p.city, p.postal_code
             FROM users u
             LEFT JOIN parents p ON p.user_id = u.id
             WHERE u.id = ? AND u.role = 'parent'`,
            [req.user.id]
        );

        console.log('Parent profile data:', profile);

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
        const {
            name,
            email,
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

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        if (!relationship_to_child) {
            return res.status(400).json({ error: 'Relationship to child is required' });
        }

        if (!emergency_contact_1_name || !emergency_contact_1_phone) {
            return res.status(400).json({ error: 'Emergency contact 1 name and phone are required' });
        }

        if (!emergency_contact_2_name || !emergency_contact_2_phone) {
            return res.status(400).json({ error: 'Emergency contact 2 name and phone are required' });
        }

        if (!home_address) {
            return res.status(400).json({ error: 'Home address is required' });
        }

        // Check if email is already taken by another user
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        await dbRun('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);

        // Upsert into parents table
        await dbRun(
            `INSERT INTO parents (
                user_id,
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
                school_id,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                phone = EXCLUDED.phone,
                work_phone = EXCLUDED.work_phone,
                relationship_to_child = EXCLUDED.relationship_to_child,
                emergency_contact_1_name = EXCLUDED.emergency_contact_1_name,
                emergency_contact_1_phone = EXCLUDED.emergency_contact_1_phone,
                emergency_contact_2_name = EXCLUDED.emergency_contact_2_name,
                emergency_contact_2_phone = EXCLUDED.emergency_contact_2_phone,
                home_address = EXCLUDED.home_address,
                city = EXCLUDED.city,
                postal_code = EXCLUDED.postal_code,
                school_id = EXCLUDED.school_id,
                updated_at = CURRENT_TIMESTAMP`,
            [
                req.user.id,
                phone,
                work_phone || null,
                relationship_to_child,
                emergency_contact_1_name,
                emergency_contact_1_phone,
                emergency_contact_2_name,
                emergency_contact_2_phone,
                home_address,
                city || null,
                postal_code || null,
                req.user.school_id || null,
            ]
        );

        const updatedProfile = await dbGet(
            `SELECT u.id, u.email, u.name,
                    p.phone, p.work_phone, p.relationship_to_child,
                    p.emergency_contact_1_name, p.emergency_contact_1_phone,
                    p.emergency_contact_2_name, p.emergency_contact_2_phone,
                    p.home_address, p.city, p.postal_code
             FROM users u
             LEFT JOIN parents p ON p.user_id = u.id
             WHERE u.id = ? AND u.role = 'parent'`,
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
        const schoolId = getSchoolId(req);

        let query = `
            SELECT u.id, u.email, u.name, u.role, u.created_at,
                   (SELECT COUNT(*) FROM students WHERE parent_id = u.id) as children_count
            FROM users u
            WHERE u.role = 'parent'
        `;
        const params = [];

        // Platform admin can view across schools
        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            query += ' AND u.school_id = ?';
            params.push(schoolId);
        }

        query += ' ORDER BY u.name';

        const parents = await dbAll(query, params);
        
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

// Get parent by ID (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const parent = await dbGet('SELECT * FROM users WHERE id = ? AND role = ?', [req.params.id, 'parent']);
        
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (parent.school_id !== schoolId) {
                return res.status(404).json({ error: 'Parent not found' });
            }
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

        const student = await dbGet(
            'SELECT * FROM students WHERE parent_link_code = ?',
            [link_code]
        );

        if (!student) {
            return res.status(404).json({ error: 'Invalid link code' });
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

        // If student has no school_id but parent has one, assign the student to parent's school
        if (!student.school_id && req.user.school_id) {
            await dbRun(
                'UPDATE students SET school_id = ? WHERE id = ?',
                [req.user.school_id, student.id]
            );
        }

        // Update student's parent_id
        await dbRun(
            'UPDATE students SET parent_id = ? WHERE id = ?',
            [req.user.id, student.id]
        );

        const updatedStudent = await dbGet('SELECT * FROM students WHERE id = ?', [student.id]);
        res.json({ message: 'Child linked successfully', student: updatedStudent });
    } catch (error) {
        console.error('Error linking child:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Link school by code only
router.post('/link-school', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { school_code } = req.body;

        if (!school_code) {
            return res.status(400).json({ error: 'School code is required' });
        }

        // Try to find school by code or ID
        let school;

        // First, if the code looks numeric, try it as an ID
        const numericCode = parseInt(school_code, 10);
        if (!isNaN(numericCode)) {
            school = await dbGet('SELECT * FROM schools WHERE id = ?', [numericCode]);
        }

        // If not found or the code is non-numeric, try matching by dedicated code field
        if (!school) {
            try {
                school = await dbGet('SELECT * FROM schools WHERE code = ?', [school_code]);
            } catch (err) {
                console.error('Error looking up school by code:', err);
            }
        }

        // As a final fallback, try matching by name pattern (case-insensitive)
        if (!school) {
            try {
                school = await dbGet('SELECT * FROM schools WHERE name ILIKE ?', [`%${school_code}%`]);
            } catch (err) {
                console.error('Error looking up school by name:', err);
            }
        }

        if (!school) {
            return res.status(404).json({ error: 'Invalid school code. Please check and try again.' });
        }

        // Check if user is already linked to this school (handle missing table gracefully)
        let existingLink = null;
        let useUserSchoolsTable = true;

        try {
            existingLink = await dbGet(
                'SELECT * FROM user_schools WHERE user_id = ? AND school_id = ?',
                [req.user.id, school.id]
            );
        } catch (err) {
            // user_schools table doesn't exist, fall back to users.school_id
            console.log('user_schools table not available, using users.school_id fallback');
            useUserSchoolsTable = false;
        }

        if (!existingLink) {
            if (useUserSchoolsTable) {
                // Create link in user_schools table
                try {
                    await dbRun(
                        'INSERT INTO user_schools (user_id, school_id) VALUES (?, ?)',
                        [req.user.id, school.id]
                    );
                } catch (err) {
                    // If insert fails (e.g. duplicate), just update user's school_id
                    console.log('user_schools insert failed, updating users.school_id:', err.message);
                    await dbRun(
                        'UPDATE users SET school_id = ? WHERE id = ?',
                        [school.id, req.user.id]
                    );
                }
            } else {
                // Fallback: just update user's school_id directly
                await dbRun(
                    'UPDATE users SET school_id = ? WHERE id = ?',
                    [school.id, req.user.id]
                );
            }
        }

        // Also update the user's current school_id for convenience
        await dbRun(
            'UPDATE users SET school_id = ? WHERE id = ?',
            [school.id, req.user.id]
        );

        // Keep parents table in sync (if present)
        try {
            await dbRun('UPDATE parents SET school_id = ? WHERE user_id = ?', [school.id, req.user.id]);
        } catch (err) {
            console.log('Could not update parents.school_id (table may not exist):', err.message);
        }

        res.json({ message: 'School linked successfully', school });
    } catch (error) {
        console.error('Error linking school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all schools linked to parent
router.get('/linked-schools', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        let schools = [];

        // Try to get from user_schools table first
        try {
            schools = await dbAll(
                `SELECT s.id, s.name, s.email, s.status 
                 FROM schools s 
                 INNER JOIN user_schools us ON s.id = us.school_id 
                 WHERE us.user_id = ?`,
                [req.user.id]
            );
        } catch (err) {
            // If user_schools table doesn't exist, get schools from children
            const children = await dbAll(
                `SELECT DISTINCT s.school_id 
                 FROM students s 
                 WHERE s.parent_id = ? AND s.school_id IS NOT NULL`,
                [req.user.id]
            );

            if (children.length > 0) {
                const schoolIds = children.map(c => c.school_id).filter((id, index, self) => self.indexOf(id) === index);
                if (schoolIds.length > 0) {
                    const placeholders = schoolIds.map(() => '?').join(',');
                    schools = await dbAll(
                        `SELECT id, name, email, status FROM schools WHERE id IN (${placeholders})`,
                        schoolIds
                    );
                }
            }

            // Also include the user's current school_id if set
            if (req.user.school_id) {
                const currentSchool = await dbGet('SELECT id, name, email, status FROM schools WHERE id = ?', [req.user.school_id]);
                if (currentSchool && !schools.find(s => s.id === currentSchool.id)) {
                    schools.push(currentSchool);
                }
            }
        }

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

        // Keep parents table in sync (if present)
        try {
            await dbRun('UPDATE parents SET school_id = ? WHERE user_id = ?', [school_id, req.user.id]);
        } catch (err) {
            console.log('Could not update parents.school_id (table may not exist):', err.message);
        }

        res.json({ message: 'School switched successfully', school });
    } catch (error) {
        console.error('Error switching school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;



