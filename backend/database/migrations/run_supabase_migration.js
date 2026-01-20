/**
 * Migration Script: Add Supabase Auth Support
 * 
 * Adds supabase_user_id, auth_provider, and last_sign_in columns to users table
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false
});

async function runSupabaseMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🔐 Starting Supabase authentication migration...\n');

        // Read the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'add_supabase_auth.sql'),
            'utf8'
        );

        // Run migration on public schema (users table is in public)
        console.log('📋 Running migration on public.users table...');
        
        await client.query('BEGIN');
        
        // Execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            console.log(`  Executing: ${statement.substring(0, 60)}...`);
            await client.query(statement);
        }
        
        await client.query('COMMIT');
        
        console.log('✅ Migration completed successfully!\n');
        
        // Verify the changes
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name IN ('supabase_user_id', 'auth_provider', 'last_sign_in')
            ORDER BY column_name
        `);
        
        console.log('📊 Verified columns added:');
        result.rows.forEach(row => {
            console.log(`  ✓ ${row.column_name} (${row.data_type})`);
        });
        
        console.log('\n✅ Supabase authentication support enabled!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runSupabaseMigration()
    .then(() => {
        console.log('Migration script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
