const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
    rejectUnauthorized: false
  } : false
});

async function checkUserSchools() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking user and school associations...\n');
    
    // Check if admin@school.com exists
    const user = await client.query(
      'SELECT id, email, name, role, primary_school_id, is_active FROM public.users WHERE email = $1',
      ['admin@school.com']
    );
    
    if (user.rows.length === 0) {
      console.log('❌ User admin@school.com not found in public.users table');
      console.log('\n📋 Available users:');
      const allUsers = await client.query('SELECT id, email, name, role, primary_school_id FROM public.users LIMIT 10');
      console.table(allUsers.rows);
    } else {
      console.log('✅ User found:');
      console.table(user.rows);
      
      const userId = user.rows[0].id;
      const primarySchoolId = user.rows[0].primary_school_id;
      
      // Check user_schools associations
      console.log('\n📚 User-School associations:');
      const userSchools = await client.query(`
        SELECT us.*, s.name as school_name, s.code, s.schema_name, s.status
        FROM public.user_schools us
        JOIN public.schools s ON us.school_id = s.id
        WHERE us.user_id = $1
      `, [userId]);
      
      if (userSchools.rows.length === 0) {
        console.log('❌ No user_schools associations found');
      } else {
        console.table(userSchools.rows);
      }
      
      // Check primary school
      if (primarySchoolId) {
        console.log('\n🏫 Primary school:');
        const primarySchool = await client.query(
          'SELECT * FROM public.schools WHERE id = $1',
          [primarySchoolId]
        );
        console.table(primarySchool.rows);
        
        // Check if schema exists and has data
        const schemaName = primarySchool.rows[0]?.schema_name;
        if (schemaName) {
          console.log(`\n📊 Checking data in schema: ${schemaName}`);
          
          try {
            const studentCount = await client.query(`SELECT COUNT(*) FROM ${schemaName}.students`);
            const classCount = await client.query(`SELECT COUNT(*) FROM ${schemaName}.classes`);
            const teacherCount = await client.query(`SELECT COUNT(*) FROM ${schemaName}.teachers`);
            
            console.log(`  Students: ${studentCount.rows[0].count}`);
            console.log(`  Classes: ${classCount.rows[0].count}`);
            console.log(`  Teachers: ${teacherCount.rows[0].count}`);
          } catch (err) {
            console.log(`  ❌ Error accessing schema: ${err.message}`);
          }
        }
      } else {
        console.log('\n⚠️  No primary_school_id set for user');
      }
    }
    
    // List all schools
    console.log('\n🏫 All schools in database:');
    const allSchools = await client.query('SELECT id, name, code, schema_name, status FROM public.schools');
    console.table(allSchools.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserSchools();
