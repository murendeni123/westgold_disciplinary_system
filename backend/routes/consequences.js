const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createNotification, notifySchoolAdmins } = require('./notifications');

const router = express.Router();

// Get all consequence definitions (admin and teacher)
router.get('/definitions', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const consequences = await schemaAll(req, 'SELECT * FROM consequences ORDER BY name');
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await schemaRun(req,
      `INSERT INTO consequences (name, description, severity, default_duration, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, description || null, severity || null, default_duration || null, is_active !== undefined ? (is_active ? 1 : 0) : 1]
    );

    const consequence = await schemaGet(req, 'SELECT * FROM consequences WHERE id = $1', [result.id]);
    res.status(201).json(consequence);
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req,
      `UPDATE consequences 
       SET name = $1, description = $2, severity = $3, default_duration = $4, is_active = $5
       WHERE id = $6`,
      [name, description || null, severity || null, default_duration || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]
    );

    const consequence = await schemaGet(req, 'SELECT * FROM consequences WHERE id = $1', [req.params.id]);
    res.json(consequence);
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return res.status(400).json({ error: 'Consequence with this name already exists' });
    }
    console.error('Error updating consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete consequence definition (admin only)
router.delete('/definitions/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    await schemaRun(req, 'DELETE FROM consequences WHERE id = $1', [req.params.id]);
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    
    let query = `
      SELECT sc.*, 
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id as student_number,
             s.id as student_id,
             c.name as consequence_name,
             c.severity,
             u.name as assigned_by_name,
             verifier.name as verified_by_name
      FROM student_consequences sc
      INNER JOIN students s ON sc.student_id = s.id
      LEFT JOIN consequences c ON sc.consequence_id = c.id
      INNER JOIN public.users u ON sc.assigned_by = u.id
      LEFT JOIN public.users verifier ON sc.completion_verified_by = verifier.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // If user is a parent, only show consequences for their linked children
    if (req.user.role === 'parent') {
      query += ` AND s.parent_id = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (student_id) {
      query += ` AND sc.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (status) {
      query += ` AND sc.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ' ORDER BY sc.assigned_date DESC';

    const consequences = await schemaAll(req, query, params);
    res.json(consequences);
  } catch (error) {
    console.error('Error fetching student consequences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get consequence by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const consequence = await schemaGet(req, `
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
      INNER JOIN public.users u ON sc.assigned_by = u.id
      LEFT JOIN public.users verifier ON sc.completion_verified_by = verifier.id
      WHERE sc.id = $1
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const consequences = await schemaAll(req, `
      SELECT sc.*, 
             c.name as consequence_name,
             c.severity,
             u.name as assigned_by_name
      FROM student_consequences sc
      LEFT JOIN consequences c ON sc.consequence_id = c.id
      INNER JOIN public.users u ON sc.assigned_by = u.id
      WHERE sc.student_id = $1
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
    const schema = getSchema(req);
    
    console.log('Assign consequence request:', { student_id, consequence_id, incident_id, assigned_date, schema, userId: req.user?.userId });
    
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!student_id || !assigned_date) {
      return res.status(400).json({ error: 'Student ID and assigned date are required' });
    }

    if (!req.user || !req.user.id) {
      console.error('User ID not found in request');
      return res.status(401).json({ error: 'User authentication failed' });
    }

    // Verify student exists in this school's schema
    const student = await schemaGet(req, 'SELECT id FROM students WHERE id = $1', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get consequence details first to check if it's a suspension
    const consequenceDetails = consequence_id ? await schemaGet(req, 
      'SELECT * FROM consequences WHERE id = $1', 
      [consequence_id]
    ) : null;

    // Determine consequence name - either from selected consequence or custom
    const consequenceName = consequenceDetails ? consequenceDetails.name : (notes || 'Custom Consequence');

    // Check if this is a suspension
    const isSuspension = consequenceDetails && consequenceDetails.severity === 'high';
    const initialStatus = 'pending';

    const result = await schemaRun(req,
      `INSERT INTO student_consequences (student_id, consequence_id, incident_id, consequence_name, assigned_by, assigned_date, due_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [student_id, consequence_id || null, incident_id || null, consequenceName, req.user.id, assigned_date, due_date || null, notes || null, initialStatus]
    );

    const consequence = await schemaGet(req, 'SELECT * FROM student_consequences WHERE id = $1', [result.id]);
    
    // Get student details for notifications
    const studentDetails = await schemaGet(req, 
      'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1', 
      [student_id]
    );
    
    // Create notification for parent
    try {
      if (studentDetails && studentDetails.parent_id) {
        await createNotification(
          req,
          studentDetails.parent_id,
          'consequence',
          'Consequence Assigned',
          `A consequence has been assigned to your child`,
          result.id,
          'consequence'
        );
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Notify admins for high severity consequences
    try {
      if (consequenceDetails && consequenceDetails.severity === 'high') {
        await notifySchoolAdmins(
          req,
          'high_severity_consequence',
          '⚠️ High Severity Consequence Assigned',
          `${consequenceDetails.name} assigned to ${studentDetails.student_name}`,
          result.id,
          'consequence'
        );
      }
    } catch (notifError) {
      console.error('Error notifying admins:', notifError);
    }

    res.status(201).json(consequence);
  } catch (error) {
    console.error('Error assigning consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign suspension (admin only) with notifications
router.post('/suspension', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { student_id, start_date, end_date, reason, notes } = req.body;
    const schema = getSchema(req);
    
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!student_id || !start_date) {
      return res.status(400).json({ error: 'Student ID and start date are required' });
    }

    // Verify student exists
    const student = await schemaGet(req, 
      'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1', 
      [student_id]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create the suspension consequence
    const result = await schemaRun(req,
      `INSERT INTO student_consequences (student_id, consequence_name, assigned_by, assigned_date, due_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [student_id, reason || 'Suspension', req.user.id, start_date, end_date || null, notes || null]
    );

    // Notify parent
    if (student.parent_id) {
      try {
        await createNotification(
          req,
          student.parent_id,
          'suspension',
          '⚠️ Student Suspended',
          `${student.student_name} has been suspended. Start date: ${start_date}${end_date ? `, End date: ${end_date}` : ''}.`,
          result.id,
          'consequence'
        );
      } catch (notifError) {
        console.error('Error notifying parent:', notifError);
      }
    }

    const consequence = await schemaGet(req, 'SELECT * FROM student_consequences WHERE id = $1', [result.id]);
    res.status(201).json(consequence);
  } catch (error) {
    console.error('Error assigning suspension:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student consequence (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes, due_date, completion_verified, completion_verified_by } = req.body;
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes || null);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(due_date || null);
    }
    if (completion_verified !== undefined) {
      updates.push(`completion_verified = $${paramIndex++}`);
      updates.push(`completion_verified_by = $${paramIndex++}`);
      updates.push('completion_verified_at = CURRENT_TIMESTAMP');
      params.push(completion_verified ? true : false);
      params.push(completion_verified ? (completion_verified_by || req.user.id) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    await schemaRun(req,
      `UPDATE student_consequences 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      params
    );

    const consequence = await schemaGet(req, 'SELECT * FROM student_consequences WHERE id = $1', [req.params.id]);
    res.json(consequence);
  } catch (error) {
    console.error('Error updating consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark consequence as completed (admin only)
router.put('/:id/complete', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    await schemaRun(req,
      'UPDATE student_consequences SET status = $1 WHERE id = $2',
      ['completed', req.params.id]
    );

    const consequence = await schemaGet(req, 'SELECT * FROM student_consequences WHERE id = $1', [req.params.id]);
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
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Verify this is the parent of the student
    const consequence = await schemaGet(req, `
      SELECT sc.*, s.parent_id 
      FROM student_consequences sc
      INNER JOIN students s ON sc.student_id = s.id
      WHERE sc.id = $1
    `, [req.params.id]);

    if (!consequence) {
      return res.status(404).json({ error: 'Consequence not found' });
    }

    if (consequence.parent_id !== userId) {
      return res.status(403).json({ error: 'You can only acknowledge consequences for your own children' });
    }

    await schemaRun(req,
      `UPDATE student_consequences 
       SET parent_acknowledged = true, 
           parent_acknowledged_at = CURRENT_TIMESTAMP,
           parent_notes = $1
       WHERE id = $2`,
      [parent_notes || null, req.params.id]
    );

    const updated = await schemaGet(req, 'SELECT * FROM student_consequences WHERE id = $1', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error acknowledging consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student consequence (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    await schemaRun(req, 'DELETE FROM student_consequences WHERE id = $1', [req.params.id]);
    res.json({ message: 'Consequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting consequence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
