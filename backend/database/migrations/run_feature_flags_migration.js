const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
    rejectUnauthorized: false
  } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running feature flags migration...');
    
    // First, create the platform schema if it doesn't exist
    console.log('Creating platform schema if not exists...');
    await client.query('CREATE SCHEMA IF NOT EXISTS platform');
    console.log('✅ Platform schema ready');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'create_feature_flags.sql'),
      'utf8'
    );
    
    await client.query(sql);
    
    console.log('✅ Feature flags table created successfully');
    console.log('✅ Default feature flags created for all schools');
    console.log('✅ Trigger created for automatic feature flag creation');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
