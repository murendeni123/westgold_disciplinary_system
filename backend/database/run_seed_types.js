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

async function seedTypes() {
    const client = await pool.connect();
    
    try {
        console.log('🌱 Seeding Incident Types, Merit Types, and Intervention Types...\n');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'seed_types.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        let incidentCount = 0;
        let meritCount = 0;
        let interventionCount = 0;
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    const result = await client.query(trimmed);
                    
                    // Track inserts
                    if (trimmed.toUpperCase().includes('INSERT INTO INCIDENT_TYPES') && result.rowCount > 0) {
                        incidentCount++;
                    } else if (trimmed.toUpperCase().includes('INSERT INTO MERIT_TYPES') && result.rowCount > 0) {
                        meritCount++;
                    } else if (trimmed.toUpperCase().includes('INSERT INTO INTERVENTION_TYPES') && result.rowCount > 0) {
                        interventionCount++;
                    }
                    
                    // Show verification results
                    if (trimmed.toUpperCase().startsWith('SELECT') && result.rows && result.rows.length > 0) {
                        const row = result.rows[0];
                        console.log(`📊 ${row.category} ${row.count}`);
                    }
                } catch (err) {
                    if (!err.message.includes('duplicate key') && !err.message.includes('already exists')) {
                        console.error(`⚠️  Warning: ${err.message}`);
                    }
                }
            }
        }
        
        console.log('\n✨ Database seeding completed!\n');
        console.log('📋 Summary:');
        console.log(`   - Incident Types added: ${incidentCount}`);
        console.log(`   - Merit Types added: ${meritCount}`);
        console.log(`   - Intervention Types added: ${interventionCount}\n`);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
seedTypes()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
