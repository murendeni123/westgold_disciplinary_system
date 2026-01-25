const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const { calculateBadgeEligibility, checkBadgeStatusChange } = require('../utils/goldieBadgeHelper');

const router = express.Router();

// Get merits
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== MERITS REQUEST ===');
    console.log('req.user:', req.user ? { id: req.user.id, email: req.user.email, schemaName: req.user.schemaName } : 'undefined');
    console.log('req.schemaName:', req.schemaName);
    
    const { student_id, teacher_id, start_date, end_date } = req.query;
    const schema = getSchema(req);
    
    console.log('getSchema returned:', schema);
    
    if (!schema) {
      console.log('ERROR: No schema context!');
      return res.status(403).json({ error: 'School context required' });
    }

    let query = `
      SELECT m.id,
             m.student_id,
             m.teacher_id,
             m.merit_type_id,
             m.description,
             m.points,
             m.date as merit_date,
             m.created_at,
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id as student_identifier,
             u.name as teacher_name,
             c.class_name,
             mt.name as merit_type
      FROM merits m
      INNER JOIN students s ON m.student_id = s.id
      LEFT JOIN teachers t ON m.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN merit_types mt ON m.merit_type_id = mt.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // If user is a parent, only show merits for their linked children
    if (req.user.role === 'parent') {
      query += ` AND s.parent_id = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (student_id) {
      query += ` AND m.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (teacher_id) {
      query += ` AND m.teacher_id = $${paramIndex++}`;
      params.push(teacher_id);
    }
    if (start_date) {
      query += ` AND m.date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND m.date <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ' ORDER BY m.date DESC';

    console.log('Executing merits query in schema:', schema);
    const merits = await schemaAll(req, query, params);
    console.log('Query successful, returned', merits.length, 'merits');
    res.json(merits);
  } catch (error) {
    console.error('Error fetching merits:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create merit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, merit_date, merit_type, merit_type_id, description, points } = req.body;
    const schema = getSchema(req);

    if (!student_id || !merit_date) {
      return res.status(400).json({ error: 'Student ID and date are required' });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Get teacher ID from school schema
    const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    if (!teacher) {
      return res.status(403).json({ error: 'Teacher record not found' });
    }

    // Check badge eligibility BEFORE awarding merit
    const beforeEligibility = await calculateBadgeEligibility(req, student_id);

    const result = await schemaRun(req,
      `INSERT INTO merits (student_id, teacher_id, date, merit_type_id, description, points)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [student_id, teacher.id, merit_date, merit_type_id || null, String(description).trim(), points || 1]
    );

    const merit = await schemaGet(req, 'SELECT * FROM merits WHERE id = $1', [result.id]);
    
    // Check badge eligibility AFTER awarding merit
    const afterEligibility = await calculateBadgeEligibility(req, student_id);
    
    // Get student details for notification
    const student = await schemaGet(req, 
      'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1', 
      [student_id]
    );
    
    // Notify parent if exists
    if (student && student.parent_id) {
      await createNotification(
        req,
        student.parent_id,
        'merit',
        'Merit Awarded! 🏆',
        `${student.student_name} earned ${points || 1} merit points for: ${String(description).trim().substring(0, 100)}`,
        result.id,
        'merit'
      );
    }

    // Check if badge status changed and send notifications
    const badgeStatusChange = await checkBadgeStatusChange(
      req, 
      student_id, 
      beforeEligibility.isEligible, 
      afterEligibility.isEligible
    );
    
    // Return merit with badge status information
    res.status(201).json({
      ...merit,
      badgeStatusChange: badgeStatusChange.statusChanged ? {
        badgeEarned: badgeStatusChange.badgeEarned || false,
        badgeLost: badgeStatusChange.badgeLost || false,
        studentName: badgeStatusChange.studentName,
        cleanPoints: afterEligibility.cleanPoints,
        totalMerits: afterEligibility.totalMerits
      } : null
    });
  } catch (error) {
    console.error('Error creating merit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update merit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { merit_date, merit_type_id, description, points } = req.body;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const merit = await schemaGet(req, 'SELECT * FROM merits WHERE id = $1', [req.params.id]);
    if (!merit) {
      return res.status(404).json({ error: 'Merit not found' });
    }

    // Get teacher ID
    const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);

    // Only admin or the teacher who created it can update
    if (req.user.role !== 'admin' && (!teacher || merit.teacher_id !== teacher.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await schemaRun(req,
      `UPDATE merits 
       SET date = COALESCE($1, date), merit_type_id = $2, description = COALESCE($3, description), points = COALESCE($4, points)
       WHERE id = $5`,
      [merit_date, merit_type_id, description, points, req.params.id]
    );

    const updatedMerit = await schemaGet(req, 'SELECT * FROM merits WHERE id = $1', [req.params.id]);
    res.json(updatedMerit);
  } catch (error) {
    console.error('Error updating merit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete merit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const merit = await schemaGet(req, 'SELECT * FROM merits WHERE id = $1', [req.params.id]);
    if (!merit) {
      return res.status(404).json({ error: 'Merit not found' });
    }

    // Get teacher ID
    const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);

    if (req.user.role !== 'admin' && (!teacher || merit.teacher_id !== teacher.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await schemaRun(req, 'DELETE FROM merits WHERE id = $1', [req.params.id]);
    res.json({ message: 'Merit deleted successfully' });
  } catch (error) {
    console.error('Error deleting merit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
