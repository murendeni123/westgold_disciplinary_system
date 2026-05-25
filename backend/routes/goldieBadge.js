const express = require('express');
const router = express.Router();
const { dbGet, dbRun } = require('../database/db');
const { schemaGet, schemaAll } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');
const { calculateBadgeEligibility } = require('../utils/goldieBadgeHelper');

// Get Goldie Badge configuration for the current school
router.get('/config', async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ error: 'School context required' });
    }

    // Get configuration from goldie_badge_config table
    const config = await dbGet(
      'SELECT * FROM goldie_badge_config WHERE school_id = $1',
      [schoolId],
      'public'
    );

    // If no config exists, create default
    if (!config) {
      await dbRun(
        'INSERT INTO goldie_badge_config (school_id, points_threshold) VALUES ($1, $2)',
        [schoolId, 100],
        'public'
      );
      
      return res.json({
        school_id: schoolId,
        points_threshold: 100,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching Goldie Badge config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update Goldie Badge configuration
router.put('/config', async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user.schoolId;
    const { points_threshold } = req.body;

    if (!schoolId) {
      return res.status(400).json({ error: 'School context required' });
    }

    if (!points_threshold || points_threshold < 1) {
      return res.status(400).json({ error: 'Valid points threshold is required' });
    }

    // Upsert configuration
    await dbRun(
      `INSERT INTO goldie_badge_config (school_id, points_threshold, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (school_id)
       DO UPDATE SET points_threshold = $2, updated_at = CURRENT_TIMESTAMP`,
      [schoolId, points_threshold],
      'public'
    );

    const config = await dbGet(
      'SELECT * FROM goldie_badge_config WHERE school_id = $1',
      [schoolId],
      'public'
    );

    res.json({
      success: true,
      message: 'Goldie Badge configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating Goldie Badge config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Check badge eligibility for a student
router.get('/check-eligibility/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const eligibility = await calculateBadgeEligibility(req, studentId);
    
    res.json({
      studentId,
      isEligible: eligibility.isEligible,
      totalMerits: eligibility.totalMerits,
      totalDemerits: eligibility.totalDemerits,
      cleanPoints: eligibility.cleanPoints
    });
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

// Get Goldie Badge leaderboard — all current badge holders ordered by clean points
router.get('/leaderboard', async (req, res) => {
  try {
    if (!req.schemaName && !(req.user && req.user.schemaName)) {
      return res.status(400).json({ error: 'School context required' });
    }

    // Use the same eligibility criteria as calculateBadgeEligibility:
    // totalMerits >= 10 AND (totalMerits - totalDemerits) >= 10
    const BADGE_THRESHOLD = 10;

    const holders = await schemaAll(req, `
      SELECT
        s.id,
        s.student_id AS student_number,
        s.first_name || ' ' || s.last_name AS student_name,
        c.class_name,
        COALESCE(m.total_merits, 0) AS merit_points,
        COALESCE(bi.total_demerits, 0) AS demerit_points,
        (COALESCE(m.total_merits, 0) - COALESCE(bi.total_demerits, 0)) AS clean_points
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN (
        SELECT student_id, SUM(points) AS total_merits
        FROM merits
        GROUP BY student_id
      ) m ON s.id = m.student_id
      LEFT JOIN (
        SELECT student_id, SUM(points_deducted) AS total_demerits
        FROM behaviour_incidents
        GROUP BY student_id
      ) bi ON s.id = bi.student_id
      WHERE s.is_active = true
        AND COALESCE(m.total_merits, 0) >= $1
        AND (COALESCE(m.total_merits, 0) - COALESCE(bi.total_demerits, 0)) >= $1
      ORDER BY clean_points DESC, merit_points DESC
      LIMIT 20
    `, [BADGE_THRESHOLD]);

    res.json({ holders, threshold: BADGE_THRESHOLD });
  } catch (error) {
    console.error('Error fetching Goldie Badge leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
