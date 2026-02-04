const express = require('express');
const router = express.Router();
const { authenticatePlatformToken } = require('../middleware/auth');
const { dbAll, dbGet, dbRun } = require('../database/db');

// Get all system features
router.get('/', authenticatePlatformToken, async (req, res) => {
  try {
    const { category, is_premium, is_active } = req.query;
    
    let query = 'SELECT * FROM public.system_features WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }
    
    if (is_premium !== undefined) {
      query += ' AND is_premium = $' + (params.length + 1);
      params.push(is_premium === 'true');
    }
    
    if (is_active !== undefined) {
      query += ' AND is_active = $' + (params.length + 1);
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY category, name';
    
    const features = await dbAll(query, params);
    
    res.json({
      success: true,
      features,
      count: features.length
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: 'Error fetching features' });
  }
});

// Get feature categories
router.get('/categories', authenticatePlatformToken, async (req, res) => {
  try {
    const categories = await dbAll(`
      SELECT 
        category,
        COUNT(*) as feature_count,
        COUNT(*) FILTER (WHERE is_premium = true) as premium_count
      FROM public.system_features
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `);
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Get features for a specific plan
router.get('/plans/:planId', authenticatePlatformToken, async (req, res) => {
  try {
    const { planId } = req.params;
    
    const features = await dbAll(`
      SELECT 
        sf.id,
        sf.name,
        sf.description,
        sf.feature_key,
        sf.category,
        sf.is_premium
      FROM public.system_features sf
      INNER JOIN public.plan_features pf ON sf.id = pf.feature_id
      WHERE pf.plan_id = $1 AND sf.is_active = true
      ORDER BY sf.category, sf.name
    `, [planId]);
    
    res.json({
      success: true,
      features,
      count: features.length
    });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    res.status(500).json({ error: 'Error fetching plan features' });
  }
});

// Add feature to plan
router.post('/plans/:planId', authenticatePlatformToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const { feature_id } = req.body;
    
    if (!feature_id) {
      return res.status(400).json({ error: 'Feature ID is required' });
    }
    
    // Check if plan exists
    const plan = await dbGet('SELECT id FROM public.subscription_plans WHERE id = $1', [planId]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Check if feature exists
    const feature = await dbGet('SELECT id FROM public.system_features WHERE id = $1', [feature_id]);
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    
    // Add feature to plan (ignore if already exists)
    await dbRun(`
      INSERT INTO public.plan_features (plan_id, feature_id)
      VALUES ($1, $2)
      ON CONFLICT (plan_id, feature_id) DO NOTHING
    `, [planId, feature_id]);
    
    res.json({
      success: true,
      message: 'Feature added to plan successfully'
    });
  } catch (error) {
    console.error('Error adding feature to plan:', error);
    res.status(500).json({ error: 'Error adding feature to plan' });
  }
});

// Remove feature from plan
router.delete('/plans/:planId/features/:featureId', authenticatePlatformToken, async (req, res) => {
  try {
    const { planId, featureId } = req.params;
    
    await dbRun(`
      DELETE FROM public.plan_features
      WHERE plan_id = $1 AND feature_id = $2
    `, [planId, featureId]);
    
    res.json({
      success: true,
      message: 'Feature removed from plan successfully'
    });
  } catch (error) {
    console.error('Error removing feature from plan:', error);
    res.status(500).json({ error: 'Error removing feature from plan' });
  }
});

// Bulk update plan features
router.post('/plans/:planId/bulk', authenticatePlatformToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const { feature_ids } = req.body;
    
    if (!Array.isArray(feature_ids)) {
      return res.status(400).json({ error: 'feature_ids must be an array' });
    }
    
    // Check if plan exists
    const plan = await dbGet('SELECT id FROM public.subscription_plans WHERE id = $1', [planId]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Start transaction
    await dbRun('BEGIN');
    
    try {
      // Remove all existing features for this plan
      await dbRun('DELETE FROM public.plan_features WHERE plan_id = $1', [planId]);
      
      // Add new features
      if (feature_ids.length > 0) {
        const values = feature_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
        const query = `
          INSERT INTO public.plan_features (plan_id, feature_id)
          VALUES ${values}
          ON CONFLICT (plan_id, feature_id) DO NOTHING
        `;
        await dbRun(query, [planId, ...feature_ids]);
      }
      
      await dbRun('COMMIT');
      
      res.json({
        success: true,
        message: 'Plan features updated successfully',
        feature_count: feature_ids.length
      });
    } catch (error) {
      await dbRun('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error bulk updating plan features:', error);
    res.status(500).json({ error: 'Error updating plan features' });
  }
});

// Get all plans with their features
router.get('/plans-with-features', authenticatePlatformToken, async (req, res) => {
  try {
    const plans = await dbAll(`
      SELECT 
        sp.id,
        sp.name,
        sp.price,
        json_agg(
          json_build_object(
            'id', sf.id,
            'name', sf.name,
            'feature_key', sf.feature_key,
            'category', sf.category
          )
        ) FILTER (WHERE sf.id IS NOT NULL) as features
      FROM public.subscription_plans sp
      LEFT JOIN public.plan_features pf ON sp.id = pf.plan_id
      LEFT JOIN public.system_features sf ON pf.feature_id = sf.id AND sf.is_active = true
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY sp.price
    `);
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching plans with features:', error);
    res.status(500).json({ error: 'Error fetching plans with features' });
  }
});

module.exports = router;
