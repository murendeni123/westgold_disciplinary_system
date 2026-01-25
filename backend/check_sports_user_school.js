const { dbGet, dbAll } = require('./database/db');

async function checkSportsUserSchool() {
    try {
        console.log('🔍 Checking school context for sports@westgoldprimary.co.za...\n');
        
        // Get user details
        const user = await dbGet(`
            SELECT id, email, name, role, primary_school_id
            FROM public.users
            WHERE email = 'sports@westgoldprimary.co.za'
        `);
        
        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }
        
        console.log('User Details:');
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Primary School ID: ${user.primary_school_id}`);
        
        // Get primary school details
        if (user.primary_school_id) {
            const primarySchool = await dbGet(`
                SELECT id, name, code, school_code, schema_name, status
                FROM public.schools
                WHERE id = $1
            `, [user.primary_school_id]);
            
            console.log(`\n🏫 Primary School:`);
            if (primarySchool) {
                console.log(`  ID: ${primarySchool.id}`);
                console.log(`  Name: ${primarySchool.name}`);
                console.log(`  Code: ${primarySchool.code}`);
                console.log(`  School Code: ${primarySchool.school_code}`);
                console.log(`  Schema Name: ${primarySchool.schema_name}`);
                console.log(`  Status: ${primarySchool.status}`);
            } else {
                console.log(`  ❌ Primary school ID ${user.primary_school_id} NOT FOUND!`);
            }
        }
        
        // Get all schools user has access to via user_schools
        const userSchools = await dbAll(`
            SELECT s.id, s.name, s.code, s.school_code, s.schema_name, s.status,
                   us.role_in_school, us.is_primary
            FROM public.schools s
            JOIN public.user_schools us ON s.id = us.school_id
            WHERE us.user_id = $1
            ORDER BY us.is_primary DESC, s.name
        `, [user.id]);
        
        console.log(`\n📚 Schools via user_schools (${userSchools.length}):`);
        if (userSchools.length === 0) {
            console.log('  (No schools found in user_schools)');
        } else {
            userSchools.forEach((school, idx) => {
                console.log(`\n  ${idx + 1}. ${school.name}`);
                console.log(`     ID: ${school.id}`);
                console.log(`     Code: ${school.school_code}`);
                console.log(`     Schema: ${school.schema_name}`);
                console.log(`     Status: ${school.status}`);
                console.log(`     Role: ${school.role_in_school}`);
                console.log(`     Is Primary: ${school.is_primary}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('💡 SCHOOL_ID FOR IMPORT:');
        console.log('='.repeat(60));
        
        if (user.primary_school_id) {
            console.log(`The import will use school_id: ${user.primary_school_id}`);
            const school = await dbGet('SELECT name, schema_name FROM public.schools WHERE id = $1', [user.primary_school_id]);
            if (school) {
                console.log(`School: ${school.name}`);
                console.log(`Schema: ${school.schema_name}`);
            }
        } else if (userSchools.length > 0) {
            const primarySchool = userSchools.find(s => s.is_primary) || userSchools[0];
            console.log(`The import will use school_id: ${primarySchool.id}`);
            console.log(`School: ${primarySchool.name}`);
            console.log(`Schema: ${primarySchool.schema_name}`);
        } else {
            console.log('❌ NO SCHOOL CONTEXT FOUND!');
            console.log('User is not linked to any school.');
        }
        console.log('='.repeat(60));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkSportsUserSchool();
