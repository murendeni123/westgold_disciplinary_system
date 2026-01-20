/**
 * Migration Script: Cleanup Duplicate Time Slots
 * 
 * Removes duplicate periods that were created when the system was day-specific.
 * Now that periods apply to all weekdays, we only need one set per template.
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

async function cleanupDuplicates() {
    const client = await pool.connect();
    
    try {
        console.log('🧹 Starting duplicate time slots cleanup...\n');

        // Get all school schemas
        const schemasResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
            ORDER BY schema_name
        `);

        const schemas = schemasResult.rows.map(row => row.schema_name);
        console.log(`Found ${schemas.length} school schema(s):\n`, schemas.join(', '), '\n');

        if (schemas.length === 0) {
            console.log('⚠️  No school schemas found.');
            return;
        }

        // Read the cleanup SQL
        const cleanupSQL = fs.readFileSync(
            path.join(__dirname, 'cleanup_duplicate_periods.sql'),
            'utf8'
        );

        // Run cleanup for each schema
        for (const schema of schemas) {
            console.log(`\n📋 Cleaning schema: ${schema}`);
            
            try {
                // Set search path
                await client.query(`SET search_path TO ${schema}, public`);
                
                // Check if time_slots table exists
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = $1 
                        AND table_name = 'time_slots'
                    )
                `, [schema]);

                if (!tableCheck.rows[0].exists) {
                    console.log(`  ⏭️  Skipping ${schema} - time_slots table does not exist`);
                    continue;
                }

                // Count before cleanup
                const beforeCount = await client.query(`
                    SELECT COUNT(*) as count FROM time_slots
                `);
                console.log(`  📊 Before: ${beforeCount.rows[0].count} time slots`);

                // Execute cleanup
                const deleteResult = await client.query(`
                    DELETE FROM time_slots
                    WHERE id NOT IN (
                        SELECT MIN(id)
                        FROM time_slots
                        GROUP BY template_id, period_number
                    )
                `);
                
                console.log(`  🗑️  Deleted ${deleteResult.rowCount} duplicate slots`);
                
                // Count after cleanup
                const afterCount = await client.query(`
                    SELECT COUNT(*) as count FROM time_slots
                `);
                console.log(`  📊 After: ${afterCount.rows[0].count} time slots`);
                
                // Show summary per template
                const summary = await client.query(`
                    SELECT 
                        template_id,
                        COUNT(*) as total_periods
                    FROM time_slots
                    GROUP BY template_id
                `);
                
                if (summary.rows.length > 0) {
                    console.log(`  ✅ Templates now have unique periods:`);
                    summary.rows.forEach(row => {
                        console.log(`     Template ${row.template_id}: ${row.total_periods} periods`);
                    });
                }
                
            } catch (error) {
                console.error(`  ❌ Error cleaning ${schema}:`, error.message);
            }
        }

        console.log('\n✅ Duplicate cleanup completed!\n');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the cleanup
cleanupDuplicates()
    .then(() => {
        console.log('Cleanup script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Cleanup script failed:', error);
        process.exit(1);
    });
