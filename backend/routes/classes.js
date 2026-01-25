const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all classes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        let query = `
            SELECT c.*, u.name as teacher_name, u.email as teacher_email,
                   (SELECT COUNT(*) FROM students WHERE class_id = c.id AND is_active = true) as student_count
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
            WHERE c.is_active = true
        `;
        const params = [];
        let paramIndex = 1;

        // Teachers only see classes assigned to them
        if (req.user?.role === 'teacher') {
            const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
            if (teacher) {
                query += ` AND c.teacher_id = $${paramIndex++}`;
                params.push(teacher.id);
            }
        }

        query += ' ORDER BY c.class_name';

        const classes = await schemaAll(req, query, params);
        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get class by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const classData = await schemaGet(req, `
            SELECT c.*, u.name as teacher_name, t.email as teacher_email
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            WHERE c.id = $1
        `, [req.params.id]);

        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Get students in this class
        const students = await schemaAll(req, `
            SELECT s.* 
            FROM students s
            WHERE s.class_id = $1 AND s.is_active = true
            ORDER BY s.last_name, s.first_name
        `, [req.params.id]);

        classData.students = students;
        res.json(classData);
    } catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create class
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { class_name, grade_level, teacher_id, academic_year } = req.body;
        const schema = getSchema(req);

        if (!class_name) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const result = await schemaRun(req,
            `INSERT INTO classes (class_name, grade_level, teacher_id, academic_year, is_active)
             VALUES ($1, $2, $3, $4, true) RETURNING id`,
            [class_name, grade_level || null, teacher_id || null, academic_year || '2024-2025']
        );

        const classData = await schemaGet(req, 'SELECT * FROM classes WHERE id = $1', [result.id]);
        res.status(201).json(classData);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update class
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { class_name, grade_level, teacher_id, academic_year } = req.body;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM classes WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Class not found' });
        }

        await schemaRun(req,
            `UPDATE classes 
             SET class_name = $1, grade_level = $2, teacher_id = $3, academic_year = $4
             WHERE id = $5`,
            [class_name, grade_level || null, teacher_id || null, academic_year || null, req.params.id]
        );

        const classData = await schemaGet(req, 'SELECT * FROM classes WHERE id = $1', [req.params.id]);
        res.json(classData);
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete class (soft delete)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM classes WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Class not found' });
        }

        await schemaRun(req, 'UPDATE classes SET is_active = false WHERE id = $1', [req.params.id]);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
