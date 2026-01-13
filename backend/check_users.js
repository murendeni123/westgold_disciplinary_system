require('dotenv').config();
const { dbAll } = require('./database/db');

async function checkUsers() {
    const users = await dbAll('SELECT id, email, role, school_id FROM users WHERE role = $1 LIMIT 3', ['admin']);
    console.log('Admin users:', users);
    
    const allUsers = await dbAll('SELECT id, email, role, school_id FROM users LIMIT 10');
    console.log('\nAll users:', allUsers);
    process.exit(0);
}

checkUsers();
