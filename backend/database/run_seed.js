const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables from the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false,
});

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🌱 Seeding database with students and teachers...\n');
        
        // Hash password for teachers (password: teacher123)
        const hashedPassword = await bcrypt.hash('teacher123', 10);
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'seed_students_teachers.sql');
        let sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Replace the placeholder password hash with the actual hashed password
        sql = sql.replace(/\$2a\$10\$YourHashedPasswordHere/g, hashedPassword);
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        let teacherCount = 0;
        let studentCount = 0;
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    const result = await client.query(trimmed);
                    
                    // Track inserts
                    if (trimmed.toUpperCase().includes('INSERT INTO TEACHERS')) {
                        teacherCount++;
                    } else if (trimmed.toUpperCase().includes('INSERT INTO STUDENTS')) {
                        studentCount++;
                    }
                    
                    // If it's a SELECT statement (verification), show results
                    if (trimmed.toUpperCase().startsWith('SELECT')) {
                        if (result.rows && result.rows.length > 0) {
                            if (result.rows[0].info) {
                                console.log(`✅ ${result.rows[0].info}: ${result.rows[0].count}`);
                            }
                        }
                    }
                } catch (err) {
                    // Ignore conflicts (already exists)
                    if (!err.message.includes('duplicate') && !err.message.includes('conflict')) {
                        console.error(`⚠️  Warning: ${err.message}`);
                    }
                }
            }
        }
        
        console.log('\n✨ Database seeding completed!\n');
        console.log('📋 Summary:');
        console.log(`   - Teachers processed: ${teacherCount}`);
        console.log(`   - Students processed: ${studentCount}`);
        console.log('\n🔑 Teacher Login Credentials:');
        console.log('   Email: teacher.smith@school.com (or any teacher.xxx@school.com)');
        console.log('   Password: teacher123');
        console.log('\n🎓 Student Link Codes (for parent signup):');
        console.log('   JAMES001, EMMA002, OLIVER003, SOPHIA004, WILLIAM005');
        console.log('   AVA006, NOAH007, ISABELLA008, LIAM009, MIA010\n');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
seedDatabase()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
