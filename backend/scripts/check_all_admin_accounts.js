/**
 * Check all admin accounts across both tables
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false
});

async function checkAllAdminAccounts() {
    const client = await pool.connect();
    try {
        console.log('Connected to PostgreSQL database\n');

        // Check public.users
        console.log('=== Checking public.users ===');
        const regularUsers = await client.query(
            `SELECT id, email, name, role, created_at, updated_at 
             FROM public.users 
             WHERE email = $1`,
            ['admin@school.com']
        );

        if (regularUsers.rows.length > 0) {
            console.log(`Found ${regularUsers.rows.length} account(s) in public.users:\n`);
            regularUsers.rows.forEach((user, index) => {
                console.log(`${index + 1}. User ID: ${user.id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.created_at}`);
                console.log(`   Updated: ${user.updated_at}\n`);
            });
        } else {
            console.log('No accounts found in public.users\n');
        }

        // Check public.platform_users
        console.log('=== Checking public.platform_users ===');
        try {
            const platformUsers = await client.query(
                `SELECT id, email, name, is_active, created_at, updated_at, last_login 
                 FROM public.platform_users 
                 WHERE email = $1`,
                ['admin@school.com']
            );

            if (platformUsers.rows.length > 0) {
                console.log(`Found ${platformUsers.rows.length} account(s) in public.platform_users:\n`);
                platformUsers.rows.forEach((user, index) => {
                    console.log(`${index + 1}. User ID: ${user.id}`);
                    console.log(`   Email: ${user.email}`);
                    console.log(`   Name: ${user.name}`);
                    console.log(`   Active: ${user.is_active}`);
                    console.log(`   Created: ${user.created_at}`);
                    console.log(`   Updated: ${user.updated_at}`);
                    console.log(`   Last Login: ${user.last_login}\n`);
                });
            } else {
                console.log('No accounts found in public.platform_users\n');
            }
        } catch (err) {
            console.log('platform_users table does not exist or error:', err.message, '\n');
        }

        console.log('=== Summary ===');
        console.log('If you see accounts in BOTH tables, login checks platform_users FIRST.');
        console.log('The emergency reset only updated public.users.');
        console.log('You need to update the platform_users account as well.\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAllAdminAccounts();
