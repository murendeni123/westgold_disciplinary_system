const { pool } = require('./database/db');

async function copyAllTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Copying all tables from school_default to school_lear_1291...\n');
        
        // Get tables from school_default
        const defaultTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_default'
            ORDER BY tablename
        `);
        
        // Get existing tables in school_lear_1291
        const learTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        const learSet = new Set(learTables.rows.map(r => r.tablename));
        const missing = defaultTables.rows.filter(r => !learSet.has(r.tablename));
        
        console.log(`Found ${missing.length} missing tables to copy\n`);
        
        let created = 0;
        let skipped = 0;
        
        for (const row of missing) {
            const tableName = row.tablename;
            
            try {
                // Copy table structure (without data)
                await client.query(`
                    CREATE TABLE school_lear_1291.${tableName} 
                    (LIKE school_default.${tableName} INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)
                `);
                console.log(`✅ Created: ${tableName}`);
                created++;
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log(`⏭️  Skipped: ${tableName} (already exists)`);
                    skipped++;
                } else {
                    console.warn(`⚠️  Failed: ${tableName} - ${err.message.split('\n')[0]}`);
                }
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        
        // Final count
        const finalTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        console.log(`\n✅ Final: school_lear_1291 has ${finalTables.rows.length} tables\n`);
        console.log('All tables:');
        finalTables.rows.forEach((t, idx) => {
            console.log(`   ${idx + 1}. ${t.tablename}`);
        });
        
        console.log('\n🎉 Schema is complete!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

copyAllTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
