const { pool, dbGet, dbAll } = require('./database/db');

async function testDashboardAPI() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Testing Dashboard API queries...\n');
        
        const schema = 'school_lear_1291';
        await client.query(`SET search_path TO ${schema}, public`);
        
        // Test 1: Total Students
        console.log('1️⃣  Testing: Total Students');
        const totalStudents = await client.query(`
            SELECT COUNT(*) as count FROM students WHERE is_active = true
        `);
        console.log(`   Result: ${totalStudents.rows[0].count} students`);
        console.log(`   Expected: 795 students`);
        console.log(`   Status: ${totalStudents.rows[0].count === '795' ? '✅ PASS' : '❌ FAIL'}\n`);
        
        // Test 2: Total Incidents
        console.log('2️⃣  Testing: Total Incidents');
        const totalIncidents = await client.query(`
            SELECT COUNT(*) as count FROM behaviour_incidents
        `);
        console.log(`   Result: ${totalIncidents.rows[0].count} incidents`);
        console.log(`   Status: ✅ Query works\n`);
        
        // Test 3: Total Merits
        console.log('3️⃣  Testing: Total Merits');
        const totalMerits = await client.query(`
            SELECT COUNT(*) as count FROM merits
        `);
        console.log(`   Result: ${totalMerits.rows[0].count} merits`);
        console.log(`   Status: ✅ Query works\n`);
        
        // Test 4: Pending Detentions
        console.log('4️⃣  Testing: Pending Detentions');
        const pendingDetentions = await client.query(`
            SELECT COUNT(*) as count FROM detention_assignments WHERE status = 'assigned'
        `);
        console.log(`   Result: ${pendingDetentions.rows[0].count} detentions`);
        console.log(`   Status: ✅ Query works\n`);
        
        // Test 5: Today's Attendance
        console.log('5️⃣  Testing: Today\'s Attendance');
        const todayAttendance = await client.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
            FROM attendance 
            WHERE date = CURRENT_DATE
        `);
        console.log(`   Result: ${todayAttendance.rows[0].total || 0} records today`);
        console.log(`   Status: ✅ Query works\n`);
        
        // Test 6: Check if students have is_active column
        console.log('6️⃣  Checking students table structure');
        const studentCols = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'students'
            AND column_name = 'is_active'
        `, [schema]);
        
        if (studentCols.rows.length > 0) {
            console.log(`   ✅ is_active column exists`);
            
            // Check how many students have is_active = true
            const activeCount = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive,
                    SUM(CASE WHEN is_active IS NULL THEN 1 ELSE 0 END) as null_count
                FROM students
            `);
            console.log(`   Total students: ${activeCount.rows[0].total}`);
            console.log(`   Active: ${activeCount.rows[0].active}`);
            console.log(`   Inactive: ${activeCount.rows[0].inactive}`);
            console.log(`   NULL: ${activeCount.rows[0].null_count}`);
        } else {
            console.log(`   ❌ is_active column missing!`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY\n');
        
        console.log('Dashboard should show:');
        console.log(`   Students: ${totalStudents.rows[0].count}`);
        console.log(`   Incidents: ${totalIncidents.rows[0].count}`);
        console.log(`   Merits: ${totalMerits.rows[0].count}`);
        console.log(`   Detentions: ${pendingDetentions.rows[0].count}`);
        console.log(`   Attendance: ${todayAttendance.rows[0].total || 0}%`);
        
        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

testDashboardAPI()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
