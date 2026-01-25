require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkConsequences() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Checking consequences in database...\n');
    
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY schema_name'
    );
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`\n📁 Schema: ${schemaName}`);
      console.log('─'.repeat(50));
      
      // Check consequences table
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.consequences WHERE is_active = true`
      );
      
      const count = parseInt(countResult.rows[0].count);
      console.log(`Active consequences: ${count}`);
      
      if (count > 0) {
        const consequencesResult = await client.query(`
          SELECT id, name, consequence_type, severity
          FROM ${schemaName}.consequences
          WHERE is_active = true
          ORDER BY severity, name
        `);
        
        console.log('\nConsequences:');
        consequencesResult.rows.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.name} (${c.consequence_type}) - Severity: ${c.severity}`);
        });
      } else {
        console.log('⚠️  No active consequences found - need to create default ones');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkConsequences();
