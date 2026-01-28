const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Check profile image paths in database and verify files exist
 */

async function checkProfileImages() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking Profile Images\n');

    // Get all schools
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    for (const school of schoolsResult.rows) {
      console.log(`\n📍 School: ${school.name} (${school.schema_name})`);

      // Check students with photos
      const studentsResult = await pool.query(`
        SELECT id, first_name, last_name, photo_path 
        FROM ${school.schema_name}.students 
        WHERE photo_path IS NOT NULL AND photo_path != ''
        ORDER BY id
      `);

      console.log(`\n👨‍🎓 Students with photos: ${studentsResult.rows.length}`);
      studentsResult.rows.forEach(student => {
        const fullPath = path.join(__dirname, student.photo_path);
        const exists = fs.existsSync(fullPath);
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${student.first_name} ${student.last_name}: ${student.photo_path}`);
        if (!exists) {
          console.log(`     File not found at: ${fullPath}`);
        }
      });

      // Check teachers with photos
      const teachersResult = await pool.query(`
        SELECT t.id, u.name, t.photo_path 
        FROM ${school.schema_name}.teachers t
        INNER JOIN public.users u ON t.user_id = u.id
        WHERE t.photo_path IS NOT NULL AND t.photo_path != ''
        ORDER BY t.id
      `);

      console.log(`\n👨‍🏫 Teachers with photos: ${teachersResult.rows.length}`);
      teachersResult.rows.forEach(teacher => {
        const fullPath = path.join(__dirname, teacher.photo_path);
        const exists = fs.existsSync(fullPath);
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${teacher.name}: ${teacher.photo_path}`);
        if (!exists) {
          console.log(`     File not found at: ${fullPath}`);
        }
      });
    }

    // Check uploads directory structure
    console.log('\n\n📁 Uploads Directory Structure:');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const checkDir = (dir, indent = '') => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            console.log(`${indent}📂 ${item}/`);
            checkDir(fullPath, indent + '  ');
          } else {
            const size = (stats.size / 1024).toFixed(2);
            console.log(`${indent}📄 ${item} (${size} KB)`);
          }
        });
      };
      
      checkDir(uploadsDir);
    } else {
      console.log('❌ Uploads directory does not exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkProfileImages().catch(console.error);
}

module.exports = { checkProfileImages };
