const { Pool } = require('pg');
require('dotenv').config();

/**
 * Check detention rules in default school schema
 */

async function checkDetentionRules() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking Detention Rules in Default School Schema\n');

    // Get default school
    const schoolResult = await pool.query(
      "SELECT id, name, schema_name FROM public.schools WHERE schema_name = 'school_default' LIMIT 1"
    );

    if (schoolResult.rows.length === 0) {
      console.log('❌ No default school found');
      return;
    }

    const school = schoolResult.rows[0];
    console.log(`📍 School: ${school.name} (${school.schema_name})\n`);

    // Check if detention_rules table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = 'detention_rules'
    `, [school.schema_name]);

    if (tableCheck.rows.length === 0) {
      console.log('❌ detention_rules table does not exist in this schema');
      console.log('\nChecking for alternative tables...');
      
      const allTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        ORDER BY table_name
      `, [school.schema_name]);
      
      console.log('\nAvailable tables:');
      allTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
      return;
    }

    console.log('✅ detention_rules table exists\n');

    // Get table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'detention_rules'
      ORDER BY ordinal_position
    `, [school.schema_name]);

    console.log('📋 Table Structure:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Get existing rules
    const rulesResult = await pool.query(`
      SELECT * FROM ${school.schema_name}.detention_rules ORDER BY id
    `);

    console.log(`\n📊 Existing Detention Rules (${rulesResult.rows.length} found):\n`);
    
    if (rulesResult.rows.length === 0) {
      console.log('  No rules found in database');
    } else {
      rulesResult.rows.forEach((rule, index) => {
        console.log(`${index + 1}. Rule ID: ${rule.id}`);
        Object.keys(rule).forEach(key => {
          if (key !== 'id') {
            console.log(`   ${key}: ${rule[key]}`);
          }
        });
        console.log('');
      });
    }

    // Check all schools
    console.log('\n🏫 Checking all schools:');
    const allSchools = await pool.query(
      "SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id"
    );

    for (const sch of allSchools.rows) {
      const tableExists = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'detention_rules'
      `, [sch.schema_name]);

      const hasTable = tableExists.rows.length > 0;
      
      if (hasTable) {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${sch.schema_name}.detention_rules`);
        console.log(`  ✅ ${sch.name} (${sch.schema_name}): ${count.rows[0].count} rules`);
      } else {
        console.log(`  ❌ ${sch.name} (${sch.schema_name}): No detention_rules table`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDetentionRules().catch(console.error);
}

module.exports = { checkDetentionRules };
