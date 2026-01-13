const express = require('express');
const { dbGet, dbAll } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get feature flag for current school
router.get('/:featureName', authenticateToken, async (req, res) => {
    try {
        const schoolId = req.user.school_id;
        const featureName = req.params.featureName;

        if (!schoolId) {
            return res.status(400).json({ error: 'School ID not found in user session' });
        }

        const flag = await dbGet(
            'SELECT * FROM school_feature_flags WHERE school_id = ? AND feature_name = ?',
            [schoolId, featureName]
        );

        // Return default (disabled) if not found
        if (!flag) {
            return res.json({
                school_id: schoolId,
                feature_name: featureName,
                is_enabled: false
            });
        }

        res.json(flag);
    } catch (error) {
        console.error('Error fetching feature flag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all feature flags for current school
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schoolId = req.user.school_id;

        if (!schoolId) {
            return res.status(400).json({ error: 'School ID not found in user session' });
        }

        const flags = await dbAll(
            'SELECT * FROM school_feature_flags WHERE school_id = ? ORDER BY feature_name',
            [schoolId]
        );

        res.json(flags);
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
