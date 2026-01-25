const { createSchoolSchema } = require('./database/schemaManager');
const { dbGet } = require('./database/db');

async function createMissingSchema() {
    try {
        console.log('🔧 Creating missing schema for School 40...\n');
        
        // Get school details
        const school = await dbGet(`
            SELECT id, name, code, school_code, schema_name
            FROM public.schools
            WHERE id = 40
        `);
        
        if (!school) {
            console.log('❌ School 40 not found!');
            process.exit(1);
        }
        
        console.log('School Details:');
        console.log(`  Name: ${school.name}`);
        console.log(`  Code: ${school.school_code}`);
        console.log(`  Schema: ${school.schema_name}`);
        
        // Create the schema using the school code
        console.log(`\n📦 Creating schema using school code: ${school.school_code}...`);
        const result = await createSchoolSchema(school.school_code);
        
        if (result.success) {
            console.log(`\n✅ SUCCESS!`);
            console.log(`   Schema '${result.schemaName}' created successfully`);
            console.log(`   Tables created: ${result.tablesCreated}`);
            console.log(`\n🎉 User 73 can now import students!`);
        } else {
            console.log(`\n❌ FAILED to create schema`);
            console.log(`   Error: ${result.error}`);
        }
        
        process.exit(result.success ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createMissingSchema();
