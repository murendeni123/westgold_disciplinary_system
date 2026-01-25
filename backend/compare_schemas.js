const { pool } = require('./database/db');

async function compareSchemas() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Comparing schemas to find missing tables...\n');
        
        // Get tables from school_default (reference schema)
        const defaultTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_default'
            ORDER BY tablename
        `);
        
        // Get tables from school_lear_1291
        const learTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        const defaultSet = new Set(defaultTables.rows.map(r => r.tablename));
        const learSet = new Set(learTables.rows.map(r => r.tablename));
        
        console.log(`school_default has ${defaultSet.size} tables`);
        console.log(`school_lear_1291 has ${learSet.size} tables\n`);
        
        // Find missing tables
        const missing = [...defaultSet].filter(t => !learSet.has(t));
        
        if (missing.length === 0) {
            console.log('✅ No missing tables! school_lear_1291 has all tables from school_default.\n');
        } else {
            console.log(`❌ Missing ${missing.length} tables in school_lear_1291:\n`);
            missing.forEach((t, idx) => {
                console.log(`   ${idx + 1}. ${t}`);
            });
            
            console.log('\n🔧 Creating missing tables...\n');
            
            for (const tableName of missing) {
                try {
                    // Get CREATE TABLE statement from school_default
                    const createStmt = await client.query(`
                        SELECT 
                            'CREATE TABLE school_lear_1291.' || tablename || ' (' ||
                            string_agg(
                                column_name || ' ' || data_type ||
                                CASE 
                                    WHEN character_maximum_length IS NOT NULL 
                                    THEN '(' || character_maximum_length || ')'
                                    ELSE ''
                                END ||
                                CASE 
                                    WHEN is_nullable = 'NO' THEN ' NOT NULL'
                                    ELSE ''
                                END,
                                ', '
                            ) || ')' as create_statement
                        FROM information_schema.columns
                        WHERE table_schema = 'school_default' 
                        AND table_name = $1
                        GROUP BY tablename
                    `, [tableName]);
                    
                    if (createStmt.rows.length > 0) {
                        // This is a simplified approach - let's copy the table structure
                        await client.query(`
                            CREATE TABLE school_lear_1291.${tableName} 
                            (LIKE school_default.${tableName} INCLUDING ALL)
                        `);
                        console.log(`✅ Created: ${tableName}`);
                    }
                } catch (err) {
                    console.warn(`⚠️  Could not create ${tableName}: ${err.message.split('\n')[0]}`);
                }
            }
        }
        
        // Show extra tables in school_lear_1291
        const extra = [...learSet].filter(t => !defaultSet.has(t));
        if (extra.length > 0) {
            console.log(`\nℹ️  Extra tables in school_lear_1291 (not in school_default):`);
            extra.forEach((t, idx) => {
                console.log(`   ${idx + 1}. ${t}`);
            });
        }
        
        // Final count
        const finalTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'school_lear_1291'
            ORDER BY tablename
        `);
        
        console.log(`\n✅ Final: school_lear_1291 has ${finalTables.rows.length} tables\n`);
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

compareSchemas()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
