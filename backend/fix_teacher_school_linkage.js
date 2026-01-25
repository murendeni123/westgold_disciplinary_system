const { pool } = require('./database/db');

async function fixTeacherSchoolLinkage() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing teacher school linkage...\n');
        
        // Get school info
        const school = await client.query(`
            SELECT id, name, schema_name 
            FROM public.schools 
            WHERE schema_name = 'school_lear_1291'
        `);
        
        if (school.rows.length === 0) {
            console.log('❌ School not found');
            return;
        }
        
        const schoolId = school.rows[0].id;
        const schoolName = school.rows[0].name;
        
        console.log(`🏫 School: ${schoolName} (ID: ${schoolId})\n`);
        
        // Get all teachers that are in the school_lear_1291.teachers table
        const teachers = await client.query(`
            SELECT u.id, u.email, u.name, t.id as teacher_id
            FROM public.users u
            INNER JOIN school_lear_1291.teachers t ON u.id = t.user_id
            WHERE u.role = 'teacher'
            ORDER BY u.id
        `);
        
        console.log(`👥 Found ${teachers.rows.length} teachers to link\n`);
        
        let updatedCount = 0;
        let insertedCount = 0;
        
        await client.query('BEGIN');
        
        for (const teacher of teachers.rows) {
            // Update primary_school_id
            await client.query(`
                UPDATE public.users 
                SET primary_school_id = $1 
                WHERE id = $2
            `, [schoolId, teacher.id]);
            updatedCount++;
            
            // Insert into user_schools if not exists
            const exists = await client.query(`
                SELECT 1 FROM public.user_schools 
                WHERE user_id = $1 AND school_id = $2
            `, [teacher.id, schoolId]);
            
            if (exists.rows.length === 0) {
                await client.query(`
                    INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
                    VALUES ($1, $2, 'teacher', true)
                `, [teacher.id, schoolId]);
                insertedCount++;
            }
            
            console.log(`✅ Linked: ${teacher.name} (${teacher.email})`);
        }
        
        await client.query('COMMIT');
        
        console.log(`\n📊 Summary:`);
        console.log(`   Updated primary_school_id: ${updatedCount} teachers`);
        console.log(`   Inserted into user_schools: ${insertedCount} teachers`);
        console.log(`\n✅ All teachers now linked to ${schoolName}!\n`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

fixTeacherSchoolLinkage()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
