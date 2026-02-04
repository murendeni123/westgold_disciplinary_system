const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createNotification, notifySchoolAdmins } = require('./notifications');

const router = express.Router();

// Get all consequence assignments (filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { student_id, status, consequence_type } = req.query;
    
    let query = `
      SELECT 
        ca.*,
        s.first_name || ' ' || s.last_name as student_name,
        s.student_id as student_number,
        u.name as assigned_by_name,
        c.class_name
      FROM consequence_assignments ca
      INNER JOIN students s ON ca.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN public.users u ON ca.assigned_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // If user is a teacher, only show consequences they assigned
    if (req.user.role === 'teacher') {
      query += ` AND ca.assigned_by = $${paramIndex++}`;
      params.push(req.user.id);
    }

    // If user is a parent, only show consequences for their children
    if (req.user.role === 'parent') {
      query += ` AND s.parent_id = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (student_id) {
      query += ` AND ca.student_id = $${paramIndex++}`;
      params.push(student_id);
    }

    if (status) {
      query += ` AND ca.status = $${paramIndex++}`;
      params.push(status);
    }

    if (consequence_type) {
      query += ` AND ca.consequence_type = $${paramIndex++}`;
      params.push(consequence_type);
    }

    query += ' ORDER BY ca.assigned_at DESC';

    const assignments = await schemaAll(req, query, params);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching consequence assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available consequences for assignment (role-based filtering)
