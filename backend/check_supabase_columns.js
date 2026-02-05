const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSupabaseColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking public.users table for Supabase columns...\n');
    
    // Get column information
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name IN ('supabase_user_id', 'auth_provider', 'last_sign_in')
      ORDER BY column_name
    `);
    
    console.log('Found columns:');
    if (result.rows.length === 0) {
      console.log('  ❌ No Supabase columns found!\n');
      console.log('Required columns missing:');
      console.log('  - supabase_user_id TEXT UNIQUE');
      console.log('  - auth_provider TEXT');
      console.log('  - last_sign_in TIMESTAMP\n');
      console.log('Run this migration to add them:');
      console.log('  node backend/migrations/add_supabase_columns.js');
    } else {
      result.rows.forEach(col => {
        console.log(`  ✓ ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      if (result.rows.length < 3) {
        console.log('\n⚠️  Some columns are missing!');
        const found = result.rows.map(r => r.column_name);
        const required = ['supabase_user_id', 'auth_provider', 'last_sign_in'];
        const missing = required.filter(col => !found.includes(col));
        console.log('Missing columns:', missing.join(', '));
      } else {
        console.log('\n✅ All Supabase columns exist!');
      }
    }
    
    // Check if there are any users with supabase_user_id
    const userCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.users 
      WHERE supabase_user_id IS NOT NULL
    `);
    
    console.log(`\n📊 Users with Supabase auth: ${userCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSupabaseColumns();
