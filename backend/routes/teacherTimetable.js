/**
 * Teacher Timetable Routes  ( /api/teacher-timetable )
 *
 * A teacher's weekly schedule, one row per lesson slot in
 * teacher_timetable_slots. Slots become active only once `confirmed = true`.
 *
 * NOTE: The AI image/PDF extraction endpoint (POST /upload) is intentionally
 * deferred — see TIMETABLE_AI_EXTRACTION_HANDOFF.md. For now teachers build
 * their timetable via the manual /confirm endpoint. /upload returns 501 so the
 * contract is visible to the frontend without pretending to work.
 */

const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema, schemaTransaction } = require('../utils/schemaHelper');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getTeacherId } = require('../utils/teacherContext');
const {
    computeLessonTimes,
    jsDateToDayOfWeek,
    nowMinutes,
    timeStringToMinutes,
} = require('../utils/lessonTimes');

const router = express.Router();

function isTeacher(req) {
    return req.user && (req.user.role === 'teacher' || req.user.role === 'grade_head');
}

/**
 * POST /api/teacher-timetable/upload   (teacher only)
 * DEFERRED — AI extraction not yet implemented. See handoff doc.
 */
router.post('/upload', authenticateToken, async (req, res) => {
    if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
    return res.status(501).json({
        error: 'AI timetable extraction is not yet available.',
        detail: 'Please enter your timetable manually and submit it via /api/teacher-timetable/confirm. ' +
                'AI extraction from an image/PDF is planned — see TIMETABLE_AI_EXTRACTION_HANDOFF.md.',
        deferred: true,
    });
});

/**
 * POST /api/teacher-timetable/confirm   (teacher only)
 * Body: { slots: [{ day_of_week, lesson_number, subject, room, class_id,
 *                   is_off_period }] }
 * Replaces all of this teacher's slots and marks them confirmed = true.
 */
