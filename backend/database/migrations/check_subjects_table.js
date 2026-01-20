/**
 * Check which schemas have the subjects table
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false
});

async function checkSubjectsTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking subjects table in all school schemas...\n');

        // Get all school schemas
        const schemasResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
            ORDER BY schema_name
        `);

        const schemas = schemasResult.rows.map(row => row.schema_name);
        console.log(`Found ${schemas.length} school schema(s)\n`);

        for (const schema of schemas) {
            console.log(`📋 Checking schema: ${schema}`);
            
            // Check if subjects table exists
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = $1 
                    AND table_name = 'subjects'
                )
            `, [schema]);

            if (tableCheck.rows[0].exists) {
                // Count subjects
                await client.query(`SET search_path TO ${schema}, public`);
                const countResult = await client.query('SELECT COUNT(*) as count FROM subjects');
                console.log(`  ✅ Table exists with ${countResult.rows[0].count} subjects`);
            } else {
                console.log(`  ❌ Table does NOT exist`);
            }
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSubjectsTables()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
