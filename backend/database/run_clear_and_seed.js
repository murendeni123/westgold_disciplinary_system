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

async function clearAndSeed() {
    const client = await pool.connect();
    
    try {
        console.log('🗑️  Clearing old students and seeding 10 new students...\n');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'clear_and_seed.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    const result = await client.query(trimmed);
                    
                    // If it's a SELECT statement (verification), show results
                    if (trimmed.toUpperCase().startsWith('SELECT COUNT')) {
                        if (result.rows && result.rows.length > 0) {
                            console.log(`✅ Total students in database: ${result.rows[0].total_students}`);
                        }
                    } else if (trimmed.toUpperCase().startsWith('SELECT STUDENT_ID')) {
                        if (result.rows && result.rows.length > 0) {
                            console.log('\n📋 Students added:');
                            console.table(result.rows);
                        }
                    } else if (trimmed.toUpperCase().startsWith('DELETE')) {
                        console.log(`🗑️  Cleared ${result.rowCount} old students`);
                    } else if (trimmed.toUpperCase().startsWith('INSERT INTO STUDENTS')) {
                        console.log(`✅ Added ${result.rowCount} new students`);
                    }
                } catch (err) {
                    // Ignore some errors
                    if (!err.message.includes('does not exist') && !err.message.includes('already exists')) {
                        console.error(`⚠️  Warning: ${err.message}`);
                    }
                }
            }
        }
        
        console.log('\n✨ Database seeding completed!\n');
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
clearAndSeed()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
