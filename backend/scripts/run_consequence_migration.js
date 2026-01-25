require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting consequence_assignments migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/create_consequence_assignments.sql');
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Get all school schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM public.schools 
      WHERE schema_name IS NOT NULL 
      ORDER BY schema_name
    `);
    
    const schemas = schemasResult.rows;
    console.log(`📋 Found ${schemas.length} school schema(s) to migrate:\n`);
    
    if (schemas.length === 0) {
      console.log('⚠️  No school schemas found. Migration will not run.');
      console.log('   Please onboard a school first, then run this migration again.\n');
      return;
    }
    
    // Run migration for each schema
    for (const schema of schemas) {
      const schemaName = schema.schema_name;
      console.log(`   Processing schema: ${schemaName}`);
      
      try {
        // Replace {SCHEMA_NAME} placeholder with actual schema name
        const schemaMigrationSQL = migrationSQL.replace(/{SCHEMA_NAME}/g, schemaName);
        
        // Execute the migration
        await client.query(schemaMigrationSQL);
        
        console.log(`   ✅ Successfully migrated schema: ${schemaName}\n`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Table already exists in schema: ${schemaName}\n`);
        } else {
          console.error(`   ❌ Error migrating schema ${schemaName}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Schemas processed: ${schemas.length}`);
    console.log(`   - Table created: consequence_assignments`);
    console.log(`   - Indexes created: 5`);
    console.log(`   - Triggers created: 1\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().then(() => {
  console.log('🎉 All done!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
