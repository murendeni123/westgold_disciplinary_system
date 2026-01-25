const { dbGet, dbAll } = require('./database/db');

async function checkAdminInSchema() {
    try {
        console.log('🔍 Checking if admin exists in schema school_lear_1291...\n');
        
        // Check if user 73 exists as a teacher in the schema
        const teacher = await dbGet(`
            SELECT * FROM teachers WHERE user_id = 73
        `, [], 'school_lear_1291');
        
        if (teacher) {
            console.log('✅ Admin (User 73) EXISTS in schema as teacher:');
            console.log(`   ID: ${teacher.id}`);
            console.log(`   User ID: ${teacher.user_id}`);
            console.log(`   Department: ${teacher.department || 'N/A'}`);
            console.log(`   Is Active: ${teacher.is_active}`);
        } else {
            console.log('❌ Admin (User 73) DOES NOT exist in schema as teacher');
            console.log('\n🔧 SOLUTION: Need to create teacher record for admin');
        }
        
        // Check all teachers in the schema
        console.log('\n📋 All teachers in schema school_lear_1291:');
        const allTeachers = await dbAll(`
            SELECT * FROM teachers
        `, [], 'school_lear_1291');
        
        if (allTeachers.length === 0) {
            console.log('   (No teachers found - schema is empty)');
        } else {
            allTeachers.forEach((t, idx) => {
                console.log(`   ${idx + 1}. User ID: ${t.user_id}, Department: ${t.department || 'N/A'}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        if (!teacher) {
            console.log('💡 ACTION NEEDED:');
            console.log('='.repeat(60));
            console.log('The admin user needs to be added to the teachers table');
            console.log('in the school schema to have full access.');
            console.log('\nCreating teacher record now...');
            console.log('='.repeat(60));
            
            // Create the teacher record
            const result = await dbAll(`
                INSERT INTO teachers (user_id, is_active, department)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [73, true, 'Administration'], 'school_lear_1291');
            
            if (result && result.length > 0) {
                console.log('\n✅ SUCCESS! Admin teacher record created:');
                console.log(`   ID: ${result[0].id}`);
                console.log(`   User ID: ${result[0].user_id}`);
                console.log(`   Department: ${result[0].department}`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAdminInSchema();
