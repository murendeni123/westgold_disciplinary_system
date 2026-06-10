/**
 * Lesson Register Routes  ( /api/lesson-register )
 *
 * One register per teacher timetable slot per day. A teacher opens a register
 * for a specific lesson they teach; entries default to 'present'. Registers
 * lock automatically once their date has passed (checked lazily on read).
 */

const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema, schemaTransaction } = require('../utils/schemaHelper');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getTeacherId, notifyParentOfAttendance } = require('../utils/teacherContext');
const { jsDateToDayOfWeek } = require('../utils/lessonTimes');

const router = express.Router();

function isTeacher(req) {
    return req.user && (req.user.role === 'teacher' || req.user.role === 'grade_head');
}

async function ensureLockState(req, register) {
    if (!register) return false;
    if (register.locked) return true;
    const row = await schemaGet(req,
        'SELECT ($1::date < CURRENT_DATE) AS past FROM (SELECT 1) x',
        [register.date]);
    if (row && row.past) {
        await schemaRun(req, 'UPDATE lesson_register SET locked = true WHERE id = $1', [register.id]);
        register.locked = true;
        return true;
    }
    return false;
}

async function loadRegisterWithEntries(req, registerId) {
    const register = await schemaGet(req,
        `SELECT lr.*, c.class_name, tts.subject, tts.room
           FROM lesson_register lr
           LEFT JOIN classes c ON lr.class_id = c.id
           LEFT JOIN teacher_timetable_slots tts ON lr.teacher_timetable_slot_id = tts.id
          WHERE lr.id = $1`,
        [registerId]);
    if (!register) return null;
    const entries = await schemaAll(req,
        `SELECT e.*, s.student_id AS student_number,
                s.first_name || ' ' || s.last_name AS student_name
           FROM lesson_register_entries e
           JOIN students s ON e.student_id = s.id
          WHERE e.lesson_register_id = $1
          ORDER BY s.last_name, s.first_name`,
        [registerId]);
    return { ...register, entries };
}

/**
 * POST /api/lesson-register/open   (teacher only)
 * Body: { timetable_slot_id }
 */
router.post('/open', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const { timetable_slot_id } = req.body;
        if (!timetable_slot_id) return res.status(400).json({ error: 'timetable_slot_id is required' });

        // Validate slot ownership + state
        const slot = await schemaGet(req,
            'SELECT * FROM teacher_timetable_slots WHERE id = $1', [timetable_slot_id]);
        if (!slot) return res.status(404).json({ error: 'Timetable slot not found' });
        if (slot.teacher_id !== teacherId) {
            return res.status(403).json({ error: 'This timetable slot does not belong to you' });
        }
        if (slot.is_off_period || !slot.class_id) {
            return res.status(400).json({ error: 'Cannot open a register for an off period or a slot with no class' });
        }

        // The slot must be scheduled for today.
        const dow = jsDateToDayOfWeek();
        if (dow === null) return res.status(400).json({ error: 'No lessons scheduled on weekends' });
        if (slot.day_of_week !== dow) {
            return res.status(400).json({ error: 'This lesson is not scheduled for today' });
        }

        // Already open for today?
        const existing = await schemaGet(req,
            `SELECT * FROM lesson_register WHERE teacher_timetable_slot_id = $1 AND date = CURRENT_DATE`,
            [timetable_slot_id]);
        if (existing) {
            const full = await loadRegisterWithEntries(req, existing.id);
            await ensureLockState(req, full);
            return res.json({ created: false, register: full });
        }

        let newId;
        await schemaTransaction(req, async (client) => {
            const ins = await client.query(
                `INSERT INTO lesson_register
                    (teacher_timetable_slot_id, class_id, teacher_id, lesson_number, day_of_week, date)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING id`,
                [timetable_slot_id, slot.class_id, teacherId, slot.lesson_number, slot.day_of_week]
            );
            newId = ins.rows[0].id;
            await client.query(
                `INSERT INTO lesson_register_entries (lesson_register_id, student_id, status)
                 SELECT $1, s.id, 'present'
                   FROM students s
                  WHERE s.class_id = $2 AND s.is_active = true`,
                [newId, slot.class_id]
            );
        });

        const full = await loadRegisterWithEntries(req, newId);
        res.status(201).json({ created: true, register: full });
    } catch (error) {
        console.error('Error opening lesson register:', error);
        res.status(500).json({ error: 'Failed to open lesson register' });
    }
});

