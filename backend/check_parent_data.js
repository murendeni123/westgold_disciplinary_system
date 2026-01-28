const { Pool } = require('pg');
require('dotenv').config();

/**
 * Check parent data in database and how it's linked to students
 */

async function checkParentData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking Parent Data Across All Schemas\n');

    // Get all schools
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    for (const school of schoolsResult.rows) {
      console.log(`\n📍 School: ${school.name} (${school.schema_name})`);

      // Check if parents table exists
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'parents'
      `, [school.schema_name]);

      if (tableCheck.rows.length === 0) {
        console.log('  ❌ No parents table in this schema');
        continue;
      }

      // Get parents table structure
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'parents'
        ORDER BY ordinal_position
      `, [school.schema_name]);

      console.log('\n  📋 Parents Table Columns:');
      columnsResult.rows.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`);
      });

      // Get all parents
      const parentsResult = await pool.query(`
        SELECT * FROM ${school.schema_name}.parents ORDER BY id
      `);

      console.log(`\n  👨‍👩‍👧‍👦 Total Parents: ${parentsResult.rows.length}`);
      
      if (parentsResult.rows.length > 0) {
        console.log('\n  Parent Records:');
        parentsResult.rows.forEach((parent, index) => {
          console.log(`\n  ${index + 1}. Parent ID: ${parent.id}`);
          Object.keys(parent).forEach(key => {
            if (key !== 'id' && parent[key] !== null) {
              console.log(`     ${key}: ${parent[key]}`);
            }
          });
        });
      }

      // Check students table structure for parent linking
      const studentColumnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'students'
        AND column_name LIKE '%parent%'
        ORDER BY ordinal_position
      `, [school.schema_name]);

      console.log('\n  📋 Student Parent-Related Columns:');
      studentColumnsResult.rows.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`);
      });

      // Get students with parent links
      const studentsWithParentsResult = await pool.query(`
        SELECT id, first_name, last_name, parent_id, secondary_parent_id, parent_link_code
        FROM ${school.schema_name}.students 
        WHERE parent_id IS NOT NULL OR secondary_parent_id IS NOT NULL
        ORDER BY id
      `);

      console.log(`\n  👨‍🎓 Students with Parent Links: ${studentsWithParentsResult.rows.length}`);
      
      if (studentsWithParentsResult.rows.length > 0) {
        studentsWithParentsResult.rows.forEach(student => {
          console.log(`    - ${student.first_name} ${student.last_name}: parent_id=${student.parent_id}, secondary_parent_id=${student.secondary_parent_id}`);
        });
      }

      // Check public.users table for parent users
      const parentUsersResult = await pool.query(`
        SELECT u.id, u.name, u.email, u.role, u.school_id
        FROM public.users u
        WHERE u.role = 'parent' AND u.school_id = $1
        ORDER BY u.id
      `, [school.id]);

      console.log(`\n  👤 Parent Users (public.users): ${parentUsersResult.rows.length}`);
      
      if (parentUsersResult.rows.length > 0) {
        parentUsersResult.rows.forEach(user => {
          console.log(`    - ${user.name} (${user.email}): user_id=${user.id}`);
        });
      }

      // Try to join students with parents
      try {
        const joinResult = await pool.query(`
          SELECT 
            s.id as student_id,
            s.first_name,
            s.last_name,
            s.parent_id,
            s.secondary_parent_id,
            p1.id as primary_parent_db_id,
            p2.id as secondary_parent_db_id
          FROM ${school.schema_name}.students s
          LEFT JOIN ${school.schema_name}.parents p1 ON s.parent_id = p1.id
          LEFT JOIN ${school.schema_name}.parents p2 ON s.secondary_parent_id = p2.id
          WHERE s.parent_id IS NOT NULL OR s.secondary_parent_id IS NOT NULL
          ORDER BY s.id
        `);

        console.log(`\n  🔗 Student-Parent Join Results: ${joinResult.rows.length}`);
        if (joinResult.rows.length > 0) {
          joinResult.rows.forEach(row => {
            console.log(`    - ${row.first_name} ${row.last_name}:`);
            console.log(`      parent_id: ${row.parent_id} → ${row.primary_parent_db_id ? 'Found' : 'NOT FOUND'}`);
            console.log(`      secondary_parent_id: ${row.secondary_parent_id} → ${row.secondary_parent_db_id ? 'Found' : 'NOT FOUND'}`);
          });
        }
      } catch (error) {
        console.log(`\n  ⚠️  Error joining students with parents: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkParentData().catch(console.error);
}

module.exports = { checkParentData };
