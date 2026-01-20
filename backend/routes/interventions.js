const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get all interventions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, status, type } = req.query;
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    
    let query = `
      SELECT i.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             u.name as assigned_by_name,
             it.name as intervention_type_name
      FROM interventions i
      INNER JOIN students s ON i.student_id = s.id
      INNER JOIN public.users u ON i.assigned_by = u.id
      LEFT JOIN intervention_types it ON i.type = it.name
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (student_id) {
      query += ` AND i.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (status) {
      query += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }
    if (type) {
      query += ` AND i.type = $${paramIndex++}`;
      params.push(type);
    }

    query += ' ORDER BY i.start_date DESC, i.created_at DESC';

    const interventions = await schemaAll(req, query, params);
    res.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const intervention = await schemaGet(req, `
      SELECT i.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id,
             u.name as assigned_by_name
      FROM interventions i
      INNER JOIN students s ON i.student_id = s.id
      INNER JOIN public.users u ON i.assigned_by = u.id
      WHERE i.id = $1
    `, [req.params.id]);

    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // Get sessions
    const sessions = await schemaAll(req, `
      SELECT * FROM intervention_sessions 
      WHERE intervention_id = $1 
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!student_id || !type) {
      return res.status(400).json({ error: 'Student ID and type are required' });
    }

    // Verify student exists in this school's schema
    const student = await schemaGet(req, 'SELECT id FROM students WHERE id = $1', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await schemaRun(req,
      `INSERT INTO interventions (student_id, type, description, assigned_by, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [student_id, type, description || null, req.user.id, start_date || null, end_date || null, notes || null]
    );

    const intervention = await schemaGet(req, 'SELECT * FROM interventions WHERE id = $1', [result.id]);
    
    // Create notification for parent
    try {
      const studentWithParent = await schemaGet(req, 'SELECT parent_id FROM students WHERE id = $1', [student_id]);
      if (studentWithParent && studentWithParent.parent_id) {
        await createNotification(
          studentWithParent.parent_id,
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req,
      `UPDATE interventions 
       SET type = $1, description = $2, start_date = $3, end_date = $4, status = $5, notes = $6
       WHERE id = $7`,
      [type, description || null, start_date || null, end_date || null, status || 'active', notes || null, req.params.id]
    );

    const intervention = await schemaGet(req, 'SELECT * FROM interventions WHERE id = $1', [req.params.id]);
    res.json(intervention);
  } catch (error) {
    console.error('Error updating intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete intervention (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    await schemaRun(req, 'DELETE FROM interventions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Intervention deleted successfully' });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention types
router.get('/types/list', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const types = await schemaAll(req, 'SELECT * FROM intervention_types WHERE is_active = true ORDER BY name');
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await schemaRun(req,
      `INSERT INTO intervention_types (name, description, default_duration)
       VALUES ($1, $2, $3) RETURNING id`,
      [name, description || null, default_duration || null]
    );

    const type = await schemaGet(req, 'SELECT * FROM intervention_types WHERE id = $1', [result.id]);
    res.status(201).json(type);
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req,
      `UPDATE intervention_types 
       SET name = $1, description = $2, default_duration = $3, is_active = $4
       WHERE id = $5`,
      [name, description || null, default_duration || null, is_active !== undefined ? is_active : true, req.params.id]
    );

    const type = await schemaGet(req, 'SELECT * FROM intervention_types WHERE id = $1', [req.params.id]);
    res.json(type);
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return res.status(400).json({ error: 'Intervention type with this name already exists' });
    }
    console.error('Error updating intervention type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete intervention type (admin only)
router.delete('/types/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    await schemaRun(req, 'DELETE FROM intervention_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Intervention type deleted successfully' });
  } catch (error) {
    console.error('Error deleting intervention type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention sessions
router.get('/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const sessions = await schemaAll(req, `
      SELECT s.*, u.name as facilitator_name
      FROM intervention_sessions s
      LEFT JOIN public.users u ON s.facilitator_id = u.id
      WHERE s.intervention_id = $1
      ORDER BY s.session_date DESC, s.session_time DESC
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!session_date) {
      return res.status(400).json({ error: 'Session date is required' });
    }

    const result = await schemaRun(req,
      `INSERT INTO intervention_sessions (intervention_id, session_date, session_time, duration, facilitator_id, notes, outcome, next_steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [req.params.id, session_date, session_time || null, duration || null, facilitator_id || null, notes || null, outcome || null, next_steps || null]
    );

    const session = await schemaGet(req, 'SELECT * FROM intervention_sessions WHERE id = $1', [result.id]);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