router.post('/confirm', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const { slots } = req.body;
        if (!Array.isArray(slots)) {
            return res.status(400).json({ error: 'slots array is required' });
        }

        for (const s of slots) {
            if (s.day_of_week === undefined || s.day_of_week < 0 || s.day_of_week > 4) {
                return res.status(400).json({ error: 'Each slot requires day_of_week between 0 (Mon) and 4 (Fri)' });
            }
            if (!Number.isInteger(s.lesson_number) || s.lesson_number <= 0) {
                return res.status(400).json({ error: 'Each slot requires a positive lesson_number' });
            }
        }

        await schemaTransaction(req, async (client) => {
            await client.query('DELETE FROM teacher_timetable_slots WHERE teacher_id = $1', [teacherId]);
            for (const s of slots) {
                const isOff = !!s.is_off_period;
                await client.query(
                    `INSERT INTO teacher_timetable_slots
                        (teacher_id, day_of_week, lesson_number, class_id, subject, room, is_off_period, confirmed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                    [
                        teacherId,
                        s.day_of_week,
                        s.lesson_number,
                        isOff ? null : (s.class_id || null),
                        isOff ? null : (s.subject || null),
                        isOff ? null : (s.room || null),
                        isOff,
                    ]
                );
            }
        });

        res.json({ message: 'Timetable confirmed', slots_saved: slots.length });
    } catch (error) {
        console.error('Error confirming teacher timetable:', error);
        res.status(500).json({ error: 'Failed to confirm timetable' });
    }
});

/**
 * GET /api/teacher-timetable/my-schedule   (teacher only)
 * Returns today's confirmed slots with computed lesson times, marks the
 * currently-active slot, and includes the teacher's morning register class.
 */
router.get('/my-schedule', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const dow = jsDateToDayOfWeek();
        if (dow === null) {
            return res.json({ is_school_day: false, day_of_week: null, slots: [], morning_register_class: null });
        }

        const dayConfig = await schemaGet(req,
            'SELECT * FROM school_day_config WHERE day_of_week = $1', [dow]);
        const dayBreaks = await schemaAll(req,
            'SELECT * FROM school_breaks WHERE day_of_week = $1 ORDER BY after_lesson_number', [dow]);
        const lessonTimes = computeLessonTimes(dayConfig, dayBreaks);
        const timeByLesson = {};
        for (const lt of lessonTimes) timeByLesson[lt.lesson_number] = lt;

        const slots = await schemaAll(req,
            `SELECT tts.*, c.class_name
               FROM teacher_timetable_slots tts
               LEFT JOIN classes c ON tts.class_id = c.id
              WHERE tts.teacher_id = $1 AND tts.day_of_week = $2 AND tts.confirmed = true
              ORDER BY tts.lesson_number`,
            [teacherId, dow]);

        const currentMins = nowMinutes();
        const enriched = slots.map(s => {
            const t = timeByLesson[s.lesson_number] || null;
            let is_current = false;
            if (t) {
                const start = timeStringToMinutes(t.start_time);
                const end = timeStringToMinutes(t.end_time);
                is_current = currentMins >= start && currentMins < end;
            }
            return {
                ...s,
                start_time: t ? t.start_time : null,
                end_time: t ? t.end_time : null,
                is_current,
            };
        });

        // Morning register class: the teacher's own register class, OR a class
        // they have been assigned to cover as a substitute today.
        let morningRegisterClass = null;
        const ownClass = await schemaGet(req,
            `SELECT c.id, c.class_name, false AS is_substitute
               FROM teachers t
               JOIN classes c ON c.id = t.class_teacher_of
              WHERE t.id = $1 AND t.is_class_teacher = true`,
            [teacherId]);
        if (ownClass) {
            morningRegisterClass = ownClass;
        } else {
            const sub = await schemaGet(req,
                `SELECT c.id, c.class_name, true AS is_substitute
                   FROM morning_register_substitutes s
                   JOIN classes c ON c.id = s.class_id
                  WHERE s.substitute_teacher_id = $1 AND s.date = CURRENT_DATE`,
                [teacherId]);
            if (sub) morningRegisterClass = sub;
        }

        res.json({
            is_school_day: true,
            day_of_week: dow,
            day_configured: !!dayConfig,
            slots: enriched,
            morning_register_class: morningRegisterClass,
        });
    } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

/**
 * GET /api/teacher-timetable/my-week   (teacher only)
 * Returns ALL of the authenticated teacher's confirmed slots, grouped by day,
 * so they can review/edit their full weekly timetable. Declared before the
 * admin `/:teacherId` route so it is matched first.
 */
router.get('/my-week', authenticateToken, async (req, res) => {
    try {
        if (!isTeacher(req)) return res.status(403).json({ error: 'Teacher access required' });
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = await getTeacherId(req);
        if (!teacherId) return res.status(404).json({ error: 'Teacher record not found' });

        const slots = await schemaAll(req,
            `SELECT tts.*, c.class_name
               FROM teacher_timetable_slots tts
               LEFT JOIN classes c ON tts.class_id = c.id
              WHERE tts.teacher_id = $1
              ORDER BY tts.day_of_week, tts.lesson_number`,
            [teacherId]);

        const byDay = {};
        for (let d = 0; d <= 4; d++) byDay[d] = [];
        for (const s of slots) {
            if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
            byDay[s.day_of_week].push(s);
        }

        res.json({ teacher_id: teacherId, slots, by_day: byDay });
    } catch (error) {
        console.error('Error fetching own teacher timetable:', error);
        res.status(500).json({ error: 'Failed to fetch your timetable' });
    }
});

/**
 * GET /api/teacher-timetable/:teacherId   (admin only)
 * Full week schedule for a teacher.
 */
router.get('/:teacherId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const teacherId = parseInt(req.params.teacherId, 10);
        if (Number.isNaN(teacherId)) return res.status(400).json({ error: 'Invalid teacher id' });

        const slots = await schemaAll(req,
            `SELECT tts.*, c.class_name
               FROM teacher_timetable_slots tts
               LEFT JOIN classes c ON tts.class_id = c.id
              WHERE tts.teacher_id = $1
              ORDER BY tts.day_of_week, tts.lesson_number`,
            [teacherId]);

        // Group by day for convenience
        const byDay = {};
        for (let d = 0; d <= 4; d++) byDay[d] = [];
        for (const s of slots) {
            if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
            byDay[s.day_of_week].push(s);
        }

        res.json({ teacher_id: teacherId, slots, by_day: byDay });
    } catch (error) {
        console.error('Error fetching teacher timetable (admin):', error);
        res.status(500).json({ error: 'Failed to fetch teacher timetable' });
    }
});

module.exports = router;
