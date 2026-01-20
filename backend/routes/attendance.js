const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all attendance records
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { student_id, class_id, date, start_date, end_date, status } = req.query;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }
        
        let query = `
            SELECT a.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   c.class_name,
                   t.name as teacher_name
            FROM attendance a
            INNER JOIN students s ON a.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers t ON a.recorded_by = t.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (student_id) {
            query += ` AND a.student_id = $${paramIndex++}`;
            params.push(student_id);
        }
        if (class_id) {
            query += ` AND s.class_id = $${paramIndex++}`;
            params.push(class_id);
        }
        if (date) {
            query += ` AND a.date = $${paramIndex++}`;
            params.push(date);
        }
        if (start_date) {
            query += ` AND a.date >= $${paramIndex++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND a.date <= $${paramIndex++}`;
            params.push(end_date);
        }
        if (status) {
            query += ` AND a.status = $${paramIndex++}`;
            params.push(status);
        }

        query += ' ORDER BY a.date DESC, s.last_name, s.first_name';

        const records = await schemaAll(req, query, params);
        res.json(records);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get attendance by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const record = await schemaGet(req, `
            SELECT a.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   c.class_name,
                   t.name as teacher_name
            FROM attendance a
            INNER JOIN students s ON a.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers t ON a.recorded_by = t.id
            WHERE a.id = $1
        `, [req.params.id]);

        if (!record) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error fetching attendance record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create attendance record
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { student_id, attendance_date, status, notes } = req.body;
        const schema = getSchema(req);

        if (!student_id || !attendance_date || !status) {
            return res.status(400).json({ error: 'Student ID, date, and status are required' });
        }

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Get teacher ID
        const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);

        const result = await schemaRun(req,
            `INSERT INTO attendance (student_id, date, status, notes, recorded_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (student_id, date) DO UPDATE SET status = $3, notes = $4, recorded_by = $5
             RETURNING id`,
            [student_id, attendance_date, status, notes || null, teacher?.id || null]
        );

        const record = await schemaGet(req, 'SELECT * FROM attendance WHERE id = $1', [result.id]);
        res.status(201).json(record);
    } catch (error) {
        console.error('Error creating attendance record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk create attendance (for daily register)
router.post('/bulk', authenticateToken, async (req, res) => {
    try {
        const { class_id, attendance_date, records } = req.body;
        const schema = getSchema(req);

        if (!attendance_date || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Date and records array are required' });
        }

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Get teacher ID
        const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);

        const results = [];
        for (const record of records) {
            try {
                const result = await schemaRun(req,
                    `INSERT INTO attendance (student_id, date, status, notes, recorded_by)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (student_id, date) DO UPDATE SET status = $3, notes = $4, recorded_by = $5
                     RETURNING id`,
                    [record.student_id, attendance_date, record.status, record.notes || null, teacher?.id || null]
                );
                const attendanceRecord = await schemaGet(req, 'SELECT * FROM attendance WHERE id = $1', [result.id]);
                results.push(attendanceRecord);
            } catch (err) {
                console.error('Error creating attendance record:', err);
            }
        }

        res.status(201).json({ message: 'Attendance records created', records: results });
    } catch (error) {
        console.error('Error creating bulk attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update attendance record
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { attendance_date, status, notes } = req.body;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM attendance WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        await schemaRun(req,
            `UPDATE attendance 
             SET date = COALESCE($1, date), status = COALESCE($2, status), notes = $3
             WHERE id = $4`,
            [attendance_date, status, notes, req.params.id]
        );

        const record = await schemaGet(req, 'SELECT * FROM attendance WHERE id = $1', [req.params.id]);
        res.json(record);
    } catch (error) {
        console.error('Error updating attendance record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete attendance record
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id FROM attendance WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        await schemaRun(req, 'DELETE FROM attendance WHERE id = $1', [req.params.id]);
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
