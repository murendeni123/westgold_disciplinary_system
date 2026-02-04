const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAndPopulateConsequences() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking consequences in all schemas...\n');
    
    // Get all school schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'school_%' OR schema_name LIKE 'learskool_%'
      ORDER BY schema_name
    `);
    
    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`Found ${schemas.length} school schemas:`, schemas.join(', '), '\n');
    
    // Default consequences to populate
    const defaultConsequences = [
      {
        name: 'Verbal Warning',
        description: 'A verbal warning given to the student about their behavior',
        severity: 'low',
        default_duration: '1 day',
        is_active: 1
      },
      {
        name: 'Written Warning',
        description: 'A formal written warning that will be kept on record',
        severity: 'medium',
        default_duration: '1 week',
        is_active: 1
      },
      {
        name: 'Detention',
        description: 'Student must attend detention after school',
        severity: 'medium',
        default_duration: '1 hour',
        is_active: 1
      },
      {
        name: 'Suspension',
        description: 'Student is suspended from school',
        severity: 'high',
        default_duration: '3 days',
        is_active: 1
      },
      {
        name: 'Parent Meeting Required',
        description: 'A meeting with parents is required to discuss behavior',
        severity: 'medium',
        default_duration: '1 week',
        is_active: 1
      }
    ];
    
    for (const schema of schemas) {
      console.log(`\n📋 Checking schema: ${schema}`);
      
      // Check if consequences table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'consequences'
        );
      `, [schema]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`  ⚠️  consequences table does not exist in ${schema}`);
        continue;
      }
      
      // Check current consequences
      const currentConsequences = await client.query(`
        SELECT * FROM ${schema}.consequences ORDER BY id
      `);
      
      console.log(`  ✓ Found ${currentConsequences.rows.length} existing consequences`);
      
      if (currentConsequences.rows.length > 0) {
        console.log(`  📝 Existing consequences:`);
        currentConsequences.rows.forEach(c => {
          console.log(`     - ${c.name} (${c.severity}, active: ${c.is_active})`);
        });
      } else {
        console.log(`  ⚠️  No consequences found - populating with defaults...`);
        
        for (const consequence of defaultConsequences) {
          try {
            await client.query(`
              INSERT INTO ${schema}.consequences (name, description, severity, default_duration, is_active)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (name) DO NOTHING
            `, [consequence.name, consequence.description, consequence.severity, consequence.default_duration, consequence.is_active]);
            
            console.log(`     ✓ Added: ${consequence.name}`);
          } catch (err) {
            console.log(`     ✗ Failed to add ${consequence.name}: ${err.message}`);
          }
        }
        
        // Verify population
        const verifyResult = await client.query(`
          SELECT COUNT(*) as count FROM ${schema}.consequences
        `);
        console.log(`  ✓ Total consequences after population: ${verifyResult.rows[0].count}`);
      }
    }
    
    console.log('\n✅ Consequences check and population complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndPopulateConsequences();
