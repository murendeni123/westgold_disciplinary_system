const { pool } = require('./database/db');

async function checkTeacherSchoolLinkage() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking teacher school linkage...\n');
        
        // Get school info
        const school = await client.query(`
            SELECT id, name, schema_name 
            FROM public.schools 
            WHERE schema_name = 'school_lear_1291'
        `);
        
        if (school.rows.length === 0) {
            console.log('❌ School not found with schema school_lear_1291');
            return;
        }
        
        const schoolInfo = school.rows[0];
        console.log('🏫 School Info:');
        console.log(`   ID: ${schoolInfo.id}`);
        console.log(`   Name: ${schoolInfo.name}`);
        console.log(`   Schema: ${schoolInfo.schema_name}\n`);
        
        // Get all teachers
        const teachers = await client.query(`
            SELECT u.id, u.email, u.name, u.primary_school_id, t.id as teacher_id
            FROM public.users u
            LEFT JOIN school_lear_1291.teachers t ON u.id = t.user_id
            WHERE u.role = 'teacher'
            ORDER BY u.id
        `);
        
        console.log(`👥 Found ${teachers.rows.length} teachers\n`);
        
        // Check user_schools linkage
        let linkedCount = 0;
        let notLinkedCount = 0;
        let hasPrimarySchoolId = 0;
        let noPrimarySchoolId = 0;
        
        for (const teacher of teachers.rows) {
            const userSchool = await client.query(`
                SELECT * FROM public.user_schools 
                WHERE user_id = $1 AND school_id = $2
            `, [teacher.id, schoolInfo.id]);
            
            const isLinked = userSchool.rows.length > 0;
            const hasPrimary = teacher.primary_school_id === schoolInfo.id;
            
            if (isLinked) linkedCount++;
            else notLinkedCount++;
            
            if (hasPrimary) hasPrimarySchoolId++;
            else noPrimarySchoolId++;
            
            if (!isLinked || !hasPrimary) {
                console.log(`Teacher: ${teacher.name} (${teacher.email})`);
                console.log(`   User ID: ${teacher.id}`);
                console.log(`   Teacher ID: ${teacher.teacher_id || 'NOT LINKED'}`);
                console.log(`   In user_schools: ${isLinked ? '✅' : '❌'}`);
                console.log(`   primary_school_id: ${hasPrimary ? '✅' : `❌ (${teacher.primary_school_id || 'NULL'})`}`);
                console.log('');
            }
        }
        
        console.log('📊 Summary:');
        console.log(`   Linked in user_schools: ${linkedCount}/${teachers.rows.length}`);
        console.log(`   Not linked in user_schools: ${notLinkedCount}/${teachers.rows.length}`);
        console.log(`   Has primary_school_id: ${hasPrimarySchoolId}/${teachers.rows.length}`);
        console.log(`   Missing primary_school_id: ${noPrimarySchoolId}/${teachers.rows.length}\n`);
        
        if (notLinkedCount > 0 || noPrimarySchoolId > 0) {
            console.log('⚠️  ISSUE FOUND: Teachers are not properly linked to school!');
            console.log('   This is why login shows "no school access"\n');
        } else {
            console.log('✅ All teachers properly linked to school\n');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

checkTeacherSchoolLinkage()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
