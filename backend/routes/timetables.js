const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get timetables
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { class_id, student_id, teacher_id, day_of_week } = req.query;
    
    let query = `
      SELECT t.*, 
             c.class_name,
             u.name as teacher_name
      FROM timetables t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN users u ON t.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ' AND t.class_id = ?';
      params.push(class_id);
    }
    if (student_id) {
      query += ' AND t.student_id = ?';
      params.push(student_id);
    }
    if (teacher_id) {
      query += ' AND t.teacher_id = ?';
      params.push(teacher_id);
    }
    if (day_of_week !== undefined) {
      query += ' AND t.day_of_week = ?';
      params.push(day_of_week);
    }

    query += ' ORDER BY t.day_of_week, t.period_number';

    const timetables = await dbAll(query, params);
    res.json(timetables);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create timetable
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { class_id, student_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room, is_break, academic_year } = req.body;

    const result = await dbRun(
      `INSERT INTO timetables (class_id, student_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room, is_break, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [class_id || null, student_id || null, teacher_id || null, day_of_week, period_number, subject || null, start_time || null, end_time || null, room || null, is_break || 0, academic_year || '2024-2025']
    );

    const timetable = await dbGet('SELECT * FROM timetables WHERE id = ?', [result.id]);
    res.status(201).json(timetable);
  } catch (error) {
    console.error('Error creating timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk create timetables
router.post('/bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { timetables } = req.body;
    const results = [];

    for (const tt of timetables) {
      const result = await dbRun(
        `INSERT INTO timetables (class_id, student_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room, is_break, academic_year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tt.class_id || null, tt.student_id || null, tt.teacher_id || null, tt.day_of_week, tt.period_number, tt.subject || null, tt.start_time || null, tt.end_time || null, tt.room || null, tt.is_break || 0, tt.academic_year || '2024-2025']
      );
      const timetable = await dbGet('SELECT * FROM timetables WHERE id = ?', [result.id]);
      results.push(timetable);
    }

    res.status(201).json({ message: 'Timetables created', timetables: results });
  } catch (error) {
    console.error('Error creating bulk timetables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update timetable
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { day_of_week, period_number, subject, start_time, end_time, room, is_break } = req.body;

    await dbRun(
      `UPDATE timetables 
       SET day_of_week = ?, period_number = ?, subject = ?, start_time = ?, end_time = ?, room = ?, is_break = ?
       WHERE id = ?`,
      [day_of_week, period_number, subject || null, start_time || null, end_time || null, room || null, is_break || 0, req.params.id]
    );

    const timetable = await dbGet('SELECT * FROM timetables WHERE id = ?', [req.params.id]);
    res.json(timetable);
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete timetable
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM timetables WHERE id = ?', [req.params.id]);
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

