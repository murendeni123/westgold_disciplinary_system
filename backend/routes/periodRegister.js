const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// PERIOD SESSIONS (Teacher Register)
// =====================================================

// Get teacher's periods for today
router.get('/teacher/today', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const teacherId = req.user.teacher_id || req.query.teacher_id;
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, etc.
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 (Mon-Sun)

    // Get teacher's timetable for today
    const timetable = await schemaAll(req, `
      SELECT ct.*, 
             ts.period_number, ts.period_name, ts.start_time, ts.end_time, 
             ts.day_of_week, ts.is_break,
             s.name as subject_name,
             cl.class_name,
             c.name as classroom_name,
             ps.id as session_id,
             ps.status as session_status,
             ps.completed_at,
             (SELECT COUNT(*) FROM period_attendance_records WHERE session_id = ps.id AND status = 'present') as present_count,
             (SELECT COUNT(*) FROM period_attendance_records WHERE session_id = ps.id) as total_marked
      FROM class_timetables ct
      JOIN time_slots ts ON ct.time_slot_id = ts.id
      JOIN classes cl ON ct.class_id = cl.id
      LEFT JOIN subjects s ON ct.subject_id = s.id
      LEFT JOIN classrooms c ON ct.classroom_id = c.id
      LEFT JOIN period_sessions ps ON ps.class_timetable_id = ct.id AND ps.session_date = $2
      WHERE ct.teacher_id = $1 
        AND ct.is_active = 1
        AND ts.day_of_week = $3
        AND ts.is_break = 0
        AND (ct.effective_to IS NULL OR ct.effective_to >= CURRENT_DATE)
      ORDER BY ts.period_number
    `, [teacherId, today, adjustedDay]);

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching teacher periods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher's periods for a specific week
router.get('/teacher/week', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const teacherId = req.user.teacher_id || req.query.teacher_id;
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID required' });
    }

    const { start_date } = req.query;
    const startDate = start_date || new Date().toISOString().split('T')[0];

    // Get teacher's full timetable
    const timetable = await schemaAll(req, `
      SELECT ct.*, 
             ts.period_number, ts.period_name, ts.start_time, ts.end_time, 
             ts.day_of_week, ts.is_break,
             s.name as subject_name,
             cl.class_name,
             c.name as classroom_name
      FROM class_timetables ct
      JOIN time_slots ts ON ct.time_slot_id = ts.id
      JOIN classes cl ON ct.class_id = cl.id
      LEFT JOIN subjects s ON ct.subject_id = s.id
      LEFT JOIN classrooms c ON ct.classroom_id = c.id
      WHERE ct.teacher_id = $1 
        AND ct.is_active = 1
        AND ts.is_break = 0
        AND (ct.effective_to IS NULL OR ct.effective_to >= CURRENT_DATE)
      ORDER BY ts.day_of_week, ts.period_number
    `, [teacherId]);

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching teacher week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get or create period session
router.post('/session/start', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { class_timetable_id, session_date } = req.body;

    if (!class_timetable_id || !session_date) {
      return res.status(400).json({ error: 'Class timetable ID and session date are required' });
    }

    // Use the helper function to get or create session
    const sessionId = await schemaGet(req,
      'SELECT get_or_create_period_session($1, $2) as session_id',
      [class_timetable_id, session_date]
    );

    // Get the full session details
    const session = await schemaGet(req, `
      SELECT ps.*, 
             cl.class_name,
             s.name as subject_name,
             ts.period_name, ts.start_time, ts.end_time,
             c.name as classroom_name
      FROM period_sessions ps
      JOIN classes cl ON ps.class_id = cl.id
      JOIN time_slots ts ON ps.time_slot_id = ts.id
      LEFT JOIN subjects s ON ps.subject_id = s.id
      LEFT JOIN classrooms c ON c.id = (
        SELECT classroom_id FROM class_timetables WHERE id = ps.class_timetable_id
      )
      WHERE ps.id = $1
    `, [sessionId.session_id]);

    // Get students in the class
    const students = await schemaAll(req, `
      SELECT student_id, first_name, last_name, gender, date_of_birth
      FROM students
      WHERE class_id = $1
      ORDER BY last_name, first_name
    `, [session.class_id]);

    // Get existing attendance records for this session
    const attendanceRecords = await schemaAll(req, `
      SELECT * FROM period_attendance_records
      WHERE session_id = $1
    `, [sessionId.session_id]);

    // Check for dismissals
    const dismissals = await schemaAll(req, `
      SELECT student_id, dismissed_at, dismissal_reason, returned_at
      FROM student_dismissals
      WHERE dismissal_date = $1 AND is_active = 1
    `, [session_date]);

    // Check for late arrivals
    const lateArrivals = await schemaAll(req, `
      SELECT student_id, arrived_at, reason
      FROM student_late_arrivals
      WHERE arrival_date = $1
    `, [session_date]);

    res.json({
      session,
      students,
      attendanceRecords,
      dismissals,
      lateArrivals
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance for a student
router.post('/attendance/mark', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { session_id, student_id, status, notes } = req.body;

    if (!session_id || !student_id || !status) {
      return res.status(400).json({ error: 'Session ID, student ID, and status are required' });
    }

    // Check if session is locked
    const session = await schemaGet(req,
      'SELECT status FROM period_sessions WHERE id = $1',
      [session_id]
    );

    if (session.status === 'locked') {
      return res.status(403).json({ error: 'This register is locked and cannot be edited' });
    }

    // Check if session was completed more than 15 minutes ago (grace period)
    if (session.status === 'completed') {
      const completedSession = await schemaGet(req,
        'SELECT completed_at FROM period_sessions WHERE id = $1',
        [session_id]
      );
      
      const completedTime = new Date(completedSession.completed_at);
      const now = new Date();
      const minutesSinceCompletion = (now - completedTime) / 1000 / 60;

      if (minutesSinceCompletion > 15) {
        return res.status(403).json({ error: 'Grace period expired. Contact admin to reopen this register.' });
      }
    }

    // Upsert attendance record
    const result = await schemaRun(req, `
      INSERT INTO period_attendance_records (session_id, student_id, status, marked_by, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (session_id, student_id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        marked_at = CURRENT_TIMESTAMP,
        marked_by = EXCLUDED.marked_by,
        notes = EXCLUDED.notes
      RETURNING *
    `, [session_id, student_id, status, req.user.id, notes]);

    // Update session status to in_progress
    await schemaRun(req,
      'UPDATE period_sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3',
      ['in_progress', session_id, 'not_marked']
    );

    res.json(result);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk mark attendance (e.g., "Mark All Present")
router.post('/attendance/bulk-mark', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { session_id, student_ids, status } = req.body;

    if (!session_id || !Array.isArray(student_ids) || !status) {
      return res.status(400).json({ error: 'Session ID, student IDs array, and status are required' });
    }

    const results = [];
    for (const student_id of student_ids) {
      const result = await schemaRun(req, `
        INSERT INTO period_attendance_records (session_id, student_id, status, marked_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (session_id, student_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          marked_at = CURRENT_TIMESTAMP,
          marked_by = EXCLUDED.marked_by
        RETURNING *
      `, [session_id, student_id, status, req.user.id]);
      results.push(result);
    }

    // Update session status
    await schemaRun(req,
      'UPDATE period_sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['in_progress', session_id]
    );

    res.json(results);
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete register
router.post('/session/:sessionId/complete', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const result = await schemaRun(req, `
      UPDATE period_sessions 
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          completed_by = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [req.user.id, req.params.sessionId]);

    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Trigger bunking detection
    await detectBunkingPatterns(req, req.params.sessionId);

    res.json(result);
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// DISMISSALS & LATE ARRIVALS
// =====================================================

// Dismiss student (Admin or Teacher)
router.post('/dismiss', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { student_id, dismissal_date, dismissal_reason } = req.body;

    if (!student_id || !dismissal_date || !dismissal_reason) {
      return res.status(400).json({ error: 'Student ID, date, and reason are required' });
    }

    const result = await schemaRun(req, `
      INSERT INTO student_dismissals (student_id, dismissal_date, dismissed_by, dismissal_reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [student_id, dismissal_date, req.user.id, dismissal_reason]);

    // Auto-mark remaining periods as dismissed
    await autoMarkDismissedPeriods(req, student_id, dismissal_date, result.dismissed_at);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error dismissing student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark student as returned
router.post('/return', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { dismissal_id, return_notes } = req.body;

    if (!dismissal_id) {
      return res.status(400).json({ error: 'Dismissal ID is required' });
    }

    const result = await schemaRun(req, `
      UPDATE student_dismissals 
      SET returned_at = CURRENT_TIMESTAMP,
          returned_by = $1,
          return_notes = $2,
          is_active = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [req.user.id, return_notes, dismissal_id]);

    if (!result) {
      return res.status(404).json({ error: 'Dismissal record not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error marking return:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record late arrival (Admin or Teacher)
router.post('/late-arrival', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { student_id, arrival_date, reason } = req.body;

    if (!student_id || !arrival_date) {
      return res.status(400).json({ error: 'Student ID and arrival date are required' });
    }

    const userRole = req.user.role;

    const result = await schemaRun(req, `
      INSERT INTO student_late_arrivals (student_id, arrival_date, recorded_by, recorded_by_role, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [student_id, arrival_date, req.user.id, userRole, reason]);

    // Auto-mark missed periods as late_arrival
    await autoMarkLateArrivalPeriods(req, student_id, arrival_date, result.arrived_at);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error recording late arrival:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function autoMarkDismissedPeriods(req, studentId, dismissalDate, dismissedAt) {
  try {
    const dismissedTime = new Date(dismissedAt);
    const timeString = dismissedTime.toTimeString().split(' ')[0]; // HH:MM:SS

    // Get student's class
    const student = await schemaGet(req,
      'SELECT class_id FROM students WHERE student_id = $1',
      [studentId]
    );

    if (!student || !student.class_id) return;

    // Get all period sessions for this class on this date that start after dismissal time
    const sessions = await schemaAll(req, `
      SELECT ps.id
      FROM period_sessions ps
      JOIN time_slots ts ON ps.time_slot_id = ts.id
      WHERE ps.class_id = $1
        AND ps.session_date = $2
        AND ts.start_time > $3
        AND ps.status != 'locked'
    `, [student.class_id, dismissalDate, timeString]);

    // Mark student as dismissed in those sessions
    for (const session of sessions) {
      await schemaRun(req, `
        INSERT INTO period_attendance_records (session_id, student_id, status, marked_by, notes)
        VALUES ($1, $2, 'dismissed', $3, 'Auto-marked: Student dismissed')
        ON CONFLICT (session_id, student_id) DO NOTHING
      `, [session.id, studentId, req.user.id]);
    }
  } catch (error) {
    console.error('Error auto-marking dismissed periods:', error);
  }
}

async function autoMarkLateArrivalPeriods(req, studentId, arrivalDate, arrivedAt) {
  try {
    const arrivalTime = new Date(arrivedAt);
    const timeString = arrivalTime.toTimeString().split(' ')[0];

    // Get student's class
    const student = await schemaGet(req,
      'SELECT class_id FROM students WHERE student_id = $1',
      [studentId]
    );

    if (!student || !student.class_id) return;

    // Get all period sessions for this class on this date that ended before arrival time
    const sessions = await schemaAll(req, `
      SELECT ps.id
      FROM period_sessions ps
      JOIN time_slots ts ON ps.time_slot_id = ts.id
      WHERE ps.class_id = $1
        AND ps.session_date = $2
        AND ts.end_time < $3
        AND ps.status != 'locked'
    `, [student.class_id, arrivalDate, timeString]);

    // Mark student as late_arrival in those sessions
    for (const session of sessions) {
      await schemaRun(req, `
        INSERT INTO period_attendance_records (session_id, student_id, status, marked_by, notes)
        VALUES ($1, $2, 'late_arrival', $3, 'Auto-marked: Late arrival to school')
        ON CONFLICT (session_id, student_id) DO NOTHING
      `, [session.id, studentId, req.user.id]);
    }
  } catch (error) {
    console.error('Error auto-marking late arrival periods:', error);
  }
}

async function detectBunkingPatterns(req, sessionId) {
  try {
    // Get session details
    const session = await schemaGet(req, `
      SELECT session_date, class_id, time_slot_id
      FROM period_sessions
      WHERE id = $1
    `, [sessionId]);

    if (!session) return;

    // Get all attendance records for this session
    const records = await schemaAll(req, `
      SELECT student_id, status
      FROM period_attendance_records
      WHERE session_id = $1
    `, [sessionId]);

    for (const record of records) {
      // Pattern 1: Present to Absent (check previous period)
      if (record.status === 'absent') {
        const previousPeriod = await schemaGet(req, `
          SELECT par.status
          FROM period_attendance_records par
          JOIN period_sessions ps ON par.session_id = ps.id
          JOIN time_slots ts ON ps.time_slot_id = ts.id
          JOIN time_slots current_ts ON current_ts.id = $3
          WHERE par.student_id = $1
            AND ps.session_date = $2
            AND ps.class_id = $4
            AND ts.period_number = current_ts.period_number - 1
          LIMIT 1
        `, [record.student_id, session.session_date, session.time_slot_id, session.class_id]);

        if (previousPeriod && previousPeriod.status === 'present') {
          await createAttendanceFlag(req, record.student_id, session.session_date, 'present_to_absent',
            'Student marked present in previous period but absent in this period');
        }
      }

      // Pattern 2: Absent to Present (check previous period)
      if (record.status === 'present') {
        const previousPeriod = await schemaGet(req, `
          SELECT par.status
          FROM period_attendance_records par
          JOIN period_sessions ps ON par.session_id = ps.id
          JOIN time_slots ts ON ps.time_slot_id = ts.id
          JOIN time_slots current_ts ON current_ts.id = $3
          WHERE par.student_id = $1
            AND ps.session_date = $2
            AND ps.class_id = $4
            AND ts.period_number = current_ts.period_number - 1
          LIMIT 1
        `, [record.student_id, session.session_date, session.time_slot_id, session.class_id]);

        if (previousPeriod && previousPeriod.status === 'absent') {
          // Check if there's a late arrival or dismissal record
          const lateArrival = await schemaGet(req,
            'SELECT id FROM student_late_arrivals WHERE student_id = $1 AND arrival_date = $2',
            [record.student_id, session.session_date]
          );

          if (!lateArrival) {
            await createAttendanceFlag(req, record.student_id, session.session_date, 'absent_to_present',
              'Student marked absent in previous period but present in this period (no late arrival record)');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error detecting bunking patterns:', error);
  }
}

async function createAttendanceFlag(req, studentId, flagDate, flagType, description) {
  try {
    await schemaRun(req, `
      INSERT INTO attendance_flags (student_id, flag_date, flag_type, description)
      VALUES ($1, $2, $3, $4)
    `, [studentId, flagDate, flagType, description]);
  } catch (error) {
    console.error('Error creating attendance flag:', error);
  }
}

// Get today's dismissals
router.get('/dismissals/today', async (req, res) => {
    try {
        const schema = req.schemaName;
        const today = new Date().toISOString().split('T')[0];

        const dismissals = await pool.query(`
            SELECT 
                sd.*,
                s.first_name || ' ' || s.last_name as student_name,
                s.class_id,
                c.class_name,
                u.name as dismissed_by_name
            FROM ${schema}.student_dismissals sd
            JOIN ${schema}.students s ON sd.student_id = s.student_id
            LEFT JOIN ${schema}.classes c ON s.class_id = c.id
            LEFT JOIN public.users u ON sd.dismissed_by = u.id
            WHERE sd.dismissal_date = $1
            ORDER BY sd.dismissed_at DESC
        `, [today]);

        res.json(dismissals.rows);
    } catch (error) {
        console.error('Error fetching dismissals:', error);
        res.status(500).json({ error: 'Failed to fetch dismissals' });
    }
});

// Get attendance flags
router.get('/flags', async (req, res) => {
    try {
        const schema = req.schemaName;
        const { resolved, date } = req.query;

        let query = `
            SELECT 
                af.*,
                s.first_name || ' ' || s.last_name as student_name,
                c.class_name,
                ps.session_date
            FROM ${schema}.attendance_flags af
            JOIN ${schema}.students s ON af.student_id = s.student_id
            LEFT JOIN ${schema}.classes c ON s.class_id = c.id
            LEFT JOIN ${schema}.period_sessions ps ON af.session_id = ps.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        if (resolved !== undefined) {
            query += ` AND af.is_resolved = $${paramCount}`;
            params.push(resolved === 'true');
            paramCount++;
        }

        if (date) {
            query += ` AND ps.session_date = $${paramCount}`;
            params.push(date);
            paramCount++;
        }

        query += ' ORDER BY af.created_at DESC';

        const flags = await pool.query(query, params);
        res.json(flags.rows);
    } catch (error) {
        console.error('Error fetching flags:', error);
        res.status(500).json({ error: 'Failed to fetch attendance flags' });
    }
});

// Resolve attendance flag
router.put('/flags/:id/resolve', async (req, res) => {
    try {
        const schema = req.schemaName;
        const { id } = req.params;
        const { resolution_notes } = req.body;

        await pool.query(`
            UPDATE ${schema}.attendance_flags
            SET 
                is_resolved = true,
                resolved_at = CURRENT_TIMESTAMP,
                resolved_by = $1,
                resolution_notes = $2
            WHERE id = $3
        `, [req.user.id, resolution_notes, id]);

        res.json({ message: 'Flag resolved successfully' });
    } catch (error) {
        console.error('Error resolving flag:', error);
        res.status(500).json({ error: 'Failed to resolve flag' });
    }
});

// Generate attendance report
router.get('/reports/attendance', async (req, res) => {
    try {
        const schema = req.schemaName;
        const { grade_level, start_date, end_date, report_type } = req.query;

        let query = `
            SELECT 
                s.student_id,
                s.first_name || ' ' || s.last_name as student_name,
                c.class_name,
                c.grade_level,
                ps.session_date,
                EXTRACT(DOW FROM ps.session_date) as day_of_week,
                COUNT(CASE WHEN par.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN par.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN par.status = 'late' THEN 1 END) as late_count,
                COUNT(CASE WHEN par.status = 'excused' THEN 1 END) as excused_count,
                COUNT(par.id) as total_periods
            FROM ${schema}.students s
            JOIN ${schema}.classes c ON s.class_id = c.id
            LEFT JOIN ${schema}.period_attendance_records par ON s.student_id = par.student_id
            LEFT JOIN ${schema}.period_sessions ps ON par.session_id = ps.id
            WHERE ps.session_date BETWEEN $1 AND $2
        `;

        const params = [start_date, end_date];
        let paramCount = 3;

        if (grade_level) {
            query += ` AND c.grade_level = $${paramCount}`;
            params.push(grade_level);
            paramCount++;
        }

        query += `
            GROUP BY s.student_id, s.first_name, s.last_name, c.class_name, c.grade_level, ps.session_date
            ORDER BY c.grade_level, c.class_name, s.last_name, s.first_name, ps.session_date
        `;

        const report = await pool.query(query, params);

        // Group by student for weekly view
        const groupedData = {};
        report.rows.forEach(row => {
            const key = `${row.student_id}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    student_id: row.student_id,
                    student_name: row.student_name,
                    class_name: row.class_name,
                    grade_level: row.grade_level,
                    days: {},
                    totals: {
                        present: 0,
                        absent: 0,
                        late: 0,
                        excused: 0
                    }
                };
            }

            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][row.day_of_week];
            groupedData[key].days[dayName] = {
                present: row.present_count,
                absent: row.absent_count,
                late: row.late_count,
                excused: row.excused_count
            };

            groupedData[key].totals.present += parseInt(row.present_count);
            groupedData[key].totals.absent += parseInt(row.absent_count);
            groupedData[key].totals.late += parseInt(row.late_count);
            groupedData[key].totals.excused += parseInt(row.excused_count);
        });

        res.json({
            report_type,
            grade_level,
            start_date,
            end_date,
            data: Object.values(groupedData)
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
