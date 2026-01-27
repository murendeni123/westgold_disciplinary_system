/**
 * Reset a user's password
 * Usage: node scripts/reset_user_password.js <email> <new_password>
 */

require('dotenv').config();
const { dbGet, dbRun } = require('../database/db');
const { hashPassword } = require('../middleware/auth');

async function resetPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
        console.error('❌ Usage: node scripts/reset_user_password.js <email> <new_password>');
        process.exit(1);
    }

    if (newPassword.length < 6) {
        console.error('❌ Password must be at least 6 characters long');
        process.exit(1);
    }

    try {
        console.log(`🔍 Looking for user: ${email}`);
        
        const user = await dbGet(
            'SELECT id, email, name, role FROM public.users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name} (${user.role})`);
        console.log(`🔐 Hashing new password...`);

        const hashedPassword = await hashPassword(newPassword);

        console.log(`💾 Updating password in database...`);

        await dbRun(
            'UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, user.id]
        );

        console.log(`✅ Password reset successfully!`);
        console.log(`\nYou can now login with:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${newPassword}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

resetPassword();
