const { dbGet, dbAll } = require('./database/db');

async function checkUserSchoolLinkage() {
    try {
        console.log('🔍 Checking user-school linkage for common users...\n');
        
        // Get the most recently logged in users
        const users = await dbAll(`
            SELECT id, email, name, role, primary_school_id, last_login
            FROM public.users
            WHERE role IN ('admin', 'teacher', 'parent')
            ORDER BY last_login DESC NULLS LAST
            LIMIT 5
        `);
        
        console.log(`Found ${users.length} recent users:\n`);
        
        for (const user of users) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`User: ${user.email} (ID: ${user.id})`);
            console.log(`Role: ${user.role}`);
            console.log(`Primary School ID: ${user.primary_school_id}`);
            console.log(`Last Login: ${user.last_login || 'Never'}`);
            
            // Check user_schools table
            const userSchools = await dbAll(`
                SELECT us.school_id, us.role_in_school, us.is_primary, 
                       s.name, s.schema_name, s.status
                FROM public.user_schools us
                JOIN public.schools s ON us.school_id = s.id
                WHERE us.user_id = $1
            `, [user.id]);
            
            if (userSchools.length > 0) {
                console.log(`\n✅ user_schools entries: ${userSchools.length}`);
                userSchools.forEach((us, idx) => {
                    console.log(`  ${idx + 1}. School: ${us.name} (ID: ${us.school_id})`);
                    console.log(`     Schema: ${us.schema_name}`);
                    console.log(`     Role: ${us.role_in_school}`);
                    console.log(`     Primary: ${us.is_primary}`);
                    console.log(`     Status: ${us.status}`);
                });
            } else {
                console.log(`\n❌ NO user_schools entries found!`);
            }
            
            // Check if primary_school_id exists
            if (user.primary_school_id) {
                const school = await dbGet(`
                    SELECT id, name, schema_name, status
                    FROM public.schools
                    WHERE id = $1
                `, [user.primary_school_id]);
                
                if (school) {
                    console.log(`\n✅ Primary school exists:`);
                    console.log(`   Name: ${school.name}`);
                    console.log(`   Schema: ${school.schema_name}`);
                    console.log(`   Status: ${school.status}`);
                } else {
                    console.log(`\n❌ Primary school ID ${user.primary_school_id} NOT FOUND in schools table!`);
                }
            } else {
                console.log(`\n❌ No primary_school_id set!`);
            }
            
            // Simulate what /school-info endpoint would return
            console.log(`\n📊 What /school-info would return:`);
            const schoolId = user.primary_school_id;
            if (!schoolId) {
                console.log(`   ❌ 404 - No school associated with this user`);
            } else {
                const schoolInfo = await dbGet(`
                    SELECT id, name, code, school_code, schema_name, email, phone, address
                    FROM public.schools
                    WHERE id = $1
                `, [schoolId]);
                
                if (schoolInfo) {
                    console.log(`   ✅ Would return school info:`);
                    console.log(`      School ID: ${schoolInfo.id}`);
                    console.log(`      Name: ${schoolInfo.name}`);
                    console.log(`      Code: ${schoolInfo.code}`);
                    console.log(`      School Code: ${schoolInfo.school_code}`);
                    console.log(`      Schema: ${schoolInfo.schema_name}`);
                } else {
                    console.log(`   ❌ 404 - School ID ${schoolId} not found`);
                }
            }
        }
        
        console.log(`\n${'='.repeat(60)}\n`);
        console.log('🔧 RECOMMENDATIONS:\n');
        
        const usersWithoutSchool = users.filter(u => !u.primary_school_id);
        const usersWithoutUserSchools = [];
        
        for (const user of users) {
            const userSchools = await dbAll(
                'SELECT * FROM public.user_schools WHERE user_id = $1',
                [user.id]
            );
            if (userSchools.length === 0) {
                usersWithoutUserSchools.push(user);
            }
        }
        
        if (usersWithoutSchool.length > 0) {
            console.log(`❌ ${usersWithoutSchool.length} users have no primary_school_id:`);
            usersWithoutSchool.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
            console.log(`\n   Fix: UPDATE public.users SET primary_school_id = <school_id> WHERE id = <user_id>`);
        }
        
        if (usersWithoutUserSchools.length > 0) {
            console.log(`\n❌ ${usersWithoutUserSchools.length} users have no user_schools entries:`);
            usersWithoutUserSchools.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
            console.log(`\n   Fix: INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)`);
            console.log(`        VALUES (<user_id>, <school_id>, '<role>', true)`);
        }
        
        if (usersWithoutSchool.length === 0 && usersWithoutUserSchools.length === 0) {
            console.log(`✅ All checked users have proper school associations!`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUserSchoolLinkage();
