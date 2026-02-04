const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Default consequences that should exist in every school schema
const DEFAULT_CONSEQUENCES = [
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
    name: 'Parent Meeting Required',
    description: 'A meeting with parents is required to discuss behavior',
    severity: 'medium',
    default_duration: '1 week',
    is_active: 1
  },
  {
    name: 'In-School Suspension',
    description: 'Student is suspended but remains on school premises under supervision',
    severity: 'high',
    default_duration: '1-3 days',
    is_active: 1
  },
  {
    name: 'Out-of-School Suspension',
    description: 'Student is suspended from school and must stay at home',
    severity: 'high',
    default_duration: '3-5 days',
    is_active: 1
  }
];

async function populateConsequences() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Populating consequences in all school schemas...\n');
    
    // Get all school schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'school_%' OR schema_name LIKE 'learskool_%'
      ORDER BY schema_name
    `);
    
    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`Found ${schemas.length} school schemas:`, schemas.join(', '), '\n');
    
    for (const schema of schemas) {
      console.log(`\n📋 Processing schema: ${schema}`);
      
      // Check if consequences table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'consequences'
        );
      `, [schema]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`  ⚠️  consequences table does not exist in ${schema} - skipping`);
        continue;
      }
      
      // Get current count
      const countResult = await client.query(`
        SELECT COUNT(*) as count FROM ${schema}.consequences
      `);
      const currentCount = parseInt(countResult.rows[0].count);
      
      console.log(`  📊 Current consequences: ${currentCount}`);
      
      // Populate default consequences
      let added = 0;
      let skipped = 0;
      
      for (const consequence of DEFAULT_CONSEQUENCES) {
        try {
          const result = await client.query(`
            INSERT INTO ${schema}.consequences (name, description, severity, default_duration, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
          `, [consequence.name, consequence.description, consequence.severity, consequence.default_duration, consequence.is_active]);
          
          if (result.rowCount > 0) {
            console.log(`     ✓ Added: ${consequence.name}`);
            added++;
          } else {
            console.log(`     - Skipped (exists): ${consequence.name}`);
            skipped++;
          }
        } catch (err) {
          console.log(`     ✗ Failed to add ${consequence.name}: ${err.message}`);
        }
      }
      
      // Verify final count
      const finalCountResult = await client.query(`
        SELECT COUNT(*) as count FROM ${schema}.consequences
      `);
      const finalCount = parseInt(finalCountResult.rows[0].count);
      
      console.log(`  ✅ Summary: ${added} added, ${skipped} skipped, ${finalCount} total`);
    }
    
    console.log('\n✅ Consequences population complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  populateConsequences()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { populateConsequences };
