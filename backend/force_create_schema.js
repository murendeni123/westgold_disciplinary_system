const { pool } = require('./database/db');
const fs = require('fs');
const path = require('path');

async function forceCreateSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Force creating schema school_lear_1291...\n');
        
        // Drop schema if it exists (clean slate)
        console.log('1. Dropping existing schema (if any)...');
        await client.query('DROP SCHEMA IF EXISTS school_lear_1291 CASCADE');
        console.log('   ✅ Dropped (or didn\'t exist)\n');
        
        // Create schema
        console.log('2. Creating schema...');
        await client.query('CREATE SCHEMA school_lear_1291');
        console.log('   ✅ Schema created\n');
        
        // Verify schema exists
        const check = await client.query(`
            SELECT nspname FROM pg_namespace WHERE nspname = 'school_lear_1291'
        `);
        
        if (check.rows.length === 0) {
            throw new Error('Schema creation failed - not found after creation');
        }
        console.log('   ✅ Verified schema exists\n');
        
        // Read template
        console.log('3. Reading schema template...');
        const templatePath = path.join(__dirname, 'database/school_schema_template.sql');
        let templateSql = fs.readFileSync(templatePath, 'utf8');
        console.log('   ✅ Template loaded\n');
        
        // Replace placeholders
        console.log('4. Creating tables...');
        templateSql = templateSql.replace(/{SCHEMA_NAME}/g, 'school_lear_1291');
        
        // Split and execute statements
        const statements = templateSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    successCount++;
                } catch (err) {
                    if (err.message.includes('already exists')) {
                        skipCount++;
                    } else {
                        console.warn(`   ⚠️  Warning: ${err.message.split('\n')[0]}`);
                    }
                }
            }
        }
        
        console.log(`   ✅ Created ${successCount} objects (${skipCount} skipped)\n`);
        
        // Verify tables exist
        console.log('5. Verifying tables...');
        const tables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        console.log(`   ✅ Found ${tables.rows.length} tables:`);
        tables.rows.forEach(t => console.log(`      - ${t.tablename}`));
        
        console.log('\n✅ SUCCESS! Schema school_lear_1291 is ready!');
        console.log('🎉 You can now import students!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

forceCreateSchema()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
