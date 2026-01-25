const { dbGet, dbAll } = require('./database/db');

async function checkSchool40() {
    try {
        console.log('🔍 Checking School ID 40...\n');
        
        // Get school details
        const school = await dbGet(`
            SELECT id, name, code, school_code, schema_name, status
            FROM public.schools
            WHERE id = 40
        `);
        
        if (!school) {
            console.log('❌ School ID 40 not found!');
            process.exit(1);
        }
        
        console.log('School Details:');
        console.log(`  ID: ${school.id}`);
        console.log(`  Name: ${school.name}`);
        console.log(`  Code: ${school.code}`);
        console.log(`  School Code: ${school.school_code}`);
        console.log(`  Schema Name: ${school.schema_name}`);
        console.log(`  Status: ${school.status}`);
        
        // Check if schema exists
        console.log(`\n🔍 Checking if schema '${school.schema_name}' exists...`);
        const schemaExists = await dbGet(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = $1
        `, [school.schema_name]);
        
        if (schemaExists) {
            console.log(`  ✅ Schema '${school.schema_name}' EXISTS`);
        } else {
            console.log(`  ❌ Schema '${school.schema_name}' DOES NOT EXIST`);
            console.log(`\n  🔧 SOLUTION: Need to create the schema!`);
        }
        
        // Check user 73
        console.log(`\n🔍 Checking User 73 association with School 40...`);
        const userSchool = await dbGet(`
            SELECT us.user_id, us.school_id, us.role_in_school, us.is_primary,
                   u.email, u.name
            FROM public.user_schools us
            JOIN public.users u ON us.user_id = u.id
            WHERE us.user_id = 73 AND us.school_id = 40
        `);
        
        if (userSchool) {
            console.log(`  ✅ User 73 is linked to School 40`);
            console.log(`     Email: ${userSchool.email}`);
            console.log(`     Name: ${userSchool.name}`);
            console.log(`     Role: ${userSchool.role_in_school}`);
            console.log(`     Is Primary: ${userSchool.is_primary}`);
        } else {
            console.log(`  ❌ User 73 is NOT linked to School 40`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('💡 DIAGNOSIS:');
        console.log('='.repeat(60));
        if (!schemaExists) {
            console.log('The schema for School 40 does NOT exist in the database.');
            console.log('This is why you get "SECURITY VIOLATION: Non-existent schema"');
            console.log('\nThe schema needs to be created using the schemaManager.');
        }
        console.log('='.repeat(60));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkSchool40();
