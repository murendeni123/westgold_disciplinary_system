const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get detention rules
router.get('/rules', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const rules = await dbAll('SELECT * FROM detention_rules ORDER BY min_points');
    res.json(rules);
  } catch (error) {
    console.error('Error fetching detention rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/update detention rule
router.post('/rules', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id, action_type, min_points, max_points, severity, detention_duration, is_active } = req.body;

    if (id) {
      await dbRun(
        `UPDATE detention_rules 
         SET action_type = ?, min_points = ?, max_points = ?, severity = ?, detention_duration = ?, is_active = ?
         WHERE id = ?`,
        [action_type, min_points, max_points || null, severity || null, detention_duration || 60, is_active !== undefined ? is_active : 1, id]
      );
      const rule = await dbGet('SELECT * FROM detention_rules WHERE id = ?', [id]);
      res.json(rule);
    } else {
      const result = await dbRun(
        `INSERT INTO detention_rules (action_type, min_points, max_points, severity, detention_duration, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [action_type, min_points, max_points || null, severity || null, detention_duration || 60, is_active !== undefined ? is_active : 1]
      );
      const rule = await dbGet('SELECT * FROM detention_rules WHERE id = ?', [result.id]);
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
    const { date, status } = req.query;
    
    let query = `
      SELECT d.*, u.name as teacher_name,
             (SELECT COUNT(*) FROM detention_assignments WHERE detention_id = d.id) as student_count
      FROM detentions d
      LEFT JOIN users u ON d.teacher_on_duty_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND d.detention_date = ?';
      params.push(date);
    }
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.detention_date DESC, d.detention_time';

    const detentions = await dbAll(query, params);
    res.json(detentions);
  } catch (error) {
    console.error('Error fetching detentions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detention by ID with assignments
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const detention = await dbGet(`
      SELECT d.*, u.name as teacher_name
      FROM detentions d
      LEFT JOIN users u ON d.teacher_on_duty_id = u.id
      WHERE d.id = ?
    `, [req.params.id]);

    if (!detention) {
      return res.status(404).json({ error: 'Detention not found' });
    }

    const assignments = await dbAll(`
      SELECT da.*, s.first_name || ' ' || s.last_name as student_name, s.student_id
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      WHERE da.detention_id = ?
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
    const { detention_date, detention_time, duration, location, teacher_on_duty_id, notes } = req.body;

    const result = await dbRun(
      `INSERT INTO detentions (detention_date, detention_time, duration, location, teacher_on_duty_id, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [detention_date, detention_time, duration || 60, location || null, teacher_on_duty_id || null, notes || null]
    );

    const detention = await dbGet('SELECT * FROM detentions WHERE id = ?', [result.id]);
    res.status(201).json(detention);
  } catch (error) {
    console.error('Error creating detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update detention
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { detention_date, detention_time, duration, location, teacher_on_duty_id, status, notes } = req.body;

    await dbRun(
      `UPDATE detentions 
       SET detention_date = ?, detention_time = ?, duration = ?, location = ?, teacher_on_duty_id = ?, status = ?, notes = ?
       WHERE id = ?`,
      [detention_date, detention_time, duration || 60, location || null, teacher_on_duty_id || null, status || 'scheduled', notes || null, req.params.id]
    );

    const detention = await dbGet('SELECT * FROM detentions WHERE id = ?', [req.params.id]);
    res.json(detention);
  } catch (error) {
    console.error('Error updating detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign student to detention
router.post('/:id/assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { student_id, incident_id, reason } = req.body;

    const result = await dbRun(
      `INSERT INTO detention_assignments (detention_id, student_id, incident_id, reason)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, student_id, incident_id || null, reason || null]
    );

    const assignment = await dbGet('SELECT * FROM detention_assignments WHERE id = ?', [result.id]);
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update detention attendance
router.put('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const { status, attendance_time, notes } = req.body;

    await dbRun(
      `UPDATE detention_assignments 
       SET status = ?, attendance_time = ?, notes = ?
       WHERE id = ?`,
      [status, attendance_time || null, notes || null, req.params.id]
    );

    const assignment = await dbGet(`
      SELECT da.*, s.first_name, s.last_name, s.parent_id, d.detention_date, d.detention_time
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      INNER JOIN detentions d ON da.detention_id = d.id
      WHERE da.id = ?
    `, [req.params.id]);

    // Notify parent if student was late or absent
    if (assignment && assignment.parent_id && (status === 'late' || status === 'absent')) {
      await createNotification(
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

// Auto-assign students based on incidents
router.post('/auto-assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { detention_id } = req.body;

    // Get active detention rules
    const rules = await dbAll('SELECT * FROM detention_rules WHERE is_active = 1 ORDER BY min_points DESC');

    // Get students with pending incidents
    const incidents = await dbAll(`
      SELECT bi.*, s.id as student_id,
             (SELECT COALESCE(SUM(points), 0) FROM behaviour_incidents WHERE student_id = s.id AND status = 'approved') as total_points
      FROM behaviour_incidents bi
      INNER JOIN students s ON bi.student_id = s.id
      WHERE bi.status = 'approved' AND bi.id NOT IN (SELECT incident_id FROM detention_assignments WHERE incident_id IS NOT NULL)
    `);

    const assignments = [];
    for (const incident of incidents) {
      // Find matching rule
      const rule = rules.find(r => 
        incident.total_points >= r.min_points &&
        (!r.max_points || incident.total_points <= r.max_points) &&
        (!r.severity || r.severity === incident.severity) &&
        r.action_type === 'detention'
      );

      if (rule) {
        const result = await dbRun(
          `INSERT INTO detention_assignments (detention_id, student_id, incident_id, reason)
           VALUES (?, ?, ?, ?)`,
          [detention_id, incident.student_id, incident.id, `Auto-assigned: ${incident.incident_type} (${incident.total_points} points)`]
        );
        assignments.push(result.id);

        // Get student and parent info for notification
        const student = await dbGet('SELECT * FROM students WHERE id = ?', [incident.student_id]);
        const detention = await dbGet('SELECT * FROM detentions WHERE id = ?', [detention_id]);

        // Notify parent if student has a parent
        if (student && student.parent_id) {
          await createNotification(
            student.parent_id,
            'detention_assigned',
            'Detention Assigned',
            `Your child ${student.first_name} ${student.last_name} has been assigned to detention on ${detention.detention_date} at ${detention.detention_time}. Reason: ${incident.incident_type}`,
            detention_id,
            'detention'
          );
        }
      }
    }

    res.json({ message: 'Auto-assignment completed', assignments_count: assignments.length });
  } catch (error) {
    console.error('Error auto-assigning:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete detention
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM detention_assignments WHERE detention_id = ?', [req.params.id]);
    await dbRun('DELETE FROM detentions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Detention deleted successfully' });
  } catch (error) {
    console.error('Error deleting detention:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

