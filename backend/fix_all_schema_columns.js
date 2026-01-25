const { pool } = require('./database/db');

async function fixAllSchemaColumns() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Adding all missing columns to school_lear_1291...\n');
        
        const schema = 'school_lear_1291';
        let fixCount = 0;
        
        // Fix classes table
        console.log('1️⃣  Fixing classes table...');
        try {
            await client.query(`ALTER TABLE ${schema}.classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
            console.log('   ✅ Added is_active');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        // Fix teachers table - add name column (will be populated from users)
        console.log('\n2️⃣  Fixing teachers table...');
        try {
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN IF NOT EXISTS name TEXT`);
            console.log('   ✅ Added name column');
            fixCount++;
            
            // Populate name from users table
            await client.query(`
                UPDATE ${schema}.teachers t
                SET name = u.name
                FROM public.users u
                WHERE t.user_id = u.id AND t.name IS NULL
            `);
            console.log('   ✅ Populated names from users table');
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN IF NOT EXISTS email TEXT`);
            console.log('   ✅ Added email column');
            fixCount++;
            
            // Populate email from users table
            await client.query(`
                UPDATE ${schema}.teachers t
                SET email = u.email
                FROM public.users u
                WHERE t.user_id = u.id AND t.email IS NULL
            `);
            console.log('   ✅ Populated emails from users table');
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN IF NOT EXISTS phone TEXT`);
            console.log('   ✅ Added phone column');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN IF NOT EXISTS employee_id TEXT`);
            console.log('   ✅ Added employee_id column');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`);
            console.log('   ✅ Added is_admin column');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.teachers ADD COLUMN IF NOT EXISTS photo_path TEXT`);
            console.log('   ✅ Added photo_path column');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        // Fix attendance table
        console.log('\n3️⃣  Fixing attendance table...');
        try {
            await client.query(`ALTER TABLE ${schema}.attendance ADD COLUMN IF NOT EXISTS notes TEXT`);
            console.log('   ✅ Added notes');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.attendance ADD COLUMN IF NOT EXISTS recorded_by INTEGER`);
            console.log('   ✅ Added recorded_by');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        // Fix behaviour_incidents table
        console.log('\n4️⃣  Fixing behaviour_incidents table...');
        try {
            await client.query(`ALTER TABLE ${schema}.behaviour_incidents ADD COLUMN IF NOT EXISTS date DATE`);
            console.log('   ✅ Added date');
            fixCount++;
            
            // Populate from date_occurred
            await client.query(`
                UPDATE ${schema}.behaviour_incidents 
                SET date = date_occurred::date 
                WHERE date IS NULL AND date_occurred IS NOT NULL
            `);
            console.log('   ✅ Populated date from date_occurred');
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.behaviour_incidents ADD COLUMN IF NOT EXISTS time TIME`);
            console.log('   ✅ Added time');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.behaviour_incidents ADD COLUMN IF NOT EXISTS location TEXT`);
            console.log('   ✅ Added location');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.behaviour_incidents ADD COLUMN IF NOT EXISTS witnesses TEXT`);
            console.log('   ✅ Added witnesses');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.behaviour_incidents ADD COLUMN IF NOT EXISTS action_taken TEXT`);
            console.log('   ✅ Added action_taken');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.behaviour_incidents ADD COLUMN IF NOT EXISTS parent_notified BOOLEAN DEFAULT false`);
            console.log('   ✅ Added parent_notified');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        // Fix detention_sessions table
        console.log('\n5️⃣  Fixing detention_sessions table...');
        try {
            await client.query(`ALTER TABLE ${schema}.detention_sessions ADD COLUMN IF NOT EXISTS end_time TIME`);
            console.log('   ✅ Added end_time');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.detention_sessions ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0`);
            console.log('   ✅ Added current_count');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.detention_sessions ADD COLUMN IF NOT EXISTS created_by INTEGER`);
            console.log('   ✅ Added created_by');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        // Fix notifications table
        console.log('\n6️⃣  Fixing notifications table...');
        try {
            await client.query(`ALTER TABLE ${schema}.notifications ADD COLUMN IF NOT EXISTS related_id INTEGER`);
            console.log('   ✅ Added related_id');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        try {
            await client.query(`ALTER TABLE ${schema}.notifications ADD COLUMN IF NOT EXISTS related_type TEXT`);
            console.log('   ✅ Added related_type');
            fixCount++;
        } catch (err) { console.log(`   ⚠️  ${err.message}`); }
        
        console.log(`\n✅ Applied ${fixCount} column fixes!\n`);
        
        // Verify key tables
        console.log('🔍 Verifying key table structures...\n');
        
        const tables = ['classes', 'teachers', 'students', 'behaviour_incidents'];
        for (const table of tables) {
            const cols = await client.query(`
                SELECT column_name 
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
            `, [schema, table]);
            console.log(`${table}: ${cols.rows.length} columns`);
        }
        
        console.log('\n🎉 Schema fixes complete!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

fixAllSchemaColumns()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
