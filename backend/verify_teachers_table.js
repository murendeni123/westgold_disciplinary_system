const { pool } = require('./database/db');

async function verifyTeachersTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Verifying teachers table structure in school_lear_1291...\n');
        console.log('='.repeat(80));
        
        const schema = 'school_lear_1291';
        
        // Get all columns in teachers table
        const columns = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'teachers'
            ORDER BY ordinal_position
        `, [schema]);
        
        console.log(`\n📊 Teachers table has ${columns.rows.length} columns:\n`);
        
        columns.rows.forEach((col, idx) => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
        });
        
        // Check if email column exists
        const hasEmail = columns.rows.some(col => col.column_name === 'email');
        const hasName = columns.rows.some(col => col.column_name === 'name');
        const hasPhone = columns.rows.some(col => col.column_name === 'phone');
        
        console.log('\n' + '='.repeat(80));
        console.log('\n📋 Column Check:\n');
        console.log(`   ${hasEmail ? '✅' : '❌'} email column`);
        console.log(`   ${hasName ? '✅' : '❌'} name column`);
        console.log(`   ${hasPhone ? '✅' : '❌'} phone column`);
        
        // Get current teacher data
        console.log('\n' + '='.repeat(80));
        console.log('\n👥 Current Teachers Data:\n');
        
        const teachers = await client.query(`
            SELECT t.*, u.name as user_name, u.email as user_email
            FROM ${schema}.teachers t
            LEFT JOIN public.users u ON t.user_id = u.id
        `);
        
        if (teachers.rows.length > 0) {
            teachers.rows.forEach((teacher, idx) => {
                console.log(`\n   Teacher ${idx + 1}:`);
                console.log(`      ID: ${teacher.id}`);
                console.log(`      User ID: ${teacher.user_id}`);
                console.log(`      Name (from users): ${teacher.user_name}`);
                console.log(`      Email (from users): ${teacher.user_email}`);
                if (hasName) console.log(`      Name (in teachers): ${teacher.name || 'NULL'}`);
                if (hasEmail) console.log(`      Email (in teachers): ${teacher.email || 'NULL'}`);
                if (hasPhone) console.log(`      Phone (in teachers): ${teacher.phone || 'NULL'}`);
            });
        } else {
            console.log('   No teachers found');
        }
        
        console.log('\n' + '='.repeat(80));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

verifyTeachersTable()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
