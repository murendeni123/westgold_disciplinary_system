const { Pool } = require('pg');
require('dotenv').config();

/**
 * Check parent 'bongs' data in default school schema
 */

async function checkBongsParent() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking Parent "bongs" in Default School\n');

    // Find user 'bongs' in public.users
    const userResult = await pool.query(`
      SELECT id, name, email, role, school_id, created_at, auth_provider
      FROM public.users 
      WHERE LOWER(name) LIKE '%bongs%' OR LOWER(email) LIKE '%bongs%'
      ORDER BY id
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No user found with name or email containing "bongs"');
      return;
    }

    console.log(`Found ${userResult.rows.length} user(s) matching "bongs":\n`);
    
    for (const user of userResult.rows) {
      console.log(`👤 User ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   School ID: ${user.school_id}`);
      console.log(`   Auth Provider: ${user.auth_provider || 'local'}`);
      console.log(`   Created: ${user.created_at}`);

      // Get school info
      if (user.school_id) {
        const schoolResult = await pool.query(`
          SELECT id, name, schema_name 
          FROM public.schools 
          WHERE id = $1
        `, [user.school_id]);

        if (schoolResult.rows.length > 0) {
          const school = schoolResult.rows[0];
          console.log(`   School: ${school.name} (${school.schema_name})`);

          // Check if parent record exists in schema.parents
          const parentResult = await pool.query(`
            SELECT * FROM ${school.schema_name}.parents 
            WHERE user_id = $1
          `, [user.id]);

          if (parentResult.rows.length > 0) {
            console.log(`\n   ✅ Parent record found in ${school.schema_name}.parents:`);
            const parent = parentResult.rows[0];
            console.log(`      Parent ID: ${parent.id}`);
            console.log(`      Phone: ${parent.phone || 'NULL'}`);
            console.log(`      Work Phone: ${parent.work_phone || 'NULL'}`);
            console.log(`      Relationship: ${parent.relationship_to_child || 'NULL'}`);
            console.log(`      Emergency Contact 1: ${parent.emergency_contact_1_name || 'NULL'} (${parent.emergency_contact_1_phone || 'NULL'})`);
            console.log(`      Emergency Contact 2: ${parent.emergency_contact_2_name || 'NULL'} (${parent.emergency_contact_2_phone || 'NULL'})`);
            console.log(`      Address: ${parent.home_address || 'NULL'}`);
            console.log(`      City: ${parent.city || 'NULL'}`);
            console.log(`      Postal Code: ${parent.postal_code || 'NULL'}`);
            console.log(`      Created: ${parent.created_at}`);
            console.log(`      Updated: ${parent.updated_at || 'NULL'}`);
          } else {
            console.log(`\n   ❌ NO parent record found in ${school.schema_name}.parents`);
            console.log(`      This means profile data was never saved to the schema.parents table`);
          }

          // Check if this parent has linked children
          const childrenResult = await pool.query(`
            SELECT id, first_name, last_name, student_id, class_id
            FROM ${school.schema_name}.students
            WHERE parent_id = $1
          `, [user.id]);

          if (childrenResult.rows.length > 0) {
            console.log(`\n   👨‍👩‍👧‍👦 Linked Children (${childrenResult.rows.length}):`);
            childrenResult.rows.forEach(child => {
              console.log(`      - ${child.first_name} ${child.last_name} (ID: ${child.id}, Student ID: ${child.student_id})`);
            });
          } else {
            console.log(`\n   ⚠️  No children linked to this parent`);
          }
        }
      } else {
        console.log(`   ⚠️  No school_id assigned to this user`);
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkBongsParent().catch(console.error);
}

module.exports = { checkBongsParent };
