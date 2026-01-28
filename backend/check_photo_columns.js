const { Pool } = require('pg');
require('dotenv').config();

/**
 * Check if photo_path columns exist in students and teachers tables
 */

async function checkPhotoColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking photo_path Columns in All Schemas\n');

    // Get all schools
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    for (const school of schoolsResult.rows) {
      console.log(`\n📍 School: ${school.name} (${school.schema_name})`);

      // Check students table columns
      const studentColumnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'students'
        ORDER BY ordinal_position
      `, [school.schema_name]);

      const hasStudentPhotoPath = studentColumnsResult.rows.some(col => col.column_name === 'photo_path');
      console.log(`  Students table: ${hasStudentPhotoPath ? '✅' : '❌'} photo_path column`);
      
      if (!hasStudentPhotoPath) {
        console.log(`    Available columns: ${studentColumnsResult.rows.map(c => c.column_name).join(', ')}`);
      }

      // Check teachers table columns
      const teacherColumnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'teachers'
        ORDER BY ordinal_position
      `, [school.schema_name]);

      const hasTeacherPhotoPath = teacherColumnsResult.rows.some(col => col.column_name === 'photo_path');
      console.log(`  Teachers table: ${hasTeacherPhotoPath ? '✅' : '❌'} photo_path column`);
      
      if (!hasTeacherPhotoPath) {
        console.log(`    Available columns: ${teacherColumnsResult.rows.map(c => c.column_name).join(', ')}`);
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
  checkPhotoColumns().catch(console.error);
}

module.exports = { checkPhotoColumns };