/**
 * GET /api/lesson-register/today   (teacher only)
 * Returns today's teaching slots with their register status (opened/submitted).
 */
router.get('/today', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const dow = jsDateToDayOfWeek();
        if (dow === null) return res.json({ is_school_day: false, lessons: [] });

        // Today's teaching slots (exclude off periods) + any register already opened.
        const lessons = await schemaAll(req,
            `SELECT tts.id AS timetable_slot_id, tts.lesson_number, tts.subject, tts.room,
                    tts.class_id, c.class_name,
                    lr.id AS register_id, lr.submitted_at, lr.locked
               FROM teacher_timetable_slots tts
               LEFT JOIN classes c ON tts.class_id = c.id
               LEFT JOIN lesson_register lr
                      ON lr.teacher_timetable_slot_id = tts.id AND lr.date = CURRENT_DATE
              WHERE tts.teacher_id = $1
                AND tts.day_of_week = $2
                AND tts.confirmed = true
                AND tts.is_off_period = false
                AND tts.class_id IS NOT NULL
              ORDER BY tts.lesson_number`,
            [teacherId, dow]);

        const enriched = lessons.map(l => ({
            ...l,
            opened: !!l.register_id,
            submitted: !!l.submitted_at,
        }));

        res.json({ is_school_day: true, day_of_week: dow, lessons: enriched });
    } catch (error) {
        console.error('Error fetching today\'s lesson registers:', error);
        res.status(500).json({ error: 'Failed to fetch lesson registers' });
    }
});

/**
 * PATCH /api/lesson-register/entry/:entryId   (teacher only)
 * Body: { status, note }
 */
