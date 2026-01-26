/**
 * Check for duplicate user accounts
 * Usage: node scripts/check_user_accounts.js <email>
 */

require('dotenv').config();
const { pool } = require('../database/db');

async function checkAccounts() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Usage: node scripts/check_user_accounts.js <email>');
        process.exit(1);
    }

    const client = await pool.connect();
    try {
        console.log(`\n🔍 Checking for accounts with email: ${email}\n`);
        
        // Check public.users
        const users = await client.query(
            'SELECT id, email, name, role, created_at, updated_at FROM public.users WHERE email = $1',
            [email.toLowerCase()]
        );

        console.log(`Found ${users.rows.length} account(s) in public.users:`);
        users.rows.forEach((user, index) => {
            console.log(`\n${index + 1}. User ID: ${user.id}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Updated: ${user.updated_at}`);
        });

        // Check platform_users
        try {
            const platformUsers = await client.query(
                'SELECT id, email, name, created_at FROM public.platform_users WHERE email = $1',
                [email.toLowerCase()]
            );

            if (platformUsers.rows.length > 0) {
                console.log(`\nFound ${platformUsers.rows.length} account(s) in platform_users:`);
                platformUsers.rows.forEach((user, index) => {
                    console.log(`\n${index + 1}. Platform User ID: ${user.id}`);
                    console.log(`   Name: ${user.name}`);
                    console.log(`   Created: ${user.created_at}`);
                });
            }
        } catch (e) {
            console.log('\nNo platform_users table or no platform accounts found');
        }

        if (users.rows.length === 0) {
            console.log('\n❌ No accounts found with this email');
        } else if (users.rows.length > 1) {
            console.log('\n⚠️  WARNING: Multiple accounts found with the same email!');
            console.log('   This could cause authentication issues.');
        }

    } finally {
        client.release();
        process.exit(0);
    }
}

checkAccounts();
