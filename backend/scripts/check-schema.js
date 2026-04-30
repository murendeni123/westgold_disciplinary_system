require('dotenv').config();
const { pool } = require('../database/db');

async function main() {
    const school = await pool.query(
        `SELECT id, name, schema_name FROM public.schools WHERE name ILIKE $1`,
        ['%jan viljoen%']
    );
    const s = school.rows[0];
    if (!s) { console.log('School not found'); await pool.end(); return; }

    const exists = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) as exists`,
        [s.schema_name]
    );
    console.log(`School: ${s.name} | Schema: ${s.schema_name} | Exists: ${exists.rows[0].exists}`);

    if (exists.rows[0].exists) {
        const tables = await pool.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
            [s.schema_name]
        );
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', ') || 'NONE');
    }
    await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
