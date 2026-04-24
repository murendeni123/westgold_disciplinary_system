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
        
        // Add Grade Head columns to teachers table
        await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_grade_head BOOLEAN DEFAULT FALSE;`);
        await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS grade_head_for VARCHAR(10);`);
        await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS has_class BOOLEAN DEFAULT TRUE;`);
        // Add name/email/is_admin to teachers (required by teacher create/update routes)
        await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS name TEXT;`);
        await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email TEXT;`);
        await client.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`);

        // Add missing columns to behaviour_incidents
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS incident_time TIME;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS time TIME;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS date_occurred DATE;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS date DATE;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS action_taken TEXT;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;`);

        // Add missing columns to merits
        await client.query(`ALTER TABLE merits ADD COLUMN IF NOT EXISTS date_awarded DATE;`);

        // Add missing columns to attendance
        await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS recorded_by INTEGER;`);

        // Add alias columns to incident_types (severity/points = default_severity/default_points)
        await client.query(`ALTER TABLE incident_types ADD COLUMN IF NOT EXISTS severity TEXT;`);
        await client.query(`ALTER TABLE incident_types ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;`);

        // Add alias column to merit_types
        await client.query(`ALTER TABLE merit_types ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;`);
        await client.query(`ALTER TABLE behaviour_incidents ADD COLUMN IF NOT EXISTS points_deducted INTEGER DEFAULT 0;`);
        
        // Sync time columns
        await client.query(`UPDATE behaviour_incidents SET incident_time = time WHERE incident_time IS NULL AND time IS NOT NULL;`);
        await client.query(`UPDATE behaviour_incidents SET time = incident_time WHERE time IS NULL AND incident_time IS NOT NULL;`);
        
        // Sync points columns
        await client.query(`UPDATE behaviour_incidents SET points_deducted = points WHERE points_deducted = 0 AND points > 0;`);

        // Backfill incident_types severity/points aliases from default_* columns
        await client.query(`UPDATE incident_types SET severity = default_severity WHERE severity IS NULL AND default_severity IS NOT NULL;`);
        await client.query(`UPDATE incident_types SET points = default_points WHERE points IS NULL OR points = 0 AND default_points > 0;`);

        // Backfill merit_types points alias
        await client.query(`UPDATE merit_types SET points = default_points WHERE points IS NULL OR points <= 0 AND default_points > 0;`);

        // Backfill behaviour_incidents date/date_occurred from incident_date
        await client.query(`UPDATE behaviour_incidents SET date = incident_date WHERE date IS NULL AND incident_date IS NOT NULL;`);
        await client.query(`UPDATE behaviour_incidents SET date_occurred = incident_date WHERE date_occurred IS NULL AND incident_date IS NOT NULL;`);
        
        // Add missing columns to merits
        await client.query(`ALTER TABLE merits ADD COLUMN IF NOT EXISTS date DATE;`);
        
        // Sync date column (merit_date is primary, date is alias)
        await client.query(`UPDATE merits SET date = merit_date WHERE date IS NULL AND merit_date IS NOT NULL;`);
        
        // Add missing columns to attendance
        await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS date DATE;`);
        
        // Sync date column (attendance_date is primary, date is alias)
        await client.query(`UPDATE attendance SET date = attendance_date WHERE date IS NULL AND attendance_date IS NOT NULL;`);
        
        // Fix all boolean columns - convert INTEGER (0/1) to BOOLEAN (true/false)
        const booleanColumns = [
            { table: 'notifications', column: 'is_read' },
            { table: 'notifications', column: 'is_dismissed' },
            { table: 'consequences', column: 'is_active' },
            { table: 'incident_types', column: 'is_active' },
            { table: 'merit_types', column: 'is_active' },
            { table: 'subjects', column: 'is_active' },
            { table: 'intervention_types', column: 'is_active' },
            { table: 'classrooms', column: 'is_active' },
            { table: 'classes', column: 'is_active' },
            { table: 'students', column: 'is_active' },
            { table: 'class_timetables', column: 'is_active' },
            { table: 'student_dismissals', column: 'is_active' },
            { table: 'timetable_slots', column: 'is_break' },
            { table: 'academic_years', column: 'is_current' },
            { table: 'terms', column: 'is_current' },
            { table: 'student_consequences', column: 'parent_acknowledged' },
            { table: 'student_consequences', column: 'completion_verified' }
        ];
        
        for (const { table, column } of booleanColumns) {
            try {
                // Check if table exists
                const tableExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = '${schemaName}' 
                        AND table_name = '${table}'
                    );
                `);
                
                if (!tableExists.rows[0].exists) continue;
                
                // Check column type
                const columnType = await client.query(`
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = '${schemaName}' 
                    AND table_name = '${table}' 
                    AND column_name = '${column}';
                `);
                
                if (columnType.rows[0]?.data_type === 'integer') {
                    // Convert INTEGER to BOOLEAN
                    await client.query(`
                        ALTER TABLE ${table} 
                        ALTER COLUMN ${column} TYPE BOOLEAN 
                        USING CASE WHEN ${column} = 0 THEN false ELSE true END;
                    `);
                    console.log(`    ✓ Converted ${table}.${column} from INTEGER to BOOLEAN`);
                }
            } catch (err) {
                console.log(`    ⚠ Skipped ${table}.${column}: ${err.message}`);
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

        // Create import_history table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS import_history (
                id SERIAL PRIMARY KEY,
                school_id INTEGER NOT NULL,
                user_id   INTEGER NOT NULL,
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
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_import_history_school ON import_history(school_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_import_history_created ON import_history(created_at DESC);`);

        // Widen short VARCHAR columns on import_history that overflow with 'completed_with_errors'
        for (const col of ['status', 'mode', 'academic_year']) {
            try {
                await client.query(`ALTER TABLE import_history ALTER COLUMN ${col} TYPE VARCHAR(100)`);
            } catch (e) { /* already correct type or column absent */ }
        }

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
