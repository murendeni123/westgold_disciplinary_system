const { pool } = require('./database/db');

async function checkTeacherPassword() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking teacher passwords in database...\n');
        
        // Get all teachers with their user info
        const teachers = await client.query(`
            SELECT u.id, u.email, u.name, u.password, u.role, t.id as teacher_id
            FROM public.users u
            LEFT JOIN school_lear_1291.teachers t ON u.id = t.user_id
            WHERE u.role = 'teacher'
            ORDER BY u.id
        `);
        
        console.log(`Found ${teachers.rows.length} teacher users:\n`);
        
        teachers.rows.forEach((teacher, idx) => {
            console.log(`Teacher ${idx + 1}:`);
            console.log(`   User ID: ${teacher.id}`);
            console.log(`   Email: ${teacher.email}`);
            console.log(`   Name: ${teacher.name}`);
            console.log(`   Teacher ID: ${teacher.teacher_id || 'NOT LINKED'}`);
            console.log(`   Password type: ${typeof teacher.password}`);
            console.log(`   Password value: ${JSON.stringify(teacher.password).substring(0, 100)}`);
            
            // Check if password is a bcrypt hash (should start with $2a$, $2b$, or $2y$)
            if (typeof teacher.password === 'string') {
                const isBcrypt = teacher.password.startsWith('$2a$') || 
                                teacher.password.startsWith('$2b$') || 
                                teacher.password.startsWith('$2y$');
                console.log(`   Is valid bcrypt hash: ${isBcrypt ? '✅ YES' : '❌ NO'}`);
            } else {
                console.log(`   ❌ ERROR: Password is not a string!`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

checkTeacherPassword()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
