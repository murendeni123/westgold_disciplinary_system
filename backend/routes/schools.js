const express = require('express');
const { dbGet, dbAll } = require('../database/db');
const { authenticateToken, getSchoolId } = require('../middleware/auth');

const router = express.Router();

// Get current user's school
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        
        if (!schoolId) {
            return res.status(404).json({ error: 'No school associated with your account' });
        }

        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [schoolId]);
        
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        res.json(school);
    } catch (error) {
        console.error('Error fetching current school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get school by ID (if user has access)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schoolId = parseInt(req.params.id);
        const userSchoolId = getSchoolId(req);

        // Users can only access their own school (unless platform admin)
        if (req.user.role !== 'platform_admin' && schoolId !== userSchoolId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const school = await dbGet('SELECT * FROM schools WHERE id = ?', [schoolId]);
        
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        res.json(school);
    } catch (error) {
        console.error('Error fetching school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

