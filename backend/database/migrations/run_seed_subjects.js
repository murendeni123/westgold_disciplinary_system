/**
 * Migration Script: Seed Predefined Subjects Catalogue
 * 
 * Seeds the database with standard South African curriculum subjects
 * Runs across all school schemas
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

async function seedSubjects() {
    const client = await pool.connect();
    
    try {
        console.log('📚 Starting predefined subjects seeding...\n');

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

        // Read the seed SQL
        const seedSQL = fs.readFileSync(
            path.join(__dirname, 'seed_predefined_subjects.sql'),
            'utf8'
        );

        // Run seed for each schema
        for (const schema of schemas) {
            console.log(`\n📋 Seeding schema: ${schema}`);
            
            try {
                // Set search path
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
                    console.log(`  ⏭️  Skipping ${schema} - subjects table does not exist`);
                    continue;
                }

                // Count before seeding
                const beforeCount = await client.query(`
                    SELECT COUNT(*) as count FROM subjects
                `);
                console.log(`  📊 Before: ${beforeCount.rows[0].count} subjects`);

                // Execute seed SQL
                await client.query(seedSQL);
                
                // Count after seeding
                const afterCount = await client.query(`
                    SELECT COUNT(*) as count FROM subjects
                `);
                console.log(`  📊 After: ${afterCount.rows[0].count} subjects`);
                
                // Show the predefined subjects
                const predefinedSubjects = await client.query(`
                    SELECT code, name 
                    FROM subjects 
                    WHERE code IN ('AFR', 'ENG', 'MAT', 'NS', 'SS', 'LO', 'EMS', 'TECH', 'CA')
                    ORDER BY code
                `);
                
                if (predefinedSubjects.rows.length > 0) {
                    console.log(`  ✅ Predefined subjects available:`);
                    predefinedSubjects.rows.forEach(row => {
                        console.log(`     ${row.code} - ${row.name}`);
                    });
                }
                
            } catch (error) {
                console.error(`  ❌ Error seeding ${schema}:`, error.message);
            }
        }

        console.log('\n✅ Subject catalogue seeding completed!\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the seeding
seedSubjects()
    .then(() => {
        console.log('Seeding script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seeding script failed:', error);
        process.exit(1);
    });
