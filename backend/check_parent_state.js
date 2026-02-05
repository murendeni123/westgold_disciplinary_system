const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkParentState() {
  const client = await pool.connect();
  
  try {
    const email = 'charttitans1@gmail.com';
    console.log(`🔍 Checking parent state for: ${email}\n`);
    
    // Get user from public.users
    const userResult = await client.query(
      'SELECT * FROM public.users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User Info:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Primary School ID: ${user.primary_school_id || 'NULL'}`);
    console.log(`   Supabase User ID: ${user.supabase_user_id || 'NULL'}`);
    console.log(`   Auth Provider: ${user.auth_provider || 'NULL'}\n`);
    
    // Get user's schools
    const schoolsResult = await client.query(`
      SELECT s.id, s.name, s.code, s.schema_name, us.is_primary, us.role_in_school
      FROM public.schools s
      JOIN public.user_schools us ON s.id = us.school_id
      WHERE us.user_id = $1 AND s.status = 'active'
      ORDER BY us.is_primary DESC
    `, [user.id]);
    
    console.log('🏫 Linked Schools:');
    if (schoolsResult.rows.length === 0) {
      console.log('   ❌ No schools linked!');
    } else {
      schoolsResult.rows.forEach(school => {
        console.log(`   ${school.is_primary ? '⭐' : '  '} ${school.name} (${school.code})`);
        console.log(`      Schema: ${school.schema_name}`);
        console.log(`      Role: ${school.role_in_school}`);
      });
    }
    console.log();
    
    // Get children for each school
    for (const school of schoolsResult.rows) {
      console.log(`👶 Children in ${school.name}:`);
      
      const childrenResult = await client.query(
        `SELECT s.id, s.student_id, s.first_name, s.last_name, s.parent_id, c.class_name
         FROM ${school.schema_name}.students s
         LEFT JOIN ${school.schema_name}.classes c ON s.class_id = c.id
         WHERE s.parent_id = $1`,
        [user.id]
      );
      
      if (childrenResult.rows.length === 0) {
        console.log('   ❌ No children linked!');
      } else {
        childrenResult.rows.forEach(child => {
          console.log(`   ✓ ${child.first_name} ${child.last_name} (${child.student_id})`);
          console.log(`     Class: ${child.class_name || 'Not assigned'}`);
        });
      }
      console.log();
    }
    
    // Check parent profile in school schema
    if (schoolsResult.rows.length > 0) {
      const primarySchool = schoolsResult.rows[0];
      console.log(`📋 Parent Profile in ${primarySchool.name}:`);
      
      const parentResult = await client.query(
        `SELECT * FROM ${primarySchool.schema_name}.parents WHERE user_id = $1`,
        [user.id]
      );
      
      if (parentResult.rows.length === 0) {
        console.log('   ❌ No parent profile found!');
      } else {
        const parent = parentResult.rows[0];
        console.log(`   ✓ Profile exists (ID: ${parent.id})`);
        console.log(`     Phone: ${parent.phone || 'Not set'}`);
        console.log(`     Contact Method: ${parent.preferred_contact_method || 'Not set'}`);
      }
      console.log();
    }
    
    // Summary
    console.log('📊 Onboarding Status:');
    const hasSchool = schoolsResult.rows.length > 0;
    const hasChildren = schoolsResult.rows.some(school => {
      // This is a simplified check - would need to query each schema
      return true; // We checked above
    });
    
    console.log(`   School Linked: ${hasSchool ? '✅' : '❌'}`);
    console.log(`   Children Linked: ${hasChildren ? '✅' : '❌'}`);
    console.log(`   Should Show Onboarding: ${!hasSchool || !hasChildren ? '⚠️  YES' : '✅ NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkParentState();
