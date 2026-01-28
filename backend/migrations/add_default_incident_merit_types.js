const { Pool } = require('pg');
require('dotenv').config();

async function addDefaultTypes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding default incident types and merit types to all schools...\n');

    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL'
    );

    for (const school of schoolsResult.rows) {
      console.log(`\n📍 Processing: ${school.name} (${school.schema_name})`);
      
      try {
        // Check if incident_types table exists
        const incidentTableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'incident_types'
          )
        `, [school.schema_name]);

        if (incidentTableCheck.rows[0].exists) {
          // Check if table is empty or has very few entries
          const incidentCount = await pool.query(
            `SELECT COUNT(*) FROM ${school.schema_name}.incident_types`
          );
          
          if (incidentCount.rows[0].count < 5) {
            console.log('   📝 Adding default incident types...');
            
            const incidentTypes = [
              ['Late to Class', 'Student arrives late without valid excuse', 1, 'low'],
              ['Uniform Violation', 'Not wearing proper school uniform', 1, 'low'],
              ['Incomplete Homework', 'Failed to complete assigned homework', 1, 'low'],
              ['Talking in Class', 'Disrupting class with unnecessary talking', 1, 'low'],
              ['Out of Seat', 'Leaving seat without permission', 1, 'low'],
              ['Forgot Materials', 'Did not bring required books or materials', 1, 'low'],
              ['Littering', 'Throwing trash on school grounds', 2, 'low'],
              ['Running in Hallways', 'Running in corridors or hallways', 1, 'low'],
              ['Disrespectful Behavior', 'Showing disrespect to teachers or staff', 3, 'medium'],
              ['Disrupting Class', 'Significant disruption to learning environment', 3, 'medium'],
              ['Inappropriate Language', 'Using inappropriate or offensive language', 3, 'medium'],
              ['Defiance', 'Refusing to follow teacher instructions', 4, 'medium'],
              ['Cheating', 'Academic dishonesty or plagiarism', 5, 'medium'],
              ['Skipping Class', 'Absent from class without permission', 4, 'medium'],
              ['Inappropriate Use of Technology', 'Misusing phones, tablets, or computers', 3, 'medium'],
              ['Vandalism (Minor)', 'Minor damage to school property', 4, 'medium'],
              ['Bullying (Verbal)', 'Verbal harassment or intimidation', 5, 'medium'],
              ['Fighting', 'Physical altercation with another student', 8, 'high'],
              ['Bullying (Physical)', 'Physical harassment or assault', 10, 'high'],
              ['Theft', 'Stealing school or personal property', 7, 'high'],
              ['Vandalism (Major)', 'Significant damage to school property', 8, 'high'],
              ['Threatening Behavior', 'Threatening violence or harm to others', 9, 'high'],
              ['Possession of Prohibited Items', 'Bringing dangerous or prohibited items', 10, 'high'],
              ['Leaving School Grounds', 'Leaving campus without authorization', 6, 'high'],
              ['Serious Defiance', 'Severe insubordination or defiance', 7, 'high'],
              ['Harassment', 'Serious harassment based on protected characteristics', 9, 'high'],
              ['Substance Violation', 'Possession or use of prohibited substances', 10, 'high']
            ];
            
            for (const [name, description, points, severity] of incidentTypes) {
              try {
                await pool.query(
                  `INSERT INTO ${school.schema_name}.incident_types (name, description, points, severity, is_active)
                   VALUES ($1, $2, $3, $4, true)`,
                  [name, description, points, severity]
                );
              } catch (err) {
                // Skip if already exists
                if (!err.message.includes('duplicate') && !err.message.includes('unique')) {
                  throw err;
                }
              }
            }
            
            const newIncidentCount = await pool.query(
              `SELECT COUNT(*) FROM ${school.schema_name}.incident_types`
            );
            console.log(`      ✅ Incident types: ${newIncidentCount.rows[0].count}`);
          } else {
            console.log(`      ✅ Incident types already configured: ${incidentCount.rows[0].count}`);
          }
        }

        // Check if merit_types table exists
        const meritTableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'merit_types'
          )
        `, [school.schema_name]);

        if (meritTableCheck.rows[0].exists) {
          // Check if table is empty or has very few entries
          const meritCount = await pool.query(
            `SELECT COUNT(*) FROM ${school.schema_name}.merit_types`
          );
          
          if (meritCount.rows[0].count < 5) {
            console.log('   📝 Adding default merit types...');
            
            const meritTypes = [
              ['Excellent Test Score', 'Scored 90% or above on a test', 2],
              ['Perfect Attendance', 'Full week of perfect attendance', 2],
              ['Homework Excellence', 'Consistently excellent homework quality', 1],
              ['Academic Improvement', 'Significant improvement in grades', 2],
              ['Class Participation', 'Outstanding participation in class', 1],
              ['Project Excellence', 'Exceptional work on class project', 3],
              ['Helping Others', 'Helping classmates or teachers', 2],
              ['Good Citizenship', 'Demonstrating excellent citizenship', 2],
              ['Respectful Behavior', 'Showing exceptional respect and courtesy', 1],
              ['Leadership', 'Demonstrating leadership qualities', 2],
              ['Kindness', 'Acts of kindness towards others', 2],
              ['Responsibility', 'Taking responsibility for actions', 1],
              ['Punctuality', 'Consistently on time for class', 1],
              ['Student of the Week', 'Selected as student of the week', 5],
              ['Outstanding Achievement', 'Exceptional achievement in any area', 4],
              ['Community Service', 'Contributing to school or community', 3],
              ['Sportsmanship', 'Excellent sportsmanship in activities', 3],
              ['Creative Excellence', 'Outstanding creative work or performance', 3],
              ['Problem Solving', 'Exceptional problem-solving skills', 3],
              ['Peer Mentoring', 'Helping and mentoring other students', 4]
            ];
            
            for (const [name, description, points] of meritTypes) {
              try {
                await pool.query(
                  `INSERT INTO ${school.schema_name}.merit_types (name, description, points, is_active)
                   VALUES ($1, $2, $3, true)`,
                  [name, description, points]
                );
              } catch (err) {
                // Skip if already exists
                if (!err.message.includes('duplicate') && !err.message.includes('unique')) {
                  throw err;
                }
              }
            }
            
            const newMeritCount = await pool.query(
              `SELECT COUNT(*) FROM ${school.schema_name}.merit_types`
            );
            console.log(`      ✅ Merit types: ${newMeritCount.rows[0].count}`);
          } else {
            console.log(`      ✅ Merit types already configured: ${meritCount.rows[0].count}`);
          }
        }

        console.log(`   ✅ Completed for ${school.name}`);

      } catch (error) {
        console.error(`   ❌ Error for ${school.name}:`, error.message);
      }
    }

    console.log('\n✅ All default types added!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addDefaultTypes().catch(console.error);
}

module.exports = { addDefaultTypes };