router.patch('/entry/:entryId', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const entryId = parseInt(req.params.entryId, 10);
        if (Number.isNaN(entryId)) return res.status(400).json({ error: 'Invalid entry id' });

        const { status, note } = req.body;
        const VALID = ['present', 'absent', 'late', 'excused', 'early_departure'];
        if (status !== undefined && !VALID.includes(status)) {
            return res.status(400).json({ error: `status must be one of ${VALID.join(', ')}` });
        }

        const entry = await schemaGet(req,
            `SELECT e.id, lr.id AS register_id, lr.date, lr.locked
               FROM lesson_register_entries e
               JOIN lesson_register lr ON e.lesson_register_id = lr.id
              WHERE e.id = $1`,
            [entryId]);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        const locked = await ensureLockState(req, { id: entry.register_id, date: entry.date, locked: entry.locked });
        if (locked) return res.status(409).json({ error: 'Register is locked and can no longer be edited' });

        await schemaRun(req,
            `UPDATE lesson_register_entries
                SET status = COALESCE($1, status),
                    note   = COALESCE($2, note),
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = $3`,
            [status ?? null, note ?? null, entryId]);

        const updated = await schemaGet(req,
            `SELECT e.*, s.student_id AS student_number,
                    s.first_name || ' ' || s.last_name AS student_name
               FROM lesson_register_entries e
               JOIN students s ON e.student_id = s.id
              WHERE e.id = $1`,
            [entryId]);
        res.json({ entry: updated });
    } catch (error) {
        console.error('Error updating lesson register entry:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

/**
 * POST /api/lesson-register/submit/:registerId   (teacher only)
 */
router.post('/submit/:registerId', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const registerId = parseInt(req.params.registerId, 10);
        if (Number.isNaN(registerId)) return res.status(400).json({ error: 'Invalid register id' });

        const register = await schemaGet(req,
            `SELECT lr.*, tts.subject, tts.lesson_number AS slot_lesson
               FROM lesson_register lr
               LEFT JOIN teacher_timetable_slots tts ON lr.teacher_timetable_slot_id = tts.id
              WHERE lr.id = $1`,
            [registerId]);
        if (!register) return res.status(404).json({ error: 'Register not found' });

        const teacherId = await getTeacherId(req);
        if (register.teacher_id !== teacherId) {
            return res.status(403).json({ error: 'This register does not belong to you' });
        }

        const locked = await ensureLockState(req, register);
        if (locked) return res.status(409).json({ error: 'Register is locked and can no longer be submitted' });

        await schemaRun(req,
            'UPDATE lesson_register SET submitted_at = CURRENT_TIMESTAMP WHERE id = $1', [registerId]);

        const flagged = await schemaAll(req,
            `SELECT e.status, s.id, s.parent_id, s.secondary_parent_id, s.first_name, s.last_name
               FROM lesson_register_entries e
               JOIN students s ON e.student_id = s.id
              WHERE e.lesson_register_id = $1 AND e.status IN ('absent', 'late')`,
            [registerId]);

        const dateStr = register.date instanceof Date
            ? register.date.toISOString().slice(0, 10)
            : String(register.date).slice(0, 10);
        const context = `Period ${register.lesson_number}${register.subject ? ' (' + register.subject + ')' : ''}`;
        for (const st of flagged) {
            await notifyParentOfAttendance(req, st, st.status, context, dateStr);
        }

        const full = await loadRegisterWithEntries(req, registerId);
        res.json({ message: 'Lesson register submitted', notified: flagged.length, register: full });
    } catch (error) {
        console.error('Error submitting lesson register:', error);
        res.status(500).json({ error: 'Failed to submit lesson register' });
    }
});

/**
 * GET /api/lesson-register/class/:classId   (admin only)
 * Lesson register history for a class, paginated (?limit=&offset=).
 */
router.get('/class/:classId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const classId = parseInt(req.params.classId, 10);
        if (Number.isNaN(classId)) return res.status(400).json({ error: 'Invalid class id' });

        const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
        const offset = parseInt(req.query.offset, 10) || 0;

        const rows = await schemaAll(req,
            `SELECT lr.*, c.class_name, tts.subject,
                    u.name AS teacher_name,
                    (SELECT COUNT(*) FROM lesson_register_entries e WHERE e.lesson_register_id = lr.id) AS total_students,
                    (SELECT COUNT(*) FROM lesson_register_entries e WHERE e.lesson_register_id = lr.id AND e.status = 'absent') AS absent_count,
                    (SELECT COUNT(*) FROM lesson_register_entries e WHERE e.lesson_register_id = lr.id AND e.status = 'late') AS late_count
               FROM lesson_register lr
               LEFT JOIN classes c ON lr.class_id = c.id
               LEFT JOIN teacher_timetable_slots tts ON lr.teacher_timetable_slot_id = tts.id
               LEFT JOIN teachers t ON lr.teacher_id = t.id
               LEFT JOIN public.users u ON t.user_id = u.id
              WHERE lr.class_id = $1
              ORDER BY lr.date DESC, lr.lesson_number
              LIMIT $2 OFFSET $3`,
            [classId, limit, offset]);

        const totalRow = await schemaGet(req,
            'SELECT COUNT(*) AS cnt FROM lesson_register WHERE class_id = $1', [classId]);

        res.json({ records: rows, total: parseInt(totalRow.cnt, 10), limit, offset });
    } catch (error) {
        console.error('Error fetching lesson register history:', error);
        res.status(500).json({ error: 'Failed to fetch lesson register history' });
    }
});

module.exports = router;
