require('dotenv').config();
const { dbAll } = require('./database/db');

async function showUsers() {
    const users = await dbAll(`
        SELECT u.id, u.email, u.role, u.school_id, s.name as school_name 
        FROM users u 
        LEFT JOIN schools s ON u.school_id = s.id 
        WHERE u.role = 'admin'
        ORDER BY u.id
    `);
    
    console.log('\n=== Admin Users and Their Schools ===\n');
    console.table(users);
    
    console.log('\nWhen you log in with:');
    users.forEach(u => {
        console.log(`  - ${u.email} → You see data for: ${u.school_name || 'ALL schools (no filter)'}`);
    });
    
    process.exit(0);
}

showUsers();
