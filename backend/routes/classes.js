const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');

const router = express.Router();

// Get all classes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        let query = `
            SELECT c.*, u.name as teacher_name, u.email as teacher_email,
                   (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Platform admin can view across schools
        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            query += ' AND c.school_id = ?';
            params.push(schoolId);
        }

        // Teachers only see classes assigned to them
        if (req.user?.role === 'teacher') {
            query += ' AND c.teacher_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY c.class_name';

        const classes = await dbAll(query, params);
        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get class by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const classData = await dbGet(`
            SELECT c.*, u.name as teacher_name, u.email as teacher_email
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (classData.school_id !== schoolId) {
                return res.status(404).json({ error: 'Class not found' });
            }
        }

        // Get students in this class via class_students junction table
        const students = await dbAll(`
            SELECT s.* 
            FROM students s
            JOIN class_students cs ON s.id = cs.student_id
            WHERE cs.class_id = ?
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
        const schoolId = getSchoolId(req);

        if (!class_name) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const result = await dbRun(
            `INSERT INTO classes (class_name, grade_level, teacher_id, academic_year, school_id)
             VALUES (?, ?, ?, ?, ?) RETURNING id`,
            [class_name, grade_level || null, teacher_id || null, academic_year || '2024-2025', schoolId]
        );

        const classData = await dbGet('SELECT * FROM classes WHERE id = ?', [result.id]);
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
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT id, school_id FROM classes WHERE id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Class not found' });
        }

        await dbRun(
            `UPDATE classes 
             SET class_name = ?, grade_level = ?, teacher_id = ?, academic_year = ?
             WHERE id = ?`,
            [class_name, grade_level || null, teacher_id || null, academic_year || null, req.params.id]
        );

        const classData = await dbGet('SELECT * FROM classes WHERE id = ?', [req.params.id]);
        res.json(classData);
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete class
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT id, school_id FROM classes WHERE id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Class not found' });
        }

        await dbRun('DELETE FROM classes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

