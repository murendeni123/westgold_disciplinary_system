require('dotenv').config();
const { dbAll } = require('./database/db');

async function checkData() {
    console.log('=== Database Data Check ===\n');
    
    // Check students by school_id
    const studentsBySchool = await dbAll(`
        SELECT school_id, COUNT(*) as count 
        FROM students 
        GROUP BY school_id
    `);
    console.log('Students by school_id:', studentsBySchool);
    
    // Check incidents by school_id
    const incidentsBySchool = await dbAll(`
        SELECT school_id, COUNT(*) as count 
        FROM behaviour_incidents 
        GROUP BY school_id
    `);
    console.log('Incidents by school_id:', incidentsBySchool);
    
    // Check schools
    const schools = await dbAll('SELECT id, name FROM schools');
    console.log('Schools:', schools);
    
    // Check if user admin@school.com can see any students
    console.log('\n--- Testing school_id = 1 (admin@school.com) ---');
    const studentsForSchool1 = await dbAll('SELECT id, first_name, last_name FROM students WHERE school_id = $1', [1]);
    console.log('Students for school_id=1:', studentsForSchool1.length, 'found');
    
    console.log('\n--- Testing school_id = 2 (admin1@gmail.com) ---');
    const studentsForSchool2 = await dbAll('SELECT id, first_name, last_name FROM students WHERE school_id = $1', [2]);
    console.log('Students for school_id=2:', studentsForSchool2.length, 'found');
    if (studentsForSchool2.length > 0) {
        console.log('Sample:', studentsForSchool2.slice(0, 3));
    }
    
    process.exit(0);
}

checkData();
