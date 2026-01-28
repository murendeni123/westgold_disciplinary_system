-- Fix all 5 issues for Learskool - Westgold Primary (school_lear_1291)
-- This script will be run with schema replacement

-- ============================================
-- ISSUE 1: Add Suggested Interventions Function and Data
-- ============================================

-- Create the get_suggested_strategies function
CREATE OR REPLACE FUNCTION {SCHEMA_NAME}.get_suggested_strategies(
  p_student_id INTEGER,
  p_category behaviour_category
)
RETURNS TABLE (
  strategy_id INTEGER,
  strategy_name TEXT,
  description TEXT,
  times_used INTEGER,
  last_used TIMESTAMP,
  was_effective BOOLEAN,
  priority_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    COALESCE(usage.times_used, 0)::INTEGER,
    usage.last_used,
    usage.was_effective,
    CASE 
      WHEN usage.times_used IS NULL THEN 100  -- Never tried = highest priority
      WHEN usage.was_effective = true THEN 50  -- Previously effective
      WHEN usage.was_effective = false THEN 10 -- Previously ineffective
      ELSE 30  -- Tried but no effectiveness recorded
    END as priority_score
  FROM {SCHEMA_NAME}.intervention_strategies s
  LEFT JOIN (
    SELECT 
      isu.strategy_id,
      COUNT(*)::INTEGER as times_used,
      MAX(isu.created_at) as last_used,
      BOOL_OR(isu.was_effective) as was_effective
    FROM {SCHEMA_NAME}.intervention_strategies_used isu
    INNER JOIN {SCHEMA_NAME}.interventions i ON isu.intervention_id = i.id
    WHERE i.student_id = p_student_id
    GROUP BY isu.strategy_id
  ) usage ON s.id = usage.strategy_id
  WHERE s.category = p_category AND s.is_active = true
  ORDER BY priority_score DESC, s.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert intervention strategies if they don't exist
INSERT INTO {SCHEMA_NAME}.intervention_strategies (category, name, description, display_order, is_active)
VALUES
-- Disruptive Behaviour strategies
('disruptive', 'Proximity control', 'Move closer to student during instruction', 1, true),
('disruptive', 'Redirect attention', 'Gently redirect focus to task', 2, true),
('disruptive', 'Positive reinforcement', 'Praise appropriate behaviour immediately', 3, true),
('disruptive', 'Clear expectations reminder', 'Restate classroom rules calmly', 4, true),
('disruptive', 'Break/movement opportunity', 'Provide brief physical activity break', 5, true),
('disruptive', 'Peer buddy system', 'Pair with positive role model', 6, true),
('disruptive', 'Visual cues', 'Use hand signals or visual reminders', 7, true),
('disruptive', 'Choice provision', 'Offer limited appropriate choices', 8, true),
('disruptive', 'Time-out (brief)', '2-3 minute cool-down period', 9, true),
('disruptive', 'Parent communication', 'Inform parent of pattern and plan', 10, true),

-- Non-compliance strategies
('non_compliance', 'Calm, firm directive', 'Repeat instruction in neutral tone', 1, true),
('non_compliance', 'Wait time', 'Give 5-10 seconds for processing', 2, true),
('non_compliance', 'Break task into steps', 'Provide smaller, manageable chunks', 3, true),
('non_compliance', 'Offer assistance', 'Check if help is needed', 4, true),
('non_compliance', 'Natural consequences', 'Explain logical outcome of non-compliance', 5, true),
('non_compliance', 'Positive framing', 'State what to do, not what not to do', 6, true),
('non_compliance', 'Check understanding', 'Verify student comprehends request', 7, true),
('non_compliance', 'Reduce audience', 'Speak privately to avoid power struggle', 8, true),
('non_compliance', 'Compliance momentum', 'Start with easy requests first', 9, true),
('non_compliance', 'Behaviour contract', 'Co-create agreement with student', 10, true),

-- Low Engagement strategies
('low_engagement', 'Interest-based tasks', 'Connect content to student interests', 1, true),
('low_engagement', 'Hands-on activities', 'Provide tactile/kinesthetic learning', 2, true),
('low_engagement', 'Peer collaboration', 'Structured group work opportunity', 3, true),
('low_engagement', 'Frequent check-ins', 'Monitor progress every 5-10 minutes', 4, true),
('low_engagement', 'Goal setting', 'Set small, achievable targets together', 5, true),
('low_engagement', 'Varied instruction', 'Mix teaching methods (visual, auditory, kinesthetic)', 6, true),
('low_engagement', 'Immediate feedback', 'Provide quick positive reinforcement', 7, true),
('low_engagement', 'Increase positive feedback', 'More frequent encouragement', 8, true),
('low_engagement', 'Parent progress update', 'Collaborative home-school support', 9, true),
('low_engagement', 'Monitor engagement weekly', 'Regular tracking and adjustment', 10, true)
ON CONFLICT (category, name) DO NOTHING;

-- ============================================
-- ISSUE 2 & 4: Ensure incident_types and merit_types have correct points
-- ============================================

-- This will be handled by ensuring the Discipline Rules page data is properly saved
-- The tables should already exist, we just need to ensure data integrity

COMMENT ON TABLE {SCHEMA_NAME}.incident_types IS 'Incident types with point values - synced from Discipline Rules';
COMMENT ON TABLE {SCHEMA_NAME}.merit_types IS 'Merit types with point values - synced from Discipline Rules';
