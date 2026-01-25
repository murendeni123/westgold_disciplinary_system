const { dbGet, dbAll } = require('./database/db');

async function checkUser73() {
    try {
        console.log('🔍 Checking User 73 context...\n');
        
        // Get user details
        const user = await dbGet(`
            SELECT id, email, name, role, primary_school_id, last_login
            FROM public.users
            WHERE id = 73
        `);
        
        if (!user) {
            console.log('❌ User 73 not found!');
            process.exit(1);
        }
        
        console.log('User Details:');
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Primary School ID: ${user.primary_school_id}`);
        console.log(`  Last Login: ${user.last_login}`);
        
        // Get user's schools
        const userSchools = await dbAll(`
            SELECT s.id, s.name, s.code, s.school_code, s.schema_name, s.status,
                   us.role_in_school, us.is_primary
            FROM public.schools s
            JOIN public.user_schools us ON s.id = us.school_id
            WHERE us.user_id = 73
        `);
        
        console.log(`\n📚 User Schools (${userSchools.length}):`);
        userSchools.forEach((school, idx) => {
            console.log(`\n  ${idx + 1}. ${school.name}`);
            console.log(`     ID: ${school.id}`);
            console.log(`     Code: ${school.code}`);
            console.log(`     School Code: ${school.school_code}`);
            console.log(`     Schema Name: ${school.schema_name}`);
            console.log(`     Status: ${school.status}`);
            console.log(`     Role: ${school.role_in_school}`);
            console.log(`     Is Primary: ${school.is_primary}`);
        });
        
        // Check if primary school exists
        if (user.primary_school_id) {
            const primarySchool = await dbGet(`
                SELECT id, name, code, school_code, schema_name, status
                FROM public.schools
                WHERE id = $1
            `, [user.primary_school_id]);
            
            console.log(`\n🏫 Primary School:`);
            if (primarySchool) {
                console.log(`  Name: ${primarySchool.name}`);
                console.log(`  Schema: ${primarySchool.schema_name}`);
                console.log(`  Status: ${primarySchool.status}`);
            } else {
                console.log(`  ❌ Primary school ID ${user.primary_school_id} NOT FOUND!`);
            }
        }
        
        // Check if schema_name 'school_lear_1291' exists in database
        console.log(`\n🔍 Checking if schema 'school_lear_1291' exists in PostgreSQL...`);
        const schemaExists = await dbGet(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'school_lear_1291'
        `);
        
        if (schemaExists) {
            console.log(`  ✅ Schema 'school_lear_1291' EXISTS in database`);
        } else {
            console.log(`  ❌ Schema 'school_lear_1291' DOES NOT EXIST in database`);
            console.log(`\n  This is why you're getting "SECURITY VIOLATION: Non-existent schema"`);
        }
        
        // List all schemas that start with 'school_'
        const allSchemas = await dbAll(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
            ORDER BY schema_name
        `);
        
        console.log(`\n📋 All school schemas in database (${allSchemas.length}):`);
        allSchemas.forEach(s => console.log(`  - ${s.schema_name}`));
        
        console.log('\n' + '='.repeat(60));
        console.log('💡 RECOMMENDATION:');
        console.log('='.repeat(60));
        console.log('User 73 has an OLD TOKEN that references schema "school_lear_1291"');
        console.log('which does not exist in the database.');
        console.log('\nUser needs to:');
        console.log('1. Log out completely');
        console.log('2. Clear browser cache/localStorage');
        console.log('3. Log back in to get a NEW v2 token');
        console.log('='.repeat(60));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUser73();
