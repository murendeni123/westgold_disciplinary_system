const { pool } = require('./database/db');

async function fixCriticalIssues() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing critical issues in schema school_lear_1291...\n');
        
        // Issue 1: Add missing columns to behaviour_incidents
        console.log('1️⃣  Adding missing columns to behaviour_incidents...');
        
        try {
            await client.query(`
                ALTER TABLE school_lear_1291.behaviour_incidents 
                ADD COLUMN IF NOT EXISTS points_deducted INTEGER DEFAULT 0
            `);
            console.log('   ✅ Added points_deducted column');
        } catch (err) {
            console.log(`   ⚠️  points_deducted: ${err.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE school_lear_1291.behaviour_incidents 
                ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false
            `);
            console.log('   ✅ Added follow_up_required column');
        } catch (err) {
            console.log(`   ⚠️  follow_up_required: ${err.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE school_lear_1291.behaviour_incidents 
                ADD COLUMN IF NOT EXISTS follow_up_notes TEXT
            `);
            console.log('   ✅ Added follow_up_notes column');
        } catch (err) {
            console.log(`   ⚠️  follow_up_notes: ${err.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE school_lear_1291.behaviour_incidents 
                ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false
            `);
            console.log('   ✅ Added resolved column');
        } catch (err) {
            console.log(`   ⚠️  resolved: ${err.message}`);
        }
        
        // Issue 2: Create import_history table in schema
        console.log('\n2️⃣  Creating import_history table...');
        
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS school_lear_1291.import_history (
                    id SERIAL PRIMARY KEY,
                    school_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    import_type VARCHAR(50) NOT NULL,
                    file_name VARCHAR(255),
                    mode VARCHAR(20) NOT NULL DEFAULT 'upsert',
                    academic_year VARCHAR(20),
                    total_rows INTEGER DEFAULT 0,
                    created_count INTEGER DEFAULT 0,
                    updated_count INTEGER DEFAULT 0,
                    skipped_count INTEGER DEFAULT 0,
                    failed_count INTEGER DEFAULT 0,
                    classes_created INTEGER DEFAULT 0,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    error_message TEXT,
                    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('   ✅ Created import_history table');
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_import_history_school 
                ON school_lear_1291.import_history(school_id)
            `);
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_import_history_user 
                ON school_lear_1291.import_history(user_id)
            `);
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_import_history_created 
                ON school_lear_1291.import_history(created_at DESC)
            `);
            console.log('   ✅ Created indexes');
        } catch (err) {
            console.log(`   ⚠️  import_history: ${err.message}`);
        }
        
        // Verify fixes
        console.log('\n✅ Verifying fixes...\n');
        
        const biCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_schema = 'school_lear_1291' 
            AND table_name = 'behaviour_incidents'
            ORDER BY ordinal_position
        `);
        
        console.log(`behaviour_incidents now has ${biCols.rows.length} columns:`);
        biCols.rows.forEach(r => console.log(`   - ${r.column_name}`));
        
        const ihExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'school_lear_1291' 
                AND table_name = 'import_history'
            )
        `);
        
        console.log(`\nimport_history table exists: ${ihExists.rows[0].exists ? '✅ Yes' : '❌ No'}`);
        
        console.log('\n🎉 All critical issues fixed!\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

fixCriticalIssues()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
