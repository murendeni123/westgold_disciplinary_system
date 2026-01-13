require('dotenv').config();
const { dbAll, dbGet } = require('./database/db');

async function testDatabase() {
    try {
        console.log('Testing database connection and data...\n');
        
        // Check schools
        const schools = await dbAll('SELECT id, name FROM schools LIMIT 5');
        console.log('Schools:', schools.length, 'found');
        if (schools.length > 0) console.log('  Sample:', schools[0]);
        
        // Check users
        const users = await dbAll('SELECT id, name, email, role, school_id FROM users LIMIT 5');
        console.log('\nUsers:', users.length, 'found');
        if (users.length > 0) console.log('  Sample:', users[0]);
        
        // Check students
        const students = await dbAll('SELECT id, first_name, last_name, school_id FROM students LIMIT 5');
        console.log('\nStudents:', students.length, 'found');
        if (students.length > 0) console.log('  Sample:', students[0]);
        
        // Check incidents
        const incidents = await dbAll('SELECT id, student_id, incident_type, school_id FROM behaviour_incidents LIMIT 5');
        console.log('\nIncidents:', incidents.length, 'found');
        if (incidents.length > 0) console.log('  Sample:', incidents[0]);
        
        // Check classes
        const classes = await dbAll('SELECT id, name, school_id FROM classes LIMIT 5');
        console.log('\nClasses:', classes.length, 'found');
        if (classes.length > 0) console.log('  Sample:', classes[0]);
        
        console.log('\n--- Database test complete ---');
    } catch (error) {
        console.error('Error:', error.message);
    }
    process.exit(0);
}

testDatabase();
