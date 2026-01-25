const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get behaviour categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { 
        value: 'disruptive_classroom', 
        label: 'Disruptive Classroom Behaviour',
        description: 'Talking out of turn, interrupting lessons, distracting peers, calling out answers, excessive movement',
        icon: '🧑‍🏫'
      },
      { 
        value: 'non_compliance', 
        label: 'Non-Compliance / Defiance',
        description: 'Refusal to follow instructions, arguing with teacher, ignoring requests, power struggles',
        icon: '🤝'
      },
      { 
        value: 'inattention', 
        label: 'Inattention / Distractibility',
        description: 'Daydreaming, incomplete work, difficulty focusing, easily distracted',
        icon: '🧠'
      },
      { 
        value: 'peer_conflict', 
        label: 'Peer Conflict / Bullying',
        description: 'Verbal conflict, teasing, exclusion, repeated peer disputes',
        icon: '💬'
      },
      { 
        value: 'low_engagement', 
        label: 'Low Engagement / Withdrawal',
        description: 'Minimal participation, avoidance of tasks, low motivation, social withdrawal',
        icon: '😊'
      }
    ];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all intervention strategies for a category
router.get('/strategies', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    let query = 'SELECT * FROM intervention_strategies WHERE is_active = true';
    const params = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, display_order';

    const strategies = await schemaAll(req, query, params);
    res.json(strategies);
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get suggested strategies for a student and category (prioritizes untried)
router.get('/suggested-strategies', authenticateToken, async (req, res) => {
  try {
    const { student_id, category } = req.query;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!student_id || !category) {
      return res.status(400).json({ error: 'student_id and category are required' });
    }

    const strategies = await schemaAll(req,
      'SELECT * FROM get_suggested_strategies($1, $2)',
      [student_id, category]
    );

    res.json(strategies);
  } catch (error) {
    console.error('Error fetching suggested strategies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student intervention history
router.get('/student-history/:student_id', authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Get overall history
    const history = await schemaAll(req,
      `SELECT * FROM student_intervention_history WHERE student_id = $1`,
      [student_id]
    );

    // Get recent interventions with strategies
    const recentInterventions = await schemaAll(req,
      `SELECT 
        i.id,
        i.behaviour_category,
        i.created_at,
        i.outcome,
        i.engagement_score,
        ARRAY_AGG(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'was_effective', isu.was_effective
          )
        ) FILTER (WHERE s.id IS NOT NULL) as strategies_used
      FROM interventions i
      LEFT JOIN intervention_strategies_used isu ON i.id = isu.intervention_id
      LEFT JOIN intervention_strategies s ON isu.strategy_id = s.id
      WHERE i.student_id = $1
      GROUP BY i.id, i.behaviour_category, i.created_at, i.outcome, i.engagement_score
      ORDER BY i.created_at DESC
      LIMIT 10`,
      [student_id]
    );

    res.json({
      history,
      recent_interventions: recentInterventions
    });
  } catch (error) {
    console.error('Error fetching student history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create intervention with strategies
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      student_id,
      behaviour_category,
      triggers,
      frequency,
      context_notes,
      start_date,
      review_date,
      engagement_score,
      tone_used,
      compliance_outcome,
      strategies, // Array of strategy IDs
      description
    } = req.body;

    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    if (!student_id || !behaviour_category) {
      return res.status(400).json({ error: 'student_id and behaviour_category are required' });
    }

    // Get teacher ID
    const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    if (!teacher) {
      return res.status(403).json({ error: 'Teacher record not found' });
    }

    // Create intervention
    const intervention = await schemaRun(req,
      `INSERT INTO interventions (
        student_id, 
        assigned_by, 
        type,
        description,
        behaviour_category, 
        triggers, 
        frequency, 
        context_notes,
        start_date,
        end_date,
        engagement_score,
        tone_used,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        student_id,
        teacher.id,
        'guided_intervention',
        description || 'Guided intervention',
        behaviour_category,
        triggers,
        frequency,
        context_notes,
        start_date || new Date().toISOString().split('T')[0],
        review_date,
        engagement_score,
        tone_used,
        'active'
      ]
    );

    // Link strategies
    if (strategies && strategies.length > 0) {
      for (const strategyId of strategies) {
        await schemaRun(req,
          `INSERT INTO intervention_strategies_used (intervention_id, strategy_id)
           VALUES ($1, $2)
           ON CONFLICT (intervention_id, strategy_id) DO NOTHING`,
          [intervention.id, strategyId]
        );
      }
    }

    // Get complete intervention with strategies
    const completeIntervention = await schemaGet(req,
      `SELECT 
        i.*,
        ARRAY_AGG(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description
          )
        ) FILTER (WHERE s.id IS NOT NULL) as strategies
      FROM interventions i
      LEFT JOIN intervention_strategies_used isu ON i.id = isu.intervention_id
      LEFT JOIN intervention_strategies s ON isu.strategy_id = s.id
      WHERE i.id = $1
      GROUP BY i.id`,
      [intervention.id]
    );

    res.status(201).json(completeIntervention);
  } catch (error) {
    console.error('Error creating intervention:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update intervention outcome and strategy effectiveness
router.put('/:id/outcome', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, outcome_notes, strategy_effectiveness } = req.body;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    // Update intervention outcome
    await schemaRun(req,
      `UPDATE interventions 
       SET outcome = $1, 
           outcome_notes = $2,
           outcome_date = CURRENT_DATE,
           status = 'completed'
       WHERE id = $3`,
      [outcome, outcome_notes, id]
    );

    // Update strategy effectiveness if provided
    // strategy_effectiveness should be array of { strategy_id, was_effective, notes }
    if (strategy_effectiveness && Array.isArray(strategy_effectiveness)) {
      for (const se of strategy_effectiveness) {
        await schemaRun(req,
          `UPDATE intervention_strategies_used
           SET was_effective = $1, notes = $2
           WHERE intervention_id = $3 AND strategy_id = $4`,
          [se.was_effective, se.notes, id, se.strategy_id]
        );
      }
    }

    const updatedIntervention = await schemaGet(req,
      'SELECT * FROM interventions WHERE id = $1',
      [id]
    );

    res.json(updatedIntervention);
  } catch (error) {
    console.error('Error updating intervention outcome:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intervention statistics for reporting
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    let dateFilter = '';
    const params = [];
    if (start_date && end_date) {
      dateFilter = 'WHERE i.created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }

    // Category breakdown
    const categoryStats = await schemaAll(req,
      `SELECT 
        behaviour_category,
        COUNT(*) as total_interventions,
        AVG(engagement_score) as avg_engagement,
        COUNT(CASE WHEN outcome = 'successful' THEN 1 END) as successful_count
      FROM interventions i
      ${dateFilter}
      GROUP BY behaviour_category`,
      params
    );

    // Most effective strategies
    const effectiveStrategies = await schemaAll(req,
      `SELECT 
        s.name,
        s.category,
        COUNT(*) as times_used,
        COUNT(CASE WHEN isu.was_effective = true THEN 1 END) as times_effective,
        ROUND(COUNT(CASE WHEN isu.was_effective = true THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as effectiveness_rate
      FROM intervention_strategies_used isu
      JOIN intervention_strategies s ON isu.strategy_id = s.id
      JOIN interventions i ON isu.intervention_id = i.id
      ${dateFilter}
      GROUP BY s.id, s.name, s.category
      HAVING COUNT(*) >= 3
      ORDER BY effectiveness_rate DESC
      LIMIT 10`,
      params
    );

    res.json({
      category_stats: categoryStats,
      effective_strategies: effectiveStrategies
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
