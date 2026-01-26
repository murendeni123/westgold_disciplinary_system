/**
 * Check if a password matches the stored hash
 * Usage: node scripts/check_password_hash.js <email> <password_to_test>
 */

require('dotenv').config();
const { dbGet } = require('../database/db');
const { verifyPassword } = require('../middleware/auth');

async function checkPassword() {
    const email = process.argv[2];
    const passwordToTest = process.argv[3];

    if (!email || !passwordToTest) {
        console.error('❌ Usage: node scripts/check_password_hash.js <email> <password_to_test>');
        process.exit(1);
    }

    try {
        console.log(`🔍 Looking for user: ${email}`);
        
        const user = await dbGet(
            'SELECT id, email, name, role, password_hash FROM public.users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name} (${user.role})`);
        console.log(`\n🔐 Testing password: "${passwordToTest}"`);

        const isValid = await verifyPassword(passwordToTest, user.password_hash);

        if (isValid) {
            console.log(`✅ Password matches!`);
        } else {
            console.log(`❌ Password does NOT match`);
            console.log(`\nThis could mean:`);
            console.log(`1. The password is incorrect`);
            console.log(`2. The password was stored with HTML escaping (old bug)`);
            console.log(`\nTry testing with HTML-escaped version if password contains: < > & " '`);
        }
        
        process.exit(isValid ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkPassword();
