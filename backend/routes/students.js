const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// Get all students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        console.log('GET /api/students - User:', req.user?.email, 'Role:', req.user?.role, 'School ID:', schoolId);

        let query = `
            SELECT s.*, c.class_name, u.name as parent_name, u.email as parent_email
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON s.parent_id = u.id
        `;
        const params = [];

        // Platform admin can view across schools
        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                console.log('No school_id found for user:', req.user?.email);
                return res.status(403).json({ error: 'School context required' });
            }
            query += ' WHERE s.school_id = ?';
            params.push(schoolId);
            console.log('Filtering students by school_id:', schoolId);
        } else {
            console.log('Platform admin - no school filtering');
        }

        query += ' ORDER BY s.last_name, s.first_name';

        const students = await dbAll(query, params);
        console.log('Returned', students.length, 'students');
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const student = await dbGet(`
            SELECT s.*, c.class_name, u.name as parent_name, u.email as parent_email
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON s.parent_id = u.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (student.school_id !== schoolId) {
                return res.status(404).json({ error: 'Student not found' });
            }
        }

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload student photo (admin or teacher of student's class)
router.post('/:id/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const schoolId = getSchoolId(req);
        const studentRow = await dbGet('SELECT id, class_id, school_id FROM students WHERE id = ?', [req.params.id]);
        if (!studentRow) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (studentRow.school_id !== schoolId) {
                return res.status(404).json({ error: 'Student not found' });
            }
        }

        // Check if user is admin or teacher of student's class
        if (req.user.role !== 'admin') {
            const classData = await dbGet('SELECT teacher_id FROM classes WHERE id = ?', [studentRow.class_id]);
            if (!classData || classData.teacher_id !== req.user.id) {
                return res.status(403).json({ error: 'You can only upload photos for students in your class' });
            }
        }

        const photoPath = `/uploads/students/${req.file.filename}`;
        await dbRun('UPDATE students SET photo_path = ? WHERE id = ?', [photoPath, req.params.id]);
        
        const student = await dbGet('SELECT * FROM students WHERE id = ?', [req.params.id]);
        res.json({ message: 'Photo uploaded successfully', student });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create student
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_id } = req.body;
        const schoolId = getSchoolId(req);

        if (!student_id || !first_name || !last_name) {
            return res.status(400).json({ error: 'Student ID, first name, and last name are required' });
        }

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Generate unique parent link code
        const parent_link_code = `LINK${Date.now().toString().slice(-6)}`;

        const result = await dbRun(
            `INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_id, parent_link_code, school_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [student_id, first_name, last_name, date_of_birth || null, class_id || null, grade_level || null, parent_id || null, parent_link_code, schoolId]
        );

        const student = await dbGet('SELECT * FROM students WHERE id = ?', [result.id]);
        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.message.includes('UNIQUE constraint')) {
            res.status(400).json({ error: 'Student ID already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update student
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { first_name, last_name, date_of_birth, class_id, grade_level, parent_id } = req.body;
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT id, school_id FROM students WHERE id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Student not found' });
        }

        await dbRun(
            `UPDATE students 
             SET first_name = ?, last_name = ?, date_of_birth = ?, class_id = ?, grade_level = ?, parent_id = ?
             WHERE id = ?`,
            [first_name, last_name, date_of_birth || null, class_id || null, grade_level || null, parent_id || null, req.params.id]
        );

        const student = await dbGet('SELECT * FROM students WHERE id = ?', [req.params.id]);
        res.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete student
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT id, school_id FROM students WHERE id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Student not found' });
        }

        await dbRun('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate new parent link code
router.post('/:id/generate-link', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT id, school_id FROM students WHERE id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const parent_link_code = `LINK${Date.now().toString().slice(-6)}`;
        await dbRun('UPDATE students SET parent_link_code = ? WHERE id = ?', [parent_link_code, req.params.id]);
        const student = await dbGet('SELECT id, parent_link_code FROM students WHERE id = ?', [req.params.id]);
        res.json({ parent_link_code: student.parent_link_code });
    } catch (error) {
        console.error('Error generating link code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

