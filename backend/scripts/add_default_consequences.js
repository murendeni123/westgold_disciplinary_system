require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function addDefaultConsequences() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Adding default consequences...\n');
    
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY schema_name'
    );
    
    const defaultConsequences = [
      {
        name: 'Verbal Warning',
        description: 'A verbal warning given to the student for minor infractions',
        severity: 'low',
        default_duration: '1 day'
      },
      {
        name: 'Written Warning',
        description: 'A formal written warning documented in the student record',
        severity: 'medium',
        default_duration: '1 week'
      },
      {
        name: 'Suspension',
        description: 'Temporary removal from school for serious infractions',
        severity: 'high',
        default_duration: '3 days'
      }
    ];
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`📁 Processing schema: ${schemaName}`);
      
      for (const consequence of defaultConsequences) {
        // Check if this consequence already exists
        const existingResult = await client.query(
          `SELECT id FROM ${schemaName}.consequences WHERE LOWER(name) = LOWER($1)`,
          [consequence.name]
        );
        
        if (existingResult.rows.length > 0) {
          console.log(`   ⚠️  "${consequence.name}" already exists, skipping...`);
          continue;
        }
        
        // Insert the consequence
        await client.query(`
          INSERT INTO ${schemaName}.consequences 
          (name, description, severity, default_duration, is_active)
          VALUES ($1, $2, $3, $4, 1)
        `, [
          consequence.name,
          consequence.description,
          consequence.severity,
          consequence.default_duration
        ]);
        
        console.log(`   ✅ Created: ${consequence.name}`);
      }
      console.log('');
    }
    
    console.log('✅ Default consequences added!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addDefaultConsequences();
