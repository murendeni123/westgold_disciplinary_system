/**
 * Morning Register Routes  ( /api/morning-register )
 *
 * One register per class per day, taken by the class's register teacher or by
 * an admin-assigned substitute. Entries default to 'present'. Registers lock
 * automatically once their date has passed (checked lazily on read — Part 8).
 */

const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema, schemaTransaction } = require('../utils/schemaHelper');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getTeacherId, notifyParentOfAttendance } = require('../utils/teacherContext');

const router = express.Router();

function isTeacher(req) {
    return req.user && (req.user.role === 'teacher' || req.user.role === 'grade_head');
}

/**
 * Lazily lock a register whose date is in the past. Returns the effective
 * locked state. Mutates the passed row's `locked` field.
 */
async function ensureLockState(req, register) {
    if (!register) return false;
    if (register.locked) return true;
    // Compare the register's date against today's date in the DB.
    const row = await schemaGet(req,
        'SELECT ($1::date < CURRENT_DATE) AS past FROM (SELECT 1) x',
        [register.date]);
    if (row && row.past) {
        await schemaRun(req, 'UPDATE morning_register SET locked = true WHERE id = $1', [register.id]);
        register.locked = true;
        return true;
    }
    return false;
}

/** Load a register with its student entries (joined to student details). */
async function loadRegisterWithEntries(req, registerId) {
    const register = await schemaGet(req,
        `SELECT mr.*, c.class_name
           FROM morning_register mr
           LEFT JOIN classes c ON mr.class_id = c.id
          WHERE mr.id = $1`,
        [registerId]);
    if (!register) return null;
    const entries = await schemaAll(req,
        `SELECT e.*, s.student_id AS student_number,
                s.first_name || ' ' || s.last_name AS student_name
           FROM morning_register_entries e
           JOIN students s ON e.student_id = s.id
          WHERE e.morning_register_id = $1
          ORDER BY s.last_name, s.first_name`,
        [registerId]);
    return { ...register, entries };
}

/**
 * Resolve which class (if any) this teacher should take a morning register for
 * today, and whether they're acting as a substitute.
 * @returns {Promise<{class_id:number, is_substitute:boolean}|null>}
 */
async function resolveRegisterClass(req, teacherId) {
    const own = await schemaGet(req,
        `SELECT class_teacher_of AS class_id
           FROM teachers
          WHERE id = $1 AND is_class_teacher = true AND class_teacher_of IS NOT NULL`,
        [teacherId]);
    if (own && own.class_id) return { class_id: own.class_id, is_substitute: false };

    const sub = await schemaGet(req,
        `SELECT class_id FROM morning_register_substitutes
          WHERE substitute_teacher_id = $1 AND date = CURRENT_DATE`,
        [teacherId]);
    if (sub && sub.class_id) return { class_id: sub.class_id, is_substitute: true };

    return null;
}

/**
 * POST /api/morning-register/open   (teacher only)
 * Opens (or returns the existing) morning register for the teacher's class today.
 */
router.post('/open', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const assignment = await resolveRegisterClass(req, teacherId);
        if (!assignment) {
            return res.status(403).json({ error: 'You do not have a morning register class assigned for today' });
        }

        // Already open for today?
        const existing = await schemaGet(req,
            `SELECT * FROM morning_register WHERE class_id = $1 AND date = CURRENT_DATE`,
            [assignment.class_id]);
        if (existing) {
            const full = await loadRegisterWithEntries(req, existing.id);
            await ensureLockState(req, full);
            return res.json({ created: false, register: full });
        }

        // Create register + pre-populate entries as 'present'
        let newId;
        await schemaTransaction(req, async (client) => {
            const ins = await client.query(
                `INSERT INTO morning_register (class_id, date, taken_by_teacher_id, is_substitute)
                 VALUES ($1, CURRENT_DATE, $2, $3) RETURNING id`,
                [assignment.class_id, teacherId, assignment.is_substitute]
            );
            newId = ins.rows[0].id;
            await client.query(
                `INSERT INTO morning_register_entries (morning_register_id, student_id, status)
                 SELECT $1, s.id, 'present'
                   FROM students s
                  WHERE s.class_id = $2 AND s.is_active = true`,
                [newId, assignment.class_id]
            );
        });

        const full = await loadRegisterWithEntries(req, newId);
        res.status(201).json({ created: true, register: full });
    } catch (error) {
        console.error('Error opening morning register:', error);
        res.status(500).json({ error: 'Failed to open morning register' });
    }
});

/**
 * GET /api/morning-register/today   (teacher only)
 * Returns today's register for the teacher's class, or { assigned: false }.
 */
router.get('/today', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const assignment = await resolveRegisterClass(req, teacherId);
        if (!assignment) return res.json({ assigned: false });

        const existing = await schemaGet(req,
            `SELECT * FROM morning_register WHERE class_id = $1 AND date = CURRENT_DATE`,
            [assignment.class_id]);

        if (!existing) {
            return res.json({
                assigned: true,
                opened: false,
                class_id: assignment.class_id,
                is_substitute: assignment.is_substitute,
            });
        }

        const full = await loadRegisterWithEntries(req, existing.id);
        await ensureLockState(req, full);
        res.json({ assigned: true, opened: true, register: full });
    } catch (error) {
        console.error('Error fetching today\'s morning register:', error);
        res.status(500).json({ error: 'Failed to fetch morning register' });
    }
});

