/**
 * Test Supabase Connection Script
 * 
 * Run this script to verify your Supabase configuration is correct.
 * 
 * Usage: node scripts/testSupabaseConnection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('='.repeat(60));
console.log('SUPABASE CONNECTION TEST');
console.log('='.repeat(60));

// Check environment variables
const checks = {
  DATABASE_URL: !!process.env.DATABASE_URL,
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
};

console.log('\n📋 Environment Variables:');
Object.entries(checks).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const masked = value ? '***configured***' : 'NOT SET';
  console.log(`  ${status} ${key}: ${masked}`);
});

// Test Supabase connection
async function testConnection() {
  console.log('\n🔌 Testing Supabase Connection...\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Cannot test - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    return false;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(5);

    if (schoolsError) {
      console.log(`  ❌ Failed: ${schoolsError.message}`);
      
      // Check if it's a table not found error
      if (schoolsError.message.includes('does not exist')) {
        console.log('  ℹ️  The "schools" table does not exist. You may need to run migrations.');
      }
    } else {
      console.log(`  ✅ Success! Found ${schools?.length || 0} schools`);
      if (schools && schools.length > 0) {
        schools.forEach(s => console.log(`     - ${s.name} (ID: ${s.id})`));
      }
    }

    // Test 2: Check tables exist
    console.log('\nTest 2: Check Core Tables');
    const tables = ['schools', 'users', 'students', 'teachers', 'classes', 'behaviour_incidents', 'audit_logs'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: ${count ?? 0} records`);
      }
    }

    // Test 3: Write test (to audit_logs)
    console.log('\nTest 3: Write Test (audit_logs)');
    const { data: insertData, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        school_id: 1,
        action: 'CONNECTION_TEST',
        entity_type: 'system',
        description: 'Supabase connection test',
        metadata: { test: true, timestamp: new Date().toISOString() },
      })
      .select()
      .single();

    if (insertError) {
      console.log(`  ❌ Insert failed: ${insertError.message}`);
    } else {
      console.log(`  ✅ Insert success! ID: ${insertData.id}`);

      // Clean up test record
      await supabase.from('audit_logs').delete().eq('id', insertData.id);
      console.log(`  🧹 Cleaned up test record`);
    }

    // Test 4: Auth check
    console.log('\nTest 4: Auth Service');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`  ❌ Auth error: ${authError.message}`);
    } else {
      console.log(`  ✅ Auth service available`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUPABASE CONNECTION TEST COMPLETE');
    console.log('='.repeat(60));

    return true;
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    return false;
  }
}

// Test pg Pool connection (DATABASE_URL)
async function testPgConnection() {
  console.log('\n🔌 Testing PostgreSQL Pool Connection (DATABASE_URL)...\n');

  if (!process.env.DATABASE_URL) {
    console.log('❌ Cannot test - DATABASE_URL not set');
    return false;
  }

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db');
    console.log(`  ✅ Connected to: ${result.rows[0].db}`);
    console.log(`  ✅ Server time: ${result.rows[0].now}`);
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error(`  ❌ Connection failed: ${error.message}`);
    return false;
  }
}

// Run tests
async function main() {
  const pgResult = await testPgConnection();
  const supabaseResult = await testConnection();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`PostgreSQL Pool (DATABASE_URL): ${pgResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`Supabase JS Client: ${supabaseResult ? '✅ Working' : '❌ Failed'}`);

  if (pgResult && supabaseResult) {
    console.log('\n🎉 Both connections working! You can safely migrate to Supabase.');
    console.log('\nNext steps:');
    console.log('1. Set USE_SUPABASE=true in .env to switch to Supabase client');
    console.log('2. Test your application thoroughly');
    console.log('3. Freeze the old database once confirmed stable');
  } else if (pgResult && !supabaseResult) {
    console.log('\n⚠️  PostgreSQL working but Supabase client not configured.');
    console.log('Your app will continue to work with DATABASE_URL.');
    console.log('\nTo enable Supabase client:');
    console.log('1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('2. Run this test again');
  }

  process.exit(pgResult || supabaseResult ? 0 : 1);
}

main();
