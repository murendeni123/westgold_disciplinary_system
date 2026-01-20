/**
 * Quick script to check subjects in database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false
});

async function checkSubjects() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking subjects in school_default schema...\n');

        await client.query('SET search_path TO school_default, public');
        
        // Check if table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'school_default' 
                AND table_name = 'subjects'
            )
        `);
        
        console.log('Table exists:', tableCheck.rows[0].exists);
        
        if (!tableCheck.rows[0].exists) {
            console.log('❌ Subjects table does not exist in school_default schema');
            return;
        }

        // Get all subjects
        const allSubjects = await client.query('SELECT id, code, name, is_active FROM subjects ORDER BY code');
        console.log(`\n📊 Total subjects: ${allSubjects.rows.length}`);
        
        if (allSubjects.rows.length > 0) {
            console.log('\nAll subjects:');
            allSubjects.rows.forEach(s => {
                console.log(`  ${s.code} - ${s.name} (active: ${s.is_active})`);
            });
        }
        
        // Get active subjects
        const activeSubjects = await client.query('SELECT id, code, name FROM subjects WHERE is_active = true ORDER BY code');
        console.log(`\n✅ Active subjects: ${activeSubjects.rows.length}`);
        
        if (activeSubjects.rows.length > 0) {
            activeSubjects.rows.forEach(s => {
                console.log(`  ${s.code} - ${s.name}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSubjects()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
