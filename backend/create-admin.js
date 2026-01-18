const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kkmvxmbnmjbrwtfaihas:Murendeni246@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    
    // Check if admin exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@school.com']
    );
    
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4)',
        ['admin@school.com', hash, 'admin', 'School Admin']
      );
      console.log('Admin created: admin@school.com / admin123');
    } else {
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hash, 'admin@school.com']
      );
      console.log('Admin password updated: admin@school.com / admin123');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

createAdmin();
