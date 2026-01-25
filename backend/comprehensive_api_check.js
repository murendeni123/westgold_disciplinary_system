const { pool, dbGet, dbAll } = require('./database/db');

async function comprehensiveCheck() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 COMPREHENSIVE API & DATABASE CHECK\n');
        console.log('='.repeat(60));
        
        const schema = 'school_lear_1291';
        const issues = [];
        const warnings = [];
        
        // 1. Check behaviour_incidents table structure
        console.log('\n1️⃣  Checking behaviour_incidents table...');
        const biColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'behaviour_incidents'
            ORDER BY ordinal_position
        `, [schema]);
        
        console.log(`   Found ${biColumns.rows.length} columns`);
        const biColNames = biColumns.rows.map(r => r.column_name);
        
        const requiredBiCols = ['points_deducted', 'follow_up_required', 'severity', 'incident_type'];
        const missingBiCols = requiredBiCols.filter(col => !biColNames.includes(col));
        
        if (missingBiCols.length > 0) {
            issues.push(`behaviour_incidents missing columns: ${missingBiCols.join(', ')}`);
            console.log(`   ❌ Missing columns: ${missingBiCols.join(', ')}`);
        } else {
            console.log(`   ✅ All required columns present`);
        }
        
        // 2. Check students table
        console.log('\n2️⃣  Checking students table...');
        const studentCount = await client.query(`
            SELECT COUNT(*) as count FROM ${schema}.students
        `);
        console.log(`   Students: ${studentCount.rows[0].count}`);
        
        if (studentCount.rows[0].count === '0') {
            warnings.push('No students in database');
        }
        
        // 3. Check teachers table
        console.log('\n3️⃣  Checking teachers table...');
        const teacherCount = await client.query(`
            SELECT COUNT(*) as count FROM ${schema}.teachers
        `);
        console.log(`   Teachers: ${teacherCount.rows[0].count}`);
        
        // 4. Check classes table
        console.log('\n4️⃣  Checking classes table...');
        const classCount = await client.query(`
            SELECT COUNT(*) as count FROM ${schema}.classes
        `);
        console.log(`   Classes: ${classCount.rows[0].count}`);
        
        if (classCount.rows[0].count === '0') {
            warnings.push('No classes in database');
        }
        
        // 5. Check detention_sessions table
        console.log('\n5️⃣  Checking detention_sessions table...');
        const detentionCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'detention_sessions'
        `, [schema]);
        console.log(`   ✅ Table exists with ${detentionCols.rows.length} columns`);
        
        // 6. Check merits table
        console.log('\n6️⃣  Checking merits table...');
        const meritCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'merits'
        `, [schema]);
        console.log(`   ✅ Table exists with ${meritCols.rows.length} columns`);
        
        // 7. Check attendance table
        console.log('\n7️⃣  Checking attendance table...');
        const attendanceCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'attendance'
        `, [schema]);
        console.log(`   ✅ Table exists with ${attendanceCols.rows.length} columns`);
        
        // 8. Check messages table
        console.log('\n8️⃣  Checking messages table...');
        const messageCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'messages'
        `, [schema]);
        console.log(`   ✅ Table exists with ${messageCols.rows.length} columns`);
        
        // 9. Check notifications table
        console.log('\n9️⃣  Checking notifications table...');
        const notifCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'notifications'
        `, [schema]);
        console.log(`   ✅ Table exists with ${notifCols.rows.length} columns`);
        
        // 10. Check import_history table (in public schema)
        console.log('\n🔟 Checking import_history table...');
        const importCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'import_history'
        `, [schema]);
        
        if (importCols.rows.length > 0) {
            console.log(`   ✅ Table exists with ${importCols.rows.length} columns`);
        } else {
            issues.push('import_history table not found in schema');
            console.log(`   ❌ Table not found`);
        }
        
        // 11. Check all table counts
        console.log('\n📊 Data Summary:');
        const tables = ['students', 'teachers', 'classes', 'behaviour_incidents', 
                       'merits', 'attendance', 'detentions', 'detention_sessions',
                       'messages', 'notifications'];
        
        for (const table of tables) {
            try {
                const count = await client.query(`SELECT COUNT(*) as count FROM ${schema}.${table}`);
                const c = count.rows[0].count;
                console.log(`   ${table.padEnd(25)} ${c.toString().padStart(6)} records`);
            } catch (err) {
                console.log(`   ${table.padEnd(25)} ❌ ERROR`);
                issues.push(`Cannot query ${table}: ${err.message}`);
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY\n');
        
        if (issues.length === 0 && warnings.length === 0) {
            console.log('✅ ALL CHECKS PASSED - No issues found!\n');
        } else {
            if (issues.length > 0) {
                console.log(`❌ CRITICAL ISSUES (${issues.length}):`);
                issues.forEach((issue, idx) => {
                    console.log(`   ${idx + 1}. ${issue}`);
                });
                console.log('');
            }
            
            if (warnings.length > 0) {
                console.log(`⚠️  WARNINGS (${warnings.length}):`);
                warnings.forEach((warning, idx) => {
                    console.log(`   ${idx + 1}. ${warning}`);
                });
                console.log('');
            }
        }
        
        console.log('='.repeat(60));
        
        return { issues, warnings };
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

comprehensiveCheck()
    .then(({ issues, warnings }) => {
        if (issues.length > 0) {
            console.log('\n🔧 RECOMMENDED ACTIONS:');
            if (issues.some(i => i.includes('behaviour_incidents missing columns'))) {
                console.log('   1. Add missing columns to behaviour_incidents table');
            }
            if (issues.some(i => i.includes('import_history'))) {
                console.log('   2. Create import_history table in schema');
            }
        }
        process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
