const { pool } = require('./database/db');

async function fixAllMissingColumns() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Adding all missing columns to schema school_lear_1291...\n');
        
        const schema = 'school_lear_1291';
        
        // Fix behaviour_incidents table - add status column
        console.log('1️⃣  Adding status to behaviour_incidents...');
        try {
            await client.query(`
                ALTER TABLE ${schema}.behaviour_incidents 
                ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
            `);
            console.log('   ✅ Added status column');
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
        
        // Fix behaviour_incidents - add incident_type_id
        console.log('\n2️⃣  Adding incident_type_id to behaviour_incidents...');
        try {
            await client.query(`
                ALTER TABLE ${schema}.behaviour_incidents 
                ADD COLUMN IF NOT EXISTS incident_type_id INTEGER
            `);
            console.log('   ✅ Added incident_type_id column');
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
        
        // Fix merits table - add date_awarded if missing
        console.log('\n3️⃣  Checking merits table date columns...');
        const meritCols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'merits'
            AND column_name IN ('date_awarded', 'date')
        `, [schema]);
        
        const meritColNames = meritCols.rows.map(r => r.column_name);
        console.log(`   Has columns: ${meritColNames.join(', ')}`);
        
        if (!meritColNames.includes('date_awarded')) {
            try {
                await client.query(`
                    ALTER TABLE ${schema}.merits 
                    ADD COLUMN IF NOT EXISTS date_awarded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                `);
                console.log('   ✅ Added date_awarded column');
            } catch (err) {
                console.log(`   ⚠️  ${err.message}`);
            }
        }
        
        // Fix detention_assignments - add scheduled_date and scheduled_time
        console.log('\n4️⃣  Adding scheduled columns to detention_assignments...');
        try {
            await client.query(`
                ALTER TABLE ${schema}.detention_assignments 
                ADD COLUMN IF NOT EXISTS scheduled_date DATE
            `);
            console.log('   ✅ Added scheduled_date column');
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE ${schema}.detention_assignments 
                ADD COLUMN IF NOT EXISTS scheduled_time TIME
            `);
            console.log('   ✅ Added scheduled_time column');
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
        
        // Populate scheduled_date and scheduled_time from detention_sessions
        console.log('\n5️⃣  Populating scheduled dates from detention_sessions...');
        try {
            await client.query(`
                UPDATE ${schema}.detention_assignments da
                SET scheduled_date = ds.detention_date,
                    scheduled_time = ds.detention_time
                FROM ${schema}.detention_sessions ds
                WHERE da.detention_session_id = ds.id
                AND da.scheduled_date IS NULL
            `);
            console.log('   ✅ Populated scheduled dates');
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
        
        console.log('\n✅ All missing columns added!\n');
        
        // Show summary
        console.log('📋 Summary of fixes:');
        console.log('   - behaviour_incidents: added status, incident_type_id');
        console.log('   - merits: verified date columns');
        console.log('   - detention_assignments: added scheduled_date, scheduled_time');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

fixAllMissingColumns()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
