require('dotenv').config();
const { pool } = require('../database/db');

async function diagnoseUser() {
    const client = await pool.connect();
    
    try {
        console.log('\n========================================');
        console.log('🔍 Diagnosing admin@school.com');
        console.log('========================================\n');
        
        // 1. Find the user
        const user = await client.query(`
            SELECT * FROM public.users WHERE email = 'admin@school.com'
        `);
        
        if (user.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }
        
        const userData = user.rows[0];
        console.log('👤 USER DATA:');
        console.log(`   ID: ${userData.id}`);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Primary School ID: ${userData.primary_school_id}`);
        console.log(`   Is Active: ${userData.is_active}`);
        
        // 2. Check the school
        if (userData.primary_school_id) {
            const school = await client.query(`
                SELECT * FROM public.schools WHERE id = $1
            `, [userData.primary_school_id]);
            
            if (school.rows.length > 0) {
                const schoolData = school.rows[0];
                console.log('\n🏫 PRIMARY SCHOOL:');
                console.log(`   ID: ${schoolData.id}`);
                console.log(`   Name: ${schoolData.name}`);
                console.log(`   Code: ${schoolData.code}`);
                console.log(`   School Code: ${schoolData.school_code}`);
                console.log(`   Schema Name: ${schoolData.schema_name || 'NULL ⚠️'}`);
                console.log(`   Status: ${schoolData.status}`);
                
                // Check if schema exists
                if (schoolData.schema_name) {
                    const schemaCheck = await client.query(`
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.schemata 
                            WHERE schema_name = $1
                        )
                    `, [schoolData.schema_name]);
                    
                    console.log(`   Schema Exists: ${schemaCheck.rows[0].exists ? 'YES ✅' : 'NO ❌'}`);
                    
                    // Check schema data
                    if (schemaCheck.rows[0].exists) {
                        await client.query(`SET search_path TO ${schoolData.schema_name}, public`);
                        
                        const students = await client.query('SELECT COUNT(*) as count FROM students');
                        const teachers = await client.query('SELECT COUNT(*) as count FROM teachers');
                        const classes = await client.query('SELECT COUNT(*) as count FROM classes');
                        const incidents = await client.query('SELECT COUNT(*) as count FROM behaviour_incidents');
                        const merits = await client.query('SELECT COUNT(*) as count FROM merits');
                        
                        console.log('\n📊 SCHEMA DATA:');
                        console.log(`   Students: ${students.rows[0].count}`);
                        console.log(`   Teachers: ${teachers.rows[0].count}`);
                        console.log(`   Classes: ${classes.rows[0].count}`);
                        console.log(`   Incidents: ${incidents.rows[0].count}`);
                        console.log(`   Merits: ${merits.rows[0].count}`);
                        
                        // Reset search path
                        await client.query('SET search_path TO public');
                    }
                }
            } else {
                console.log('\n❌ Primary school not found in database!');
            }
        } else {
            console.log('\n⚠️  User has no primary_school_id set!');
        }
        
        // 3. Check user_schools links
        const userSchools = await client.query(`
            SELECT us.*, s.name as school_name, s.schema_name
            FROM public.user_schools us
            JOIN public.schools s ON us.school_id = s.id
            WHERE us.user_id = $1
        `, [userData.id]);
        
        console.log('\n🔗 USER_SCHOOLS LINKS:');
        if (userSchools.rows.length === 0) {
            console.log('   ❌ No links found in user_schools table!');
        } else {
            userSchools.rows.forEach(link => {
                console.log(`   - School ID: ${link.school_id}`);
                console.log(`     Name: ${link.school_name}`);
                console.log(`     Schema: ${link.schema_name || 'NULL'}`);
                console.log(`     Role: ${link.role_in_school}`);
                console.log(`     Is Primary: ${link.is_primary}`);
            });
        }
        
        // 4. Check what JWT would contain
        console.log('\n🔑 JWT CONTEXT (what login should return):');
        if (userData.primary_school_id) {
            const school = await client.query(`
                SELECT schema_name FROM public.schools WHERE id = $1
            `, [userData.primary_school_id]);
            
            if (school.rows.length > 0 && school.rows[0].schema_name) {
                console.log(`   schoolId: ${userData.primary_school_id}`);
                console.log(`   schemaName: ${school.rows[0].schema_name}`);
                console.log('   ✅ Should work correctly');
            } else {
                console.log('   ❌ PROBLEM: No schema_name for school!');
                console.log('   This means the user can login but won\'t see any data!');
            }
        } else {
            console.log('   ❌ PROBLEM: No primary_school_id!');
        }
        
        console.log('\n========================================');
        console.log('✅ Diagnosis Complete');
        console.log('========================================\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

diagnoseUser();
