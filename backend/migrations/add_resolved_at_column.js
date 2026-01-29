const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addResolvedAtColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding resolved_at column to behaviour_incidents tables...\n');

    // Get all school schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM public.schools
    `);

    const schemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`Found ${schemas.length} active school schemas\n`);

    for (const schema of schemas) {
      console.log(`Processing schema: ${schema}`);
      
      try {
        // Add resolved_at column
        await client.query(`
          ALTER TABLE ${schema}.behaviour_incidents 
          ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP
        `);
        console.log(`  ✅ Added resolved_at column to ${schema}.behaviour_incidents`);

        // Ensure status column exists with proper default
        await client.query(`
          ALTER TABLE ${schema}.behaviour_incidents 
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
        `);
        console.log(`  ✅ Ensured status column exists in ${schema}.behaviour_incidents`);

      } catch (err) {
        console.error(`  ❌ Error processing ${schema}:`, err.message);
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addResolvedAtColumn().catch(console.error);
