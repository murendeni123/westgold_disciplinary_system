/**
 * School Information Routes
 * Returns school information for the currently logged-in user
 */

const express = require('express');
const router = express.Router();
const { dbGet } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const cache = require('../utils/cache');

/**
 * GET /api/school-info
 * Get current user's school information
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        if (!user || (!user.schoolId && !user.primary_school_id)) {
            return res.status(404).json({ 
                error: 'No school associated with this user' 
            });
        }
        
        const schoolId = user.schoolId || user.primary_school_id;
        
        // Serve from cache when available (5 min TTL)
        const cacheKey = `school_info_${schoolId}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // Get school information
        const school = await dbGet(`
            SELECT 
                id,
                name,
                code,
                school_code,
                subdomain,
                email,
                phone,
                address,
                city,
                province,
                country,
                postal_code,
                status,
                primary_color,
                secondary_color,
                accent_color,
                timezone,
                date_format,
                currency,
                max_students,
                max_teachers,
                created_at
            FROM public.schools 
            WHERE id = $1
        `, [schoolId]);
        
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        cache.set(cacheKey, school, 5 * 60 * 1000);
        res.json(school);
        
    } catch (error) {
        console.error('Error fetching school info:', error);
        res.status(500).json({ error: 'Failed to fetch school information' });
    }
});

module.exports = router;

