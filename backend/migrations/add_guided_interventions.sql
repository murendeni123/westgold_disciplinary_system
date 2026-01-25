-- Migration: Add Guided Intervention Model
-- Description: Replaces simple intervention types with a 2-step guided model

-- Step 1: Create behaviour_categories enum
CREATE TYPE behaviour_category AS ENUM (
  'disruptive_classroom',
  'non_compliance',
  'inattention',
  'peer_conflict',
  'low_engagement'
);

-- Step 2: Create intervention_strategies table (library of all possible strategies)
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.intervention_strategies (
  id SERIAL PRIMARY KEY,
  category behaviour_category NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Update interventions table to use new model
ALTER TABLE {SCHEMA_NAME}.interventions 
  ADD COLUMN IF NOT EXISTS behaviour_category behaviour_category,
  ADD COLUMN IF NOT EXISTS triggers TEXT,
  ADD COLUMN IF NOT EXISTS frequency TEXT,
  ADD COLUMN IF NOT EXISTS context_notes TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS review_date DATE,
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER CHECK (engagement_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS tone_used TEXT,
  ADD COLUMN IF NOT EXISTS compliance_outcome TEXT;

-- Step 4: Create intervention_strategies_used junction table (tracks which strategies were tried)
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.intervention_strategies_used (
  id SERIAL PRIMARY KEY,
  intervention_id INTEGER REFERENCES {SCHEMA_NAME}.interventions(id) ON DELETE CASCADE,
  strategy_id INTEGER REFERENCES {SCHEMA_NAME}.intervention_strategies(id) ON DELETE CASCADE,
  was_effective BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(intervention_id, strategy_id)
);

-- Step 5: Create student_intervention_history view for tracking
CREATE OR REPLACE VIEW {SCHEMA_NAME}.student_intervention_history AS
SELECT 
  s.id as student_id,
  s.first_name || ' ' || s.last_name as student_name,
  i.behaviour_category,
  COUNT(DISTINCT i.id) as total_interventions,
  COUNT(DISTINCT isu.strategy_id) as strategies_tried,
  ARRAY_AGG(DISTINCT isu.strategy_id) as strategy_ids_used,
  MAX(i.created_at) as last_intervention_date
FROM {SCHEMA_NAME}.students s
LEFT JOIN {SCHEMA_NAME}.interventions i ON s.id = i.student_id
LEFT JOIN {SCHEMA_NAME}.intervention_strategies_used isu ON i.id = isu.intervention_id
GROUP BY s.id, s.first_name, s.last_name, i.behaviour_category;

-- Step 6: Insert intervention strategies library
INSERT INTO {SCHEMA_NAME}.intervention_strategies (category, name, description, display_order) VALUES
-- DISRUPTIVE CLASSROOM BEHAVIOUR
('disruptive_classroom', 'Private verbal redirection', 'Quietly redirect student behavior without drawing attention', 1),
('disruptive_classroom', 'Non-verbal cue (hand signal, eye contact)', 'Use silent signals to redirect behavior', 2),
('disruptive_classroom', 'Behaviour cue card or desk reminder', 'Visual reminder of expected behavior', 3),
('disruptive_classroom', 'Seat closer to teacher', 'Move student to proximity seating', 4),
('disruptive_classroom', 'Change seating away from trigger peers', 'Separate from distracting influences', 5),
('disruptive_classroom', 'Pre-lesson check-in to set behaviour goal', 'Brief conversation before class starts', 6),
('disruptive_classroom', 'Break tasks into smaller steps', 'Chunk work into manageable pieces', 7),
('disruptive_classroom', 'Assign classroom responsibility (helper role)', 'Give student a job or leadership role', 8),
('disruptive_classroom', 'Positive reinforcement for on-task behaviour', 'Praise and acknowledge good behavior', 9),
('disruptive_classroom', 'Clear reminder of classroom expectations', 'Review rules and expectations', 10),

-- NON-COMPLIANCE / DEFIANCE
('non_compliance', 'Calm repetition of instruction (once)', 'Restate direction calmly without escalation', 1),
('non_compliance', 'Offer structured choice ("now or in 5 minutes")', 'Provide limited options for compliance', 2),
('non_compliance', 'Private conversation outside class', 'Discuss behavior away from peers', 3),
('non_compliance', 'Acknowledge feelings before redirecting', 'Validate emotions then redirect', 4),
('non_compliance', 'Restate expectations clearly', 'Clarify what is required', 5),
('non_compliance', 'Allow short cool-down period', 'Give time to regulate emotions', 6),
('non_compliance', 'Positive reinforcement upon compliance', 'Praise when student follows through', 7),
('non_compliance', 'Involve learner in setting class rules', 'Co-create expectations', 8),
('non_compliance', 'Goal-setting discussion with learner', 'Collaborative behavior planning', 9),
('non_compliance', 'Behaviour agreement (informal)', 'Written or verbal commitment', 10),

-- INATTENTION / DISTRACTIBILITY
('inattention', 'Seat closer to teacher', 'Proximity seating for focus', 1),
('inattention', 'Reduce visual distractions', 'Minimize environmental triggers', 2),
('inattention', 'Use visual task checklist', 'Provide step-by-step visual guide', 3),
('inattention', 'Break tasks into timed chunks', 'Use Pomodoro or similar technique', 4),
('inattention', 'Frequent brief check-ins', 'Regular monitoring and support', 5),
('inattention', 'Provide clear, written instructions', 'Written reference for tasks', 6),
('inattention', 'Use timer for focus periods', 'Time-bound work sessions', 7),
('inattention', 'Praise task completion', 'Acknowledge finished work', 8),
('inattention', 'Allow movement break between tasks', 'Brain breaks for regulation', 9),
('inattention', 'Provide structured routine', 'Predictable schedule and transitions', 10),

-- PEER CONFLICT / BULLYING
('peer_conflict', 'Guided restorative discussion', 'Facilitated conversation between parties', 1),
('peer_conflict', 'Teach conflict resolution skills', 'Explicit instruction in problem-solving', 2),
('peer_conflict', 'Teach appropriate apology', 'Model and practice sincere apologies', 3),
('peer_conflict', 'Mediate peer agreement', 'Help students reach resolution', 4),
('peer_conflict', 'Adjust seating arrangements', 'Separate conflicting students', 5),
('peer_conflict', 'Increase playground/class monitoring', 'Enhanced supervision', 6),
('peer_conflict', 'Assign peer support buddy', 'Positive peer mentoring', 7),
('peer_conflict', 'Social skills mini-lesson', 'Teach specific social behaviors', 8),
('peer_conflict', 'Parent notification (non-disciplinary)', 'Inform parents for support', 9),
('peer_conflict', 'Refer to school counsellor', 'Professional support intervention', 10),

-- LOW ENGAGEMENT / WITHDRAWAL
('low_engagement', 'One-on-one check-in', 'Private conversation about wellbeing', 1),
('low_engagement', 'Set small achievable goals', 'Break down expectations', 2),
('low_engagement', 'Praise effort, not results', 'Growth mindset reinforcement', 3),
('low_engagement', 'Use learner interests in tasks', 'Personalize learning content', 4),
('low_engagement', 'Assign leadership/helper role', 'Give responsibility and purpose', 5),
('low_engagement', 'Pair with supportive peer', 'Buddy system for engagement', 6),
('low_engagement', 'Increase positive feedback', 'More frequent encouragement', 7),
('low_engagement', 'Parent progress update', 'Collaborative home-school support', 8),
('low_engagement', 'Counsellor check-in', 'Wellbeing assessment', 9),
('low_engagement', 'Monitor engagement weekly', 'Regular tracking and adjustment', 10);

-- Step 7: Create function to get suggested strategies (prioritizes untried ones)
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

-- Step 8: Create index for performance
CREATE INDEX IF NOT EXISTS idx_interventions_behaviour_category ON {SCHEMA_NAME}.interventions(behaviour_category);
CREATE INDEX IF NOT EXISTS idx_interventions_student_category ON {SCHEMA_NAME}.interventions(student_id, behaviour_category);
CREATE INDEX IF NOT EXISTS idx_intervention_strategies_category ON {SCHEMA_NAME}.intervention_strategies(category);
CREATE INDEX IF NOT EXISTS idx_strategies_used_intervention ON {SCHEMA_NAME}.intervention_strategies_used(intervention_id);
