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
             s.student_id as student_number,
             s.id as student_id,
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

    // If user is a parent, only show interventions for their linked children
    if (req.user.role === 'parent') {
      query += ` AND s.parent_id = $${paramIndex++}`;
      params.push(req.user.id);
    }

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
          req,
          studentWithParent.parent_id,
          'intervention',
          'New Intervention Assigned',
          `An intervention has been assigned to your child`,
          result.id,
          'intervention'
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

// Update intervention progress (admin and teacher)
router.put('/:id/progress', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { 
      progress_status, 
      progress_percentage, 
      progress_notes, 
      next_session_date,
      sessions_completed,
      sessions_planned 
    } = req.body;
    
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (progress_status !== undefined) {
      updates.push(`progress_status = $${paramIndex++}`);
      params.push(progress_status);
    }
    if (progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${paramIndex++}`);
      params.push(progress_percentage);
    }
    if (progress_notes !== undefined) {
      updates.push(`progress_notes = $${paramIndex++}`);
      params.push(progress_notes);
    }
    if (next_session_date !== undefined) {
      updates.push(`next_session_date = $${paramIndex++}`);
      params.push(next_session_date);
    }
    if (sessions_completed !== undefined) {
      updates.push(`sessions_completed = $${paramIndex++}`);
      params.push(sessions_completed);
    }
    if (sessions_planned !== undefined) {
      updates.push(`sessions_planned = $${paramIndex++}`);
      params.push(sessions_planned);
    }

    // Always update last_progress_update
    updates.push(`last_progress_update = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No progress fields to update' });
    }

    params.push(req.params.id);
    const query = `
      UPDATE interventions 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    await schemaRun(req, query, params);
    const intervention = await schemaGet(req, 'SELECT * FROM interventions WHERE id = $1', [req.params.id]);

    res.json({
      message: 'Progress updated successfully',
      intervention
    });
  } catch (error) {
    console.error('Error updating intervention progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record intervention outcome (admin and teacher)
router.put('/:id/outcome', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { 
      outcome, 
      outcome_notes, 
      effectiveness_rating,
      follow_up_required,
      follow_up_notes
    } = req.body;
    
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!outcome) {
      return res.status(400).json({ error: 'Outcome is required' });
    }

    // Update intervention with outcome
    await schemaRun(req, `
      UPDATE interventions 
      SET outcome = $1,
          outcome_date = CURRENT_DATE,
          outcome_notes = $2,
          effectiveness_rating = $3,
          follow_up_required = $4,
          follow_up_notes = $5,
          completed_by = $6,
          progress_status = 'completed',
          progress_percentage = 100
      WHERE id = $7
    `, [
      outcome,
      outcome_notes || null,
      effectiveness_rating || null,
      follow_up_required || false,
      follow_up_notes || null,
      req.user.id,
      req.params.id
    ]);

    const intervention = await schemaGet(req, `
      SELECT i.*, 
             s.first_name || ' ' || s.last_name as student_name,
             u.name as completed_by_name
      FROM interventions i
      INNER JOIN students s ON i.student_id = s.id
      LEFT JOIN public.users u ON i.completed_by = u.id
      WHERE i.id = $1
    `, [req.params.id]);

    res.json({
      message: 'Outcome recorded successfully',
      intervention
    });
  } catch (error) {
    console.error('Error recording intervention outcome:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention statistics (admin only)
router.get('/stats/overview', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Get overall stats
    const stats = await schemaGet(req, `
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN progress_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN progress_status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN progress_status = 'not_started' THEN 1 END) as not_started,
        COUNT(CASE WHEN outcome = 'successful' THEN 1 END) as successful_outcomes,
        COUNT(CASE WHEN outcome = 'partially_successful' THEN 1 END) as partially_successful,
        COUNT(CASE WHEN outcome = 'unsuccessful' THEN 1 END) as unsuccessful_outcomes,
        ROUND(AVG(effectiveness_rating), 2) as avg_effectiveness_rating,
        COUNT(CASE WHEN follow_up_required = true THEN 1 END) as follow_ups_needed
      FROM interventions
    `);

    // Get outcome breakdown by type
    const outcomesByType = await schemaAll(req, `
      SELECT 
        type,
        COUNT(*) as total,
        COUNT(CASE WHEN outcome = 'successful' THEN 1 END) as successful,
        ROUND(AVG(effectiveness_rating), 2) as avg_rating
      FROM interventions
      WHERE outcome IS NOT NULL
      GROUP BY type
      ORDER BY total DESC
    `);

    res.json({
      overall: stats,
      by_type: outcomesByType
    });
  } catch (error) {
    console.error('Error fetching intervention stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

