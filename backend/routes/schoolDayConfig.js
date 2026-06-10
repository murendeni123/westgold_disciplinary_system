/**
 * School Day Config Routes  ( /api/school-day-config )
 *
 * Admin sets the school's daily period schedule once: start time, number of
 * lessons, lesson duration, and breaks — per weekday (0=Mon..4=Fri).
 * Exact lesson start/end times are DERIVED from this config at read time
 * (see utils/lessonTimes.js) and are never stored per-lesson.
 */

const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema, schemaTransaction } = require('../utils/schemaHelper');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { computeLessonTimes } = require('../utils/lessonTimes');

const router = express.Router();

/**
 * POST /api/school-day-config/setup   (admin only)
 * Body: { days: [{ day_of_week, school_start_time, total_lessons,
 *                  lesson_duration_minutes, breaks: [{ after_lesson_number,
 *                  duration_minutes }] }] }
 * Replaces the entire existing configuration (delete + reinsert).
 */
router.post('/setup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const { days } = req.body;
        if (!Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ error: 'days array is required' });
        }

        // Validate each day before writing anything
        for (const d of days) {
            if (d.day_of_week === undefined || d.day_of_week === null ||
                d.day_of_week < 0 || d.day_of_week > 4) {
                return res.status(400).json({ error: 'Each day requires day_of_week between 0 (Mon) and 4 (Fri)' });
            }
            if (!d.school_start_time) {
                return res.status(400).json({ error: `day_of_week ${d.day_of_week} requires school_start_time` });
            }
            if (!Number.isInteger(d.total_lessons) || d.total_lessons <= 0) {
                return res.status(400).json({ error: `day_of_week ${d.day_of_week} requires a positive total_lessons` });
            }
            if (!Number.isInteger(d.lesson_duration_minutes) || d.lesson_duration_minutes <= 0) {
                return res.status(400).json({ error: `day_of_week ${d.day_of_week} requires a positive lesson_duration_minutes` });
            }
        }

        // Atomic replace
        await schemaTransaction(req, async (client) => {
            await client.query('DELETE FROM school_breaks');
            await client.query('DELETE FROM school_day_config');

            for (const d of days) {
                await client.query(
                    `INSERT INTO school_day_config
                        (day_of_week, school_start_time, total_lessons, lesson_duration_minutes)
                     VALUES ($1, $2, $3, $4)`,
                    [d.day_of_week, d.school_start_time, d.total_lessons, d.lesson_duration_minutes]
                );

                const breaks = Array.isArray(d.breaks) ? d.breaks : [];
                for (const b of breaks) {
                    if (b.after_lesson_number === undefined || b.duration_minutes === undefined) continue;
                    await client.query(
                        `INSERT INTO school_breaks (day_of_week, after_lesson_number, duration_minutes)
                         VALUES ($1, $2, $3)`,
                        [d.day_of_week, b.after_lesson_number, b.duration_minutes]
                    );
                }
            }
        });

        res.json({ message: 'School day configuration saved', days_configured: days.length });
    } catch (error) {
        console.error('Error saving school day config:', error);
        res.status(500).json({ error: 'Failed to save school day configuration' });
    }
});

/**
 * GET /api/school-day-config
 * Any authenticated school user. Returns each configured day with computed
 * lesson times.
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) return res.status(403).json({ error: 'School context required' });

        const configs = await schemaAll(req,
            `SELECT * FROM school_day_config ORDER BY day_of_week`, []);
        const allBreaks = await schemaAll(req,
            `SELECT * FROM school_breaks ORDER BY day_of_week, after_lesson_number`, []);

        const days = configs.map(cfg => {
            const dayBreaks = allBreaks.filter(b => b.day_of_week === cfg.day_of_week);
            return {
                ...cfg,
                breaks: dayBreaks,
                lessons: computeLessonTimes(cfg, dayBreaks),
            };
        });

        res.json({ configured: days.length > 0, days });
    } catch (error) {
        console.error('Error fetching school day config:', error);
        res.status(500).json({ error: 'Failed to fetch school day configuration' });
    }
});

module.exports = router;
