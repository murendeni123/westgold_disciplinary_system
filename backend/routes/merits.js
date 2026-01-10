const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Get merits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, teacher_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT m.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             u.name as teacher_name,
             c.class_name
      FROM merits m
      INNER JOIN students s ON m.student_id = s.id
      INNER JOIN users u ON m.teacher_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ' AND m.student_id = ?';
      params.push(student_id);
    }
    if (teacher_id) {
      query += ' AND m.teacher_id = ?';
      params.push(teacher_id);
    }
    if (start_date) {
      query += ' AND m.merit_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND m.merit_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY m.merit_date DESC';

    const merits = await dbAll(query, params);
    res.json(merits);
  } catch (error) {
    console.error('Error fetching merits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create merit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, merit_date, merit_type, description, points } = req.body;

    if (!student_id || !merit_date || !merit_type) {
      return res.status(400).json({ error: 'Student ID, date, and type are required' });
    }

    const result = await dbRun(
      `INSERT INTO merits (student_id, teacher_id, merit_date, merit_type, description, points)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, req.user.id, merit_date, merit_type, description || null, points || 0]
    );

    const merit = await dbGet('SELECT * FROM merits WHERE id = ?', [result.id]);

    // Send notification to parent (in-app + WhatsApp) - positive news!
    notificationService.sendMeritNotification({
      meritId: result.id,
      studentId: student_id,
      meritType: merit_type,
      points: points || 0,
      description: description || '',
      date: merit_date,
      schoolId: req.user.school_id,
    });

    res.status(201).json(merit);
  } catch (error) {
    console.error('Error creating merit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update merit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { merit_date, merit_type, description, points } = req.body;

    // Only admin or the teacher who created it can update
    const merit = await dbGet('SELECT * FROM merits WHERE id = ?', [req.params.id]);
    if (!merit) {
      return res.status(404).json({ error: 'Merit not found' });
    }

    if (req.user.role !== 'admin' && merit.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await dbRun(
      `UPDATE merits 
       SET merit_date = ?, merit_type = ?, description = ?, points = ?
       WHERE id = ?`,
      [merit_date, merit_type, description || null, points || 0, req.params.id]
    );

    const updatedMerit = await dbGet('SELECT * FROM merits WHERE id = ?', [req.params.id]);
    res.json(updatedMerit);
  } catch (error) {
    console.error('Error updating merit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete merit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const merit = await dbGet('SELECT * FROM merits WHERE id = ?', [req.params.id]);
    if (!merit) {
      return res.status(404).json({ error: 'Merit not found' });
    }

    if (req.user.role !== 'admin' && merit.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await dbRun('DELETE FROM merits WHERE id = ?', [req.params.id]);
    res.json({ message: 'Merit deleted successfully' });
  } catch (error) {
    console.error('Error deleting merit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;



