require('dotenv').config();
const { pool } = require('../database/db');

async function main() {
    const school = await pool.query(
        `SELECT id, name, schema_name, plan_type, status FROM public.schools WHERE name ILIKE $1`,
        ['%jan viljoen%']
    );
    if (!school.rows.length) { console.log('School not found'); await pool.end(); return; }
    const s = school.rows[0];
    console.log('\n=== School ===');
    console.log(s);

    const users = await pool.query(`
        SELECT u.id, u.email, u.name, u.role, u.is_active,
               CASE WHEN u.password      IS NOT NULL THEN 'SET' ELSE 'NULL' END AS password_col,
               CASE WHEN u.password_hash IS NOT NULL THEN 'SET' ELSE 'NULL' END AS password_hash_col,
               us.role_in_school
        FROM public.users u
        JOIN public.user_schools us ON u.id = us.user_id
        WHERE us.school_id = $1
    `, [s.id]);
    console.log('\n=== Linked Users ===');
    users.rows.forEach(u => console.log(u));

    await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
