const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function investigateIssues() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('\n=== INVESTIGATING 5 ISSUES FOR LEARSKOOL - WESTGOLD PRIMARY ===\n');
    
    // Get the schema name for Learskool - Westgold Primary
    const schoolResult = await client.query(
      `SELECT id, name, schema_name FROM public.schools WHERE name ILIKE '%westgold%' OR name ILIKE '%learskool%'`
    );
    
    if (schoolResult.rows.length === 0) {
      console.log('❌ Could not find Learskool - Westgold Primary school');
      return;
    }
    
    const school = schoolResult.rows[0];
    const schemaName = school.schema_name;
    console.log(`✅ Found school: ${school.name}`);
    console.log(`   Schema: ${schemaName}\n`);
    
    // ISSUE 1: Check if intervention_strategies table exists
    console.log('--- ISSUE 1: Suggested Interventions Not Displaying ---');
    const strategiesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'intervention_strategies'
      )
    `, [schemaName]);
    
    if (strategiesTableCheck.rows[0].exists) {
      console.log('✅ intervention_strategies table exists');
      
      // Check if there are any strategies
      const strategiesCount = await client.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.intervention_strategies`
      );
      console.log(`   Strategies count: ${strategiesCount.rows[0].count}`);
      
      // Check if get_suggested_strategies function exists
      const functionCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = $1 AND p.proname = 'get_suggested_strategies'
        )
      `, [schemaName]);
      
      if (functionCheck.rows[0].exists) {
        console.log('✅ get_suggested_strategies function exists');
      } else {
        console.log('❌ get_suggested_strategies function MISSING');
      }
    } else {
      console.log('❌ intervention_strategies table MISSING');
    }
    
    // ISSUE 2: Check consequences table
    console.log('\n--- ISSUE 2: Consequence Types Missing on Assignment Form ---');
    const consequencesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'consequences'
      )
    `, [schemaName]);
    
    if (consequencesTableCheck.rows[0].exists) {
      console.log('✅ consequences table exists');
      
      const consequencesCount = await client.query(
        `SELECT COUNT(*) as count, 
         COUNT(*) FILTER (WHERE is_active = 1) as active_count 
         FROM ${schemaName}.consequences`
      );
      console.log(`   Total consequences: ${consequencesCount.rows[0].count}`);
      console.log(`   Active consequences: ${consequencesCount.rows[0].active_count}`);
      
      if (consequencesCount.rows[0].count > 0) {
        const sampleConsequences = await client.query(
          `SELECT id, name, severity, is_active FROM ${schemaName}.consequences LIMIT 5`
        );
        console.log('   Sample consequences:');
        sampleConsequences.rows.forEach(c => {
          console.log(`     - ${c.name} (severity: ${c.severity}, active: ${c.is_active})`);
        });
      }
    } else {
      console.log('❌ consequences table MISSING');
    }
    
    // ISSUE 3: Check admin permissions for incidents/merits
    console.log('\n--- ISSUE 3: Admin Ability to Assign Incidents and Merits ---');
    console.log('   Checking routes/incidents.js and routes/merits.js for role restrictions...');
    console.log('   (This requires code inspection - will be fixed in code)');
    
    // ISSUE 4: Check incident_types and merit_types tables
    console.log('\n--- ISSUE 4: Incident and Merit Points Not Syncing ---');
    const incidentTypesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'incident_types'
      )
    `, [schemaName]);
    
    if (incidentTypesCheck.rows[0].exists) {
      console.log('✅ incident_types table exists');
      
      const incidentTypes = await client.query(
        `SELECT id, name, points, severity FROM ${schemaName}.incident_types ORDER BY id LIMIT 10`
      );
      console.log(`   Incident types count: ${incidentTypes.rows.length}`);
      incidentTypes.rows.forEach(it => {
        console.log(`     - ${it.name}: ${it.points} points (severity: ${it.severity})`);
      });
    } else {
      console.log('❌ incident_types table MISSING');
    }
    
    const meritTypesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'merit_types'
      )
    `, [schemaName]);
    
    if (meritTypesCheck.rows[0].exists) {
      console.log('✅ merit_types table exists');
      
      const meritTypes = await client.query(
        `SELECT id, name, points FROM ${schemaName}.merit_types ORDER BY id LIMIT 10`
      );
      console.log(`   Merit types count: ${meritTypes.rows.length}`);
      meritTypes.rows.forEach(mt => {
        console.log(`     - ${mt.name}: ${mt.points} points`);
      });
    } else {
      console.log('❌ merit_types table MISSING');
    }
    
    // ISSUE 5: Check notification triggers
    console.log('\n--- ISSUE 5: Missing Admin Notifications for High-Severity Events ---');
    console.log('   Checking notification creation in incidents route...');
    console.log('   (This requires code inspection - will be fixed in code)');
    
    // Check if there are any admins in the school
    const adminsCheck = await client.query(`
      SELECT COUNT(*) as admin_count
      FROM public.users u
      JOIN public.user_schools us ON u.id = us.user_id
      WHERE us.school_id = $1 AND u.role = 'admin' AND u.is_active = true
    `, [school.id]);
    console.log(`   Active admins in school: ${adminsCheck.rows[0].admin_count}`);
    
    console.log('\n=== INVESTIGATION COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

investigateIssues();
