require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false,
});

async function fixTeacherSchools() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing teacher school assignments...\n');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'add_school_to_teachers.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    const result = await client.query(trimmed);
                    
                    // If it's a SELECT statement (verification), show results
                    if (trimmed.toUpperCase().startsWith('SELECT')) {
                        if (result.rows && result.rows.length > 0) {
                            if (result.rows[0].info) {
                                console.log(`✅ ${result.rows[0].info}: ${result.rows[0].count}`);
                            } else {
                                // Show table results
                                console.log('\n📋 Teacher-School Assignments:');
                                console.table(result.rows);
                            }
                        }
                    } else if (trimmed.toUpperCase().startsWith('UPDATE')) {
                        console.log(`✅ Updated ${result.rowCount} records`);
                    }
                } catch (err) {
                    console.error(`❌ Error: ${err.message}`);
                }
            }
        }
        
        console.log('\n✨ Teacher school assignments fixed!\n');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
fixTeacherSchools()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
