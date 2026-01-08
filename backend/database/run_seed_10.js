const fs = require('fs');
const path = require('path');

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

async function seed10Students() {
    const client = await pool.connect();
    
    try {
        console.log('🌱 Seeding 10 students to database...\n');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'seed_10_students.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    const result = await client.query(trimmed);
                    
                    // If it's the INSERT statement
                    if (trimmed.toUpperCase().includes('INSERT INTO STUDENTS')) {
                        console.log(`✅ Processed student records (${result.rowCount} new students added)`);
                    }
                    
                    // If it's a SELECT statement (verification), show results
                    if (trimmed.toUpperCase().startsWith('SELECT STUDENT_ID')) {
                        if (result.rows && result.rows.length > 0) {
                            console.log('\n📋 Students with S2024 IDs in database:');
                            console.table(result.rows);
                            console.log(`\n✅ Total: ${result.rows.length} students\n`);
                        } else {
                            console.log('\n⚠️  No students found with S2024 IDs\n');
                        }
                    }
                } catch (err) {
                    if (err.message.includes('duplicate key')) {
                        console.log('ℹ️  Some students already exist (skipped duplicates)');
                    } else if (!err.message.includes('does not exist')) {
                        console.error(`⚠️  Warning: ${err.message}`);
                    }
                }
            }
        }
        
        console.log('✨ Database seeding completed!\n');
        console.log('🎓 Student Link Codes for parent signup:');
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
seed10Students()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
