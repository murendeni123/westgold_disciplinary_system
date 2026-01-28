const { Pool } = require('pg');
require('dotenv').config();

/**
 * Migration: Fix parent school_id and primary_school_id based on their linked children
 * 
 * This migration ensures all parents have proper school associations so their
 * profile data can be saved to the correct schema.parents table.
 */

async function fixParentSchoolIds() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing Parent School IDs\n');

    // Get all schools with schemas
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    console.log(`Found ${schoolsResult.rows.length} schools\n`);

    let totalParentsFixed = 0;

    for (const school of schoolsResult.rows) {
      console.log(`📍 Processing: ${school.name} (${school.schema_name})`);

      // Find parents who have children in this school but don't have school_id set
      const parentsToFixResult = await pool.query(`
        SELECT DISTINCT s.parent_id, u.name, u.email, u.school_id, u.primary_school_id
        FROM ${school.schema_name}.students s
        INNER JOIN public.users u ON s.parent_id = u.id
        WHERE u.role = 'parent' 
          AND s.parent_id IS NOT NULL
          AND (u.school_id IS NULL OR u.primary_school_id IS NULL)
        ORDER BY s.parent_id
      `);

      if (parentsToFixResult.rows.length > 0) {
        console.log(`  Found ${parentsToFixResult.rows.length} parents to fix:`);

        for (const parent of parentsToFixResult.rows) {
          console.log(`    - ${parent.name} (${parent.email})`);
          console.log(`      Current school_id: ${parent.school_id || 'NULL'}`);
          console.log(`      Current primary_school_id: ${parent.primary_school_id || 'NULL'}`);

          // Update school_id and primary_school_id
          await pool.query(`
            UPDATE public.users 
            SET school_id = COALESCE(school_id, $1),
                primary_school_id = COALESCE(primary_school_id, $1)
            WHERE id = $2
          `, [school.id, parent.parent_id]);

          console.log(`      ✅ Updated to school_id: ${school.id}, primary_school_id: ${school.id}`);
          totalParentsFixed++;
        }
      } else {
        console.log(`  ℹ️  All parents in this school already have school_id set`);
      }

      console.log('');
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Total parents fixed: ${totalParentsFixed}`);

    // Verify the fix
    console.log('\n🔍 Verification:');
    const orphanedParentsResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.school_id, u.primary_school_id
      FROM public.users u
      WHERE u.role = 'parent' 
        AND (u.school_id IS NULL OR u.primary_school_id IS NULL)
      ORDER BY u.id
    `);

    if (orphanedParentsResult.rows.length > 0) {
      console.log(`   ⚠️  ${orphanedParentsResult.rows.length} parents still without school_id:`);
      orphanedParentsResult.rows.forEach(parent => {
        console.log(`      - ${parent.name} (${parent.email}) - ID: ${parent.id}`);
      });
    } else {
      console.log(`   ✅ All parents now have school_id and primary_school_id set`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixParentSchoolIds()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { fixParentSchoolIds };
