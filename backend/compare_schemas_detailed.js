const { pool } = require('./database/db');

async function compareSchemas() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Comparing school_default and school_lear_1291 schemas...\n');
        console.log('='.repeat(80));
        
        const defaultSchema = 'school_default';
        const learSchema = 'school_lear_1291';
        
        // Get all tables from both schemas
        const defaultTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `, [defaultSchema]);
        
        const learTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `, [learSchema]);
        
        const defaultTableNames = defaultTables.rows.map(r => r.table_name);
        const learTableNames = learTables.rows.map(r => r.table_name);
        
        console.log(`\n📊 Table Count:`);
        console.log(`   school_default: ${defaultTableNames.length} tables`);
        console.log(`   school_lear_1291: ${learTableNames.length} tables`);
        
        // Find missing tables
        const missingInLear = defaultTableNames.filter(t => !learTableNames.includes(t));
        const extraInLear = learTableNames.filter(t => !defaultTableNames.includes(t));
        
        if (missingInLear.length > 0) {
            console.log(`\n⚠️  Tables in school_default but MISSING in school_lear_1291:`);
            missingInLear.forEach(t => console.log(`   - ${t}`));
        }
        
        if (extraInLear.length > 0) {
            console.log(`\n📌 Extra tables in school_lear_1291:`);
            extraInLear.forEach(t => console.log(`   - ${t}`));
        }
        
        // Compare columns for common tables
        const commonTables = defaultTableNames.filter(t => learTableNames.includes(t));
        console.log(`\n\n📋 Comparing ${commonTables.length} common tables...\n`);
        console.log('='.repeat(80));
        
        const columnDifferences = [];
        
        for (const tableName of commonTables) {
            const defaultCols = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
            `, [defaultSchema, tableName]);
            
            const learCols = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
            `, [learSchema, tableName]);
            
            const defaultColNames = defaultCols.rows.map(r => r.column_name);
            const learColNames = learCols.rows.map(r => r.column_name);
            
            const missingCols = defaultColNames.filter(c => !learColNames.includes(c));
            const extraCols = learColNames.filter(c => !defaultColNames.includes(c));
            
            if (missingCols.length > 0 || extraCols.length > 0) {
                columnDifferences.push({
                    table: tableName,
                    missingCols,
                    extraCols,
                    defaultCount: defaultColNames.length,
                    learCount: learColNames.length
                });
            }
        }
        
        if (columnDifferences.length > 0) {
            console.log(`\n⚠️  Found ${columnDifferences.length} tables with column differences:\n`);
            
            columnDifferences.forEach(diff => {
                console.log(`\n📌 Table: ${diff.table}`);
                console.log(`   Columns: default=${diff.defaultCount}, lear=${diff.learCount}`);
                
                if (diff.missingCols.length > 0) {
                    console.log(`   ❌ Missing in lear: ${diff.missingCols.join(', ')}`);
                }
                if (diff.extraCols.length > 0) {
                    console.log(`   ➕ Extra in lear: ${diff.extraCols.join(', ')}`);
                }
            });
        } else {
            console.log('\n✅ All common tables have matching columns!\n');
        }
        
        // Check data counts for key tables
        console.log('\n' + '='.repeat(80));
        console.log('\n📊 Data Counts in school_lear_1291:\n');
        
        const keyTables = ['students', 'classes', 'teachers', 'behaviour_incidents', 
                          'merits', 'detentions', 'detention_sessions', 'attendance'];
        
        for (const table of keyTables) {
            if (learTableNames.includes(table)) {
                const count = await client.query(`
                    SELECT COUNT(*) as count FROM ${learSchema}.${table}
                `);
                console.log(`   ${table.padEnd(25)} ${count.rows[0].count} records`);
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('\n📋 SUMMARY:\n');
        
        if (missingInLear.length === 0 && columnDifferences.length === 0) {
            console.log('✅ Schemas are structurally identical!');
            console.log('✅ All tables and columns match between schemas.');
        } else {
            console.log(`⚠️  Found ${missingInLear.length} missing tables`);
            console.log(`⚠️  Found ${columnDifferences.length} tables with column differences`);
            console.log('\n💡 These differences may cause API errors if queries expect missing columns.');
        }
        
        console.log('\n' + '='.repeat(80) + '\n');
        
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
