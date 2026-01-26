const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// Get all students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        let query = `
            SELECT s.*, c.class_name, u.name as parent_name, u.email as parent_email
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN public.users u ON s.parent_id = u.id
        `;

        const params = [];
        const conditions = [];
        let paramIndex = 1;
        
        // If user is a parent, only show their own children
        if (req.user.role === 'parent') {
            conditions.push(`s.parent_id = $${paramIndex++}`);
            params.push(req.user.id);
        }
        
        // Filter by class_id if provided
        if (req.query.class_id) {
            conditions.push(`s.class_id = $${paramIndex++}`);
            params.push(req.query.class_id);
        }
        
        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += ` ORDER BY s.last_name, s.first_name`;

        const students = await schemaAll(req, query, params);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const student = await schemaGet(req, `
            SELECT s.*, c.class_name, u.name as parent_name, u.email as parent_email
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN public.users u ON s.parent_id = u.id
            WHERE s.id = $1
        `, [req.params.id]);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // If user is a parent, verify they can only access their own children
        if (req.user.role === 'parent') {
            if (student.parent_id !== req.user.id) {
                return res.status(403).json({ error: 'You can only access your own children' });
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

        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const studentRow = await schemaGet(req, 'SELECT id, class_id FROM students WHERE id = $1', [req.params.id]);
        if (!studentRow) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if user is admin or teacher of student's class
        if (req.user.role !== 'admin') {
            // Get teacher ID from teachers table using user_id
            const teacherData = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
            if (!teacherData) {
                return res.status(403).json({ error: 'Teacher record not found' });
            }
            
            const classData = await schemaGet(req, 'SELECT teacher_id FROM classes WHERE id = $1', [studentRow.class_id]);
            if (!classData || classData.teacher_id !== teacherData.id) {
                return res.status(403).json({ error: 'You can only upload photos for students in your class' });
            }
        }

        const photoPath = `/uploads/students/${req.file.filename}`;
        await schemaRun(req, 'UPDATE students SET photo_path = $1 WHERE id = $2', [photoPath, req.params.id]);
        
        const student = await schemaGet(req, 'SELECT * FROM students WHERE id = $1', [req.params.id]);
        res.json({ message: 'Photo uploaded successfully', student });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create student
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { student_id, first_name, last_name, date_of_birth, class_id, parent_id } = req.body;
        const schema = getSchema(req);

        if (!student_id || !first_name || !last_name) {
            return res.status(400).json({ error: 'Student ID, first name, and last name are required' });
        }

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Generate unique parent link code
        const parent_link_code = `LINK${Date.now().toString().slice(-6)}`;

        const result = await schemaRun(req,
            `INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, parent_id, parent_link_code, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
            [student_id, first_name, last_name, date_of_birth || null, class_id || null, parent_id || null, parent_link_code]
        );

        const student = await schemaGet(req, 'SELECT * FROM students WHERE id = $1', [result.id]);
        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
            res.status(400).json({ error: 'Student ID already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update student
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { first_name, last_name, date_of_birth, class_id, parent_id } = req.body;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM students WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Student not found' });
        }

        await schemaRun(req,
            `UPDATE students 
             SET first_name = $1, last_name = $2, date_of_birth = $3, class_id = $4, parent_id = $5
             WHERE id = $6`,
            [first_name, last_name, date_of_birth || null, class_id || null, parent_id || null, req.params.id]
        );

        const student = await schemaGet(req, 'SELECT * FROM students WHERE id = $1', [req.params.id]);
        res.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete student (soft delete)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM students WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Soft delete - set is_active to false
        await schemaRun(req, 'UPDATE students SET is_active = false WHERE id = $1', [req.params.id]);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate new parent link code
router.post('/:id/generate-link', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM students WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const parent_link_code = `LINK${Date.now().toString().slice(-6)}`;
        await schemaRun(req, 'UPDATE students SET parent_link_code = $1 WHERE id = $2', [parent_link_code, req.params.id]);
        const student = await schemaGet(req, 'SELECT id, parent_link_code FROM students WHERE id = $1', [req.params.id]);
        res.json({ parent_link_code: student.parent_link_code });
    } catch (error) {
        console.error('Error generating link code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
