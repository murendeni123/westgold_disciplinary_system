// Script to create platform admin credentials in the database

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('./db');

const createPlatformAdmin = async () => {
  try {
    console.log('Creating platform admin credentials...');

    const email = process.env.PLATFORM_ADMIN_EMAIL || 'superadmin@pds.com';
    const password = process.env.PLATFORM_ADMIN_PASSWORD || 'superadmin123';
    const name = process.env.PLATFORM_ADMIN_NAME || 'Super Admin';

    // Check if platform_users table exists, if not create it
    const usePostgres = !!process.env.DATABASE_URL;
    
    let tableExists = false;
    if (usePostgres) {
      const result = await dbGet(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'platform_users'
        )
      `);
      tableExists = result?.exists || false;
    } else {
      // SQLite check
      try {
        await dbGet('SELECT 1 FROM platform_users LIMIT 1');
        tableExists = true;
      } catch {
        tableExists = false;
      }
    }

    if (!tableExists) {
      console.log('Creating platform_users table...');
      if (usePostgres) {
        await dbRun(`
          CREATE TABLE IF NOT EXISTS platform_users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'platform_admin',
            is_active INTEGER DEFAULT 1,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        await dbRun(`
          CREATE TABLE IF NOT EXISTS platform_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'platform_admin',
            is_active INTEGER DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
      console.log('✅ platform_users table created');
    }

    // Check if platform admin already exists
    const existing = await dbGet('SELECT id FROM platform_users WHERE email = ?', [email]);

    if (existing) {
      console.log('⚠️  Platform admin already exists. Updating password...');
      const passwordHash = await bcrypt.hash(password, 10);
      await dbRun(
        'UPDATE platform_users SET password_hash = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
        [passwordHash, name, email]
      );
      console.log('✅ Platform admin password updated');
    } else {
      console.log('Creating new platform admin...');
      const passwordHash = await bcrypt.hash(password, 10);
      await dbRun(
        `INSERT INTO platform_users (email, password_hash, name, role, is_active)
         VALUES (?, ?, ?, 'platform_admin', 1)`,
        [email, passwordHash, name]
      );
      console.log('✅ Platform admin created successfully');
    }

    // Display credentials
    console.log('\n📋 Platform Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name:     ${name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Platform admin setup completed successfully');
  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createPlatformAdmin()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = createPlatformAdmin;

