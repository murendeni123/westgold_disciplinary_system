require('dotenv').config();
const { dbRun, dbAll } = require('./database/db');

async function fixSchoolIds() {
    console.log('=== Fixing NULL school_id values ===\n');
    
    // Default school_id to assign (use 1 for "Default School" or 2 for "west gold")
    const defaultSchoolId = 2; // Change this if needed
    
    // Update students with NULL school_id
    const studentsResult = await dbRun(
        'UPDATE students SET school_id = $1 WHERE school_id IS NULL',
        [defaultSchoolId]
    );
    console.log(`Updated ${studentsResult.changes} students with school_id = ${defaultSchoolId}`);
    
    // Update behaviour_incidents with NULL school_id
    const incidentsResult = await dbRun(
        'UPDATE behaviour_incidents SET school_id = $1 WHERE school_id IS NULL',
        [defaultSchoolId]
    );
    console.log(`Updated ${incidentsResult.changes} incidents with school_id = ${defaultSchoolId}`);
    
    // Update classes with NULL school_id
    const classesResult = await dbRun(
        'UPDATE classes SET school_id = $1 WHERE school_id IS NULL',
        [defaultSchoolId]
    );
    console.log(`Updated ${classesResult.changes} classes with school_id = ${defaultSchoolId}`);
    
    // Update merits with NULL school_id
    const meritsResult = await dbRun(
        'UPDATE merits SET school_id = $1 WHERE school_id IS NULL',
        [defaultSchoolId]
    );
    console.log(`Updated ${meritsResult.changes} merits with school_id = ${defaultSchoolId}`);
    
    // Update detentions with NULL school_id
    const detentionsResult = await dbRun(
        'UPDATE detentions SET school_id = $1 WHERE school_id IS NULL',
        [defaultSchoolId]
    );
    console.log(`Updated ${detentionsResult.changes} detentions with school_id = ${defaultSchoolId}`);
    
    // Verify the fix
    console.log('\n=== Verification ===');
    const studentsBySchool = await dbAll(`
        SELECT school_id, COUNT(*) as count 
        FROM students 
        GROUP BY school_id
    `);
    console.log('Students by school_id:', studentsBySchool);
    
    const incidentsBySchool = await dbAll(`
        SELECT school_id, COUNT(*) as count 
        FROM behaviour_incidents 
        GROUP BY school_id
    `);
    console.log('Incidents by school_id:', incidentsBySchool);
    
    console.log('\nDone! Now log in with admin1@gmail.com to see all data for school_id=2');
    process.exit(0);
}

fixSchoolIds();
