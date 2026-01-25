const { pool } = require('./database/db');
const fs = require('fs');
const path = require('path');

async function createAllMissingTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking existing tables in schema school_lear_1291...\n');
        
        // Get current tables
        const existingTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        const existing = existingTables.rows.map(r => r.tablename);
        console.log(`Current tables (${existing.length}):`);
        existing.forEach(t => console.log(`  - ${t}`));
        
        console.log('\n🔧 Creating all missing tables...\n');
        
        // Read the full schema template
        const templatePath = path.join(__dirname, 'database/school_schema_template.sql');
        let templateSql = fs.readFileSync(templatePath, 'utf8');
        
        // Replace schema name
        templateSql = templateSql.replace(/{SCHEMA_NAME}/g, 'school_lear_1291');
        
        // Split into individual statements
        const statements = templateSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        let created = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    
                    // Check if it's a CREATE TABLE statement
                    if (statement.toUpperCase().includes('CREATE TABLE')) {
                        const match = statement.match(/CREATE TABLE.*?school_lear_1291\.(\w+)/i);
                        if (match) {
                            const tableName = match[1];
                            if (!existing.includes(tableName)) {
                                console.log(`✅ Created: ${tableName}`);
                                created++;
                            } else {
                                skipped++;
                            }
                        }
                    }
                } catch (err) {
                    if (err.message.includes('already exists')) {
                        skipped++;
                    } else if (err.message.includes('does not exist')) {
                        // Skip errors about missing relations (these are for indexes/constraints)
                        skipped++;
                    } else {
                        console.warn(`⚠️  Warning: ${err.message.split('\n')[0]}`);
                        errors++;
                    }
                }
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Errors: ${errors}`);
        
        // Get final table list
        const finalTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        console.log(`\n✅ Final table count: ${finalTables.rows.length} tables\n`);
        console.log('All tables in schema school_lear_1291:');
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

createAllMissingTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
