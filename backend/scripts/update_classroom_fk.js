const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateClassroomForeignKey() {
  const client = await pool.connect();
  
  try {
    console.log('Updating classroom_id foreign key in class_timetables...');
    
    // Get all school schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'school_%'
    `);
    
    const schemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`Found ${schemas.length} school schemas:`, schemas);
    
    for (const schema of schemas) {
      console.log(`\nProcessing schema: ${schema}`);
      
      // Drop the old foreign key constraint to classrooms
      try {
        await client.query(`
          ALTER TABLE ${schema}.class_timetables
          DROP CONSTRAINT IF EXISTS class_timetables_classroom_id_fkey
        `);
        console.log(`  ✓ Dropped old classroom_id foreign key constraint`);
      } catch (err) {
        console.log(`  ⚠ Could not drop constraint:`, err.message);
      }
      
      // Add new foreign key constraint to classes table
      try {
        await client.query(`
          ALTER TABLE ${schema}.class_timetables
          ADD CONSTRAINT class_timetables_classroom_id_fkey
          FOREIGN KEY (classroom_id) 
          REFERENCES ${schema}.classes(id) 
          ON DELETE SET NULL
        `);
        console.log(`  ✓ Added new foreign key constraint to classes table`);
      } catch (err) {
        console.log(`  ⚠ Could not add constraint:`, err.message);
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

updateClassroomForeignKey().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
