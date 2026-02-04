const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkConsequencesSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking consequences table schema in all school schemas...\n');
    
    // Get all school schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'school_%' OR schema_name LIKE 'learskool_%'
      ORDER BY schema_name
    `);
    
    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`Found ${schemas.length} school schemas\n`);
    
    for (const schema of schemas) {
      console.log(`\n📋 Schema: ${schema}`);
      
      // Check if consequences table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'consequences'
        );
      `, [schema]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`  ⚠️  consequences table does not exist`);
        continue;
      }
      
      // Get column types for is_active
      const columnInfo = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 
        AND table_name = 'consequences'
        AND column_name = 'is_active'
      `, [schema]);
      
      if (columnInfo.rows.length > 0) {
        const col = columnInfo.rows[0];
        console.log(`  ✓ is_active column type: ${col.data_type}`);
        console.log(`    Default: ${col.column_default}`);
        
        if (col.data_type === 'integer') {
          console.log(`  ⚠️  WARNING: is_active is INTEGER, should be BOOLEAN`);
        }
      } else {
        console.log(`  ⚠️  is_active column not found`);
      }
      
      // Check row count
      const countResult = await client.query(`
        SELECT COUNT(*) as count FROM ${schema}.consequences
      `);
      console.log(`  📊 Total consequences: ${countResult.rows[0].count}`);
    }
    
    console.log('\n✅ Schema check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkConsequencesSchema();
