const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get all consequence definitions (admin only)
router.get('/definitions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let query = 'SELECT * FROM consequences WHERE 1=1';
    const params = [];

    if (schoolId) {
      query += ' AND (school_id = ? OR school_id IS NULL)';
      params.push(schoolId);
    }

    query += ' ORDER BY name';

    const consequences = await dbAll(query, params);
    res.json(consequences);
  } catch (error) {
    console.error('Error fetching consequences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create consequence definition (admin only)
router.post('/definitions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, severity, default_duration, is_active } = req.body;
    const schoolId = getSchoolId(req);

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await dbRun(
      `INSERT INTO consequences (name, description, severity, default_duration, is_active, school_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, severity || 'low', default_duration || null, is_active !== undefined ? is_active : 1, schoolId]
    );

    const consequence = await dbGet('SELECT * FROM consequences WHERE id = ?', [result.id]);
    res.status(201).json(consequence);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Consequence with this name already exists' });
    }
    console.error('Error creating consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update consequence definition (admin only)
router.put('/definitions/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, severity, default_duration, is_active } = req.body;

    await dbRun(
      `UPDATE consequences 
       SET name = ?, description = ?, severity = ?, default_duration = ?, is_active = ?
       WHERE id = ?`,
      [name, description || null, severity || 'low', default_duration || null, is_active !== undefined ? is_active : 1, req.params.id]
    );

    const consequence = await dbGet('SELECT * FROM consequences WHERE id = ?', [req.params.id]);
    res.json(consequence);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Consequence with this name already exists' });
    }
    console.error('Error updating consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete consequence definition (admin only)
router.delete('/definitions/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM consequences WHERE id = ?', [req.params.id]);
    res.json({ message: 'Consequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all student consequences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, status } = req.query;
    const schoolId = getSchoolId(req);
    
    let query = `
      SELECT sc.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             c.name as consequence_name,
             c.severity,
             u.name as assigned_by_name,
             verifier.name as verified_by_name
      FROM student_consequences sc
      INNER JOIN students s ON sc.student_id = s.id
      LEFT JOIN consequences c ON sc.consequence_id = c.id
      INNER JOIN users u ON sc.assigned_by = u.id
      LEFT JOIN users verifier ON sc.completion_verified_by = verifier.id
      WHERE 1=1
    `;
    const params = [];

    if (schoolId) {
      query += ' AND sc.school_id = ?';
      params.push(schoolId);
    }

    if (student_id) {
      query += ' AND sc.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      query += ' AND sc.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sc.assigned_date DESC';

    const consequences = await dbAll(query, params);
    res.json(consequences);
  } catch (error) {
    console.error('Error fetching student consequences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get consequence by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const consequence = await dbGet(`
      SELECT sc.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             c.name as consequence_name,
             c.severity,
             u.name as assigned_by_name,
             verifier.name as verified_by_name
      FROM student_consequences sc
      INNER JOIN students s ON sc.student_id = s.id
      LEFT JOIN consequences c ON sc.consequence_id = c.id
      INNER JOIN users u ON sc.assigned_by = u.id
      LEFT JOIN users verifier ON sc.completion_verified_by = verifier.id
      WHERE sc.id = ?
    `, [req.params.id]);

    if (!consequence) {
      return res.status(404).json({ error: 'Consequence not found' });
    }

    res.json(consequence);
  } catch (error) {
    console.error('Error fetching consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student consequences by student ID
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const consequences = await dbAll(`
      SELECT sc.*, 
             c.name as consequence_name,
             c.severity,
             u.name as assigned_by_name
      FROM student_consequences sc
      LEFT JOIN consequences c ON sc.consequence_id = c.id
      INNER JOIN users u ON sc.assigned_by = u.id
      WHERE sc.student_id = ?
      ORDER BY sc.assigned_date DESC
    `, [req.params.studentId]);
    res.json(consequences);
  } catch (error) {
    console.error('Error fetching student consequences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign consequence to student (admin and teacher)
router.post('/assign', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { student_id, consequence_id, incident_id, assigned_date, due_date, notes } = req.body;
    const schoolId = getSchoolId(req);

    if (!student_id || !assigned_date) {
      return res.status(400).json({ error: 'Student ID and assigned date are required' });
    }

    // Verify student is in the same school
    const student = await dbGet('SELECT id, school_id FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (student.school_id !== schoolId) {
      return res.status(403).json({ error: 'You can only assign consequences to students in your school' });
    }

    const result = await dbRun(
      `INSERT INTO student_consequences (student_id, consequence_id, incident_id, assigned_by, assigned_date, due_date, notes, parent_acknowledged, parent_acknowledged_at, parent_notes, completion_verified, completion_verified_by, completion_verified_at, school_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, 0, NULL, NULL, ?)`,
      [student_id, consequence_id || null, incident_id || null, req.user.id, assigned_date, due_date || null, notes || null, schoolId]
    );

    const consequence = await dbGet('SELECT * FROM student_consequences WHERE id = ?', [result.id]);
    
    // Create notification for parent
    try {
      const student = await dbGet('SELECT parent_id FROM students WHERE id = ?', [student_id]);
      if (student && student.parent_id) {
        await createNotification(
          student.parent_id,
          'consequence',
          'Consequence Assigned',
          `A consequence has been assigned to your child`,
          result.id,
          'consequence',
          req.app
        );
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.status(201).json(consequence);
  } catch (error) {
    console.error('Error assigning consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student consequence (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes, due_date, completion_verified, completion_verified_by } = req.body;

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes || null);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date || null);
    }
    if (completion_verified !== undefined) {
      updates.push('completion_verified = ?');
      updates.push('completion_verified_by = ?');
      updates.push('completion_verified_at = CURRENT_TIMESTAMP');
      params.push(completion_verified ? 1 : 0);
      params.push(completion_verified ? (completion_verified_by || req.user.id) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    await dbRun(
      `UPDATE student_consequences 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    const consequence = await dbGet('SELECT * FROM student_consequences WHERE id = ?', [req.params.id]);
    res.json(consequence);
  } catch (error) {
    console.error('Error updating consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark consequence as completed (admin only)
router.put('/:id/complete', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun(
      'UPDATE student_consequences SET status = ? WHERE id = ?',
      ['completed', req.params.id]
    );

    const consequence = await dbGet('SELECT * FROM student_consequences WHERE id = ?', [req.params.id]);
    res.json(consequence);
  } catch (error) {
    console.error('Error completing consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Parent acknowledge consequence
router.put('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { parent_notes } = req.body;
    const userId = req.user.id;

    // Verify this is the parent of the student
    const consequence = await dbGet(`
      SELECT sc.*, s.parent_id 
      FROM student_consequences sc
      INNER JOIN students s ON sc.student_id = s.id
      WHERE sc.id = ?
    `, [req.params.id]);

    if (!consequence) {
      return res.status(404).json({ error: 'Consequence not found' });
    }

    if (consequence.parent_id !== userId) {
      return res.status(403).json({ error: 'You can only acknowledge consequences for your own children' });
    }

    await dbRun(
      `UPDATE student_consequences 
       SET parent_acknowledged = 1, 
           parent_acknowledged_at = CURRENT_TIMESTAMP,
           parent_notes = ?
       WHERE id = ?`,
      [parent_notes || null, req.params.id]
    );

    const updated = await dbGet('SELECT * FROM student_consequences WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error acknowledging consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student consequence (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM student_consequences WHERE id = ?', [req.params.id]);
    res.json({ message: 'Consequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
