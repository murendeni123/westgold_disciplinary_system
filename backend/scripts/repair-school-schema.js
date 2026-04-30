/**
 * One-time repair script: create missing school schema for a school that has a DB record
 * but whose schema was never physically created.
 *
 * Usage: node scripts/repair-school-schema.js "Jan Viljoen"
 *        node scripts/repair-school-schema.js  (defaults to Jan Viljoen)
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('../database/db');

const schoolNameArg = process.argv[2] || 'Jan Viljoen';

async function main() {
    // 1. Look up the school
    const res = await pool.query(
        `SELECT id, name, schema_name FROM public.schools WHERE name ILIKE $1`,
        [`%${schoolNameArg}%`]
    );
    if (!res.rows.length) {
        console.error(`No school found matching: ${schoolNameArg}`);
        await pool.end(); process.exit(1);
    }
    const school = res.rows[0];
    console.log(`Found school: "${school.name}" (id=${school.id}, schema=${school.schema_name})`);

    // 2. Check if schema already exists and has tables
    const existsRes = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) AS exists`,
        [school.schema_name]
    );
    const schemaExists = existsRes.rows[0].exists;
    if (schemaExists) {
        const tablesCheck = await pool.query(
            `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = $1`,
            [school.schema_name]
        );
        if (parseInt(tablesCheck.rows[0].cnt) > 0) {
            console.log(`Schema ${school.schema_name} already exists with tables — nothing to do.`);
            await pool.end(); return;
        }
        console.log(`Schema ${school.schema_name} exists but has NO tables — will initialise tables now.`);
    }

    // 3. Read template SQL
    const templatePath = path.join(__dirname, '../database/school_schema_template.sql');
    if (!fs.existsSync(templatePath)) {
        console.error(`Template not found at: ${templatePath}`);
        await pool.end(); process.exit(1);
    }
    let sql = fs.readFileSync(templatePath, 'utf8');
    sql = sql.replace(/{SCHEMA_NAME}/g, school.schema_name);

    // 4. Execute all statements — use autocommit (no outer transaction) so one
    //    failing statement doesn't abort the rest.
    const client = await pool.connect();
    try {
        // Create the schema first — this MUST succeed before anything else
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${school.schema_name}`);
        console.log(`✅ Created schema: ${school.schema_name}`);

        // Set search_path so unqualified table names resolve correctly
        await client.query(`SET search_path TO ${school.schema_name}, public`);

        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let ok = 0, skip = 0, warn = 0;
        for (const stmt of statements) {
            // Strip leading comment lines so we can detect CREATE SCHEMA
            const stripped = stmt.replace(/^(--[^\n]*\n)*/g, '').trim();
            if (!stripped) { skip++; continue; }
            // Skip any CREATE SCHEMA lines already in the template
            if (/^\s*CREATE\s+SCHEMA/i.test(stripped)) { skip++; continue; }
            try {
                await client.query(stmt);
                ok++;
            } catch (err) {
                if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
                    skip++;
                } else {
                    console.warn(`  ⚠ ${err.message.slice(0, 150)}`);
                    warn++;
                }
            }
        }

        console.log(`✅ Schema initialised — ${ok} OK, ${skip} skipped, ${warn} warnings`);

        // 5. Verify
        const verifyRes = await client.query(
            `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) AS exists`,
            [school.schema_name]
        );
        if (!verifyRes.rows[0].exists) {
            throw new Error('Schema still missing after creation — check template SQL');
        }

        // List tables created
        const tablesRes = await client.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
            [school.schema_name]
        );
        console.log(`✅ Verified schema exists with tables: ${tablesRes.rows.map(r => r.table_name).join(', ') || 'NONE'}`);

    } catch (err) {
        console.error(`❌ Failed:`, err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
