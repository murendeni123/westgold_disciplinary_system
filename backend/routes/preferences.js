const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com')
        ? { rejectUnauthorized: false }
        : false
});

// Ensure the user_preferences table exists
const ensureTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.user_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            email_notifications_enabled BOOLEAN DEFAULT FALSE,
            email_on_behaviour BOOLEAN DEFAULT FALSE,
            email_on_merits BOOLEAN DEFAULT FALSE,
            email_on_detention BOOLEAN DEFAULT FALSE,
            email_on_absence BOOLEAN DEFAULT FALSE,
            dark_mode BOOLEAN DEFAULT FALSE,
            compact_view BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
};

ensureTable().catch(err => console.error('Could not ensure user_preferences table:', err.message));

const defaults = {
    email_notifications_enabled: false,
    email_on_behaviour: false,
    email_on_merits: false,
    email_on_detention: false,
    email_on_absence: false,
    dark_mode: false,
    compact_view: false
};

// GET /api/preferences
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM public.user_preferences WHERE user_id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.json({ ...defaults, user_id: req.user.id });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/preferences
router.put('/', async (req, res) => {
    try {
        const {
            email_notifications_enabled,
            email_on_behaviour,
            email_on_merits,
            email_on_detention,
            email_on_absence,
            dark_mode,
            compact_view
        } = req.body;

        const vals = [
            email_notifications_enabled ?? false,
            email_on_behaviour ?? false,
            email_on_merits ?? false,
            email_on_detention ?? false,
            email_on_absence ?? false,
            dark_mode ?? false,
            compact_view ?? false,
            req.user.id
        ];

        await pool.query(`
            INSERT INTO public.user_preferences
                (user_id, email_notifications_enabled, email_on_behaviour, email_on_merits,
                 email_on_detention, email_on_absence, dark_mode, compact_view)
            VALUES ($8, $1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE SET
                email_notifications_enabled = $1,
                email_on_behaviour = $2,
                email_on_merits = $3,
                email_on_detention = $4,
                email_on_absence = $5,
                dark_mode = $6,
                compact_view = $7,
                updated_at = NOW()
        `, vals);

        const updated = await pool.query(
            'SELECT * FROM public.user_preferences WHERE user_id = $1',
            [req.user.id]
        );
        res.json(updated.rows[0]);
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/preferences/user/:userId  (internal use by email service)
router.get('/user/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM public.user_preferences WHERE user_id = $1',
            [req.params.userId]
        );
        if (result.rows.length === 0) {
            return res.json({ ...defaults, user_id: parseInt(req.params.userId) });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
