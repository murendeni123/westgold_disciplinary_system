const { Pool } = require('pg');
require('dotenv').config();

async function fixInterventions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing intervention strategies for all schools...\n');

    // Get all schools
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL'
    );

    for (const school of schoolsResult.rows) {
      console.log(`\n📍 Processing: ${school.name} (${school.schema_name})`);
      
      try {
        // Check if intervention_strategies table exists
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'intervention_strategies'
          )
        `, [school.schema_name]);

        if (!tableCheck.rows[0].exists) {
          console.log('   ⏭️  Skipping - intervention_strategies table does not exist');
          continue;
        }

        // Create the function
        await pool.query(`
          CREATE OR REPLACE FUNCTION ${school.schema_name}.get_suggested_strategies(
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
                WHEN usage.times_used IS NULL THEN 100
                WHEN usage.was_effective = true THEN 50
                WHEN usage.was_effective = false THEN 10
                ELSE 30
              END as priority_score
            FROM ${school.schema_name}.intervention_strategies s
            LEFT JOIN (
              SELECT 
                isu.strategy_id,
                COUNT(*)::INTEGER as times_used,
                MAX(isu.created_at) as last_used,
                BOOL_OR(isu.was_effective) as was_effective
              FROM ${school.schema_name}.intervention_strategies_used isu
              INNER JOIN ${school.schema_name}.interventions i ON isu.intervention_id = i.id
              WHERE i.student_id = p_student_id
              GROUP BY isu.strategy_id
            ) usage ON s.id = usage.strategy_id
            WHERE s.category = p_category AND s.is_active = true
            ORDER BY priority_score DESC, s.display_order ASC;
          END;
          $$ LANGUAGE plpgsql;
        `);
        console.log('   ✅ Created get_suggested_strategies function');

        // Insert default strategies
        await pool.query(`
          INSERT INTO ${school.schema_name}.intervention_strategies (category, name, description, display_order, is_active)
          VALUES
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
          ON CONFLICT (category, name) DO NOTHING
        `);
        
        const countResult = await pool.query(
          `SELECT COUNT(*) as count FROM ${school.schema_name}.intervention_strategies`
        );
        console.log(`   ✅ Intervention strategies: ${countResult.rows[0].count}`);

      } catch (error) {
        console.error(`   ❌ Error for ${school.name}:`, error.message);
      }
    }

    console.log('\n✅ Migration complete!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixInterventions().catch(console.error);
}

module.exports = { fixInterventions };
