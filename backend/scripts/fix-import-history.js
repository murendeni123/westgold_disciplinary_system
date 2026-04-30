/**
 * Migration: fix import_history in every school schema.
 *  - Creates the table if it is missing
 *  - Widens VARCHAR(20) columns (status, mode, academic_year) to VARCHAR(100)
 *    so values like 'completed_with_errors' (21 chars) no longer overflow
 */
require('dotenv').config();
const { pool } = require('../database/db');

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS import_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    user_id  INTEGER NOT NULL,
    import_type VARCHAR(50)  NOT NULL DEFAULT 'students',
    file_name   VARCHAR(255),
    mode        VARCHAR(100) NOT NULL DEFAULT 'upsert',
    academic_year VARCHAR(100),
    total_rows    INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    failed_count  INTEGER DEFAULT 0,
    classes_created INTEGER DEFAULT 0,
    status       VARCHAR(100) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_import_history_school   ON import_history(school_id);
CREATE INDEX IF NOT EXISTS idx_import_history_user     ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created  ON import_history(created_at DESC);
`;

async function fixSchema(client, schemaName) {
    await client.query(`SET search_path TO ${schemaName}, public`);

    // 1. Create table if missing
    for (const stmt of CREATE_SQL.split(';').map(s => s.trim()).filter(Boolean)) {
        try { await client.query(stmt); } catch (e) {
            if (!e.message.includes('already exists')) {
                console.warn(`  ${schemaName}: ${e.message}`);
            }
        }
    }

    // 2. Widen VARCHAR(20) columns that are known to overflow
    const wideCols = ['status', 'mode', 'academic_year'];
    for (const col of wideCols) {
        try {
            await client.query(
                `ALTER TABLE import_history ALTER COLUMN ${col} TYPE VARCHAR(100)`
            );
        } catch (e) {
            if (!e.message.includes('does not exist')) {
                console.warn(`  ${schemaName}.import_history.${col}: ${e.message}`);
            }
        }
    }
}

async function main() {
    const schemasRes = await pool.query(`
        SELECT schema_name FROM information_schema.schemata
        WHERE schema_name LIKE 'school_%'
        ORDER BY schema_name
    `);
    const schemas = schemasRes.rows.map(r => r.schema_name);
    console.log(`Fixing import_history in ${schemas.length} school schemas…\n`);

    const client = await pool.connect();
    try {
        for (const schema of schemas) {
            await fixSchema(client, schema);
            console.log(`  ✅ ${schema}`);
        }
    } finally {
        client.release();
        await pool.end();
    }
    console.log('\nDone.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
