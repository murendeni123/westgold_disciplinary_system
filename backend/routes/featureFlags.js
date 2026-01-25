const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { platformAdminOnly } = require('../middleware/schemaContext');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all feature flags for all schools (Platform Admin only)
router.get('/all', authenticateToken, platformAdminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ff.id,
        ff.school_id,
        s.name as school_name,
        ff.feature_name,
        ff.is_enabled,
        ff.enabled_at,
        ff.disabled_at,
        ff.created_at,
        ff.updated_at
      FROM platform.feature_flags ff
      JOIN public.schools s ON ff.school_id = s.id
      ORDER BY s.name, ff.feature_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Get feature flags for a specific school (Platform Admin only)
router.get('/school/:schoolId', authenticateToken, platformAdminOnly, async (req, res) => {
  try {
    const { schoolId } = req.params;

    const result = await pool.query(`
      SELECT 
        ff.id,
        ff.school_id,
        s.name as school_name,
        ff.feature_name,
        ff.is_enabled,
        ff.enabled_at,
        ff.disabled_at,
        ff.created_at,
        ff.updated_at
      FROM platform.feature_flags ff
      JOIN public.schools s ON ff.school_id = s.id
      WHERE ff.school_id = $1
      ORDER BY ff.feature_name
    `, [schoolId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching school feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Get feature flags for current user's school (School Admin/Teacher/Parent)
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const schoolId = req.user.schoolId || req.schoolId;

    if (!schoolId) {
      return res.status(400).json({ error: 'School context required' });
    }

    const result = await pool.query(`
      SELECT 
        feature_name,
        is_enabled
      FROM platform.feature_flags
      WHERE school_id = $1
    `, [schoolId]);

    // Convert to object format for easy lookup
    const flags = {};
    result.rows.forEach(row => {
      flags[row.feature_name] = row.is_enabled;
    });

    res.json(flags);
  } catch (error) {
    console.error('Error fetching current school feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Check if a specific feature is enabled for current school
router.get('/check/:featureName', authenticateToken, async (req, res) => {
  try {
    const schoolId = req.user.schoolId || req.schoolId;
    const { featureName } = req.params;

    if (!schoolId) {
      return res.status(400).json({ error: 'School context required' });
    }

    const result = await pool.query(`
      SELECT is_enabled
      FROM platform.feature_flags
      WHERE school_id = $1 AND feature_name = $2
    `, [schoolId, featureName]);

    if (result.rows.length === 0) {
      return res.json({ enabled: false });
    }

    res.json({ enabled: result.rows[0].is_enabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

// Toggle feature flag (Platform Admin only)
router.put('/toggle/:schoolId/:featureName', authenticateToken, platformAdminOnly, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { schoolId, featureName } = req.params;
    const { enabled } = req.body;

    await client.query('BEGIN');

    // Update or insert feature flag
    // For platform admins, enabled_by should be null since they don't have a numeric user ID
    const enabledBy = req.user.isPlatformAdmin ? null : req.user.id;
    
    const result = await client.query(`
      INSERT INTO platform.feature_flags (school_id, feature_name, is_enabled, enabled_by, enabled_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (school_id, feature_name)
      DO UPDATE SET 
        is_enabled = $3,
        enabled_by = $4,
        enabled_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE platform.feature_flags.enabled_at END,
        disabled_at = CASE WHEN $3 = false THEN CURRENT_TIMESTAMP ELSE platform.feature_flags.disabled_at END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [schoolId, featureName, enabled, enabledBy, enabled ? new Date() : null]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'} for school`,
      flag: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error toggling feature flag:', error);
    res.status(500).json({ error: 'Failed to toggle feature flag' });
  } finally {
    client.release();
  }
});

// Bulk toggle feature for multiple schools (Platform Admin only)
router.put('/bulk-toggle/:featureName', authenticateToken, platformAdminOnly, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { featureName } = req.params;
    const { schoolIds, enabled } = req.body;

    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return res.status(400).json({ error: 'School IDs array is required' });
    }

    await client.query('BEGIN');

    // For platform admins, enabled_by should be null since they don't have a numeric user ID
    const enabledBy = req.user.isPlatformAdmin ? null : req.user.id;

    for (const schoolId of schoolIds) {
      await client.query(`
        INSERT INTO platform.feature_flags (school_id, feature_name, is_enabled, enabled_by, enabled_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (school_id, feature_name)
        DO UPDATE SET 
          is_enabled = $3,
          enabled_by = $4,
          enabled_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE platform.feature_flags.enabled_at END,
          disabled_at = CASE WHEN $3 = false THEN CURRENT_TIMESTAMP ELSE platform.feature_flags.disabled_at END,
          updated_at = CURRENT_TIMESTAMP
      `, [schoolId, featureName, enabled, enabledBy, enabled ? new Date() : null]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'} for ${schoolIds.length} schools`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk toggling feature flag:', error);
    res.status(500).json({ error: 'Failed to bulk toggle feature flag' });
  } finally {
    client.release();
  }
});

module.exports = router;
