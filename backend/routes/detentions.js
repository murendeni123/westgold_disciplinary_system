const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get detention rules
router.get('/rules', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const rules = await schemaAll(req, 'SELECT * FROM detention_rules ORDER BY min_points');
    res.json(rules);
  } catch (error) {
    console.error('Error fetching detention rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/update detention rule
router.post('/rules', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { id, action_type, min_points, max_points, severity, detention_duration, is_active } = req.body;

    if (id) {
      await schemaRun(req,
        `UPDATE detention_rules 
         SET action_type = $1, min_points = $2, max_points = $3, severity = $4, detention_duration = $5, is_active = $6
         WHERE id = $7`,
        [action_type, min_points, max_points || null, severity || null, detention_duration || 60, is_active !== undefined ? is_active : true, id]
      );
      const rule = await schemaGet(req, 'SELECT * FROM detention_rules WHERE id = $1', [id]);
      res.json(rule);
    } else {
      const result = await schemaRun(req,
        `INSERT INTO detention_rules (action_type, min_points, max_points, severity, detention_duration, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [action_type, min_points, max_points || null, severity || null, detention_duration || 60, is_active !== undefined ? is_active : true]
      );
      const rule = await schemaGet(req, 'SELECT * FROM detention_rules WHERE id = $1', [result.id]);
      res.status(201).json(rule);
    }
  } catch (error) {
    console.error('Error saving detention rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all detentions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { date, status } = req.query;
    
    let query = `
      SELECT d.*, t.name as teacher_name,
             (SELECT COUNT(*) FROM detention_assignments WHERE detention_id = d.id) as student_count
      FROM detention_sessions d
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (date) {
      query += ` AND d.detention_date = $${paramIndex++}`;
      params.push(date);
    }
    if (status) {
      query += ` AND d.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ' ORDER BY d.detention_date DESC, d.detention_time';

    const detentions = await schemaAll(req, query, params);
    res.json(detentions);
  } catch (error) {
    console.error('Error fetching detentions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detention by ID with assignments
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const detention = await schemaGet(req, `
      SELECT d.*, t.name as teacher_name
      FROM detention_sessions d
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      WHERE d.id = $1
    `, [req.params.id]);

    if (!detention) {
      return res.status(404).json({ error: 'Detention not found' });
    }

    const assignments = await schemaAll(req, `
      SELECT da.*, 
             s.first_name || ' ' || s.last_name as student_name, 
             s.student_id,
             c.grade_level,
             c.class_name
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE da.detention_id = $1
      ORDER BY da.assigned_at DESC
    `, [req.params.id]);

    detention.assignments = assignments;
    res.json(detention);
  } catch (error) {
    console.error('Error fetching detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create detention
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { detention_date, detention_time, duration, location, teacher_on_duty_id, notes } = req.body;

    const result = await schemaRun(req,
      `INSERT INTO detention_sessions (date, start_time, duration_minutes, location, supervisor_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [detention_date, detention_time, duration || 60, location || null, teacher_on_duty_id || null, notes || null]
    );

    const detention = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [result.id]);
    res.status(201).json(detention);
  } catch (error) {
    console.error('Error creating detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update detention
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { detention_date, detention_time, duration, location, teacher_on_duty_id, status, notes } = req.body;

    await schemaRun(req,
      `UPDATE detention_sessions 
       SET date = $1, start_time = $2, duration_minutes = $3, location = $4, supervisor_id = $5, status = $6, notes = $7
       WHERE id = $8`,
      [detention_date, detention_time, duration || 60, location || null, teacher_on_duty_id || null, status || 'scheduled', notes || null, req.params.id]
    );

    const detention = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [req.params.id]);
    res.json(detention);
  } catch (error) {
    console.error('Error updating detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign student to detention
router.post('/:id/assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { student_id, incident_id, reason } = req.body;

    const result = await schemaRun(req,
      `INSERT INTO detention_assignments (detention_id, student_id, incident_id, reason)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.params.id, student_id, incident_id || null, reason || null]
    );

    const assignment = await schemaGet(req, 'SELECT * FROM detention_assignments WHERE id = $1', [result.id]);
    
    // Get student and detention details for notification
    const student = await schemaGet(req, 
      'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1', 
      [student_id]
    );
    
    const detention = await schemaGet(req,
      'SELECT * FROM detention_sessions WHERE id = $1',
      [req.params.id]
    );
    
    // Notify parent if exists
    if (student && student.parent_id && detention) {
      const detentionDate = new Date(detention.detention_date).toLocaleDateString();
      await createNotification(
        req,
        student.parent_id,
        'detention',
        'Detention Assigned',
        `${student.student_name} has been assigned to detention on ${detentionDate} at ${detention.detention_time}. Reason: ${reason || 'Not specified'}`,
        result.id,
        'detention'
      );
    }
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update detention attendance
router.put('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { status, attendance_time, notes } = req.body;

    await schemaRun(req,
      `UPDATE detention_assignments 
       SET status = $1, attended_at = $2, notes = $3
       WHERE id = $4`,
      [status, attendance_time || null, notes || null, req.params.id]
    );

    const assignment = await schemaGet(req, `
      SELECT da.*, s.first_name, s.last_name, s.parent_id, d.date as detention_date, d.start_time as detention_time
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      INNER JOIN detention_sessions d ON da.detention_id = d.id
      WHERE da.id = $1
    `, [req.params.id]);

    // Notify parent if student was late or absent
    if (assignment && assignment.parent_id && (status === 'late' || status === 'absent')) {
      await createNotification(
        req,
        assignment.parent_id,
        'detention_attendance',
        `Detention ${status === 'late' ? 'Late' : 'Absent'}`,
        `Your child ${assignment.first_name} ${assignment.last_name} was ${status} for detention on ${assignment.detention_date} at ${assignment.detention_time}.`,
        assignment.detention_id,
        'detention'
      );
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete detention
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    await schemaRun(req, 'DELETE FROM detention_assignments WHERE detention_id = $1', [req.params.id]);
    await schemaRun(req, 'DELETE FROM detention_sessions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Detention deleted successfully' });
  } catch (error) {
    console.error('Error deleting detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
