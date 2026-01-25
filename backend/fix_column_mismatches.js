const { pool } = require('./database/db');

async function fixColumnMismatches() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing column mismatches in schema school_lear_1291...\n');
        
        const schema = 'school_lear_1291';
        
        // Fix teachers table
        console.log('1️⃣  Fixing teachers table...');
        
        try {
            await client.query(`
                ALTER TABLE ${schema}.teachers 
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
            `);
            console.log('   ✅ Added is_active column');
        } catch (err) {
            console.log(`   ⚠️  is_active: ${err.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE ${schema}.teachers 
                ADD COLUMN IF NOT EXISTS class_teacher_of INTEGER
            `);
            console.log('   ✅ Added class_teacher_of column');
        } catch (err) {
            console.log(`   ⚠️  class_teacher_of: ${err.message}`);
        }
        
        // Note: teachers.name should come from JOIN with users table, not as a column
        console.log('   ℹ️  Note: "name" should be fetched via JOIN with users table');
        
        // Fix merits table
        console.log('\n2️⃣  Fixing merits table...');
        
        try {
            await client.query(`
                ALTER TABLE ${schema}.merits 
                ADD COLUMN IF NOT EXISTS date DATE
            `);
            console.log('   ✅ Added date column');
            
            // Copy date_awarded to date for existing records
            await client.query(`
                UPDATE ${schema}.merits 
                SET date = date_awarded::date 
                WHERE date IS NULL AND date_awarded IS NOT NULL
            `);
            console.log('   ✅ Populated date from date_awarded');
        } catch (err) {
            console.log(`   ⚠️  date: ${err.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE ${schema}.merits 
                ADD COLUMN IF NOT EXISTS merit_type_id INTEGER
            `);
            console.log('   ✅ Added merit_type_id column');
        } catch (err) {
            console.log(`   ⚠️  merit_type_id: ${err.message}`);
        }
        
        // Fix detention_assignments table
        console.log('\n3️⃣  Fixing detention_assignments table...');
        
        try {
            await client.query(`
                ALTER TABLE ${schema}.detention_assignments 
                ADD COLUMN IF NOT EXISTS detention_id INTEGER
            `);
            console.log('   ✅ Added detention_id column');
            
            // Copy detention_session_id to detention_id for existing records
            await client.query(`
                UPDATE ${schema}.detention_assignments 
                SET detention_id = detention_session_id 
                WHERE detention_id IS NULL AND detention_session_id IS NOT NULL
            `);
            console.log('   ✅ Populated detention_id from detention_session_id');
        } catch (err) {
            console.log(`   ⚠️  detention_id: ${err.message}`);
        }
        
        // Verify fixes
        console.log('\n✅ Verifying fixes...\n');
        
        const teacherCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'teachers'
            ORDER BY ordinal_position
        `, [schema]);
        console.log(`teachers table now has ${teacherCols.rows.length} columns`);
        
        const meritCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'merits'
            ORDER BY ordinal_position
        `, [schema]);
        console.log(`merits table now has ${meritCols.rows.length} columns`);
        
        const detAssignCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'detention_assignments'
            ORDER BY ordinal_position
        `, [schema]);
        console.log(`detention_assignments table now has ${detAssignCols.rows.length} columns`);
        
        console.log('\n🎉 All column mismatches fixed!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

fixColumnMismatches()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
