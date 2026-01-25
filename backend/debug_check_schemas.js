const { dbAll } = require('./database/db');

async function checkSchemas() {
    try {
        console.log('🔍 Checking schools and their schema names...\n');
        
        const schools = await dbAll(`
            SELECT id, name, code, school_code, schema_name, status
            FROM public.schools
            ORDER BY id
        `);
        
        console.log(`Found ${schools.length} schools:\n`);
        
        schools.forEach(school => {
            console.log(`School ID: ${school.id}`);
            console.log(`  Name: ${school.name}`);
            console.log(`  Code: ${school.code}`);
            console.log(`  School Code: ${school.school_code}`);
            console.log(`  Schema Name: ${school.schema_name}`);
            console.log(`  Status: ${school.status}`);
            console.log('');
        });
        
        console.log('\n🔍 Checking users and their school associations...\n');
        
        const users = await dbAll(`
            SELECT u.id, u.email, u.name, u.role, u.primary_school_id, u.is_active
            FROM public.users u
            WHERE u.role IN ('admin', 'teacher', 'parent')
            ORDER BY u.id
            LIMIT 10
        `);
        
        console.log(`Found ${users.length} users:\n`);
        
        for (const user of users) {
            console.log(`User ID: ${user.id}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Primary School ID: ${user.primary_school_id}`);
            console.log(`  Is Active: ${user.is_active}`);
            
            // Check user_schools
            const userSchools = await dbAll(`
                SELECT us.school_id, us.role_in_school, us.is_primary, s.name, s.schema_name
                FROM public.user_schools us
                JOIN public.schools s ON us.school_id = s.id
                WHERE us.user_id = $1
            `, [user.id]);
            
            if (userSchools.length > 0) {
                console.log(`  User Schools:`);
                userSchools.forEach(us => {
                    console.log(`    - ${us.name} (ID: ${us.school_id}, Schema: ${us.schema_name}, Primary: ${us.is_primary})`);
                });
            } else {
                console.log(`  User Schools: None`);
            }
            console.log('');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkSchemas();
