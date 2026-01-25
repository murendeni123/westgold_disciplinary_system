const { pool } = require('./database/db');
const bcrypt = require('bcryptjs');

async function checkPlatformAdmin() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking platform admin setup...\n');
        
        const email = process.env.PLATFORM_ADMIN_EMAIL || 'superadmin@pds.com';
        const password = process.env.PLATFORM_ADMIN_PASSWORD || 'superadmin123';
        
        console.log(`Expected credentials from .env:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}\n`);
        
        // Check if platform_users table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'platform_users'
            ) as exists
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ platform_users table does not exist!');
            console.log('   Run: node database/create_platform_admin.js\n');
            return;
        }
        
        console.log('✅ platform_users table exists\n');
        
        // Get platform admin
        const admin = await client.query(`
            SELECT * FROM public.platform_users WHERE email = $1
        `, [email]);
        
        if (admin.rows.length === 0) {
            console.log('❌ Platform admin not found in database!');
            console.log('   Run: node database/create_platform_admin.js\n');
            return;
        }
        
        const adminData = admin.rows[0];
        console.log('✅ Platform admin found:');
        console.log(`   ID: ${adminData.id}`);
        console.log(`   Email: ${adminData.email}`);
        console.log(`   Name: ${adminData.name}`);
        console.log(`   Created: ${adminData.created_at}\n`);
        
        // Test password
        console.log('🔐 Testing password...');
        const isValid = await bcrypt.compare(password, adminData.password_hash);
        console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
        
        if (!isValid) {
            console.log('⚠️  Password in .env does not match database!');
            console.log('   Either update .env or recreate platform admin\n');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

checkPlatformAdmin()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
