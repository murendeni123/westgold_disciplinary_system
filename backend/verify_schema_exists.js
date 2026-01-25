const { dbGet, dbAll } = require('./database/db');

async function verifySchemaExists() {
    try {
        console.log('🔍 Verifying if schema school_lear_1291 exists in PostgreSQL...\n');
        
        // Method 1: Check information_schema
        const schemaCheck1 = await dbGet(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'school_lear_1291'
        `);
        
        console.log('Method 1 (information_schema):');
        console.log(schemaCheck1 ? `  ✅ EXISTS` : `  ❌ NOT FOUND`);
        
        // Method 2: Check pg_namespace
        const schemaCheck2 = await dbGet(`
            SELECT nspname 
            FROM pg_namespace 
            WHERE nspname = 'school_lear_1291'
        `);
        
        console.log('\nMethod 2 (pg_namespace):');
        console.log(schemaCheck2 ? `  ✅ EXISTS` : `  ❌ NOT FOUND`);
        
        // List all school schemas
        console.log('\n📋 All schemas starting with "school_":');
        const allSchemas = await dbAll(`
            SELECT nspname 
            FROM pg_namespace 
            WHERE nspname LIKE 'school_%'
            ORDER BY nspname
        `);
        
        if (allSchemas.length === 0) {
            console.log('  (No school schemas found)');
        } else {
            allSchemas.forEach((s, idx) => {
                console.log(`  ${idx + 1}. ${s.nspname}`);
            });
        }
        
        // Check what schemaExistsInDb function would return
        console.log('\n🔍 Testing schemaExistsInDb function...');
        const { schemaExistsInDb } = require('./utils/schemaHelper');
        const exists = await schemaExistsInDb('school_lear_1291');
        console.log(`Result: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
        if (!schemaCheck1 && !schemaCheck2) {
            console.log('\n❌ PROBLEM: Schema does NOT exist in PostgreSQL!');
            console.log('The schema creation must have failed.');
            console.log('Need to recreate the schema.');
        } else if (!exists) {
            console.log('\n❌ PROBLEM: Schema exists but schemaExistsInDb returns false!');
            console.log('There might be an issue with the schemaExistsInDb function.');
        } else {
            console.log('\n✅ Schema exists and is properly detected!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifySchemaExists();
