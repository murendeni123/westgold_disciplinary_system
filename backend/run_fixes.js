const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runFixes() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== APPLYING FIXES FOR LEARSKOOL - WESTGOLD PRIMARY ===\n');
    
    // Get the schema name
    const schoolResult = await client.query(
      `SELECT id, name, schema_name FROM public.schools WHERE name ILIKE '%westgold%' OR name ILIKE '%learskool%'`
    );
    
    if (schoolResult.rows.length === 0) {
      console.log('❌ Could not find school');
      return;
    }
    
    const school = schoolResult.rows[0];
    const schemaName = school.schema_name;
    console.log(`✅ Found school: ${school.name}`);
    console.log(`   Schema: ${schemaName}\n`);
    
    // Read and execute SQL fixes
    const sqlFile = fs.readFileSync(path.join(__dirname, 'fix_all_5_issues.sql'), 'utf8');
    const sql = sqlFile.replace(/{SCHEMA_NAME}/g, schemaName);
    
    console.log('📝 Applying SQL fixes...');
    await client.query(sql);
    console.log('✅ SQL fixes applied successfully\n');
    
    // Verify fixes
    console.log('🔍 Verifying fixes...\n');
    
    // Check intervention strategies
    const strategiesCount = await client.query(
      `SELECT COUNT(*) as count FROM ${schemaName}.intervention_strategies`
    );
    console.log(`✅ Intervention strategies: ${strategiesCount.rows[0].count}`);
    
    // Check function exists
    const functionCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = $1 AND p.proname = 'get_suggested_strategies'
      )
    `, [schemaName]);
    console.log(`✅ get_suggested_strategies function: ${functionCheck.rows[0].exists ? 'EXISTS' : 'MISSING'}`);
    
    console.log('\n=== FIXES COMPLETE ===\n');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runFixes().catch(console.error);
