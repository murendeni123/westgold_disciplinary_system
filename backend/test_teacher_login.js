const { pool } = require('./database/db');
const bcrypt = require('bcryptjs');

async function testTeacherLogin() {
    const client = await pool.connect();
    
    try {
        // Test with one of the imported teachers
        const testEmail = 'jolened08@gmail.com'; // One from the list
        const testPassword = 'teacher123'; // Default password we set
        
        console.log('🔍 Testing teacher login...\n');
        console.log(`Email: ${testEmail}`);
        console.log(`Password: ${testPassword}\n`);
        
        // Get user from database
        const user = await client.query(
            'SELECT * FROM public.users WHERE email = $1',
            [testEmail.toLowerCase()]
        );
        
        if (user.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }
        
        const userData = user.rows[0];
        console.log('✅ User found:');
        console.log(`   ID: ${userData.id}`);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Active: ${userData.is_active}`);
        console.log(`   Password column name: ${userData.password ? 'password' : userData.password_hash ? 'password_hash' : 'UNKNOWN'}`);
        
        // Get the actual password value
        const storedPassword = userData.password || userData.password_hash;
        console.log(`\n   Stored password type: ${typeof storedPassword}`);
        console.log(`   Stored password starts with: ${storedPassword ? storedPassword.substring(0, 10) : 'NULL'}`);
        
        // Try to verify password
        console.log('\n🔐 Verifying password...');
        try {
            const isValid = await bcrypt.compare(testPassword, storedPassword);
            console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
            
            if (!isValid) {
                console.log('\n💡 Trying to hash the test password and compare:');
                const hashedTest = await bcrypt.hash(testPassword, 10);
                console.log(`   Test password hashed: ${hashedTest.substring(0, 30)}...`);
                console.log(`   Stored password:      ${storedPassword.substring(0, 30)}...`);
                console.log('\n   These should be different (bcrypt generates unique hashes)');
                console.log('   But bcrypt.compare should still work if password is correct');
            }
        } catch (err) {
            console.log(`   ❌ ERROR: ${err.message}`);
            console.log('\n   This is the same error you\'re seeing in login!');
            console.log(`   Error type: ${err.constructor.name}`);
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

testTeacherLogin()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
