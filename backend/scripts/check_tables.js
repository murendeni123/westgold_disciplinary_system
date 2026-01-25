require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Checking tables in schema...\n');
    
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL LIMIT 1'
    );
    
    if (schemasResult.rows.length === 0) {
      console.log('No schemas found');
      return;
    }
    
    const schema = schemasResult.rows[0].schema_name;
    console.log(`Schema: ${schema}\n`);
    
    // Check for consequence/discipline related tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND (table_name LIKE '%consequence%' OR table_name LIKE '%discipline%')
      ORDER BY table_name
    `, [schema]);
    
    console.log('Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check discipline_rules table structure
    if (tablesResult.rows.some(r => r.table_name === 'discipline_rules')) {
      console.log('\n📋 discipline_rules columns:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'discipline_rules'
        ORDER BY ordinal_position
      `, [schema]);
      
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check if there are any records
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${schema}.discipline_rules`);
      console.log(`\nRecords in discipline_rules: ${countResult.rows[0].count}`);
      
      if (countResult.rows[0].count > 0) {
        const sampleResult = await client.query(`SELECT * FROM ${schema}.discipline_rules LIMIT 3`);
        console.log('\nSample records:');
        sampleResult.rows.forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.name} (${r.consequence_type})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
