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

async function insertSampleData() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting sample data insertion...\n');
        
        // Read the students SQL file
        console.log('📚 Inserting student data...');
        const studentsSqlPath = path.join(__dirname, 'sample_students_postgres.sql');
        const studentsSql = fs.readFileSync(studentsSqlPath, 'utf8');
        
        await executeSQL(client, studentsSql);
        
        // Read the teachers SQL file
        console.log('\n👨‍🏫 Inserting teacher data...');
        const teachersSqlPath = path.join(__dirname, 'sample_teachers_postgres.sql');
        const teachersSql = fs.readFileSync(teachersSqlPath, 'utf8');
        
        await executeSQL(client, teachersSql);
        
        console.log('\n✨ All sample data insertion complete!\n');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

async function executeSQL(client, sql) {
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    let successCount = 0;
    let errorCount = 0;
    
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
                            console.table(result.rows);
                        }
                    }
                } else {
                    successCount++;
                }
            } catch (err) {
                // Ignore certain expected errors
                if (err.message.includes('already exists') || 
                    err.message.includes('duplicate') ||
                    err.message.includes('violates unique constraint')) {
                    console.log(`⚠️  Skipped (already exists): ${trimmed.substring(0, 50)}...`);
                } else {
                    errorCount++;
                    console.error(`❌ Error executing statement: ${err.message}`);
                    console.error(`   Statement: ${trimmed.substring(0, 100)}...`);
                }
            }
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successful operations: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
}

// Run the script
insertSampleData()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
