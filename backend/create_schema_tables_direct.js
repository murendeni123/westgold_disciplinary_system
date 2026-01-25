const { pool } = require('./database/db');

async function createSchemaTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating tables in schema school_lear_1291...\n');
        
        // Create classes table
        console.log('Creating classes table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.classes (
                id SERIAL PRIMARY KEY,
                class_name TEXT NOT NULL,
                grade_level TEXT,
                teacher_id INTEGER,
                academic_year TEXT NOT NULL,
                student_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ classes\n');
        
        // Create students table
        console.log('Creating students table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.students (
                id SERIAL PRIMARY KEY,
                student_id TEXT NOT NULL UNIQUE,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                date_of_birth DATE,
                gender TEXT CHECK(gender IN ('male', 'female', 'other')),
                class_id INTEGER,
                grade_level TEXT,
                parent_id INTEGER,
                secondary_parent_id INTEGER,
                parent_link_code TEXT UNIQUE,
                photo_path TEXT,
                medical_info TEXT,
                special_needs TEXT,
                emergency_contact_name TEXT,
                emergency_contact_phone TEXT,
                is_active BOOLEAN DEFAULT true,
                enrollment_date DATE DEFAULT CURRENT_DATE,
                withdrawal_date DATE,
                demerit_points INTEGER DEFAULT 0,
                merit_points INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ students\n');
        
        // Create teachers table
        console.log('Creating teachers table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS school_lear_1291.teachers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                department TEXT,
                subjects TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ teachers\n');
        
        // Add admin to teachers table
        console.log('Adding admin (User 73) to teachers table...');
        await client.query(`
            INSERT INTO school_lear_1291.teachers (user_id, department)
            VALUES (73, 'Administration')
            ON CONFLICT (user_id) DO NOTHING
        `);
        console.log('✅ admin added\n');
        
        // Create other essential tables
        const tables = [
            { name: 'parents', sql: `CREATE TABLE IF NOT EXISTS school_lear_1291.parents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` },
            { name: 'behaviour_incidents', sql: `CREATE TABLE IF NOT EXISTS school_lear_1291.behaviour_incidents (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                incident_type TEXT NOT NULL,
                description TEXT,
                severity TEXT,
                date_occurred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` },
            { name: 'merits', sql: `CREATE TABLE IF NOT EXISTS school_lear_1291.merits (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                merit_type TEXT NOT NULL,
                description TEXT,
                points INTEGER DEFAULT 1,
                date_awarded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` },
            { name: 'attendance', sql: `CREATE TABLE IF NOT EXISTS school_lear_1291.attendance (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` },
            { name: 'messages', sql: `CREATE TABLE IF NOT EXISTS school_lear_1291.messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL,
                recipient_id INTEGER NOT NULL,
                subject TEXT,
                body TEXT,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` },
            { name: 'notifications', sql: `CREATE TABLE IF NOT EXISTS school_lear_1291.notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT,
                message TEXT,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )` }
        ];
        
        for (const table of tables) {
            console.log(`Creating ${table.name} table...`);
            await client.query(table.sql);
            console.log(`✅ ${table.name}\n`);
        }
        
        // Verify tables
        const result = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        console.log(`\n✅ SUCCESS! Created ${result.rows.length} tables:`);
        result.rows.forEach(t => console.log(`   - ${t.tablename}`));
        console.log('\n🎉 Schema is ready! You can now import students!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

createSchemaTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
