const { Pool } = require('pg');
require('dotenv').config();

/**
 * Migration: Add default detention rules to all school schemas
 * 
 * This migration ensures all schools have the standard detention rules:
 * 1. 3+ incidents → Detention
 * 2. 10+ points → Detention  
 * 3. High severity incident → Detention
 */

async function addDefaultDetentionRules() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding Default Detention Rules to All Schools\n');

    // Get all schools with schemas
    const schoolsResult = await pool.query(
      'SELECT id, name, schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY id'
    );

    console.log(`Found ${schoolsResult.rows.length} schools\n`);

    const defaultRules = [
      {
        action_type: 'detention',
        min_points: 3,
        max_points: null,
        severity: null,
        detention_duration: 60,
        is_active: 1,
        description: '3+ incidents trigger detention'
      },
      {
        action_type: 'detention',
        min_points: 10,
        max_points: null,
        severity: null,
        detention_duration: 60,
        is_active: 1,
        description: '10+ points trigger detention'
      },
      {
        action_type: 'detention',
        min_points: 1,
        max_points: null,
        severity: 'high',
        detention_duration: 60,
        is_active: 1,
        description: 'High severity incident triggers detention'
      }
    ];

    for (const school of schoolsResult.rows) {
      console.log(`📍 Processing: ${school.name} (${school.schema_name})`);

      // Check if detention_rules table exists
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'detention_rules'
      `, [school.schema_name]);

      if (tableCheck.rows.length === 0) {
        console.log(`  ⚠️  detention_rules table does not exist, creating it...`);
        
        // Create the table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ${school.schema_name}.detention_rules (
            id SERIAL PRIMARY KEY,
            action_type TEXT NOT NULL,
            min_points INTEGER DEFAULT 0,
            max_points INTEGER,
            severity TEXT,
            detention_duration INTEGER DEFAULT 60,
            is_active INTEGER DEFAULT 1,
            school_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        console.log(`  ✅ Table created`);
      }

      // Check existing rules count
      const countResult = await pool.query(`
        SELECT COUNT(*) as count FROM ${school.schema_name}.detention_rules
      `);

      const existingCount = parseInt(countResult.rows[0].count);

      if (existingCount >= 3) {
        console.log(`  ℹ️  Already has ${existingCount} rules, skipping\n`);
        continue;
      }

      // Check which rules already exist
      const existingRules = await pool.query(`
        SELECT min_points, severity FROM ${school.schema_name}.detention_rules
      `);

      const existingSet = new Set(
        existingRules.rows.map(r => `${r.min_points}-${r.severity || 'null'}`)
      );

      // Insert missing rules
      let inserted = 0;
      for (const rule of defaultRules) {
        const ruleKey = `${rule.min_points}-${rule.severity || 'null'}`;
        
        if (!existingSet.has(ruleKey)) {
          try {
            await pool.query(`
              INSERT INTO ${school.schema_name}.detention_rules 
              (action_type, min_points, max_points, severity, detention_duration, is_active, school_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              rule.action_type,
              rule.min_points,
              rule.max_points,
              rule.severity,
              rule.detention_duration,
              rule.is_active,
              null  // Set to null to avoid foreign key constraint issues
            ]);
            inserted++;
            console.log(`  ✅ Added: ${rule.description}`);
          } catch (error) {
            console.log(`  ⚠️  Error adding rule: ${error.message}`);
          }
        } else {
          console.log(`  ⏭️  Skipped: ${rule.description} (already exists)`);
        }
      }

      if (inserted > 0) {
        console.log(`  ✨ Inserted ${inserted} new rule(s)\n`);
      } else {
        console.log(`  ℹ️  No new rules needed\n`);
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addDefaultDetentionRules()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { addDefaultDetentionRules };