/**
 * PATCH /api/morning-register/entry/:entryId   (teacher only)
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

        // Find the entry's register to enforce the lock.
        const entry = await schemaGet(req,
            `SELECT e.id, mr.id AS register_id, mr.date, mr.locked
               FROM morning_register_entries e
               JOIN morning_register mr ON e.morning_register_id = mr.id
              WHERE e.id = $1`,
            [entryId]);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        const locked = await ensureLockState(req, { id: entry.register_id, date: entry.date, locked: entry.locked });
        if (locked) return res.status(409).json({ error: 'Register is locked and can no longer be edited' });

        await schemaRun(req,
            `UPDATE morning_register_entries
                SET status = COALESCE($1, status),
                    note   = COALESCE($2, note),
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = $3`,
            [status ?? null, note ?? null, entryId]);

        const updated = await schemaGet(req,
            `SELECT e.*, s.student_id AS student_number,
                    s.first_name || ' ' || s.last_name AS student_name
               FROM morning_register_entries e
               JOIN students s ON e.student_id = s.id
              WHERE e.id = $1`,
            [entryId]);
        res.json({ entry: updated });
    } catch (error) {
        console.error('Error updating morning register entry:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

/**
 * POST /api/morning-register/submit/:registerId   (teacher only)
 * Marks submitted_at and notifies parents of absent/late students.
 */
router.post('/submit/:registerId', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const registerId = parseInt(req.params.registerId, 10);
        if (Number.isNaN(registerId)) return res.status(400).json({ error: 'Invalid register id' });

        const register = await schemaGet(req, 'SELECT * FROM morning_register WHERE id = $1', [registerId]);
        if (!register) return res.status(404).json({ error: 'Register not found' });

        const locked = await ensureLockState(req, register);
        if (locked) return res.status(409).json({ error: 'Register is locked and can no longer be submitted' });

        await schemaRun(req,
            'UPDATE morning_register SET submitted_at = CURRENT_TIMESTAMP WHERE id = $1', [registerId]);

        // Notify parents of absent/late students.
        const flagged = await schemaAll(req,
            `SELECT e.status, s.id, s.parent_id, s.secondary_parent_id, s.first_name, s.last_name
               FROM morning_register_entries e
               JOIN students s ON e.student_id = s.id
              WHERE e.morning_register_id = $1 AND e.status IN ('absent', 'late')`,
            [registerId]);

        const dateStr = register.date instanceof Date
            ? register.date.toISOString().slice(0, 10)
            : String(register.date).slice(0, 10);
        for (const st of flagged) {
            await notifyParentOfAttendance(req, st, st.status, 'morning register', dateStr);
        }

        const full = await loadRegisterWithEntries(req, registerId);
        res.json({ message: 'Morning register submitted', notified: flagged.length, register: full });
    } catch (error) {
        console.error('Error submitting morning register:', error);
        res.status(500).json({ error: 'Failed to submit morning register' });
    }
});

/**
 * POST /api/morning-register/substitute   (admin only)
 * Body: { class_id, substitute_teacher_id, date }
 */
router.post('/substitute', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const { class_id, substitute_teacher_id, date } = req.body;
        if (!class_id || !substitute_teacher_id || !date) {
            return res.status(400).json({ error: 'class_id, substitute_teacher_id and date are required' });
        }

        // Upsert (one substitute per class per date)
        await schemaRun(req,
            `INSERT INTO morning_register_substitutes (class_id, substitute_teacher_id, date, created_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (class_id, date)
             DO UPDATE SET substitute_teacher_id = EXCLUDED.substitute_teacher_id,
                           created_by = EXCLUDED.created_by`,
            [class_id, substitute_teacher_id, date, req.user.id]);

        res.json({ message: 'Substitute assigned for morning register', class_id, substitute_teacher_id, date });
    } catch (error) {
        console.error('Error assigning substitute:', error);
        res.status(500).json({ error: 'Failed to assign substitute' });
    }
});

/**
 * GET /api/morning-register/class/:classId   (admin only)
 * Register history for a class, paginated (?limit=&offset=).
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
            `SELECT mr.*, c.class_name,
                    u.name AS taken_by_name,
                    (SELECT COUNT(*) FROM morning_register_entries e WHERE e.morning_register_id = mr.id) AS total_students,
                    (SELECT COUNT(*) FROM morning_register_entries e WHERE e.morning_register_id = mr.id AND e.status = 'absent') AS absent_count,
                    (SELECT COUNT(*) FROM morning_register_entries e WHERE e.morning_register_id = mr.id AND e.status = 'late') AS late_count
               FROM morning_register mr
               LEFT JOIN classes c ON mr.class_id = c.id
               LEFT JOIN teachers t ON mr.taken_by_teacher_id = t.id
               LEFT JOIN public.users u ON t.user_id = u.id
              WHERE mr.class_id = $1
              ORDER BY mr.date DESC
              LIMIT $2 OFFSET $3`,
            [classId, limit, offset]);

        const totalRow = await schemaGet(req,
            'SELECT COUNT(*) AS cnt FROM morning_register WHERE class_id = $1', [classId]);

        res.json({ records: rows, total: parseInt(totalRow.cnt, 10), limit, offset });
    } catch (error) {
        console.error('Error fetching morning register history:', error);
        res.status(500).json({ error: 'Failed to fetch register history' });
    }
});

module.exports = router;
