const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database');
    
    const migrationFile = process.argv[2] || 'add_import_history.sql';
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', migrationFile),
      'utf8'
    );
    console.log(`Running migration: ${migrationFile}`);
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
