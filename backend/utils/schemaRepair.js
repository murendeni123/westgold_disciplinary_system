/**
 * Schema Repair Utility
 * 
 * Ensures all school schemas have required tables for the application to function.
 * Does NOT modify existing table structures - only creates missing tables.
 */

const { pool } = require('../database/db');

/**
 * Repair all school schemas
 */
const repairAllSchoolSchemas = async () => {
    console.log('🔧 Checking school schemas for missing tables...');
    
    try {
        // Get all school schemas
        const result = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
        `);
        
        const schemas = result.rows.map(r => r.schema_name);
        console.log(`Found ${schemas.length} school schemas to check`);
        
        for (const schemaName of schemas) {
            await ensureRequiredTables(schemaName);
        }
        
        console.log('✅ Schema check completed successfully');
    } catch (error) {
        console.error('❌ Schema check failed:', error);
        // Don't crash the server - just log the error
    }
};

/**
 * Ensure a schema has all required tables
 */
const ensureRequiredTables = async (schemaName) => {
    console.log(`  Checking schema: ${schemaName}`);
    
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${schemaName}, public`);
        
        // Create consequence_assignments table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS consequence_assignments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL,
                consequence_id INTEGER,
                assigned_by INTEGER NOT NULL,
                assigned_by_role TEXT,
                consequence_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                incident_id INTEGER,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (incident_id) REFERENCES behaviour_incidents(id) ON DELETE SET NULL
            );
        `);
        
        // Create goldie_badge_config table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS goldie_badge_config (
                id SERIAL PRIMARY KEY,
                merit_threshold INTEGER DEFAULT 100,
                demerit_threshold INTEGER DEFAULT 10,
                evaluation_period_days INTEGER DEFAULT 30,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Insert default goldie badge config if none exists
        await client.query(`
            INSERT INTO goldie_badge_config (merit_threshold, demerit_threshold, evaluation_period_days, is_active)
            SELECT 100, 10, 30, true
            WHERE NOT EXISTS (SELECT 1 FROM goldie_badge_config);
        `);
        
        console.log(`  ✓ Schema ${schemaName} checked`);
    } catch (error) {
        console.error(`  ✗ Error checking schema ${schemaName}:`, error.message);
    } finally {
        client.release();
    }
};

module.exports = {
    repairAllSchoolSchemas
};