router.get('/available-consequences', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Get all active consequences from the existing table
    const consequences = await schemaAll(req, `
      SELECT 
        id,
        name,
        description,
        severity,
        default_duration
      FROM consequences
      WHERE is_active = 1
      ORDER BY id
    `);

    // Map consequences to include consequence_type based on name
    const mappedConsequences = consequences.map(c => {
      const nameLower = c.name.toLowerCase();
      let consequence_type = 'other';
      let requires_admin_approval = false;

      if (nameLower.includes('verbal')) {
        consequence_type = 'verbal_warning';
      } else if (nameLower.includes('written')) {
        consequence_type = 'written_warning';
      } else if (nameLower.includes('suspension') || nameLower.includes('suspend')) {
        consequence_type = 'suspension';
        requires_admin_approval = true;
      }

      return {
        id: c.id,
        name: c.name,
        consequence_type,
        description: c.description || `${c.name} - ${c.default_duration || 'No duration specified'}`,
        severity: c.severity || 'medium',
        requires_admin_approval
      };
    });

    // Filter based on role
    if (req.user.role === 'teacher') {
      // Teachers can only assign verbal and written warnings
      const allowedConsequences = mappedConsequences.filter(c => 
        c.consequence_type === 'verbal_warning' || 
        c.consequence_type === 'written_warning'
      );
      return res.json(allowedConsequences);
    }

    // Admins can assign all consequences
    res.json(mappedConsequences);
  } catch (error) {
    console.error('Error fetching available consequences:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Assign consequence (role-based restrictions)
router.post('/assign', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { 
      student_id, 
      consequence_id, 
      consequence_type, 
      reason, 
      description,
      start_date,
      end_date,
      incident_id 
    } = req.body;

    // Validate required fields
    if (!student_id || !consequence_type || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields: student_id, consequence_type, and reason are required' 
      });
    }

    // CRITICAL: Role-based permission check
    // Teachers can ONLY assign verbal_warning and written_warning
    if (req.user.role === 'teacher') {
      if (consequence_type !== 'verbal_warning' && consequence_type !== 'written_warning') {
        return res.status(403).json({ 
          error: 'Teachers are not authorized to assign this consequence type. Only Verbal and Written Warnings are allowed.' 
        });
      }
    }

    // Only admins can assign suspensions
    if (consequence_type === 'suspension' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only administrators can assign suspensions' 
      });
    }

    // Verify student exists
    const student = await schemaGet(req, 
      'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1', 
      [student_id]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Insert consequence assignment
    const result = await schemaRun(req, `
      INSERT INTO consequence_assignments (
        student_id,
        consequence_id,
        assigned_by,
        assigned_by_role,
        consequence_type,
        reason,
        description,
        start_date,
        end_date,
        incident_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING id
    `, [
      student_id,
      consequence_id || null,
      req.user.id,
      req.user.role,
      consequence_type,
      reason,
      description || null,
      start_date || null,
      end_date || null,
      incident_id || null
    ]);

    const assignment = await schemaGet(req, `
      SELECT 
        ca.*,
        s.first_name || ' ' || s.last_name as student_name,
        u.name as assigned_by_name
      FROM consequence_assignments ca
      INNER JOIN students s ON ca.student_id = s.id
      LEFT JOIN public.users u ON ca.assigned_by = u.id
      WHERE ca.id = $1
    `, [result.id]);

    // Notify parent if exists - WITH EMAIL
    if (student.parent_id) {
      const consequenceLabel = consequence_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      await createNotification(
        req,
        student.parent_id,
        'consequence',
        `${consequenceLabel} Assigned`,
        `${student.student_name} has been assigned a ${consequenceLabel}. Reason: ${reason}`,
        result.id,
        'consequence',
        { sendEmail: true } // Send email for all consequence assignments
      );
    }

    // Notify admins for suspensions - WITH EMAIL
    if (consequence_type === 'suspension') {
      await notifySchoolAdmins(
        req,
        'suspension_assigned',
        '⚠️ Suspension Assigned',
        `${student.student_name} has been suspended. Reason: ${reason}`,
        result.id,
        'consequence',
        { sendEmail: true } // Send email for suspensions
      );
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error assigning consequence:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update consequence assignment status
router.put('/:id', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { status, notes } = req.body;

    // Get existing assignment
    const existing = await schemaGet(req, 
      'SELECT * FROM consequence_assignments WHERE id = $1', 
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Consequence assignment not found' });
    }

    // Teachers can only update their own assignments
    if (req.user.role === 'teacher' && existing.assigned_by !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only update consequences you assigned' 
      });
    }

    // Update assignment
    await schemaRun(req, `
      UPDATE consequence_assignments 
      SET status = $1, notes = $2
      WHERE id = $3
    `, [status, notes || existing.notes, req.params.id]);

    const updated = await schemaGet(req, `
      SELECT 
        ca.*,
        s.first_name || ' ' || s.last_name as student_name,
        u.name as assigned_by_name
      FROM consequence_assignments ca
      INNER JOIN students s ON ca.student_id = s.id
      LEFT JOIN public.users u ON ca.assigned_by = u.id
      WHERE ca.id = $1
    `, [req.params.id]);

    res.json(updated);
  } catch (error) {
    console.error('Error updating consequence assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete consequence assignment (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM consequence_assignments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Consequence assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting consequence assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Automated consequence evaluation - checks if students meet criteria for consequences
router.post('/evaluate-student', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    // Get student's behavior statistics
    const stats = await schemaGet(req, `
      SELECT 
        s.id,
        s.first_name || ' ' || s.last_name as student_name,
        s.parent_id,
        COUNT(DISTINCT bi.id) as total_incidents,
        COALESCE(SUM(bi.points_deducted), 0) as total_points,
        COUNT(DISTINCT CASE WHEN bi.severity = 'high' THEN bi.id END) as high_severity_count,
        COUNT(DISTINCT CASE WHEN bi.severity = 'critical' THEN bi.id END) as critical_severity_count,
        COUNT(DISTINCT ca.id) FILTER (WHERE ca.consequence_type = 'verbal_warning') as verbal_warnings,
        COUNT(DISTINCT ca.id) FILTER (WHERE ca.consequence_type = 'written_warning') as written_warnings,
        COUNT(DISTINCT ca.id) FILTER (WHERE ca.consequence_type = 'suspension') as suspensions
      FROM students s
      LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id 
        AND bi.date >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN consequence_assignments ca ON s.id = ca.student_id
        AND ca.assigned_at >= CURRENT_DATE - INTERVAL '30 days'
      WHERE s.id = $1
      GROUP BY s.id, s.first_name, s.last_name, s.parent_id
    `, [student_id]);

    if (!stats) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const recommendations = [];

    // Evaluation criteria for automated consequences
    // Verbal Warning: 3-5 incidents OR 10-20 points in 30 days
    if (stats.total_incidents >= 3 && stats.total_incidents <= 5 && stats.verbal_warnings === 0) {
      recommendations.push({
        consequence_type: 'verbal_warning',
        reason: `Student has ${stats.total_incidents} incidents in the last 30 days`,
        auto_assignable: true,
        severity: 'low'
      });
    }

    if (stats.total_points >= 10 && stats.total_points <= 20 && stats.verbal_warnings === 0) {
      recommendations.push({
        consequence_type: 'verbal_warning',
        reason: `Student has accumulated ${stats.total_points} demerit points in the last 30 days`,
        auto_assignable: true,
        severity: 'low'
      });
    }

    // Written Warning: 6-10 incidents OR 21-40 points OR 2+ high severity incidents
    if (stats.total_incidents >= 6 && stats.total_incidents <= 10 && stats.written_warnings === 0) {
      recommendations.push({
        consequence_type: 'written_warning',
        reason: `Student has ${stats.total_incidents} incidents in the last 30 days`,
        auto_assignable: true,
        severity: 'medium'
      });
    }

    if (stats.total_points >= 21 && stats.total_points <= 40 && stats.written_warnings === 0) {
      recommendations.push({
        consequence_type: 'written_warning',
        reason: `Student has accumulated ${stats.total_points} demerit points in the last 30 days`,
        auto_assignable: true,
        severity: 'medium'
      });
    }

    if (stats.high_severity_count >= 2 && stats.written_warnings === 0) {
      recommendations.push({
        consequence_type: 'written_warning',
        reason: `Student has ${stats.high_severity_count} high severity incidents in the last 30 days`,
        auto_assignable: true,
        severity: 'medium'
      });
    }

    // Suspension: 11+ incidents OR 41+ points OR 1+ critical incident OR 3+ written warnings
    if (stats.total_incidents >= 11 && stats.suspensions === 0) {
      recommendations.push({
        consequence_type: 'suspension',
        reason: `Student has ${stats.total_incidents} incidents in the last 30 days`,
        auto_assignable: false,
        requires_admin: true,
        severity: 'high'
      });
    }

    if (stats.total_points >= 41 && stats.suspensions === 0) {
      recommendations.push({
        consequence_type: 'suspension',
        reason: `Student has accumulated ${stats.total_points} demerit points in the last 30 days`,
        auto_assignable: false,
        requires_admin: true,
        severity: 'high'
      });
    }

    if (stats.critical_severity_count >= 1 && stats.suspensions === 0) {
      recommendations.push({
        consequence_type: 'suspension',
        reason: `Student has ${stats.critical_severity_count} critical severity incident(s) in the last 30 days`,
        auto_assignable: false,
        requires_admin: true,
        severity: 'critical'
      });
    }

    if (stats.written_warnings >= 3 && stats.suspensions === 0) {
      recommendations.push({
        consequence_type: 'suspension',
        reason: `Student has received ${stats.written_warnings} written warnings in the last 30 days`,
        auto_assignable: false,
        requires_admin: true,
        severity: 'high'
      });
    }

    res.json({
      student: stats,
      recommendations,
      requires_action: recommendations.length > 0
    });
  } catch (error) {
    console.error('Error evaluating student consequences:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get consequence statistics for dashboard
router.get('/statistics', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const stats = await schemaGet(req, `
      SELECT 
        COUNT(*) as total_consequences,
        COUNT(*) FILTER (WHERE consequence_type = 'verbal_warning') as verbal_warnings,
        COUNT(*) FILTER (WHERE consequence_type = 'written_warning') as written_warnings,
        COUNT(*) FILTER (WHERE consequence_type = 'suspension') as suspensions,
        COUNT(*) FILTER (WHERE status = 'active') as active_consequences,
        COUNT(*) FILTER (WHERE assigned_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE assigned_at >= CURRENT_DATE - INTERVAL '30 days') as this_month
      FROM consequence_assignments
    `);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching consequence statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
