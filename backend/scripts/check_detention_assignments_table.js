require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkTable() {
  const client = await pool.connect();
  
  try {
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL LIMIT 1'
    );
    
    const schema = schemasResult.rows[0].schema_name;
    console.log(`📋 detention_assignments table structure in ${schema}:\n`);
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'detention_assignments'
      ORDER BY ordinal_position
    `, [schema]);
    
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
