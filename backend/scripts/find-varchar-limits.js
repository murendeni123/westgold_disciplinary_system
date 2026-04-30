/**
 * Find all VARCHAR(20) columns across all school schemas and public schema.
 * Reports them so we can ALTER them to VARCHAR(100).
 */
require('dotenv').config();
const { pool } = require('../database/db');

async function main() {
    // Find all varchar columns with character_maximum_length <= 50 (flag anything short)
    const res = await pool.query(`
        SELECT table_schema, table_name, column_name, character_maximum_length
        FROM information_schema.columns
        WHERE data_type = 'character varying'
          AND character_maximum_length IS NOT NULL
          AND character_maximum_length <= 50
        ORDER BY character_maximum_length, table_schema, table_name, column_name
    `);

    if (!res.rows.length) {
        console.log('No VARCHAR columns with limits <= 50 found.');
    } else {
        console.log(`Found ${res.rows.length} short VARCHAR columns:\n`);
        res.rows.forEach(r => {
            console.log(`  ${r.table_schema}.${r.table_name}.${r.column_name}  →  VARCHAR(${r.character_maximum_length})`);
        });
    }

    await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
