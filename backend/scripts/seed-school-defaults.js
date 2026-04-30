/**
 * Seed default incident types, merit types and intervention types for a school
 * whose schema was repaired after a failed onboarding.
 *
 * Usage: node scripts/seed-school-defaults.js "Jan Viljoen"
 */
require('dotenv').config();
const { pool } = require('../database/db');
const { seedDefaultTypes } = require('../database/seedDefaultTypes');

const schoolNameArg = process.argv[2] || 'Jan Viljoen';

async function main() {
    const res = await pool.query(
        `SELECT id, name, schema_name FROM public.schools WHERE name ILIKE $1`,
        [`%${schoolNameArg}%`]
    );
    if (!res.rows.length) {
        console.error(`No school found matching: ${schoolNameArg}`);
        await pool.end(); process.exit(1);
    }
    const school = res.rows[0];
    console.log(`Seeding defaults for: "${school.name}" (id=${school.id}, schema=${school.schema_name})`);

    const result = await seedDefaultTypes(school.id, school.schema_name);
    if (result.success) {
        console.log('✅ Seeded defaults:', result.counts || result);
    } else {
        console.error('❌ Seed failed:', result.error);
    }

    await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
