/**
 * Migration Script: Refactor Time Slots - Remove Day-Specific Scheduling
 * 
 * This script updates the time_slots table structure across all school schemas
 * to remove day_of_week and make periods apply to all weekdays by default.
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

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting time slots refactor migration...\n');

        // Get all school schemas
        const schemasResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
            ORDER BY schema_name
        `);

        const schemas = schemasResult.rows.map(row => row.schema_name);
        console.log(`Found ${schemas.length} school schema(s) to migrate:\n`, schemas.join(', '), '\n');

        if (schemas.length === 0) {
            console.log('⚠️  No school schemas found. Migration not needed.');
            return;
        }

        // Read the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'refactor_time_slots_remove_day.sql'),
            'utf8'
        );

        // Run migration for each schema
        for (const schema of schemas) {
            console.log(`\n📋 Migrating schema: ${schema}`);
            
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

                // Execute migration
                await client.query(migrationSQL);
                
                console.log(`  ✅ Successfully migrated ${schema}`);
                
                // Verify the changes
                const columnsResult = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = $1 
                    AND table_name = 'time_slots'
                    ORDER BY ordinal_position
                `, [schema]);
                
                console.log(`  📊 Updated columns:`, columnsResult.rows.map(r => r.column_name).join(', '));
                
            } catch (error) {
                console.error(`  ❌ Error migrating ${schema}:`, error.message);
                // Continue with other schemas
            }
        }

        console.log('\n✅ Time slots refactor migration completed!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('Migration script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
