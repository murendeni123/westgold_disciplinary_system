require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkIncidents() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Checking behaviour incidents...\n');
    
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY schema_name'
    );
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`\n📁 Schema: ${schemaName}`);
      console.log('─'.repeat(70));
      
      // Check behaviour_incidents table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'behaviour_incidents'
        ORDER BY ordinal_position
      `, [schemaName]);
      
      console.log('\n📋 Table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check total incidents
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.behaviour_incidents`
      );
      console.log(`\n📈 Total incidents: ${countResult.rows[0].count}`);
      
      // Check incidents by status
      const statusResult = await client.query(`
        SELECT status, COUNT(*) as count 
        FROM ${schemaName}.behaviour_incidents 
        GROUP BY status
        ORDER BY count DESC
      `);
      
      if (statusResult.rows.length > 0) {
        console.log('\n📊 Incidents by status:');
        statusResult.rows.forEach(row => {
          console.log(`  - ${row.status || 'NULL'}: ${row.count}`);
        });
      }
      
      // Get recent incidents with student info
      const recentResult = await client.query(`
        SELECT 
          bi.id,
          bi.student_id,
          s.first_name || ' ' || s.last_name as student_name,
          bi.incident_type_id,
          bi.points_deducted,
          bi.status,
          bi.date,
          bi.teacher_id
        FROM ${schemaName}.behaviour_incidents bi
        LEFT JOIN ${schemaName}.students s ON bi.student_id = s.id
        ORDER BY bi.date DESC, bi.id DESC
        LIMIT 5
      `);
      
      if (recentResult.rows.length > 0) {
        console.log('\n📝 Recent incidents:');
        recentResult.rows.forEach((inc, i) => {
          console.log(`\n  ${i + 1}. Student: ${inc.student_name || 'Unknown'} (ID: ${inc.student_id})`);
          console.log(`     Incident Type ID: ${inc.incident_type_id}`);
          console.log(`     Points Deducted: ${inc.points_deducted}`);
          console.log(`     Status: ${inc.status || 'NULL'}`);
          console.log(`     Date: ${inc.date}`);
          console.log(`     Teacher ID: ${inc.teacher_id}`);
        });
      } else {
        console.log('\n⚠️  No incidents found');
      }
      
      // Check students with points >= 10
      const qualifyingResult = await client.query(`
        SELECT 
          s.id,
          s.first_name || ' ' || s.last_name as student_name,
          COALESCE(SUM(bi.points_deducted), 0) as total_points,
          COUNT(bi.id) as incident_count
        FROM ${schemaName}.students s
        LEFT JOIN ${schemaName}.behaviour_incidents bi ON s.id = bi.student_id
          AND bi.status != 'resolved'
        WHERE s.is_active = true
        GROUP BY s.id, s.first_name, s.last_name
        HAVING COALESCE(SUM(bi.points_deducted), 0) >= 10
        ORDER BY COALESCE(SUM(bi.points_deducted), 0) DESC
      `);
      
      console.log(`\n🎯 Students qualifying for detention (≥10 points): ${qualifyingResult.rows.length}`);
      if (qualifyingResult.rows.length > 0) {
        qualifyingResult.rows.forEach((student, i) => {
          console.log(`  ${i + 1}. ${student.student_name}: ${student.total_points} points (${student.incident_count} incidents)`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkIncidents();
