require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkStructure() {
  const client = await pool.connect();
  
  try {
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL LIMIT 1'
    );
    
    const schema = schemasResult.rows[0].schema_name;
    console.log(`📋 Checking 'consequences' table structure in ${schema}:\n`);
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'consequences'
      ORDER BY ordinal_position
    `, [schema]);
    
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Get sample data
    const sampleResult = await client.query(`SELECT * FROM ${schema}.consequences LIMIT 3`);
    console.log(`\nSample records (${sampleResult.rows.length}):`);
    sampleResult.rows.forEach((r, i) => {
      console.log(`\n${i + 1}.`, JSON.stringify(r, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure();
