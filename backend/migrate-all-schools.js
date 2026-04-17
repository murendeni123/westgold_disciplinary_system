/**
 * migrate-all-schools.js
 *
 * Adds missing columns to detention_assignments in every school schema.
 * Run once: node backend/migrate-all-schools.js
 *
 * Safe to run multiple times — every ALTER uses IF NOT EXISTS / EXCEPTION WHEN.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // 1. Discover all school schemas (tables that have detention_sessions)
    const { rows: schemas } = await client.query(`
      SELECT DISTINCT table_schema AS schema
      FROM information_schema.tables
      WHERE table_name = 'detention_sessions'
        AND table_schema NOT IN ('public','pg_catalog','information_schema')
      ORDER BY 1
    `);

    console.log(`Found ${schemas.length} school schema(s): ${schemas.map(r => r.schema).join(', ')}\n`);

    for (const { schema } of schemas) {
      console.log(`── Migrating ${schema} ──────────────────────────────`);
      await client.query(`SET search_path TO ${schema}, public`);

      // ── A. Rename detention_session_id → detention_id (add_detention_tables.js bug) ──
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '${schema}' AND table_name = 'detention_assignments'
              AND column_name = 'detention_session_id'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '${schema}' AND table_name = 'detention_assignments'
              AND column_name = 'detention_id'
          ) THEN
            ALTER TABLE detention_assignments RENAME COLUMN detention_session_id TO detention_id;
            RAISE NOTICE 'Renamed detention_session_id -> detention_id';
          END IF;
        END $$;
      `);

      // ── B. Add missing columns ──────────────────────────────────────────
      const addCols = [
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN reason TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN attendance_time TIME; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN departure_time TIME; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN behavior_during TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN parent_notified BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN parent_notified_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_assignments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_sessions ADD COLUMN is_frozen BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_sessions ADD COLUMN completed_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
        `DO $$ BEGIN ALTER TABLE detention_sessions ADD COLUMN current_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
      ];

      for (const sql of addCols) {
        await client.query(sql);
      }

      // ── C. Fix detention_sessions status CHECK (add 'in_progress') ──────
      await client.query(`
        DO $$
        DECLARE r RECORD;
        BEGIN
          FOR r IN
            SELECT constraint_name FROM information_schema.check_constraints
            WHERE constraint_schema = '${schema}'
              AND constraint_name LIKE '%detention_sessions%status%'
          LOOP
            EXECUTE 'ALTER TABLE detention_sessions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
          END LOOP;
        END $$;
      `);
      await client.query(`ALTER TABLE detention_sessions DROP CONSTRAINT IF EXISTS detention_sessions_status_check`);
      await client.query(`
        ALTER TABLE detention_sessions
          ADD CONSTRAINT detention_sessions_status_check
          CHECK (status IN ('scheduled','in_progress','completed','cancelled'))
      `);

      // ── D. Fix detention_assignments status CHECK ──────────────────────
      await client.query(`
        DO $$
        DECLARE r RECORD;
        BEGIN
          FOR r IN
            SELECT constraint_name FROM information_schema.check_constraints
            WHERE constraint_schema = '${schema}'
              AND constraint_name LIKE '%detention_assignments%status%'
          LOOP
            EXECUTE 'ALTER TABLE detention_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
          END LOOP;
        END $$;
      `);
      await client.query(`ALTER TABLE detention_assignments DROP CONSTRAINT IF EXISTS detention_assignments_status_check`);
      await client.query(`
        ALTER TABLE detention_assignments
          ADD CONSTRAINT detention_assignments_status_check
          CHECK (status IN ('pending','assigned','attended','absent','late','excused','rescheduled'))
      `);

      // ── E. Fix FK on detention_id -> detention_sessions ─────────────────
      await client.query(`
        DO $$
        DECLARE r RECORD;
        BEGIN
          FOR r IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = '${schema}'
              AND tc.table_name = 'detention_assignments'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'detention_id'
          LOOP
            RAISE NOTICE 'Dropping old FK: %', r.constraint_name;
            EXECUTE 'ALTER TABLE detention_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
          END LOOP;
        END $$;
      `);
      await client.query(`
        DO $$
        BEGIN
          ALTER TABLE detention_assignments
            ADD CONSTRAINT da_detention_sessions_fk
            FOREIGN KEY (detention_id) REFERENCES detention_sessions(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // ── F. Make assigned_by nullable ────────────────────────────────────
      await client.query(`
        DO $$ BEGIN ALTER TABLE detention_assignments ALTER COLUMN assigned_by DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL; END $$;
      `);

      // ── G. Create detention_session_teachers if missing ─────────────────
      await client.query(`
        CREATE TABLE IF NOT EXISTS detention_session_teachers (
          id         SERIAL PRIMARY KEY,
          session_id INTEGER NOT NULL REFERENCES detention_sessions(id) ON DELETE CASCADE,
          teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (session_id, teacher_id)
        )
      `);

      // ── H. Indexes ───────────────────────────────────────────────────────
      await client.query(`CREATE INDEX IF NOT EXISTS idx_da_detention_id ON detention_assignments(detention_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_da_student_id   ON detention_assignments(student_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_da_status        ON detention_assignments(status)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ds_date          ON detention_sessions(detention_date)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ds_status        ON detention_sessions(status)`);

      console.log(`   ✅ ${schema} done\n`);
    }

    console.log('All schemas migrated successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
