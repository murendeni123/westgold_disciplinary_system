const { Pool } = require('pg');
require('dotenv').config();

/**
 * Migration: Allow NULL teacher_id in behaviour_incidents and merits tables
 * 
 * This allows admins to log incidents and award merits without having a teacher record.
 * Admin-created incidents/merits will have teacher_id = NULL.
 */

async function allowNullTeacherId() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Allowing NULL teacher_id in behaviour_incidents and merits tables\n');

    // Get all schools with schemas
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    console.log(`Found ${schoolsResult.rows.length} schools\n`);

    for (const school of schoolsResult.rows) {
      console.log(`📍 Processing: ${school.name} (${school.schema_name})`);

      // Check if behaviour_incidents table exists
      const behaviorTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'behaviour_incidents'
        )
      `, [school.schema_name]);

      if (behaviorTableExists.rows[0].exists) {
        console.log('  - Updating behaviour_incidents.teacher_id to allow NULL...');
        await pool.query(`
          ALTER TABLE ${school.schema_name}.behaviour_incidents 
          ALTER COLUMN teacher_id DROP NOT NULL
        `);
        console.log('    ✅ behaviour_incidents.teacher_id now allows NULL');
      } else {
        console.log('  ⚠️  behaviour_incidents table not found');
      }

      // Check if merits table exists
      const meritsTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'merits'
        )
      `, [school.schema_name]);

      if (meritsTableExists.rows[0].exists) {
        console.log('  - Updating merits.teacher_id to allow NULL...');
        await pool.query(`
          ALTER TABLE ${school.schema_name}.merits 
          ALTER COLUMN teacher_id DROP NOT NULL
        `);
        console.log('    ✅ merits.teacher_id now allows NULL');
      } else {
        console.log('  ⚠️  merits table not found');
      }

      console.log('');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('   Admins can now log incidents and award merits without teacher records.');

    // Verify the changes
    console.log('\n🔍 Verification:');
    for (const school of schoolsResult.rows) {
      const behaviorCheck = await pool.query(`
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'behaviour_incidents' 
        AND column_name = 'teacher_id'
      `, [school.schema_name]);

      const meritsCheck = await pool.query(`
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = 'merits' 
        AND column_name = 'teacher_id'
      `, [school.schema_name]);

      if (behaviorCheck.rows.length > 0) {
        console.log(`  ${school.name} - behaviour_incidents.teacher_id: ${behaviorCheck.rows[0].is_nullable === 'YES' ? '✅ NULL allowed' : '❌ NOT NULL'}`);
      }
      
      if (meritsCheck.rows.length > 0) {
        console.log(`  ${school.name} - merits.teacher_id: ${meritsCheck.rows[0].is_nullable === 'YES' ? '✅ NULL allowed' : '❌ NOT NULL'}`);
      }
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
  allowNullTeacherId()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { allowNullTeacherId };
