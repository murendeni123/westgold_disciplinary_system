const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all attendance records
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { student_id, class_id, date, start_date, end_date, status } = req.query;
        
        let query = `
            SELECT a.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   c.class_name,
                   u.name as teacher_name
            FROM attendance a
            INNER JOIN students s ON a.student_id = s.id
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN users u ON a.teacher_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (student_id) {
            query += ' AND a.student_id = ?';
            params.push(student_id);
        }
        if (class_id) {
            query += ' AND a.class_id = ?';
            params.push(class_id);
        }
        if (date) {
            query += ' AND a.attendance_date = ?';
            params.push(date);
        }
        if (start_date) {
            query += ' AND a.attendance_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND a.attendance_date <= ?';
            params.push(end_date);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.attendance_date DESC, s.last_name, s.first_name';

        const records = await dbAll(query, params);
        res.json(records);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get attendance by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const record = await dbGet(`
            SELECT a.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   c.class_name,
                   u.name as teacher_name
            FROM attendance a
            INNER JOIN students s ON a.student_id = s.id
            INNER JOIN classes c ON a.class_id = c.id
            INNER JOIN users u ON a.teacher_id = u.id
            WHERE a.id = ?
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
        const { student_id, class_id, attendance_date, period, status, notes } = req.body;

        if (!student_id || !class_id || !attendance_date || !status) {
            return res.status(400).json({ error: 'Student ID, class ID, date, and status are required' });
        }

        const result = await dbRun(
            `INSERT OR REPLACE INTO attendance 
             (student_id, class_id, attendance_date, period, status, notes, teacher_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [student_id, class_id, attendance_date, period || null, status, notes || null, req.user.id]
        );

        const record = await dbGet('SELECT * FROM attendance WHERE id = ?', [result.id]);
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

        if (!class_id || !attendance_date || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Class ID, date, and records array are required' });
        }

        const results = [];
        for (const record of records) {
            try {
                const result = await dbRun(
                    `INSERT OR REPLACE INTO attendance 
                     (student_id, class_id, attendance_date, period, status, notes, teacher_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [record.student_id, class_id, attendance_date, record.period || null, 
                     record.status, record.notes || null, req.user.id]
                );
                const attendanceRecord = await dbGet('SELECT * FROM attendance WHERE id = ?', [result.id]);
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
        const { attendance_date, period, status, notes } = req.body;

        await dbRun(
            `UPDATE attendance 
             SET attendance_date = ?, period = ?, status = ?, notes = ?
             WHERE id = ?`,
            [attendance_date, period || null, status, notes || null, req.params.id]
        );

        const record = await dbGet('SELECT * FROM attendance WHERE id = ?', [req.params.id]);
        res.json(record);
    } catch (error) {
        console.error('Error updating attendance record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete attendance record
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await dbRun('DELETE FROM attendance WHERE id = ?', [req.params.id]);
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;



