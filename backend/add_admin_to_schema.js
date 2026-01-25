const { dbGet, dbAll } = require('./database/db');

async function addAdminToSchema() {
    try {
        console.log('🔍 Checking teachers table structure...\n');
        
        // Get table structure
        const columns = await dbAll(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'school_lear_1291' 
            AND table_name = 'teachers'
            ORDER BY ordinal_position
        `);
        
        console.log('Teachers table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
        
        // Check if admin already exists
        const existingTeacher = await dbGet(`
            SELECT * FROM teachers WHERE user_id = 73
        `, [], 'school_lear_1291');
        
        if (existingTeacher) {
            console.log('\n✅ Admin (User 73) already exists in schema');
            console.log(`   ID: ${existingTeacher.id}`);
            process.exit(0);
        }
        
        console.log('\n📝 Creating admin teacher record...');
        
        // Create minimal teacher record (only user_id required)
        const result = await dbAll(`
            INSERT INTO teachers (user_id)
            VALUES ($1)
            RETURNING *
        `, [73], 'school_lear_1291');
        
        if (result && result.length > 0) {
            console.log('\n✅ SUCCESS! Admin teacher record created:');
            console.log(`   ID: ${result[0].id}`);
            console.log(`   User ID: ${result[0].user_id}`);
            console.log('\n🎉 Admin can now import students and access all features!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addAdminToSchema();
