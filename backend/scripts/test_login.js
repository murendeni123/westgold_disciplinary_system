/**
 * Test login functionality
 * Usage: node scripts/test_login.js <email> <password>
 */

require('dotenv').config();
const { dbGet } = require('../database/db');
const { verifyPassword } = require('../middleware/auth');

async function testLogin() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('❌ Usage: node scripts/test_login.js <email> <password>');
        process.exit(1);
    }

    console.log('\n🔍 Testing Login Flow\n');
    console.log(`Email: ${email}`);
    console.log(`Password length: ${password.length} characters`);
    
    // Check password length
    if (password.length < 6) {
        console.error('❌ VALIDATION FAILED: Password must be at least 6 characters');
        console.error('   The validateLogin middleware will reject this before it reaches the login endpoint');
        process.exit(1);
    }
    console.log('✅ Password length validation passed');

    try {
        // Check if user exists
        console.log('\n🔍 Looking up user...');
        const user = await dbGet(
            'SELECT id, email, name, role, password_hash FROM public.users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (!user) {
            console.error('❌ User not found');
            console.error('   Login will return: "Invalid credentials"');
            process.exit(1);
        }

        console.log(`✅ User found: ${user.name} (${user.role})`);

        // Test password verification
        console.log('\n🔐 Testing password verification...');
        const isValid = await verifyPassword(password, user.password_hash);

        if (isValid) {
            console.log('✅ PASSWORD MATCHES!');
            console.log('\n✅ Login should succeed');
            console.log(`   User will be logged in as: ${user.role}`);
        } else {
            console.log('❌ PASSWORD DOES NOT MATCH');
            console.log('\n❌ Login will fail with: "Invalid credentials"');
            console.log('\nPossible reasons:');
            console.log('1. Wrong password');
            console.log('2. Password was stored with HTML escaping (old bug)');
            console.log('3. Password hash is corrupted');
        }
        
        process.exit(isValid ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testLogin();
