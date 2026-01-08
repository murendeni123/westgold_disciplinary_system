const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get all interventions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, status, type } = req.query;
    const schoolId = getSchoolId(req);
    
    let query = `
      SELECT i.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             u.name as assigned_by_name,
             it.name as intervention_type_name
      FROM interventions i
      INNER JOIN students s ON i.student_id = s.id
      INNER JOIN users u ON i.assigned_by = u.id
      LEFT JOIN intervention_types it ON i.type = it.name
      WHERE 1=1
    `;
    const params = [];

    if (schoolId) {
      query += ' AND i.school_id = ?';
      params.push(schoolId);
    }

    if (student_id) {
      query += ' AND i.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND i.type = ?';
      params.push(type);
    }

    query += ' ORDER BY i.start_date DESC, i.created_at DESC';

    const interventions = await dbAll(query, params);
    res.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const intervention = await dbGet(`
      SELECT i.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             u.name as assigned_by_name
      FROM interventions i
      INNER JOIN students s ON i.student_id = s.id
      INNER JOIN users u ON i.assigned_by = u.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // Get sessions
    const sessions = await dbAll(`
      SELECT * FROM intervention_sessions 
      WHERE intervention_id = ? 
      ORDER BY session_date DESC, session_time DESC
    `, [req.params.id]);

    intervention.sessions = sessions;
    res.json(intervention);
  } catch (error) {
    console.error('Error fetching intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create intervention (admin and teacher)
// Teachers can assign interventions to their students; admins can assign for any.
router.post('/', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { student_id, type, description, start_date, end_date, notes } = req.body;
    const schoolId = getSchoolId(req);

    if (!student_id || !type) {
      return res.status(400).json({ error: 'Student ID and type are required' });
    }

    // Teachers can only assign interventions to students in their classes
    if (req.user.role === 'teacher') {
      const studentInClass = await dbGet(
        `SELECT cs.id FROM class_students cs
         JOIN classes c ON cs.class_id = c.id
         WHERE cs.student_id = ? AND c.teacher_id = ?`,
        [student_id, req.user.id]
      );
      if (!studentInClass) {
        return res.status(403).json({ error: 'You can only assign interventions to students in your classes' });
      }
    }

    const result = await dbRun(
      `INSERT INTO interventions (student_id, type, description, assigned_by, start_date, end_date, notes, school_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, type, description || null, req.user.id, start_date || null, end_date || null, notes || null, schoolId]
    );

    const intervention = await dbGet('SELECT * FROM interventions WHERE id = ?', [result.id]);
    
    // Create notification for parent
    try {
      const student = await dbGet('SELECT parent_id FROM students WHERE id = ?', [student_id]);
      if (student && student.parent_id) {
        await createNotification(
          student.parent_id,
          'intervention',
          'New Intervention Assigned',
          `An intervention has been assigned to your child`,
          result.id,
          'intervention',
          req.app
        );
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.status(201).json(intervention);
  } catch (error) {
    console.error('Error creating intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update intervention (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { type, description, start_date, end_date, status, notes } = req.body;

    await dbRun(
      `UPDATE interventions 
       SET type = ?, description = ?, start_date = ?, end_date = ?, status = ?, notes = ?
       WHERE id = ?`,
      [type, description || null, start_date || null, end_date || null, status || 'active', notes || null, req.params.id]
    );

    const intervention = await dbGet('SELECT * FROM interventions WHERE id = ?', [req.params.id]);
    res.json(intervention);
  } catch (error) {
    console.error('Error updating intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete intervention (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM interventions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Intervention deleted successfully' });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention types
router.get('/types/list', authenticateToken, async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let query = 'SELECT * FROM intervention_types WHERE is_active = 1';
    const params = [];

    if (schoolId) {
      query += ' AND (school_id = ? OR school_id IS NULL)';
      params.push(schoolId);
    }

    query += ' ORDER BY name';

    const types = await dbAll(query, params);
    res.json(types);
  } catch (error) {
    console.error('Error fetching intervention types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create intervention type (admin only)
router.post('/types', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, default_duration } = req.body;
    const schoolId = getSchoolId(req);

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await dbRun(
      `INSERT INTO intervention_types (name, description, default_duration, school_id)
       VALUES (?, ?, ?, ?)`,
      [name, description || null, default_duration || null, schoolId]
    );

    const type = await dbGet('SELECT * FROM intervention_types WHERE id = ?', [result.id]);
    res.status(201).json(type);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Intervention type with this name already exists' });
    }
    console.error('Error creating intervention type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update intervention type (admin only)
router.put('/types/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, default_duration, is_active } = req.body;

    await dbRun(
      `UPDATE intervention_types 
       SET name = ?, description = ?, default_duration = ?, is_active = ?
       WHERE id = ?`,
      [name, description || null, default_duration || null, is_active !== undefined ? is_active : 1, req.params.id]
    );

    const type = await dbGet('SELECT * FROM intervention_types WHERE id = ?', [req.params.id]);
    res.json(type);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Intervention type with this name already exists' });
    }
    console.error('Error updating intervention type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete intervention type (admin only)
router.delete('/types/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM intervention_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Intervention type deleted successfully' });
  } catch (error) {
    console.error('Error deleting intervention type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention sessions
router.get('/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await dbAll(`
      SELECT is.*, u.name as facilitator_name
      FROM intervention_sessions is
      LEFT JOIN users u ON is.facilitator_id = u.id
      WHERE is.intervention_id = ?
      ORDER BY is.session_date DESC, is.session_time DESC
    `, [req.params.id]);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create intervention session (admin only)
router.post('/:id/sessions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { session_date, session_time, duration, facilitator_id, notes, outcome, next_steps } = req.body;
    const schoolId = getSchoolId(req);

    if (!session_date) {
      return res.status(400).json({ error: 'Session date is required' });
    }

    const result = await dbRun(
      `INSERT INTO intervention_sessions (intervention_id, session_date, session_time, duration, facilitator_id, notes, outcome, next_steps, school_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, session_date, session_time || null, duration || null, facilitator_id || null, notes || null, outcome || null, next_steps || null, schoolId]
    );

    const session = await dbGet('SELECT * FROM intervention_sessions WHERE id = ?', [result.id]);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

