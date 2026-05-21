const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { requireRole } = require('../middleware/auth');

const SUPPORTED_LANGUAGES = ['en', 'af', 'zu', 'xh'];

// Ensure global_language column exists on schools table
const ensureColumns = async () => {
    try {
        await pool.query(`
            ALTER TABLE public.schools
            ADD COLUMN IF NOT EXISTS global_language VARCHAR(10) DEFAULT 'en'
        `);
    } catch (err) {
        console.error('Could not ensure global_language column on schools:', err.message);
    }
};

ensureColumns();

// GET /api/language/global
// Returns the global language set by the admin for the current school.
// Falls back to 'en' if not set. No school context needed for parents.
router.get('/global', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId || req.user?.primary_school_id;
        if (!schoolId) {
            return res.json({ global_language: 'en' });
        }

        const result = await pool.query(
            'SELECT global_language FROM public.schools WHERE id = $1',
            [schoolId]
        );

        const lang = result.rows[0]?.global_language || 'en';
        res.json({ global_language: lang });
    } catch (error) {
        console.error('Error fetching global language:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/language/global
// Admin only — sets the global default language for the school.
// Does NOT override users who have already set a personal preference.
router.patch('/global', requireRole('admin'), async (req, res) => {
    try {
        const { language } = req.body;

        if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                error: `Invalid language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
            });
        }

        const schoolId = req.user?.schoolId || req.user?.primary_school_id;
        if (!schoolId) {
            return res.status(400).json({ error: 'No school context found' });
        }

        await pool.query(
            'UPDATE public.schools SET global_language = $1, updated_at = NOW() WHERE id = $2',
            [language, schoolId]
        );

        res.json({ global_language: language, message: 'Global language updated successfully' });
    } catch (error) {
        console.error('Error updating global language:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/language/me
// Any authenticated user — sets their personal language preference.
// This always overrides the global default for that user.
router.patch('/me', async (req, res) => {
    try {
        const { language } = req.body;

        if (!language && language !== null) {
            return res.status(400).json({ error: 'Language is required (use null to reset to global default)' });
        }

        if (language !== null && !SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                error: `Invalid language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
            });
        }

        // Upsert into user_preferences
        await pool.query(`
            INSERT INTO public.user_preferences (user_id, preferred_language)
            VALUES ($1, $2)
            ON CONFLICT (user_id) DO UPDATE SET
                preferred_language = $2,
                updated_at = NOW()
        `, [req.user.id, language]);

        res.json({
            preferred_language: language,
            message: language
                ? 'Personal language preference saved'
                : 'Personal language preference cleared (will use global default)'
        });
    } catch (error) {
        console.error('Error updating personal language:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/language/resolve
// Returns the resolved language for the current user following the hierarchy:
//   user preferred_language → school global_language → 'en'
router.get('/resolve', async (req, res) => {
    try {
        const userId = req.user?.id;
        const schoolId = req.user?.schoolId || req.user?.primary_school_id;

        let userLang = null;
        let globalLang = 'en';

        if (userId) {
            const prefResult = await pool.query(
                'SELECT preferred_language FROM public.user_preferences WHERE user_id = $1',
                [userId]
            );
            userLang = prefResult.rows[0]?.preferred_language || null;
        }

        if (schoolId) {
            const schoolResult = await pool.query(
                'SELECT global_language FROM public.schools WHERE id = $1',
                [schoolId]
            );
            globalLang = schoolResult.rows[0]?.global_language || 'en';
        }

        const resolved = userLang || globalLang || 'en';

        res.json({
            resolved_language: resolved,
            user_language: userLang,
            global_language: globalLang
        });
    } catch (error) {
        console.error('Error resolving language:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
