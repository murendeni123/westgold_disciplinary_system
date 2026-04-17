const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createNotification, notifySchoolAdmins } = require('./notifications');
const { sendDetentionNotificationEmail } = require('../utils/emailService');
const { dbGet } = require('../database/db');

const router = express.Router();

// ── Session Freeze Helper ─────────────────────────────────────────────────────
// Returns true when a session is locked (completed or explicitly frozen).
// Pass a direct detention_sessions row. Attendance-update endpoints use an
// explicit `session_status` field check instead (see guards below).
function isSessionFrozen(session) {
  return session.status === 'completed' || session.is_frozen === true;
}

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
    const { date, status, student_id } = req.query;
    
    // If user is a parent, return their children's detention assignments directly
    if (req.user.role === 'parent') {
      let parentQuery = `
        SELECT da.id, da.student_id, da.detention_id, da.status, da.notes, da.created_at,
               ds.detention_date, ds.detention_time, ds.duration, ds.location, ds.status as session_status,
               s.first_name || ' ' || s.last_name as student_name,
               s.student_id as student_number,
               u.name as teacher_name
        FROM detention_assignments da
        INNER JOIN detention_sessions ds ON da.detention_id = ds.id
        INNER JOIN students s ON da.student_id = s.id
        LEFT JOIN teachers t ON ds.teacher_on_duty_id = t.id
        LEFT JOIN public.users u ON t.user_id = u.id
        WHERE s.parent_id = $1
      `;
      const parentParams = [req.user.id];
      let parentParamIndex = 2;
      
      if (student_id) {
        parentQuery += ` AND da.student_id = $${parentParamIndex++}`;
        parentParams.push(student_id);
      }
      
      parentQuery += ' ORDER BY ds.detention_date DESC, ds.detention_time';
      
      const parentDetentions = await schemaAll(req, parentQuery, parentParams);
      return res.json(parentDetentions);
    }
    
    let query = `
      SELECT d.*, u.name as teacher_name,
             (SELECT COUNT(*) FROM detention_assignments WHERE detention_id = d.id) as student_count
      FROM detention_sessions d
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      LEFT JOIN public.users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Grade head: see all detention sessions that have students from their grade
    if (req.user.isGradeHead && req.user.gradeHeadFor) {
      query += ` AND d.id IN (
        SELECT DISTINCT da.detention_id FROM detention_assignments da
        INNER JOIN students s ON da.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE c.grade_level = $${paramIndex++}
      )`;
      params.push(req.user.gradeHeadFor);
    } else if (req.user.role === 'teacher') {
      const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
      if (teacher) {
        query += ` AND d.teacher_on_duty_id = $${paramIndex++}`;
        params.push(teacher.id);
      }
    }

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

// Update detention session status
router.put('/sessions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const schema = getSchema(req);
    
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Validate status
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: scheduled, in_progress, completed, or cancelled' });
    }

    // Get session details
    const session = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [req.params.id]);
    if (!session) {
      return res.status(404).json({ error: 'Detention session not found' });
    }

    // Check authorization (admin, primary teacher, or any co-teacher)
    if (req.user.role !== 'admin') {
      const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
      let authorized = teacher && Number(teacher.id) === Number(session.teacher_on_duty_id);
      if (!authorized && teacher) {
        try {
          const coTeacher = await schemaGet(req, `
            SELECT id FROM detention_session_teachers
            WHERE session_id = $1 AND teacher_id = $2
          `, [req.params.id, teacher.id]);
          authorized = !!coTeacher;
        } catch { /* table may not exist yet */ }
      }
      if (!authorized) {
        return res.status(403).json({ error: 'Only assigned teachers or admin can update session status' });
      }
    }

    // IDEMPOTENCY GUARD: if the session is already completed, return early without
    // re-running the completion logic. Prevents double-resolving incidents if the
    // endpoint is accidentally called twice.
    if (session.status === 'completed' && status === 'completed') {
      const alreadyDone = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [req.params.id]);
      return res.json(alreadyDone);
    }

    // Update session status only — detention_assignments are NOT touched here.
    // All attendance records (attended, absent, late, excused, assigned) submitted
    // by the teacher are permanently preserved exactly as recorded.
    // DO NOT add any UPDATE to detention_assignments in this block.
    if (status === 'completed') {
      // When completing: stamp completed_at and freeze the session so no further
      // attendance edits are possible. Falls back gracefully if the migration
      // add_detention_freeze_columns.sql has not been applied yet.
      try {
        await schemaRun(req, `
          UPDATE detention_sessions
          SET status = $1, completed_at = NOW(), is_frozen = true
          WHERE id = $2
        `, [status, req.params.id]);
      } catch (freezeColErr) {
        console.warn('completed_at/is_frozen columns missing — run add_detention_freeze_columns.sql:', freezeColErr.message);
        await schemaRun(req, 'UPDATE detention_sessions SET status = $1 WHERE id = $2', [status, req.params.id]);
      }
    } else {
      await schemaRun(req, 'UPDATE detention_sessions SET status = $1 WHERE id = $2', [status, req.params.id]);
    }

    // If session is completed, mark behaviour incidents as resolved for students
    // who attended. We only READ detention_assignments here (status = 'attended');
    // we never write back to detention_assignments, ensuring attendance is preserved.
    if (status === 'completed') {
      const attendedStudents = await schemaAll(req, `
        SELECT student_id 
        FROM detention_assignments 
        WHERE detention_id = $1 AND status = 'attended'
      `, [req.params.id]);

      for (const student of attendedStudents) {
        await schemaRun(req, `
          UPDATE behaviour_incidents 
          SET status = 'resolved', resolved_at = NOW()
          WHERE student_id = $1 
            AND status != 'resolved'
            AND points_deducted > 0
        `, [student.student_id]);
      }
    }

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.schoolId}`).emit('detention_session_updated', {
        id: req.params.id,
        status
      });
    }

    // ── Completion notifications ───────────────────────────────────────────────
    // Notify primary teacher + all co-teachers when session is completed.
    if (status === 'completed') {
      try {
        const sessionDate = session.detention_date
          ? new Date(session.detention_date).toLocaleDateString()
          : 'N/A';
        const notifyMsg = `The detention session on ${sessionDate} has been completed and the register is now locked.`;
        const notifyTitle = 'Detention Session Completed & Locked';

        // Primary teacher
        if (session.teacher_on_duty_id) {
          const primaryUser = await schemaGet(req, `
            SELECT t.user_id FROM teachers t WHERE t.id = $1
          `, [session.teacher_on_duty_id]);
          if (primaryUser) {
            await createNotification(req, primaryUser.user_id, 'session_completed',
              notifyTitle, notifyMsg, req.params.id, 'detention');
          }
        }

        // Co-teachers from junction table
        try {
          const coTeachers = await schemaAll(req, `
            SELECT t.user_id
            FROM detention_session_teachers dst
            JOIN teachers t ON dst.teacher_id = t.id
            WHERE dst.session_id = $1
              AND t.id != $2
          `, [req.params.id, session.teacher_on_duty_id || 0]);
          for (const ct of coTeachers) {
            await createNotification(req, ct.user_id, 'session_completed',
              notifyTitle, notifyMsg, req.params.id, 'detention');
          }
        } catch { /* junction table not yet created */ }

        // Notify admins
        await notifySchoolAdmins(req, 'session_completed', notifyTitle, notifyMsg,
          req.params.id, 'detention');
      } catch (notifyErr) {
        console.error('Error sending completion notifications:', notifyErr);
      }
    }

    const updatedSession = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [req.params.id]);
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update detention assignment attendance
router.put('/assignments/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const { attendance_status, notes } = req.body;
    const schema = getSchema(req);
    
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Validate attendance status
    const validStatuses = ['present', 'attended', 'absent', 'late', 'excused', 'pending', 'assigned'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({ error: 'Invalid attendance status. Must be: present, attended, absent, late, excused, or pending' });
    }
    
    // Map frontend values to database values
    const statusMapping = {
      'present': 'attended',
      'pending': 'assigned',
      'attended': 'attended',
      'absent': 'absent',
      'late': 'late',
      'excused': 'excused',
      'assigned': 'assigned'
    };
    const dbStatus = statusMapping[attendance_status] || attendance_status;

    // Get assignment details (enhanced to include session status + grade for freeze/notification)
    const assignment = await schemaGet(req, `
      SELECT da.*, s.first_name || ' ' || s.last_name as student_name, s.parent_id,
             ds.teacher_on_duty_id, ds.status as session_status, ds.detention_date,
             c.grade_level as student_grade,
             u.name as teacher_name
      FROM detention_assignments da
      JOIN students s ON da.student_id = s.id
      JOIN detention_sessions ds ON da.detention_id = ds.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON ds.teacher_on_duty_id = t.id
      LEFT JOIN public.users u ON t.user_id = u.id
      WHERE da.id = $1
    `, [req.params.id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Detention assignment not found' });
    }

    // FREEZE GUARD: block all attendance changes once the session is completed.
    // This is the authoritative server-side enforcement — the frontend lock is UI-only.
    if (assignment.session_status === 'completed') {
      return res.status(403).json({
        error: 'This detention session is completed and locked. Attendance records cannot be modified.'
      });
    }

    // Check authorization: admin, primary teacher, or any co-teacher on this session
    if (req.user.role !== 'admin') {
      const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
      let authorized = teacher && Number(teacher.id) === Number(assignment.teacher_on_duty_id);
      if (!authorized && teacher) {
        try {
          const coTeacher = await schemaGet(req, `
            SELECT id FROM detention_session_teachers
            WHERE session_id = $1 AND teacher_id = $2
          `, [assignment.detention_id, teacher.id]);
          authorized = !!coTeacher;
        } catch { /* junction table not yet created */ }
      }
      if (!authorized) {
        return res.status(403).json({ error: 'Only assigned teachers or admin can mark attendance' });
      }
    }

    // Get teacher ID for marking
    const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);

    // Update attendance using the mapped database status
    await schemaRun(req, `
      UPDATE detention_assignments 
      SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
      WHERE id = $3
    `, [dbStatus, notes || null, req.params.id]);

    // If student attended detention, mark their unresolved incidents as resolved
    if (dbStatus === 'attended') {
      await schemaRun(req, `
        UPDATE behaviour_incidents 
        SET status = 'resolved', resolved_at = NOW()
        WHERE student_id = $1 
          AND status != 'resolved'
          AND points_deducted > 0
      `, [assignment.student_id]);
    }

    // Send notifications for absent/late/excused
    if (['absent', 'late', 'excused'].includes(dbStatus)) {
      // Notify parent
      if (assignment.parent_id) {
        let title, message;
        switch (dbStatus) {
          case 'absent':
            title = 'Detention Absence';
            message = `Your child, ${assignment.student_name}, was marked absent from detention. This may result in additional consequences.`;
            break;
          case 'late':
            title = 'Detention Late Arrival';
            message = `Your child, ${assignment.student_name}, arrived late to detention.`;
            break;
          case 'excused':
            title = 'Detention Excused';
            message = `Your child, ${assignment.student_name}, has been excused from detention.${notes ? ` Reason: ${notes}` : ''}`;
            break;
        }
        
        await createNotification(req, assignment.parent_id, 'detention_attendance', title, message, req.params.id, 'detention');
      }

      // Notify admins for absent status
      if (dbStatus === 'absent') {
        await notifySchoolAdmins(req, 'detention_absence', 'Detention Absence', 
          `${assignment.student_name} was marked absent from detention.`, req.params.id, 'detention');
      }

      // Notify grade head(s) for the student's grade when marked absent
      if (dbStatus === 'absent' && assignment.student_grade) {
        try {
          const gradeHeads = await schemaAll(req, `
            SELECT t.user_id
            FROM teachers t
            WHERE t.is_grade_head = true
              AND t.grade_head_for = $1
          `, [assignment.student_grade]);
          const detDateStr = assignment.detention_date
            ? new Date(assignment.detention_date).toLocaleDateString()
            : 'N/A';
          for (const gh of gradeHeads) {
            await createNotification(
              req, gh.user_id, 'detention_absence',
              'Student Absent from Detention',
              `${assignment.student_name} was absent from detention on ${detDateStr}. Teacher on duty: ${assignment.teacher_name || 'N/A'}.`,
              req.params.id, 'detention'
            );
          }
        } catch (ghErr) {
          console.error('Error notifying grade heads of detention absence:', ghErr);
        }
      }
    }

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.schoolId}`).emit('detention_attendance_updated', {
        id: req.params.id,
        status: dbStatus
      });
    }

    const updatedAssignment = await schemaGet(req, 'SELECT * FROM detention_assignments WHERE id = $1', [req.params.id]);
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all qualifying students (for dashboard display) - MUST be before /:id route
router.get('/qualifying-students', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const qualifyingStudents = await schemaAll(req, `
      SELECT 
        s.id,
        s.student_id as student_number,
        s.first_name || ' ' || s.last_name as student_name,
        c.class_name,
        COALESCE(SUM(bi.points_deducted), 0) as total_points,
        0 as upcoming_detentions
      FROM students s
      LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id
        AND bi.status != 'resolved'
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.is_active = true
        AND s.id NOT IN (
          SELECT DISTINCT da.student_id
          FROM detention_assignments da
          INNER JOIN detention_sessions ds ON da.detention_id = ds.id
          WHERE ds.detention_date >= CURRENT_DATE
            AND da.status IN ('assigned', 'late', 'attended')
        )
      GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.class_name
      HAVING COALESCE(SUM(bi.points_deducted), 0) >= 10
      ORDER BY COALESCE(SUM(bi.points_deducted), 0) DESC
    `);

    res.json(qualifyingStudents);
  } catch (error) {
    console.error('Error fetching qualifying students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get queued students waiting for detention assignment - MUST be before /:id route
router.get('/queue', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Check if detention_queue table exists
    const tableExists = await schemaGet(req, `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'detention_queue'
      )
    `, [schema]);

    if (!tableExists || !tableExists.exists) {
      // Table doesn't exist yet, return empty array
      return res.json([]);
    }

    const queuedStudents = await schemaAll(req, `
      SELECT 
        dq.id,
        dq.student_id,
        dq.points_at_queue,
        dq.queued_at,
        dq.status,
        s.first_name || ' ' || s.last_name as student_name,
        s.student_id as student_number,
        c.class_name
      FROM detention_queue dq
      INNER JOIN students s ON dq.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE dq.status = 'pending'
      ORDER BY dq.queued_at ASC
    `);

    res.json(queuedStudents);
  } catch (error) {
    console.error('Error fetching detention queue:', error);
    // Return empty array instead of error to prevent frontend crash
    res.json([]);
  }
});

// ── Multi-teacher endpoints ────────────────────────────────────────────────────
// These live before /:id to avoid any routing ambiguity.

// List all co-teachers assigned to a session
router.get('/:id/teachers', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) return res.status(403).json({ error: 'School context required' });
    try {
      const teachers = await schemaAll(req, `
        SELECT dst.teacher_id as id, u.name, u.email,
               t.subject_taught
        FROM detention_session_teachers dst
        JOIN teachers t  ON dst.teacher_id  = t.id
        JOIN public.users u ON t.user_id = u.id
        WHERE dst.session_id = $1
        ORDER BY u.name
      `, [req.params.id]);
      res.json(teachers);
    } catch { res.json([]); }  // table not yet created
  } catch (err) {
    console.error('Error fetching session teachers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign an additional teacher / invigilator to a session
router.post('/:id/teachers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) return res.status(403).json({ error: 'School context required' });
    const { teacher_id } = req.body;
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id is required' });

    // Ensure the junction table exists (safe to call multiple times)
    await schemaRun(req, `
      CREATE TABLE IF NOT EXISTS detention_session_teachers (
        id         SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES detention_sessions(id) ON DELETE CASCADE,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id)           ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (session_id, teacher_id)
      )
    `);

    await schemaRun(req, `
      INSERT INTO detention_session_teachers (session_id, teacher_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.params.id, teacher_id]);

    const teachers = await schemaAll(req, `
      SELECT dst.teacher_id as id, u.name, u.email
      FROM detention_session_teachers dst
      JOIN teachers t ON dst.teacher_id = t.id
      JOIN public.users u ON t.user_id = u.id
      WHERE dst.session_id = $1
      ORDER BY u.name
    `, [req.params.id]);
    res.json({ success: true, teachers });
  } catch (err) {
    console.error('Error assigning teacher to session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a co-teacher from a session
router.delete('/:id/teachers/:teacherId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) return res.status(403).json({ error: 'School context required' });
    try {
      await schemaRun(req, `
        DELETE FROM detention_session_teachers
        WHERE session_id = $1 AND teacher_id = $2
      `, [req.params.id, req.params.teacherId]);
    } catch { /* table not yet created — nothing to delete */ }
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing teacher from session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Session attendance Excel report ───────────────────────────────────────────
// Accessible to admins, the session's primary teacher, and any co-teacher.
router.get('/:id/report/excel', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) return res.status(403).json({ error: 'School context required' });

    const session = await schemaGet(req, `
      SELECT ds.*, u.name as teacher_name
      FROM detention_sessions ds
      LEFT JOIN teachers t ON ds.teacher_on_duty_id = t.id
      LEFT JOIN public.users u ON t.user_id = u.id
      WHERE ds.id = $1
    `, [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Authorization: admin, primary teacher, or co-teacher
    if (req.user.role !== 'admin') {
      const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
      let authorized = teacher && Number(teacher.id) === Number(session.teacher_on_duty_id);
      if (!authorized && teacher) {
        try {
          const co = await schemaGet(req, `
            SELECT id FROM detention_session_teachers
            WHERE session_id = $1 AND teacher_id = $2
          `, [req.params.id, teacher.id]);
          authorized = !!co;
        } catch {}
      }
      if (!authorized) return res.status(403).json({ error: 'Not authorized to download this report' });
    }

    const assignments = await schemaAll(req, `
      SELECT da.status, da.notes,
             s.first_name || ' ' || s.last_name as student_name,
             s.student_id   as student_number,
             c.class_name,
             c.grade_level
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      LEFT JOIN  classes  c ON s.class_id    = c.id
      WHERE da.detention_id = $1
      ORDER BY s.last_name, s.first_name
    `, [req.params.id]);

    const ExcelJS = require('exceljs');
    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detention Register');

    // ── Header section ────────────────────────────────────────────────────────
    const sessionDate = session.detention_date
      ? new Date(session.detention_date).toLocaleDateString('en-ZA')
      : 'N/A';

    worksheet.addRow(['DETENTION REGISTER']);
    worksheet.addRow([`Date: ${sessionDate}`]);
    worksheet.addRow([`Time: ${session.detention_time || 'N/A'}`]);
    worksheet.addRow([`Location: ${session.location || 'N/A'}`]);
    worksheet.addRow([`Teacher on Duty: ${session.teacher_name || 'N/A'}`]);
    worksheet.addRow([`Status: ${session.status.toUpperCase()}`]);
    worksheet.addRow([]);

    // ── Attendance table ──────────────────────────────────────────────────────
    const headerRow = worksheet.addRow([
      'Student Name', 'Student ID', 'Grade', 'Class', 'Attendance Status', 'Served', 'Notes',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF143D59' } };
    headerRow.font  = { bold: true, color: { argb: 'FFFFFFFF' } };

    const statusLabel = {
      attended: 'Present', present: 'Present',
      absent:   'Absent',  late:    'Late',
      excused:  'Excused', assigned: 'Pending',
    };

    let presentCount = 0;
    for (const a of assignments) {
      const served = (a.status === 'attended' || a.status === 'present') ? 'Yes' : 'No';
      if (served === 'Yes') presentCount++;
      worksheet.addRow([
        a.student_name,
        a.student_number || '',
        a.grade_level    || '',
        a.class_name     || '',
        statusLabel[a.status] || a.status || 'Pending',
        served,
        a.notes || '',
      ]);
    }

    worksheet.addRow([]);
    worksheet.addRow([`Total Students: ${assignments.length}  |  Served: ${presentCount}  |  Absent: ${assignments.length - presentCount}`]);

    // Auto-size columns
    worksheet.columns.forEach(col => {
      let max = 10;
      col.eachCell?.({ includeEmpty: true }, cell => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 4, 40);
    });

    const fileName = `detention_register_${req.params.id}_${sessionDate.replace(/\//g, '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating detention Excel report:', err);
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
      SELECT d.*, u.name as teacher_name
      FROM detention_sessions d
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      LEFT JOIN public.users u ON t.user_id = u.id
      WHERE d.id = $1
    `, [req.params.id]);

    if (!detention) {
      return res.status(404).json({ error: 'Detention not found' });
    }

    const assignments = await schemaAll(req, `
      SELECT da.id,
             da.detention_id,
             da.student_id       AS student_db_id,
             da.status,
             da.notes,
             da.attendance_time,
             da.departure_time,
             da.reason,
             da.incident_id,
             da.assigned_by,
             da.parent_notified,
             da.created_at,
             da.updated_at,
             s.student_id        AS student_number,
             s.first_name || ' ' || s.last_name AS student_name,
             c.grade_level,
             c.class_name
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      LEFT  JOIN classes  c ON s.class_id    = c.id
      WHERE da.detention_id = $1
      ORDER BY s.last_name, s.first_name
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
    const { detention_date, detention_time, duration, location, teacher_on_duty_id, max_capacity, notes } = req.body;

    const result = await schemaRun(req,
      `INSERT INTO detention_sessions (detention_date, detention_time, duration, location, teacher_on_duty_id, max_capacity, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled') RETURNING id`,
      [detention_date, detention_time, duration || 60, location || null, teacher_on_duty_id || null, max_capacity || 30, notes || null]
    );

    // If teacher was assigned, send notification
    if (teacher_on_duty_id) {
      const teacher = await schemaGet(req, 'SELECT * FROM teachers WHERE id = $1', [teacher_on_duty_id]);
      if (teacher && teacher.user_id) {
        const detentionDate = new Date(detention_date).toLocaleDateString();
        await createNotification(
          req,
          teacher.user_id,
          'detention',
          'Detention Assignment',
          `You have been assigned to supervise detention on ${detentionDate} at ${detention_time}. Location: ${location || 'TBD'}`,
          result.id,
          'detention'
        );
      }
    }

    const detention = await schemaGet(req, `
      SELECT d.*, t.name as teacher_name
      FROM detention_sessions d
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      WHERE d.id = $1
    `, [result.id]);
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
    const { detention_date, detention_time, duration, location, teacher_on_duty_id, max_capacity, status, notes } = req.body;

    // Get old detention to check if teacher changed
    const oldDetention = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [req.params.id]);

    await schemaRun(req,
      `UPDATE detention_sessions 
       SET detention_date = $1, detention_time = $2, duration = $3, location = $4, teacher_on_duty_id = $5, max_capacity = $6, status = $7, notes = $8
       WHERE id = $9`,
      [detention_date, detention_time, duration || 60, location || null, teacher_on_duty_id || null, max_capacity || 30, status || 'scheduled', notes || null, req.params.id]
    );

    // If teacher was assigned or changed, send notification
    if (teacher_on_duty_id && teacher_on_duty_id !== oldDetention.teacher_on_duty_id) {
      const teacher = await schemaGet(req, 'SELECT * FROM teachers WHERE id = $1', [teacher_on_duty_id]);
      if (teacher && teacher.user_id) {
        const detentionDate = new Date(detention_date).toLocaleDateString();
        await createNotification(
          req,
          teacher.user_id,
          'detention',
          'Detention Assignment',
          `You have been assigned to supervise detention on ${detentionDate} at ${detention_time}. Location: ${location || 'TBD'}`,
          req.params.id,
          'detention'
        );
      }
    }

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
      `INSERT INTO detention_assignments (detention_id, student_id, incident_id, notes)
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
    
    // Notify parent if exists - WITH EMAIL
    if (student && student.parent_id && detention) {
      const detentionDate = new Date(detention.detention_date).toLocaleDateString();
      await createNotification(
        req,
        student.parent_id,
        'detention',
        'Detention Assigned',
        `${student.student_name} has been assigned to detention on ${detentionDate} at ${detention.detention_time}. Reason: ${reason || 'Not specified'}`,
        result.id,
        'detention',
        { sendEmail: true } // Send email for detention assignments
      );

      // Send detailed email to parent
      try {
        const parent = await dbGet('SELECT email, name FROM public.users WHERE id = $1', [student.parent_id]);
        if (parent && parent.email) {
          console.log(`📧 Sending detention email to parent: ${parent.name} (${parent.email})`);
          await sendDetentionNotificationEmail(
            parent.email,
            parent.name,
            student.student_name,
            detention.detention_date,
            detention.detention_time,
            detention.duration || 60,
            detention.location,
            reason || 'Not specified'
          );
          console.log(`✅ Detention email sent successfully to ${parent.email}`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending detention email:`, emailError);
      }
    }
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update detention attendance with intelligent point tracking and auto-reassignment
router.put('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { status, attendance_time, notes } = req.body;

    // Get assignment details before update
    const assignment = await schemaGet(req, `
      SELECT da.*, s.first_name, s.last_name, s.parent_id, s.id as student_id,
             d.detention_date, d.detention_time, d.id as detention_id,
             d.status as session_status,
             c.grade_level as student_grade,
             u.name as teacher_name
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      INNER JOIN detention_sessions d ON da.detention_id = d.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      LEFT JOIN public.users u ON t.user_id = u.id
      WHERE da.id = $1
    `, [req.params.id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // FREEZE GUARD: block all attendance changes once the session is completed
    if (assignment.session_status === 'completed') {
      return res.status(403).json({
        error: 'This detention session is completed and locked. Attendance records cannot be modified.'
      });
    }

    // Update the assignment status
    await schemaRun(req,
      `UPDATE detention_assignments 
       SET status = $1, notes = $2, attendance_time = $3
       WHERE id = $4`,
      [status, notes || null, attendance_time || null, req.params.id]
    );

    // If student attended detention, notify parent
    if (status === 'attended') {
      // Notify parent of successful completion
      if (assignment.parent_id) {
        await createNotification(
          req,
          assignment.parent_id,
          'detention_attendance',
          'Detention Completed',
          `${assignment.first_name} ${assignment.last_name} successfully completed detention on ${assignment.detention_date}.`,
          assignment.detention_id,
          'detention'
        );
      }
    }

    // Handle absent or dismissed students - auto-reassign to next available session
    if (status === 'absent' || status === 'dismissed') {
      // Find the next available detention session with capacity
      const nextSession = await schemaGet(req, `
        SELECT ds.id, ds.detention_date, ds.detention_time, ds.max_capacity,
               (SELECT COUNT(*) FROM detention_assignments WHERE detention_id = ds.id) as current_count
        FROM detention_sessions ds
        WHERE ds.detention_date > $1
          AND ds.status = 'scheduled'
        ORDER BY ds.detention_date ASC, ds.detention_time ASC
        LIMIT 1
      `, [assignment.detention_date]);

      if (nextSession && nextSession.current_count < (nextSession.max_capacity || 30)) {
        // Auto-assign to next session
        try {
          await schemaRun(req,
            `INSERT INTO detention_assignments 
             (detention_id, student_id, notes, assigned_by, status)
             VALUES ($1, $2, $3, $4, 'assigned')`,
            [
              nextSession.id,
              assignment.student_id,
              `Auto-reassigned: ${status === 'absent' ? 'Absent' : 'Dismissed'} from previous detention`,
              req.user.id
            ]
          );

          // Notify parent of reassignment
          if (assignment.parent_id) {
            const nextDate = new Date(nextSession.detention_date).toLocaleDateString();
            await createNotification(
              req,
              assignment.parent_id,
              'detention',
              'Detention Rescheduled',
              `${assignment.first_name} ${assignment.last_name} has been reassigned to detention on ${nextDate} at ${nextSession.detention_time} due to ${status === 'absent' ? 'absence' : 'dismissal'} from the previous session.`,
              nextSession.id,
              'detention'
            );
          }
        } catch (error) {
          console.error('Error auto-reassigning student:', error);
        }
      } else {
        // No available session - add to queue
        try {
          const existingQueue = await schemaGet(req,
            'SELECT id FROM detention_queue WHERE student_id = $1 AND status = $2',
            [assignment.student_id, 'pending']
          );

          if (!existingQueue) {
            await schemaRun(req,
              `INSERT INTO detention_queue (student_id, points_at_queue, status)
               VALUES ($1, $2, 'pending')`,
              [assignment.student_id, assignment.points_at_assignment || 0]
            );
          }
        } catch (error) {
          console.error('Error queuing student:', error);
        }
      }

      // Notify parent based on status
      if (assignment.parent_id) {
        if (status === 'absent') {
          await createNotification(
            req,
            assignment.parent_id,
            'detention_attendance',
            'Detention - Absent',
            `Your child ${assignment.first_name} ${assignment.last_name} was absent from detention on ${assignment.detention_date} at ${assignment.detention_time}. They will be reassigned to the next available session.`,
            assignment.detention_id,
            'detention'
          );
        } else if (status === 'dismissed') {
          await createNotification(
            req,
            assignment.parent_id,
            'detention_attendance',
            'Detention - Dismissed',
            `Your child ${assignment.first_name} ${assignment.last_name} was dismissed from detention on ${assignment.detention_date}. ${notes ? 'Reason: ' + notes : ''} They will be reassigned to the next available session.`,
            assignment.detention_id,
            'detention'
          );
        }
      }

      // Notify admins
      await notifySchoolAdmins(
        req,
        'detention_missed',
        `🚫 Student ${status === 'absent' ? 'Missed' : 'Dismissed from'} Detention`,
        `${assignment.first_name} ${assignment.last_name} was ${status} from detention on ${assignment.detention_date}. Auto-reassignment initiated.`,
        assignment.detention_id,
        'detention'
      );

      // Notify grade head(s) for the student's grade when marked absent
      if (status === 'absent' && assignment.student_grade) {
        try {
          const gradeHeads = await schemaAll(req, `
            SELECT t.user_id
            FROM teachers t
            WHERE t.is_grade_head = true
              AND t.grade_head_for = $1
          `, [assignment.student_grade]);
          const detDateStr = assignment.detention_date
            ? new Date(assignment.detention_date).toLocaleDateString()
            : 'N/A';
          for (const gh of gradeHeads) {
            await createNotification(
              req, gh.user_id, 'detention_absence',
              'Student Absent from Detention',
              `${assignment.first_name} ${assignment.last_name} was absent from detention on ${detDateStr}. Teacher on duty: ${assignment.teacher_name || 'N/A'}.`,
              assignment.detention_id, 'detention'
            );
          }
        } catch (ghErr) {
          console.error('Error notifying grade heads of detention absence:', ghErr);
        }
      }
    }

    // Handle other statuses
    if (assignment.parent_id) {
      if (status === 'late') {
        await createNotification(
          req,
          assignment.parent_id,
          'detention_attendance',
          'Detention - Late Arrival',
          `Your child ${assignment.first_name} ${assignment.last_name} arrived late for detention on ${assignment.detention_date} at ${assignment.detention_time}.`,
          assignment.detention_id,
          'detention'
        );
      } else if (status === 'excused') {
        await createNotification(
          req,
          assignment.parent_id,
          'detention_attendance',
          'Detention - Excused',
          `Your child ${assignment.first_name} ${assignment.last_name} has been excused from detention on ${assignment.detention_date}. ${notes ? 'Reason: ' + notes : ''}`,
          assignment.detention_id,
          'detention'
        );
      }
    }

    // Fetch updated assignment
    const updatedAssignment = await schemaGet(req, `
      SELECT da.*, s.first_name, s.last_name, s.parent_id, d.detention_date, d.detention_time
      FROM detention_assignments da
      INNER JOIN students s ON da.student_id = s.id
      INNER JOIN detention_sessions d ON da.detention_id = d.id
      WHERE da.id = $1
    `, [req.params.id]);

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto-assign students to detention based on rules with intelligent point tracking
router.post('/auto-assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { detention_id } = req.body;

    if (!detention_id) {
      return res.status(400).json({ error: 'Detention ID is required' });
    }

    // Get detention details
    const detention = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [detention_id]);
    if (!detention) {
      return res.status(404).json({ error: 'Detention not found' });
    }

    // Get current assignments count
    const currentAssignments = await schemaAll(req, 
      'SELECT student_id FROM detention_assignments WHERE detention_id = $1', 
      [detention_id]
    );
    const currentCount = currentAssignments.length;
    const maxCapacity = detention.max_capacity || 30;
    const availableSlots = maxCapacity - currentCount;

    if (availableSlots <= 0) {
      return res.json({ 
        message: 'Detention session is at full capacity',
        assigned_count: 0,
        queued_count: 0,
        total_count: currentCount,
        capacity: maxCapacity
      });
    }

    const assignedStudents = new Set(currentAssignments.map(a => a.student_id));
    let assignedCount = 0;
    let queuedCount = 0;

    // Find all students who qualify for detention based on accumulated demerit points
    // Get students with unresolved incidents totaling >= 10 points
    const qualifyingStudentsQuery = `
      SELECT 
        s.id,
        s.first_name || ' ' || s.last_name as student_name,
        s.parent_id,
        COALESCE(SUM(bi.points_deducted), 0) as total_points
      FROM students s
      LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id
        AND bi.status != 'resolved'
      WHERE s.is_active = true
      GROUP BY s.id, s.first_name, s.last_name, s.parent_id
      HAVING COALESCE(SUM(bi.points_deducted), 0) >= 10
      ORDER BY COALESCE(SUM(bi.points_deducted), 0) DESC
    `;

    const qualifyingStudents = await schemaAll(req, qualifyingStudentsQuery);

    // Filter out students already assigned to ANY upcoming detention
    const studentsWithUpcomingDetention = await schemaAll(req, `
      SELECT DISTINCT da.student_id
      FROM detention_assignments da
      INNER JOIN detention_sessions ds ON da.detention_id = ds.id
      WHERE ds.detention_date >= CURRENT_DATE
        AND da.status IN ('assigned', 'late')
    `);
    const upcomingDetentionStudents = new Set(studentsWithUpcomingDetention.map(s => s.student_id));

    // Process qualifying students
    for (const student of qualifyingStudents) {
      // Skip if already assigned to this session or has upcoming detention
      if (assignedStudents.has(student.id) || upcomingDetentionStudents.has(student.id)) {
        continue;
      }

      // Check if there's space in current session
      if (assignedCount < availableSlots) {
        try {
          // Assign to current detention session
          await schemaRun(req,
            `INSERT INTO detention_assignments 
             (detention_id, student_id, notes, assigned_by, status)
             VALUES ($1, $2, $3, $4, 'assigned')`,
            [
              detention_id, 
              student.id, 
              `Auto-assigned: ${student.total_points} demerit points`, 
              req.user.id
            ]
          );

          // Notify parent
          if (student.parent_id) {
            const detentionDate = new Date(detention.detention_date).toLocaleDateString();
            await createNotification(
              req,
              student.parent_id,
              'detention',
              'Detention Assigned',
              `${student.student_name} has been assigned to detention on ${detentionDate} at ${detention.detention_time}. Reason: ${student.total_points} demerit points accumulated.`,
              detention_id,
              'detention'
            );
          }

          assignedStudents.add(student.id);
          assignedCount++;
        } catch (error) {
          console.error(`Error assigning student ${student.id}:`, error);
        }
      } else {
        // Session is full - add to queue for next available session
        try {
          // Check if student is already in queue
          const existingQueue = await schemaGet(req,
            'SELECT id FROM detention_queue WHERE student_id = $1 AND status = $2',
            [student.id, 'pending']
          );

          if (!existingQueue) {
            await schemaRun(req,
              `INSERT INTO detention_queue (student_id, points_at_queue, status)
               VALUES ($1, $2, 'pending')`,
              [student.id, student.total_points]
            );
            queuedCount++;
          }
        } catch (error) {
          console.error(`Error queuing student ${student.id}:`, error);
        }
      }
    }

    res.json({ 
      message: `Auto-assignment completed. ${assignedCount} students assigned, ${queuedCount} queued for next session.`,
      assigned_count: assignedCount,
      queued_count: queuedCount,
      total_count: currentCount + assignedCount,
      capacity: maxCapacity,
      qualifying_students: qualifyingStudents.length
    });
  } catch (error) {
    console.error('Error auto-assigning students:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Evaluate detention rules for a specific student (called after incident creation)
router.post('/evaluate-rules', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Get active detention rules (is_active is INTEGER in detention_rules table)
    const rules = await schemaAll(req, 
      'SELECT * FROM detention_rules WHERE is_active = 1 ORDER BY min_points'
    );

    const triggeredRules = [];

    for (const rule of rules) {
      let meetsRule = false;

      if (rule.action_type === 'points_threshold') {
        const result = await schemaGet(req, `
          SELECT COALESCE(SUM(i.points_deducted), 0) as total_points
          FROM behaviour_incidents i
          WHERE i.student_id = $1
            AND i.date >= CURRENT_DATE - INTERVAL '${rule.time_period_days || 30} days'
        `, [student_id]);
        
        const points = result?.total_points || 0;
        meetsRule = points >= rule.min_points && (!rule.max_points || points <= rule.max_points);
      } else if (rule.action_type === 'incident_count') {
        const result = await schemaGet(req, `
          SELECT COUNT(i.id) as incident_count
          FROM behaviour_incidents i
          WHERE i.student_id = $1
            AND i.date >= CURRENT_DATE - INTERVAL '${rule.time_period_days || 30} days'
        `, [student_id]);
        
        const count = result?.incident_count || 0;
        meetsRule = count >= rule.min_points && (!rule.max_points || count <= rule.max_points);
      } else if (rule.action_type === 'severity' && rule.severity) {
        const result = await schemaGet(req, `
          SELECT COUNT(i.id) as count
          FROM behaviour_incidents i
          WHERE i.student_id = $1
            AND i.severity = $2
            AND i.date >= CURRENT_DATE - INTERVAL '${rule.time_period_days || 30} days'
        `, [student_id, rule.severity]);
        
        meetsRule = (result?.count || 0) > 0;
      }

      if (meetsRule) {
        triggeredRules.push(rule);
        
        // Find next available detention session
        const nextDetention = await schemaGet(req, `
          SELECT d.*, 
                 (SELECT COUNT(*) FROM detention_assignments WHERE detention_id = d.id) as current_count
          FROM detention_sessions d
          WHERE d.detention_date >= CURRENT_DATE
            AND d.status = 'scheduled'
            AND (d.max_capacity IS NULL OR 
                 (SELECT COUNT(*) FROM detention_assignments WHERE detention_id = d.id) < d.max_capacity)
          ORDER BY d.detention_date, d.detention_time
          LIMIT 1
        `);

        if (nextDetention) {
          // Check if student is already assigned to this detention
          const existing = await schemaGet(req,
            'SELECT id FROM detention_assignments WHERE detention_id = $1 AND student_id = $2',
            [nextDetention.id, student_id]
          );

          if (!existing) {
            // Assign student to detention
            await schemaRun(req,
              `INSERT INTO detention_assignments (detention_id, student_id, notes, assigned_by)
               VALUES ($1, $2, $3, $4)`,
              [nextDetention.id, student_id, `Auto-assigned: ${rule.name}`, req.user.id]
            );

            // Get student details for notification
            const student = await schemaGet(req,
              'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1',
              [student_id]
            );

            // Notify parent
            if (student && student.parent_id) {
              const detentionDate = new Date(nextDetention.detention_date).toLocaleDateString();
              await createNotification(
                req,
                student.parent_id,
                'detention',
                'Detention Assigned',
                `${student.student_name} has been assigned to detention on ${detentionDate} at ${nextDetention.detention_time}. Reason: ${rule.name}`,
                nextDetention.id,
                'detention'
              );
            }

            // Notify admins that a student qualified for detention
            const detentionDateStr = new Date(nextDetention.detention_date).toLocaleDateString();
            await notifySchoolAdmins(
              req,
              'detention_assigned',
              '📋 Student Assigned to Detention',
              `${student ? student.student_name : 'A student'} has been auto-assigned to detention on ${detentionDateStr} at ${nextDetention.detention_time || 'TBD'}. Rule triggered: ${rule.name}`,
              nextDetention.id,
              'detention',
              { sendEmail: true }
            );
          }
        }
      }
    }

    res.json({ 
      triggered_rules: triggeredRules.length,
      rules: triggeredRules.map(r => r.name)
    });
  } catch (error) {
    console.error('Error evaluating detention rules:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get student detention history
router.get('/student/:studentId/history', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const history = await schemaAll(req, `
      SELECT da.*, 
             d.detention_date,
             d.detention_time,
             d.location,
             d.duration,
             t.name as supervisor_name
      FROM detention_assignments da
      INNER JOIN detention_sessions d ON da.detention_id = d.id
      LEFT JOIN teachers t ON d.teacher_on_duty_id = t.id
      WHERE da.student_id = $1
      ORDER BY d.detention_date DESC, d.detention_time DESC
    `, [req.params.studentId]);

    res.json(history);
  } catch (error) {
    console.error('Error fetching student detention history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create recurring detention sessions
router.post('/recurring', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const { 
      start_date, 
      end_date, 
      detention_time, 
      duration, 
      location, 
      teacher_on_duty_id, 
      max_capacity,
      days_of_week, // Array of day numbers: 0=Sunday, 1=Monday, etc.
      notes 
    } = req.body;

    if (!start_date || !end_date || !detention_time || !days_of_week || days_of_week.length === 0) {
      return res.status(400).json({ error: 'Start date, end date, time, and days of week are required' });
    }

    const createdSessions = [];
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    // Iterate through each day in the range
    for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Check if this day is in the selected days
      if (days_of_week.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if detention already exists for this date and time
        const existing = await schemaGet(req,
          'SELECT id FROM detention_sessions WHERE detention_date = $1 AND detention_time = $2',
          [dateStr, detention_time]
        );
        
        if (!existing) {
          const result = await schemaRun(req,
            `INSERT INTO detention_sessions (detention_date, detention_time, duration, location, teacher_on_duty_id, max_capacity, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled') RETURNING id`,
            [dateStr, detention_time, duration || 60, location || null, teacher_on_duty_id || null, max_capacity || 30, notes || null]
          );
          
          const session = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [result.id]);
          createdSessions.push(session);
        }
      }
    }

    res.status(201).json({ 
      message: `Created ${createdSessions.length} recurring detention sessions`,
      sessions: createdSessions,
      count: createdSessions.length
    });
  } catch (error) {
    console.error('Error creating recurring detentions:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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

// Process detention queue - assign queued students to a specific session
router.post('/:id/process-queue', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const detention = await schemaGet(req, 'SELECT * FROM detention_sessions WHERE id = $1', [req.params.id]);
    if (!detention) {
      return res.status(404).json({ error: 'Detention not found' });
    }

    // Get current capacity
    const currentAssignments = await schemaAll(req,
      'SELECT student_id FROM detention_assignments WHERE detention_id = $1',
      [req.params.id]
    );
    const currentCount = currentAssignments.length;
    const maxCapacity = detention.max_capacity || 30;
    const availableSlots = maxCapacity - currentCount;

    if (availableSlots <= 0) {
      return res.json({
        message: 'No available slots in this detention session',
        processed: 0
      });
    }

    // Get queued students (oldest first)
    const queuedStudents = await schemaAll(req, `
      SELECT dq.*, s.parent_id, s.first_name || ' ' || s.last_name as student_name
      FROM detention_queue dq
      INNER JOIN students s ON dq.student_id = s.id
      WHERE dq.status = 'pending'
      ORDER BY dq.queued_at ASC
      LIMIT $1
    `, [availableSlots]);

    let processedCount = 0;

    for (const queuedStudent of queuedStudents) {
      try {
        // Assign to detention
        await schemaRun(req,
          `INSERT INTO detention_assignments 
           (detention_id, student_id, notes, assigned_by, status)
           VALUES ($1, $2, $3, $4, 'assigned')`,
          [
            req.params.id,
            queuedStudent.student_id,
            'Auto-assigned from queue',
            req.user.id
          ]
        );

        // Update queue status
        await schemaRun(req,
          `UPDATE detention_queue 
           SET status = 'assigned', assigned_to_session_id = $1 
           WHERE id = $2`,
          [req.params.id, queuedStudent.id]
        );

        // Notify parent
        if (queuedStudent.parent_id) {
          const detentionDate = new Date(detention.detention_date).toLocaleDateString();
          await createNotification(
            req,
            queuedStudent.parent_id,
            'detention',
            'Detention Assigned',
            `${queuedStudent.student_name} has been assigned to detention on ${detentionDate} at ${detention.detention_time} from the waiting queue.`,
            req.params.id,
            'detention'
          );
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing queued student ${queuedStudent.student_id}:`, error);
      }
    }

    res.json({
      message: `Processed ${processedCount} students from queue`,
      processed: processedCount,
      remaining_slots: availableSlots - processedCount
    });
  } catch (error) {
    console.error('Error processing detention queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
