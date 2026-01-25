const { pool } = require('./database/db');

async function checkAndFixTeachersEmail() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking teachers table for email column...\n');
        
        const schema = 'school_lear_1291';
        
        // Check current columns
        const columns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'teachers'
            ORDER BY ordinal_position
        `, [schema]);
        
        const columnNames = columns.rows.map(r => r.column_name);
        console.log(`Current columns: ${columnNames.join(', ')}\n`);
        
        const hasEmail = columnNames.includes('email');
        const hasName = columnNames.includes('name');
        const hasPhone = columnNames.includes('phone');
        
        console.log(`Email column exists: ${hasEmail ? 'YES ✅' : 'NO ❌'}`);
        console.log(`Name column exists: ${hasName ? 'YES ✅' : 'NO ❌'}`);
        console.log(`Phone column exists: ${hasPhone ? 'YES ✅' : 'NO ❌'}\n`);
        
        // Add missing columns
        if (!hasEmail) {
            console.log('Adding email column...');
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN email TEXT`);
            console.log('✅ Email column added\n');
        }
        
        if (!hasName) {
            console.log('Adding name column...');
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN name TEXT`);
            console.log('✅ Name column added\n');
        }
        
        if (!hasPhone) {
            console.log('Adding phone column...');
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN phone TEXT`);
            console.log('✅ Phone column added\n');
        }
        
        // Populate from users table
        console.log('Populating teacher data from users table...');
        
        const updateResult = await client.query(`
            UPDATE ${schema}.teachers t
            SET 
                name = COALESCE(t.name, u.name),
                email = COALESCE(t.email, u.email),
                phone = COALESCE(t.phone, u.phone)
            FROM public.users u
            WHERE t.user_id = u.id
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} teacher records\n`);
        
        // Show final structure
        const finalCols = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'teachers'
            ORDER BY ordinal_position
        `, [schema]);
        
        console.log('Final teachers table structure:');
        finalCols.rows.forEach((col, idx) => {
            console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type}`);
        });
        
        // Show teacher data
        console.log('\nCurrent teacher data:');
        const teachers = await client.query(`SELECT * FROM ${schema}.teachers`);
        
        if (teachers.rows.length > 0) {
            teachers.rows.forEach(t => {
                console.log(`\n   Teacher ID ${t.id}:`);
                console.log(`      Name: ${t.name || 'NULL'}`);
                console.log(`      Email: ${t.email || 'NULL'}`);
                console.log(`      Phone: ${t.phone || 'NULL'}`);
                console.log(`      User ID: ${t.user_id}`);
            });
        }
        
        console.log('\n✅ Teachers table verification complete!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

checkAndFixTeachersEmail()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
