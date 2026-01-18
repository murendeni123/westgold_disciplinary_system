const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');

const router = express.Router();

// Get Goldie Badge feature status (for any authenticated user)
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const settings = await dbGet('SELECT goldie_badge_enabled, goldie_badge_threshold FROM platform_settings WHERE id = 1');
        res.json({
            enabled: settings?.goldie_badge_enabled === 1 || settings?.goldie_badge_enabled === true,
            threshold: settings?.goldie_badge_threshold || 10
        });
    } catch (error) {
        console.error('Error fetching Goldie Badge status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get students who qualify for Goldie Badge (merits - demerits >= threshold)
router.get('/qualified', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        
        // Check if feature is enabled
        const settings = await dbGet('SELECT goldie_badge_enabled, goldie_badge_threshold FROM platform_settings WHERE id = 1');
        if (!settings?.goldie_badge_enabled) {
            return res.json({ enabled: false, students: [] });
        }
        
        const threshold = settings.goldie_badge_threshold || 10;

        // Calculate merit and demerit totals for each student
        let query = `
            SELECT 
                s.id,
                s.student_id,
                s.first_name,
                s.last_name,
                s.photo_path,
                c.class_name,
                COALESCE(merit_totals.total_merits, 0) as total_merits,
                COALESCE(demerit_totals.total_demerits, 0) as total_demerits,
                (COALESCE(merit_totals.total_merits, 0) - COALESCE(demerit_totals.total_demerits, 0)) as net_score,
                gbf.id as flag_id,
                gbf.status as flag_status,
                gbf.flagged_at,
                gbf.awarded_at,
                gbf.notes as flag_notes
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN (
                SELECT student_id, COALESCE(SUM(points), 0) as total_merits
                FROM merits
                GROUP BY student_id
            ) merit_totals ON s.id = merit_totals.student_id
            LEFT JOIN (
                SELECT student_id, COALESCE(SUM(points), 0) as total_demerits
                FROM behaviour_incidents
                GROUP BY student_id
            ) demerit_totals ON s.id = demerit_totals.student_id
            LEFT JOIN goldie_badge_flags gbf ON s.id = gbf.student_id
            WHERE (COALESCE(merit_totals.total_merits, 0) - COALESCE(demerit_totals.total_demerits, 0)) >= ?
        `;
        
        const params = [threshold];
        
        if (schoolId) {
            query += ' AND s.school_id = ?';
            params.push(schoolId);
        }
        
        query += ' ORDER BY net_score DESC, s.last_name ASC';
        
        const students = await dbAll(query, params);
        
        res.json({
            enabled: true,
            threshold,
            students: students.map(s => ({
                ...s,
                is_flagged: s.flag_status === 'flagged' || s.flag_status === 'awarded',
                is_awarded: s.flag_status === 'awarded'
            }))
        });
    } catch (error) {
        console.error('Error fetching qualified students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all flagged students (for viewing flagged list)
router.get('/flagged', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        
        let query = `
            SELECT 
                gbf.*,
                s.student_id,
                s.first_name,
                s.last_name,
                s.photo_path,
                c.class_name,
                u.name as flagged_by_name
            FROM goldie_badge_flags gbf
            INNER JOIN students s ON gbf.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON gbf.flagged_by = u.id
            WHERE gbf.status IN ('flagged', 'awarded')
        `;
        
        const params = [];
        
        if (schoolId) {
            query += ' AND gbf.school_id = ?';
            params.push(schoolId);
        }
        
        query += ' ORDER BY gbf.flagged_at DESC';
        
        const flagged = await dbAll(query, params);
        res.json(flagged);
    } catch (error) {
        console.error('Error fetching flagged students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Flag a student for Goldie Badge
router.post('/flag/:studentId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const { notes } = req.body;
        const schoolId = getSchoolId(req);
        
        // Get student's current merit/demerit totals
        const totals = await dbGet(`
            SELECT 
                COALESCE(merit_totals.total_merits, 0) as total_merits,
                COALESCE(demerit_totals.total_demerits, 0) as total_demerits
            FROM students s
            LEFT JOIN (
                SELECT student_id, COALESCE(SUM(points), 0) as total_merits
                FROM merits
                WHERE student_id = ?
                GROUP BY student_id
            ) merit_totals ON s.id = merit_totals.student_id
            LEFT JOIN (
                SELECT student_id, COALESCE(SUM(points), 0) as total_demerits
                FROM behaviour_incidents
                WHERE student_id = ?
                GROUP BY student_id
            ) demerit_totals ON s.id = demerit_totals.student_id
            WHERE s.id = ?
        `, [studentId, studentId, studentId]);
        
        const meritPoints = totals?.total_merits || 0;
        const demeritPoints = totals?.total_demerits || 0;
        const netScore = meritPoints - demeritPoints;
        
        // Check if already flagged
        const existing = await dbGet(
            'SELECT id FROM goldie_badge_flags WHERE student_id = ?',
            [studentId]
        );
        
        if (existing) {
            // Update existing flag
            await dbRun(
                `UPDATE goldie_badge_flags 
                 SET status = 'flagged', flagged_by = ?, flagged_at = CURRENT_TIMESTAMP,
                     merit_points = ?, demerit_points = ?, net_score = ?, notes = ?
                 WHERE student_id = ?`,
                [req.user.id, meritPoints, demeritPoints, netScore, notes || null, studentId]
            );
        } else {
            // Create new flag
            await dbRun(
                `INSERT INTO goldie_badge_flags 
                 (student_id, flagged_by, merit_points, demerit_points, net_score, notes, school_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [studentId, req.user.id, meritPoints, demeritPoints, netScore, notes || null, schoolId]
            );
        }
        
        const flag = await dbGet(
            'SELECT * FROM goldie_badge_flags WHERE student_id = ?',
            [studentId]
        );
        
        res.json(flag);
    } catch (error) {
        console.error('Error flagging student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unflag a student
router.delete('/flag/:studentId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { studentId } = req.params;
        
        await dbRun(
            `UPDATE goldie_badge_flags SET status = 'removed' WHERE student_id = ?`,
            [studentId]
        );
        
        res.json({ message: 'Student unflagged successfully' });
    } catch (error) {
        console.error('Error unflagging student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark student as awarded Goldie Badge
router.put('/award/:studentId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { studentId } = req.params;
        
        await dbRun(
            `UPDATE goldie_badge_flags 
             SET status = 'awarded', awarded_at = CURRENT_TIMESTAMP 
             WHERE student_id = ?`,
            [studentId]
        );
        
        const flag = await dbGet(
            'SELECT * FROM goldie_badge_flags WHERE student_id = ?',
            [studentId]
        );
        
        res.json(flag);
    } catch (error) {
        console.error('Error awarding badge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
