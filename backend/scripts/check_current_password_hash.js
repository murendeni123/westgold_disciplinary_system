/**
 * Check the current password hash for a user
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false
});

async function checkPasswordHash() {
    const client = await pool.connect();
    try {
        console.log('Connected to PostgreSQL database\n');

        const email = 'admin@school.com';
        
        const result = await client.query(
            'SELECT id, email, password_hash, updated_at FROM public.users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('User not found');
            return;
        }

        const user = result.rows[0];
        console.log('User found:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Updated:', user.updated_at);
        console.log('  Password hash:', user.password_hash);
        console.log('  Hash length:', user.password_hash.length);
        console.log('\nTesting passwords:\n');

        // Test passwords
        const testPasswords = [
            'admin123',
            'Admin123',
            'Admin123456',
            'NewPassword123'
        ];

        for (const pwd of testPasswords) {
            const matches = await bcrypt.compare(pwd, user.password_hash);
            console.log(`  "${pwd}": ${matches ? '✅ MATCHES' : '❌ no match'}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkPasswordHash();
