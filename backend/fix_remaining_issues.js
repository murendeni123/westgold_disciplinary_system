const { pool } = require('./database/db');

async function fixRemainingIssues() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing remaining schema issues...\n');
        console.log('='.repeat(80));
        
        const schema = 'school_lear_1291';
        let fixCount = 0;
        
        // Fix 1: Add updated_at to public.users table
        console.log('\n1️⃣  Fixing public.users table...');
        try {
            await client.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
            console.log('   ✅ Added updated_at to public.users');
            fixCount++;
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
        
        // Fix 2: behaviour.js query missing users JOIN
        console.log('\n2️⃣  Checking behaviour_incidents queries...');
        console.log('   ℹ️  Note: behaviour.js needs manual fix to add users JOIN');
        console.log('   ℹ️  Query should include: LEFT JOIN public.users u ON t.user_id = u.id');
        
        // Fix 3: Check and add missing columns to various tables
        console.log('\n3️⃣  Checking for other missing columns...');
        
        // Check if parents table has all needed columns
        const parentCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'parents'
        `, [schema]);
        
        const parentColNames = parentCols.rows.map(r => r.column_name);
        console.log(`   Parents table has ${parentColNames.length} columns: ${parentColNames.join(', ')}`);
        
        if (!parentColNames.includes('phone')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS phone TEXT`);
            console.log('   ✅ Added phone to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('relationship_to_child')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS relationship_to_child TEXT`);
            console.log('   ✅ Added relationship_to_child to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('home_address')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS home_address TEXT`);
            console.log('   ✅ Added home_address to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('city')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS city TEXT`);
            console.log('   ✅ Added city to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('postal_code')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS postal_code TEXT`);
            console.log('   ✅ Added postal_code to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('emergency_contact_1_name')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS emergency_contact_1_name TEXT`);
            console.log('   ✅ Added emergency_contact_1_name to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('emergency_contact_1_phone')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS emergency_contact_1_phone TEXT`);
            console.log('   ✅ Added emergency_contact_1_phone to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('work_phone')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS work_phone TEXT`);
            console.log('   ✅ Added work_phone to parents');
            fixCount++;
        }
        
        if (!parentColNames.includes('preferred_contact_method')) {
            await client.query(`ALTER TABLE ${schema}.parents ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT`);
            console.log('   ✅ Added preferred_contact_method to parents');
            fixCount++;
        }
        
        // Check messages table
        console.log('\n4️⃣  Checking messages table...');
        const messageCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'messages'
        `, [schema]);
        
        const messageColNames = messageCols.rows.map(r => r.column_name);
        console.log(`   Messages table has ${messageColNames.length} columns: ${messageColNames.join(', ')}`);
        
        // Verify critical tables exist
        console.log('\n5️⃣  Verifying critical reference tables...');
        
        const tables = ['incident_types', 'merit_types', 'consequence_types', 'intervention_types'];
        for (const table of tables) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = $1 AND table_name = $2
                ) as exists
            `, [schema, table]);
            
            if (exists.rows[0].exists) {
                const count = await client.query(`SELECT COUNT(*) as count FROM ${schema}.${table}`);
                console.log(`   ✅ ${table}: exists (${count.rows[0].count} records)`);
            } else {
                console.log(`   ⚠️  ${table}: MISSING`);
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n✅ Applied ${fixCount} fixes\n`);
        
        // Summary of remaining manual fixes needed
        console.log('📋 MANUAL FIXES NEEDED:\n');
        console.log('1. routes/behaviour.js - Add users JOIN to incident detail query:');
        console.log('   LEFT JOIN public.users u ON t.user_id = u.id');
        console.log('');
        console.log('2. Verify all reference tables (incident_types, merit_types, etc.) have data');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

fixRemainingIssues()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
