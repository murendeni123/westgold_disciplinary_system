const { pool } = require('./database/db');

async function diagnoseColumnMismatches() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Diagnosing column mismatches in schema school_lear_1291...\n');
        
        const schema = 'school_lear_1291';
        const issues = [];
        
        // Check teachers table
        console.log('1️⃣  Checking teachers table...');
        const teacherCols = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'teachers'
            ORDER BY ordinal_position
        `, [schema]);
        
        console.log(`   Columns (${teacherCols.rows.length}):`);
        teacherCols.rows.forEach(r => console.log(`      - ${r.column_name} (${r.data_type})`));
        
        const teacherColNames = teacherCols.rows.map(r => r.column_name);
        if (!teacherColNames.includes('name')) {
            issues.push('teachers table missing "name" column - needs to join with users table');
        }
        if (!teacherColNames.includes('class_teacher_of')) {
            issues.push('teachers table missing "class_teacher_of" column');
        }
        if (!teacherColNames.includes('is_active')) {
            issues.push('teachers table missing "is_active" column');
        }
        
        // Check merits table
        console.log('\n2️⃣  Checking merits table...');
        const meritCols = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'merits'
            ORDER BY ordinal_position
        `, [schema]);
        
        console.log(`   Columns (${meritCols.rows.length}):`);
        meritCols.rows.forEach(r => console.log(`      - ${r.column_name} (${r.data_type})`));
        
        const meritColNames = meritCols.rows.map(r => r.column_name);
        if (!meritColNames.includes('merit_type_id')) {
            issues.push('merits table has "merit_type" instead of "merit_type_id"');
        }
        if (!meritColNames.includes('date')) {
            issues.push('merits table missing "date" column (has date_awarded instead)');
        }
        
        // Check detention_assignments table
        console.log('\n3️⃣  Checking detention_assignments table...');
        const detAssignCols = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'detention_assignments'
            ORDER BY ordinal_position
        `, [schema]);
        
        console.log(`   Columns (${detAssignCols.rows.length}):`);
        detAssignCols.rows.forEach(r => console.log(`      - ${r.column_name} (${r.data_type})`));
        
        const detAssignColNames = detAssignCols.rows.map(r => r.column_name);
        if (!detAssignColNames.includes('detention_id')) {
            issues.push('detention_assignments has "detention_session_id" not "detention_id"');
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 ISSUES FOUND:\n');
        
        if (issues.length === 0) {
            console.log('✅ No column mismatches found!\n');
        } else {
            issues.forEach((issue, idx) => {
                console.log(`   ${idx + 1}. ${issue}`);
            });
            console.log('');
        }
        
        console.log('='.repeat(60));
        
        return issues;
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

diagnoseColumnMismatches()
    .then((issues) => {
        process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
