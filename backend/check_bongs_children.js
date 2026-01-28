const { Pool } = require('pg');
require('dotenv').config();

/**
 * Check which students are linked to bongs parent
 */

async function checkBongsChildren() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking Students Linked to "bongs" Parent\n');

    // Get default school info
    const schoolResult = await pool.query(`
      SELECT id, name, schema_name 
      FROM public.schools 
      WHERE schema_name = 'school_default'
    `);

    if (schoolResult.rows.length === 0) {
      console.log('❌ Default school not found');
      return;
    }

    const school = schoolResult.rows[0];
    console.log(`School: ${school.name} (${school.schema_name})\n`);

    // Check students linked to bongs (user_id 63 or 109)
    const studentsResult = await pool.query(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, s.parent_id, 
             c.class_name, u.name as parent_name, u.email as parent_email
      FROM ${school.schema_name}.students s
      LEFT JOIN ${school.schema_name}.classes c ON s.class_id = c.id
      LEFT JOIN public.users u ON s.parent_id = u.id
      WHERE s.parent_id IN (63, 109)
      ORDER BY s.id
    `);

    console.log(`Students linked to bongs: ${studentsResult.rows.length}\n`);

    if (studentsResult.rows.length > 0) {
      studentsResult.rows.forEach(student => {
        console.log(`👨‍🎓 Student: ${student.first_name} ${student.last_name}`);
        console.log(`   Student ID: ${student.student_id}`);
        console.log(`   Class: ${student.class_name || 'Not assigned'}`);
        console.log(`   Parent ID: ${student.parent_id}`);
        console.log(`   Parent Name: ${student.parent_name}`);
        console.log(`   Parent Email: ${student.parent_email}`);
        console.log('');
      });

      // Now check the parent users
      const parentResult = await pool.query(`
        SELECT id, name, email, school_id, auth_provider
        FROM public.users
        WHERE id IN (63, 109)
      `);

      console.log('\n📋 Parent User Details:\n');
      parentResult.rows.forEach(parent => {
        console.log(`👤 ${parent.name} (${parent.email})`);
        console.log(`   User ID: ${parent.id}`);
        console.log(`   School ID: ${parent.school_id || 'NULL ❌'}`);
        console.log(`   Auth Provider: ${parent.auth_provider || 'local'}`);
        console.log('');
      });

      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   Parents have school_id = NULL');
      console.log('   This prevents profile data from being saved to schema.parents');
      console.log('   Need to update school_id to:', school.id);
    } else {
      console.log('No students found linked to bongs parent');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkBongsChildren().catch(console.error);
}

module.exports = { checkBongsChildren };
