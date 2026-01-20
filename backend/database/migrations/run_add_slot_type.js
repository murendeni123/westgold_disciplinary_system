/**
 * Migration Script: Add slot_type column to time_slots table
 * 
 * Adds slot_type column to all school schemas
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

async function addSlotTypeColumn() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Adding slot_type column to time_slots table...\n');

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
            path.join(__dirname, 'add_slot_type_column.sql'),
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

                // Check if column already exists
                const columnCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = $1 
                        AND table_name = 'time_slots'
                        AND column_name = 'slot_type'
                    )
                `, [schema]);

                if (columnCheck.rows[0].exists) {
                    console.log(`  ✓ Column slot_type already exists in ${schema}`);
                    continue;
                }

                // Execute migration SQL
                await client.query(migrationSQL);
                
                console.log(`  ✅ Added slot_type column to ${schema}`);
                
                // Verify the column was added
                const verifyResult = await client.query(`
                    SELECT column_name, data_type, column_default 
                    FROM information_schema.columns 
                    WHERE table_name = 'time_slots' 
                    AND column_name = 'slot_type'
                `);
                
                if (verifyResult.rows.length > 0) {
                    const col = verifyResult.rows[0];
                    console.log(`     Column: ${col.column_name} (${col.data_type}), Default: ${col.column_default}`);
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
addSlotTypeColumn()
    .then(() => {
        console.log('Migration script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
