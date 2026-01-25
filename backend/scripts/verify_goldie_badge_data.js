const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyGoldieBadgeData() {
    const client = await pool.connect();
    
    try {
        console.log('\n========================================');
        console.log('GOLDIE BADGE DATA VERIFICATION');
        console.log('========================================\n');

        // 1. Check merits table structure
        console.log('1. MERITS TABLE STRUCTURE:');
        const meritsColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'school_default' AND table_name = 'merits'
            ORDER BY ordinal_position
        `);
        console.table(meritsColumns.rows);

        // 2. Check behaviour_incidents table structure
        console.log('\n2. BEHAVIOUR_INCIDENTS TABLE STRUCTURE:');
        const incidentsColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'school_default' AND table_name = 'behaviour_incidents'
            ORDER BY ordinal_position
        `);
        console.table(incidentsColumns.rows);

        // 3. Get actual merit data
        console.log('\n3. SAMPLE MERIT DATA:');
        const meritsData = await client.query(`
            SELECT m.*, s.first_name, s.last_name, s.student_id as student_identifier
            FROM school_default.merits m
            JOIN school_default.students s ON m.student_id = s.id
            LIMIT 5
        `);
        console.table(meritsData.rows);

        // 4. Get actual incident data
        console.log('\n4. SAMPLE INCIDENT DATA:');
        const incidentsData = await client.query(`
            SELECT bi.*, s.first_name, s.last_name, s.student_id as student_identifier
            FROM school_default.behaviour_incidents bi
            JOIN school_default.students s ON bi.student_id = s.id
            LIMIT 5
        `);
        console.table(incidentsData.rows);

        // 5. Calculate Goldie Badge eligibility for all students
        console.log('\n5. GOLDIE BADGE ELIGIBILITY CALCULATION:');
        const eligibilityData = await client.query(`
            WITH student_merits AS (
                SELECT 
                    s.id,
                    s.student_id,
                    s.first_name,
                    s.last_name,
                    COALESCE(SUM(m.points), 0) as total_merit_points,
                    COUNT(m.id) as merit_count
                FROM school_default.students s
                LEFT JOIN school_default.merits m ON m.student_id = s.id
                GROUP BY s.id, s.student_id, s.first_name, s.last_name
            ),
            student_incidents AS (
                SELECT 
                    s.id,
                    COALESCE(SUM(bi.points_deducted), 0) as total_demerit_points,
                    COUNT(bi.id) as incident_count
                FROM school_default.students s
                LEFT JOIN school_default.behaviour_incidents bi ON bi.student_id = s.id
                GROUP BY s.id
            )
            SELECT 
                sm.id,
                sm.student_id,
                sm.first_name,
                sm.last_name,
                sm.total_merit_points,
                sm.merit_count,
                si.total_demerit_points,
                si.incident_count,
                (sm.total_merit_points - si.total_demerit_points) as clean_points,
                CASE 
                    WHEN sm.total_merit_points >= 10 AND (sm.total_merit_points - si.total_demerit_points) >= 10 
                    THEN 'ELIGIBLE' 
                    ELSE 'NOT ELIGIBLE' 
                END as badge_status
            FROM student_merits sm
            JOIN student_incidents si ON sm.id = si.id
            ORDER BY clean_points DESC
        `);
        console.table(eligibilityData.rows);

        // 6. Count eligible students
        const eligibleCount = eligibilityData.rows.filter(r => r.badge_status === 'ELIGIBLE').length;
        console.log(`\n✅ TOTAL STUDENTS WITH GOLDIE BADGES: ${eligibleCount}`);
        
        // 7. Show students who should be on leaderboard
        console.log('\n6. TOP 5 STUDENTS FOR LEADERBOARD:');
        const top5 = eligibilityData.rows.filter(r => r.badge_status === 'ELIGIBLE').slice(0, 5);
        console.table(top5);

        // 8. Check specific student (John Doe)
        console.log('\n7. JOHN DOE SPECIFIC CHECK:');
        const johnDoe = await client.query(`
            WITH student_data AS (
                SELECT 
                    s.id,
                    s.student_id,
                    s.first_name,
                    s.last_name
                FROM school_default.students s
                WHERE s.first_name = 'John' AND s.last_name = 'Doe'
            ),
            merits_data AS (
                SELECT 
                    m.id as merit_id,
                    m.points,
                    m.description,
                    m.date
                FROM school_default.merits m
                JOIN student_data sd ON m.student_id = sd.id
            ),
            incidents_data AS (
                SELECT 
                    bi.id as incident_id,
                    bi.points_deducted,
                    bi.description,
                    bi.date
                FROM school_default.behaviour_incidents bi
                JOIN student_data sd ON bi.student_id = sd.id
            )
            SELECT 
                sd.*,
                (SELECT COALESCE(SUM(points), 0) FROM merits_data) as total_merits,
                (SELECT COUNT(*) FROM merits_data) as merit_count,
                (SELECT COALESCE(SUM(points_deducted), 0) FROM incidents_data) as total_demerits,
                (SELECT COUNT(*) FROM incidents_data) as incident_count,
                (SELECT COALESCE(SUM(points), 0) FROM merits_data) - 
                (SELECT COALESCE(SUM(points_deducted), 0) FROM incidents_data) as clean_points
            FROM student_data sd
        `);
        
        if (johnDoe.rows.length > 0) {
            console.table(johnDoe.rows);
            console.log('\nJohn Doe Merits:');
            const johnMerits = await client.query(`
                SELECT m.* 
                FROM school_default.merits m
                JOIN school_default.students s ON m.student_id = s.id
                WHERE s.first_name = 'John' AND s.last_name = 'Doe'
            `);
            console.table(johnMerits.rows);
            
            console.log('\nJohn Doe Incidents:');
            const johnIncidents = await client.query(`
                SELECT bi.* 
                FROM school_default.behaviour_incidents bi
                JOIN school_default.students s ON bi.student_id = s.id
                WHERE s.first_name = 'John' AND s.last_name = 'Doe'
            `);
            console.table(johnIncidents.rows);
        } else {
            console.log('John Doe not found in database');
        }

        console.log('\n========================================');
        console.log('VERIFICATION COMPLETE');
        console.log('========================================\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyGoldieBadgeData();
