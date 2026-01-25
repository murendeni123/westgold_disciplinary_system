require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkStudents() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Checking students in database...\n');
    
    // Get all schemas
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY schema_name'
    );
    
    console.log(`Found ${schemasResult.rows.length} school schema(s):\n`);
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`\n📁 Schema: ${schemaName}`);
      console.log('─'.repeat(50));
      
      // Count active students
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.students WHERE is_active = true`
      );
      
      const count = parseInt(countResult.rows[0].count);
      console.log(`Active students: ${count}`);
      
      if (count > 0) {
        // Get sample students
        const studentsResult = await client.query(`
          SELECT s.id, s.student_id, s.first_name, s.last_name, c.class_name
          FROM ${schemaName}.students s
          LEFT JOIN ${schemaName}.classes c ON s.class_id = c.id
          WHERE s.is_active = true
          ORDER BY s.last_name, s.first_name
          LIMIT 5
        `);
        
        console.log('\nSample students:');
        studentsResult.rows.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.first_name} ${s.last_name} (${s.student_id}) - Class: ${s.class_name || 'N/A'}`);
        });
      } else {
        console.log('⚠️  No active students found in this schema');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStudents();
