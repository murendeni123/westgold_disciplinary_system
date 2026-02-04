/**
 * Schema Repair Utility
 * 
 * Ensures all school schemas have required tables and columns.
 * Adds missing columns to support both old and new schema versions.
 */

const { pool } = require('../database/db');

/**
 * Repair all school schemas
 */
const repairAllSchoolSchemas = async () => {
    console.log('🔧 Repairing school schemas...');
    
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
            await repairSchema(schemaName);
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
const repairSchema = async (schemaName) => {
    console.log(`  Repairing schema: ${schemaName}`);
    
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${schemaName}, public`);
        
        // Add missing columns to behaviour_incidents
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS incident_time TIME;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS time TIME;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS points_deducted INTEGER DEFAULT 0;`);
        
        // Sync time columns
        await client.query(`UPDATE behaviour_incidents SET incident_time = time WHERE incident_time IS NULL AND time IS NOT NULL;`);
        await client.query(`UPDATE behaviour_incidents SET time = incident_time WHERE time IS NULL AND incident_time IS NOT NULL;`);
        
        // Sync points columns
        await client.query(`UPDATE behaviour_incidents SET points_deducted = points WHERE points_deducted = 0 AND points > 0;`);
        
        // Add missing columns to merits
        await client.query(`ALTER TABLE merits ADD COLUMN IF NOT EXISTS date DATE;`);
        
        // Sync date column (merit_date is primary, date is alias)
        await client.query(`UPDATE merits SET date = merit_date WHERE date IS NULL AND merit_date IS NOT NULL;`);
        
        // Add missing columns to attendance
        await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS date DATE;`);
        
        // Sync date column (attendance_date is primary, date is alias)
        await client.query(`UPDATE attendance SET date = attendance_date WHERE date IS NULL AND attendance_date IS NOT NULL;`);
        
        // Fix notifications table - change is_read from INTEGER to BOOLEAN if needed
        const notificationsTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = '${schemaName}' 
                AND table_name = 'notifications'
            );
        `);
        
        if (notificationsTableExists.rows[0].exists) {
            // Check if is_read is INTEGER type
            const isReadType = await client.query(`
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_schema = '${schemaName}' 
                AND table_name = 'notifications' 
                AND column_name = 'is_read';
            `);
            
            if (isReadType.rows[0]?.data_type === 'integer') {
                // Convert INTEGER to BOOLEAN
                await client.query(`
                    ALTER TABLE notifications 
                    ALTER COLUMN is_read TYPE BOOLEAN 
                    USING CASE WHEN is_read = 0 THEN false ELSE true END;
                `);
                console.log(`    ✓ Converted notifications.is_read from INTEGER to BOOLEAN`);
            }
        }
        
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
