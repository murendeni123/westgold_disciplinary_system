/**
 * Fix subjects - set all to active
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false
});

async function fixSubjects() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing subjects in all school schemas...\n');

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
            console.log(`📋 Fixing schema: ${schema}`);
            
            await client.query(`SET search_path TO ${schema}, public`);
            
            // Check if subjects table exists
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = $1 
                    AND table_name = 'subjects'
                )
            `, [schema]);

            if (!tableCheck.rows[0].exists) {
                console.log(`  ⏭️  Skipping ${schema} - subjects table does not exist\n`);
                continue;
            }

            // Update all subjects to active
            const result = await client.query(`
                UPDATE subjects 
                SET is_active = true 
                WHERE is_active = false
                RETURNING code, name
            `);

            console.log(`  ✅ Activated ${result.rows.length} subjects`);
            if (result.rows.length > 0) {
                result.rows.forEach(s => {
                    console.log(`     ${s.code} - ${s.name}`);
                });
            }
            console.log('');
        }

        console.log('✅ All subjects activated!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixSubjects()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
