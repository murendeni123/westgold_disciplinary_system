const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Migration: Add photo_path columns to students and teachers tables in all school schemas
 * 
 * This migration ensures all schools can store profile images for students and teachers.
 * The photo_path column stores the relative path to the uploaded image file.
 */

async function addPhotoPathColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding photo_path Columns to All School Schemas\n');

    // Ensure uploads directories exist
    const uploadsDir = path.join(__dirname, '../uploads');
    const studentsDir = path.join(uploadsDir, 'students');
    const teachersDir = path.join(uploadsDir, 'teachers');

    [uploadsDir, studentsDir, teachersDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // Get all schools with schemas
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    console.log(`\nFound ${schoolsResult.rows.length} schools\n`);

    for (const school of schoolsResult.rows) {
      console.log(`📍 Processing: ${school.name} (${school.schema_name})`);

      // Check if students table has photo_path column
      const studentColumnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'students' AND column_name = 'photo_path'
      `, [school.schema_name]);

      if (studentColumnCheck.rows.length === 0) {
        console.log(`  Adding photo_path to students table...`);
        await pool.query(`
          ALTER TABLE ${school.schema_name}.students 
          ADD COLUMN IF NOT EXISTS photo_path TEXT
        `);
        console.log(`  ✅ Added photo_path column to students table`);
      } else {
        console.log(`  ℹ️  Students table already has photo_path column`);
      }

      // Check if teachers table has photo_path column
      const teacherColumnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'teachers' AND column_name = 'photo_path'
      `, [school.schema_name]);

      if (teacherColumnCheck.rows.length === 0) {
        console.log(`  Adding photo_path to teachers table...`);
        await pool.query(`
          ALTER TABLE ${school.schema_name}.teachers 
          ADD COLUMN IF NOT EXISTS photo_path TEXT
        `);
        console.log(`  ✅ Added photo_path column to teachers table`);
      } else {
        console.log(`  ℹ️  Teachers table already has photo_path column`);
      }

      console.log('');
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📁 Upload directories ready:');
    console.log(`  - ${studentsDir}`);
    console.log(`  - ${teachersDir}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addPhotoPathColumns()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { addPhotoPathColumns };
