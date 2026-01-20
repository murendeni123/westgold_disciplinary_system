/**
 * Migration Script: Remove NOT NULL constraint from day_of_week column
 * 
 * Makes day_of_week and cycle_day nullable across all school schemas
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

async function removeConstraints() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Removing NOT NULL constraints from time_slots table...\n');

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

        // Read the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'remove_day_of_week_constraint.sql'),
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

                // Check if day_of_week column exists
                const columnCheck = await client.query(`
                    SELECT column_name, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_schema = $1 
                    AND table_name = 'time_slots'
                    AND column_name IN ('day_of_week', 'cycle_day')
                `, [schema]);

                if (columnCheck.rows.length === 0) {
                    console.log(`  ⏭️  Skipping ${schema} - day_of_week column does not exist`);
                    continue;
                }

                // Show current state
                console.log('  Current column constraints:');
                columnCheck.rows.forEach(col => {
                    console.log(`    ${col.column_name}: nullable = ${col.is_nullable}`);
                });

                // Execute migration SQL
                await client.query(migrationSQL);
                
                console.log(`  ✅ Removed NOT NULL constraints in ${schema}`);
                
                // Verify the changes
                const verifyResult = await client.query(`
                    SELECT column_name, is_nullable, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'time_slots' 
                    AND column_name IN ('day_of_week', 'cycle_day')
                    ORDER BY column_name
                `);
                
                if (verifyResult.rows.length > 0) {
                    console.log('  Updated column constraints:');
                    verifyResult.rows.forEach(col => {
                        console.log(`    ${col.column_name}: nullable = ${col.is_nullable}, type = ${col.data_type}`);
                    });
                }
                
            } catch (error) {
                console.error(`  ❌ Error migrating ${schema}:`, error.message);
            }
        }

        console.log('\n✅ Migration completed!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
removeConstraints()
    .then(() => {
        console.log('Migration script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
