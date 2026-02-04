/**
 * Schema Repair Utility
 * 
 * Automatically repairs school schemas on startup to ensure backward compatibility
 * with older schemas that may be missing columns or tables.
 */

const { pool } = require('../database/db');

/**
 * Repair all school schemas
 */
const repairAllSchoolSchemas = async () => {
    console.log('🔧 Starting schema repair for all school schemas...');
    
    try {
        // Get all school schemas
        const result = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
        `);
        
        const schemas = result.rows.map(r => r.schema_name);
        console.log(`Found ${schemas.length} school schemas to repair`);
        
        for (const schemaName of schemas) {
            await repairSchemaColumns(schemaName);
        }
        
        console.log('✅ Schema repair completed successfully');
    } catch (error) {
        console.error('❌ Schema repair failed:', error);
        // Don't crash the server - just log the error
    }
};

/**
 * Repair a single schema
 */
const repairSchemaColumns = async (schemaName) => {
    console.log(`  Repairing schema: ${schemaName}`);
    
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${schemaName}, public`);
        
        // Fix merits table - ensure all required columns exist
        await client.query(`
            ALTER TABLE merits 
            ADD COLUMN IF NOT EXISTS merit_date DATE;
        `);
        
        await client.query(`
            ALTER TABLE merits 
            ADD COLUMN IF NOT EXISTS date DATE;
        `);
        
        await client.query(`
            ALTER TABLE merits 
            ADD COLUMN IF NOT EXISTS merit_type TEXT;
        `);
        
        await client.query(`
            ALTER TABLE merits 
            ADD COLUMN IF NOT EXISTS merit_type_id INTEGER;
        `);
        
        // Backfill merit_date from date if needed
        await client.query(`
            UPDATE merits 
            SET merit_date = date 
            WHERE merit_date IS NULL AND date IS NOT NULL;
        `);
        
        // Backfill date from merit_date if needed
        await client.query(`
            UPDATE merits 
            SET date = merit_date 
            WHERE date IS NULL AND merit_date IS NOT NULL;
        `);
        
        // Fix behaviour_incidents table
        await client.query(`
            ALTER TABLE behaviour_incidents 
            ADD COLUMN IF NOT EXISTS incident_date DATE;
        `);
        
        await client.query(`
            ALTER TABLE behaviour_incidents 
            ADD COLUMN IF NOT EXISTS date DATE;
        `);
        
        await client.query(`
            ALTER TABLE behaviour_incidents 
            ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
        `);
        
        await client.query(`
            ALTER TABLE behaviour_incidents 
            ADD COLUMN IF NOT EXISTS points_deducted INTEGER DEFAULT 0;
        `);
        
        await client.query(`
            ALTER TABLE behaviour_incidents 
            ADD COLUMN IF NOT EXISTS time TIME;
        `);
        
        // Backfill incident_date from date if needed
        await client.query(`
            UPDATE behaviour_incidents 
            SET incident_date = date 
            WHERE incident_date IS NULL AND date IS NOT NULL;
        `);
        
        // Backfill date from incident_date if needed
        await client.query(`
            UPDATE behaviour_incidents 
            SET date = incident_date 
            WHERE date IS NULL AND incident_date IS NOT NULL;
        `);
        
        // Backfill points_deducted from points if needed
        await client.query(`
            UPDATE behaviour_incidents 
            SET points_deducted = points 
            WHERE points_deducted = 0 AND points > 0;
        `);
        
        // Backfill points from points_deducted if needed
        await client.query(`
            UPDATE behaviour_incidents 
            SET points = points_deducted 
            WHERE points = 0 AND points_deducted > 0;
        `);
        
        // Fix attendance table
        await client.query(`
            ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS attendance_date DATE;
        `);
        
        await client.query(`
            ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS date DATE;
        `);
        
        // Backfill attendance_date from date if needed
        await client.query(`
            UPDATE attendance 
            SET attendance_date = date 
            WHERE attendance_date IS NULL AND date IS NOT NULL;
        `);
        
        // Backfill date from attendance_date if needed
        await client.query(`
            UPDATE attendance 
            SET date = attendance_date 
            WHERE date IS NULL AND attendance_date IS NOT NULL;
        `);
        
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
        
        console.log(`  ✓ Schema ${schemaName} repaired`);
    } catch (error) {
        console.error(`  ✗ Error repairing schema ${schemaName}:`, error.message);
    } finally {
        client.release();
    }
};

module.exports = {
    repairAllSchoolSchemas
};
