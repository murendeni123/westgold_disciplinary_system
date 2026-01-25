const express = require('express');
const router = express.Router();
const { dbGet, dbRun } = require('../database/db');
const { schemaGet } = require('../utils/schemaHelper');
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

module.exports = router;
