const { pool } = require('./database/db');

async function addDetentionTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Adding detention tables to schema school_lear_1291...\n');
        
        // Create detention_sessions table
        console.log('Creating detention_sessions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.detention_sessions (
                id SERIAL PRIMARY KEY,
                detention_date DATE NOT NULL,
                detention_time TIME NOT NULL,
                duration INTEGER NOT NULL DEFAULT 60,
                location TEXT,
                teacher_on_duty_id INTEGER,
                max_capacity INTEGER DEFAULT 30,
                notes TEXT,
                status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ detention_sessions\n');
        
        // Create detention_assignments table
        console.log('Creating detention_assignments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.detention_assignments (
                id SERIAL PRIMARY KEY,
                detention_session_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                incident_id INTEGER,
                assigned_by INTEGER NOT NULL,
                reason TEXT,
                status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'attended', 'absent', 'excused')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ detention_assignments\n');
        
        // Create detentions table (if needed for legacy support)
        console.log('Creating detentions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.detentions (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                incident_id INTEGER,
                detention_date DATE NOT NULL,
                detention_time TIME,
                duration INTEGER DEFAULT 60,
                location TEXT,
                reason TEXT,
                status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'excused')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ detentions\n');
        
        // Create interventions table
        console.log('Creating interventions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.interventions (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                intervention_type TEXT NOT NULL,
                description TEXT,
                date_started DATE NOT NULL,
                date_completed DATE,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ interventions\n');
        
        // Create student_consequences table
        console.log('Creating student_consequences table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.student_consequences (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                incident_id INTEGER,
                consequence_type TEXT NOT NULL,
                description TEXT,
                date_assigned DATE NOT NULL,
                date_completed DATE,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
                assigned_by INTEGER NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ student_consequences\n');
        
        // Verify tables
        const result = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            AND tablename IN ('detention_sessions', 'detention_assignments', 'detentions', 'interventions', 'student_consequences')
            ORDER BY tablename
        `);
        
        console.log(`\n✅ SUCCESS! Created ${result.rows.length} detention-related tables:`);
        result.rows.forEach(t => console.log(`   - ${t.tablename}`));
        console.log('\n🎉 You can now create detention sessions!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

addDetentionTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
