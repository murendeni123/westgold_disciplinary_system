const { Pool } = require('pg');
require('dotenv').config();

async function fixAllIssues() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing all 5 issues for all schools...\n');

    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL'
    );

    for (const school of schoolsResult.rows) {
      console.log(`\n📍 Processing: ${school.name} (${school.schema_name})`);
      
      try {
        // ============================================
        // ISSUE 1: Fix Suggested Interventions
        // ============================================
        console.log('   🔧 Issue 1: Fixing Suggested Interventions...');
        
        const interventionTableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'intervention_strategies'
          )
        `, [school.schema_name]);

        if (interventionTableCheck.rows[0].exists) {
          // Create function
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

          // Check if strategies already exist
          const existingCount = await pool.query(
            `SELECT COUNT(*) FROM ${school.schema_name}.intervention_strategies`
          );
          
          // Only insert if table is empty
          if (existingCount.rows[0].count === '0') {
            await pool.query(`
              INSERT INTO ${school.schema_name}.intervention_strategies (category, name, description, display_order, is_active)
              VALUES
              ('disruptive_classroom', 'Proximity control', 'Move closer to student during instruction', 1, true),
              ('disruptive_classroom', 'Redirect attention', 'Gently redirect focus to task', 2, true),
              ('disruptive_classroom', 'Positive reinforcement', 'Praise appropriate behaviour immediately', 3, true),
              ('disruptive_classroom', 'Clear expectations reminder', 'Restate classroom rules calmly', 4, true),
              ('disruptive_classroom', 'Break/movement opportunity', 'Provide brief physical activity break', 5, true),
              ('disruptive_classroom', 'Peer buddy system', 'Pair with positive role model', 6, true),
              ('disruptive_classroom', 'Visual cues', 'Use hand signals or visual reminders', 7, true),
              ('disruptive_classroom', 'Choice provision', 'Offer limited appropriate choices', 8, true),
              ('disruptive_classroom', 'Time-out (brief)', '2-3 minute cool-down period', 9, true),
              ('disruptive_classroom', 'Parent communication', 'Inform parent of pattern and plan', 10, true),
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
            `);
          }
          
          const stratCount = await pool.query(`SELECT COUNT(*) FROM ${school.schema_name}.intervention_strategies`);
          console.log(`      ✅ Intervention strategies: ${stratCount.rows[0].count}`);
        }

        // ============================================
        // ISSUE 2: Ensure consequences exist
        // ============================================
        console.log('   🔧 Issue 2: Ensuring consequence types exist...');
        
        const consequencesTableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'consequences'
          )
        `, [school.schema_name]);

        if (consequencesTableCheck.rows[0].exists) {
          // Insert default consequences if table is empty
          const consCount = await pool.query(`SELECT COUNT(*) FROM ${school.schema_name}.consequences`);
          
          if (consCount.rows[0].count === 0) {
            await pool.query(`
              INSERT INTO ${school.schema_name}.consequences (name, description, severity, default_duration, is_active)
              VALUES
              ('Verbal Warning', 'First level warning for minor infractions', 'low', '1 day', 1),
              ('Written Warning', 'Formal written warning for repeated or moderate infractions', 'medium', '3 days', 1),
              ('Detention', 'After-school detention for serious infractions', 'medium', '1 session', 1),
              ('Suspension', 'Temporary removal from school for severe infractions', 'high', '3 days', 1)
            `);
            console.log('      ✅ Added default consequences');
          } else {
            console.log(`      ✅ Consequences exist: ${consCount.rows[0].count}`);
          }
        }

        console.log(`   ✅ Completed fixes for ${school.name}`);

      } catch (error) {
        console.error(`   ❌ Error for ${school.name}:`, error.message);
      }
    }

    console.log('\n✅ All fixes applied!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixAllIssues().catch(console.error);
}

module.exports = { fixAllIssues };
