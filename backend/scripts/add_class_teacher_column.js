const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addClassTeacherColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding class_teacher_of column to teachers tables in all schemas...');
    
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
      
      // Check if column already exists
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'teachers' 
        AND column_name = 'class_teacher_of'
      `, [schema]);
      
      if (columnCheck.rows.length > 0) {
        console.log(`  ✓ Column already exists in ${schema}.teachers`);
        continue;
      }
      
      // Add the column
      await client.query(`
        ALTER TABLE ${schema}.teachers 
        ADD COLUMN class_teacher_of INTEGER
      `);
      console.log(`  ✓ Added class_teacher_of column to ${schema}.teachers`);
      
      // Add foreign key constraint
      try {
        await client.query(`
          ALTER TABLE ${schema}.teachers
          ADD CONSTRAINT fk_teachers_class_teacher_of_${schema.replace('school_', '')}
          FOREIGN KEY (class_teacher_of) 
          REFERENCES ${schema}.classes(id) 
          ON DELETE SET NULL
        `);
        console.log(`  ✓ Added foreign key constraint`);
      } catch (err) {
        console.log(`  ⚠ Foreign key constraint may already exist:`, err.message);
      }
      
      // Add index
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_teachers_class_teacher_of 
          ON ${schema}.teachers(class_teacher_of)
        `);
        console.log(`  ✓ Added index`);
      } catch (err) {
        console.log(`  ⚠ Index may already exist:`, err.message);
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

addClassTeacherColumn().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
