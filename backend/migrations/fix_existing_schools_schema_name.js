/**
 * Migration: Populate schema_name for existing schools
 * 
 * This migration adds schema_name to schools that don't have it set.
 * Schema names are generated from school codes.
 */

const { dbAll, dbRun } = require('../database/db');
const { generateSchemaName } = require('../database/schemaManager');

async function migrateExistingSchools() {
    console.log('🔄 Starting migration: Populate schema_name for existing schools...');
    
    try {
        // Get all schools without schema_name
        const schools = await dbAll(`
            SELECT id, name, code, school_code 
            FROM public.schools 
            WHERE schema_name IS NULL OR schema_name = ''
        `);
        
        if (schools.length === 0) {
            console.log('✅ No schools need migration. All schools have schema_name set.');
            return { success: true, updated: 0 };
        }
        
        console.log(`📊 Found ${schools.length} schools without schema_name`);
        
        let updated = 0;
        let errors = 0;
        
        for (const school of schools) {
            try {
                // Use school_code or code to generate schema name
                const codeToUse = school.school_code || school.code;
                
                if (!codeToUse) {
                    console.warn(`⚠️  School ${school.id} (${school.name}) has no code. Skipping.`);
                    errors++;
                    continue;
                }
                
                const schemaName = generateSchemaName(codeToUse);
                
                await dbRun(
                    'UPDATE public.schools SET schema_name = $1 WHERE id = $2',
                    [schemaName, school.id]
                );
                
                console.log(`✅ Updated school ${school.id} (${school.name}): schema_name = ${schemaName}`);
                updated++;
                
            } catch (error) {
                console.error(`❌ Error updating school ${school.id} (${school.name}):`, error.message);
                errors++;
            }
        }
        
        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Successfully updated: ${updated} schools`);
        console.log(`   ❌ Errors: ${errors} schools`);
        console.log(`   📝 Total processed: ${schools.length} schools`);
        
        return { 
            success: errors === 0, 
            updated, 
            errors,
            total: schools.length 
        };
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateExistingSchools()
        .then(result => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateExistingSchools };
