/**
 * Schema Manager for Multi-Tenant Architecture
 * 
 * This module handles the creation, management, and deletion of school-specific schemas.
 * Each school gets its own PostgreSQL schema with complete data isolation.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

/**
 * Generate a valid schema name from school code
 * @param {string} schoolCode - The school's unique code (e.g., "WS2025")
 * @returns {string} - Valid PostgreSQL schema name (e.g., "school_ws2025")
 */
const generateSchemaName = (schoolCode) => {
    // Sanitize and lowercase the school code
    const sanitized = schoolCode
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^[0-9]/, 's$&'); // Prefix with 's' if starts with number
    
    return `school_${sanitized}`;
};

/**
 * Check if a schema exists in the database
 * @param {string} schemaName - The schema name to check
 * @returns {Promise<boolean>} - True if schema exists
 */
const schemaExists = async (schemaName) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT EXISTS (
                SELECT 1 FROM information_schema.schemata 
                WHERE schema_name = $1
            )`,
            [schemaName]
        );
        return result.rows[0].exists;
    } finally {
        client.release();
    }
};

/**
 * Create a new school schema with all required tables
 * @param {string} schoolCode - The school's unique code
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, schemaName: string, error?: string}>}
 */
const createSchoolSchema = async (schoolCode, options = {}) => {
    const schemaName = generateSchemaName(schoolCode);
    const client = await pool.connect();
    
    try {
        // Check if schema already exists
        const exists = await schemaExists(schemaName);
        if (exists) {
            return {
                success: false,
                schemaName,
                error: `Schema ${schemaName} already exists`
            };
        }
        
        // Read the template SQL file
        const templatePath = path.join(__dirname, 'school_schema_template.sql');
        let templateSql = fs.readFileSync(templatePath, 'utf8');
        
        // Replace all occurrences of {SCHEMA_NAME} with actual schema name
        templateSql = templateSql.replace(/{SCHEMA_NAME}/g, schemaName);
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Split SQL into individual statements and execute
        const statements = templateSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                } catch (err) {
                    // Log but continue for non-critical errors (like "already exists")
                    if (!err.message.includes('already exists') && 
                        !err.message.includes('duplicate key')) {
                        console.warn(`Warning executing statement: ${err.message}`);
                    }
                }
            }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`✅ Successfully created schema: ${schemaName}`);
        
        return {
            success: true,
            schemaName,
            tablesCreated: true
        };
        
    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error(`❌ Error creating schema ${schemaName}:`, error.message);
        
        return {
            success: false,
            schemaName,
            error: error.message
        };
    } finally {
        client.release();
    }
};

/**
 * Drop a school schema and all its data
 * WARNING: This is destructive and cannot be undone!
 * @param {string} schemaName - The schema name to drop
 * @param {boolean} force - If true, drops even if schema has data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const dropSchoolSchema = async (schemaName, force = false) => {
    const client = await pool.connect();
    
    try {
        // Safety check - don't drop public schema
        if (schemaName === 'public') {
            return {
                success: false,
                error: 'Cannot drop public schema'
            };
        }
        
        // Check if schema exists
        const exists = await schemaExists(schemaName);
        if (!exists) {
            return {
                success: false,
                error: `Schema ${schemaName} does not exist`
            };
        }
        
        // If not forcing, check if schema has data
        if (!force) {
            const countResult = await client.query(`
                SELECT COUNT(*) as count 
                FROM ${schemaName}.students
            `).catch(() => ({ rows: [{ count: 0 }] }));
            
            if (parseInt(countResult.rows[0].count) > 0) {
                return {
                    success: false,
                    error: `Schema ${schemaName} contains data. Use force=true to delete anyway.`
                };
            }
        }
        
        // Drop the schema with CASCADE
        await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
        
        console.log(`✅ Successfully dropped schema: ${schemaName}`);
        
        return { success: true };
        
    } catch (error) {
        console.error(`❌ Error dropping schema ${schemaName}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        client.release();
    }
};

/**
 * List all school schemas in the database
 * @returns {Promise<string[]>} - Array of schema names
 */
const listSchoolSchemas = async () => {
    const client = await pool.connect();
    
    try {
        const result = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'school_%'
            ORDER BY schema_name
        `);
        
        return result.rows.map(row => row.schema_name);
        
    } finally {
        client.release();
    }
};

/**
 * Get statistics for a school schema
 * @param {string} schemaName - The schema name
 * @returns {Promise<object>} - Statistics object
 */
const getSchemaStats = async (schemaName) => {
    const client = await pool.connect();
    
    try {
        const stats = {};
        
        // Count students
        const studentsResult = await client.query(
            `SELECT COUNT(*) as count FROM ${schemaName}.students WHERE is_active = true`
        ).catch(() => ({ rows: [{ count: 0 }] }));
        stats.activeStudents = parseInt(studentsResult.rows[0].count);
        
        // Count teachers
        const teachersResult = await client.query(
            `SELECT COUNT(*) as count FROM ${schemaName}.teachers WHERE is_active = true`
        ).catch(() => ({ rows: [{ count: 0 }] }));
        stats.activeTeachers = parseInt(teachersResult.rows[0].count);
        
        // Count classes
        const classesResult = await client.query(
            `SELECT COUNT(*) as count FROM ${schemaName}.classes WHERE is_active = true`
        ).catch(() => ({ rows: [{ count: 0 }] }));
        stats.activeClasses = parseInt(classesResult.rows[0].count);
        
        // Count incidents this month
        const incidentsResult = await client.query(`
            SELECT COUNT(*) as count FROM ${schemaName}.behaviour_incidents 
            WHERE incident_date >= DATE_TRUNC('month', CURRENT_DATE)
        `).catch(() => ({ rows: [{ count: 0 }] }));
        stats.incidentsThisMonth = parseInt(incidentsResult.rows[0].count);
        
        // Count merits this month
        const meritsResult = await client.query(`
            SELECT COUNT(*) as count FROM ${schemaName}.merits 
            WHERE merit_date >= DATE_TRUNC('month', CURRENT_DATE)
        `).catch(() => ({ rows: [{ count: 0 }] }));
        stats.meritsThisMonth = parseInt(meritsResult.rows[0].count);
        
        return stats;
        
    } catch (error) {
        console.error(`Error getting stats for ${schemaName}:`, error.message);
        return {
            error: error.message
        };
    } finally {
        client.release();
    }
};

/**
 * Backup a school schema to SQL file
 * @param {string} schemaName - The schema name to backup
 * @param {string} outputPath - Path to save the backup file
 * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
 */
const backupSchoolSchema = async (schemaName, outputPath) => {
    // Note: This is a simplified backup. For production, use pg_dump
    const client = await pool.connect();
    
    try {
        const exists = await schemaExists(schemaName);
        if (!exists) {
            return {
                success: false,
                error: `Schema ${schemaName} does not exist`
            };
        }
        
        // Get all tables in the schema
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_type = 'BASE TABLE'
        `, [schemaName]);
        
        let backupSql = `-- Backup of schema: ${schemaName}\n`;
        backupSql += `-- Generated at: ${new Date().toISOString()}\n\n`;
        backupSql += `CREATE SCHEMA IF NOT EXISTS ${schemaName};\n\n`;
        
        for (const table of tablesResult.rows) {
            const tableName = table.table_name;
            
            // Get table data
            const dataResult = await client.query(
                `SELECT * FROM ${schemaName}.${tableName}`
            );
            
            if (dataResult.rows.length > 0) {
                backupSql += `-- Data for ${schemaName}.${tableName}\n`;
                
                for (const row of dataResult.rows) {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row)
                        .map(v => {
                            if (v === null) return 'NULL';
                            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
                            return v;
                        })
                        .join(', ');
                    
                    backupSql += `INSERT INTO ${schemaName}.${tableName} (${columns}) VALUES (${values});\n`;
                }
                backupSql += '\n';
            }
        }
        
        // Write to file
        const filePath = outputPath || path.join(__dirname, 'backups', `${schemaName}_${Date.now()}.sql`);
        
        // Ensure backup directory exists
        const backupDir = path.dirname(filePath);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, backupSql);
        
        console.log(`✅ Backup saved to: ${filePath}`);
        
        return {
            success: true,
            filePath
        };
        
    } catch (error) {
        console.error(`Error backing up ${schemaName}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        client.release();
    }
};

/**
 * Clone a school schema (for testing or migration)
 * @param {string} sourceSchema - Source schema name
 * @param {string} targetSchoolCode - Target school code
 * @returns {Promise<{success: boolean, schemaName?: string, error?: string}>}
 */
const cloneSchoolSchema = async (sourceSchema, targetSchoolCode) => {
    const targetSchema = generateSchemaName(targetSchoolCode);
    const client = await pool.connect();
    
    try {
        // Check source exists
        const sourceExists = await schemaExists(sourceSchema);
        if (!sourceExists) {
            return {
                success: false,
                error: `Source schema ${sourceSchema} does not exist`
            };
        }
        
        // Check target doesn't exist
        const targetExists = await schemaExists(targetSchema);
        if (targetExists) {
            return {
                success: false,
                error: `Target schema ${targetSchema} already exists`
            };
        }
        
        // Create new schema with template
        const createResult = await createSchoolSchema(targetSchoolCode);
        if (!createResult.success) {
            return createResult;
        }
        
        // Copy data from source to target (excluding auto-generated IDs)
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `, [sourceSchema]);
        
        await client.query('BEGIN');
        
        for (const table of tablesResult.rows) {
            const tableName = table.table_name;
            
            // Skip settings and customizations (school-specific)
            if (['settings', 'customizations'].includes(tableName)) {
                continue;
            }
            
            // Get columns (excluding id for auto-increment)
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = $1 
                AND table_name = $2 
                AND column_name != 'id'
                ORDER BY ordinal_position
            `, [sourceSchema, tableName]);
            
            const columns = columnsResult.rows.map(r => r.column_name).join(', ');
            
            if (columns) {
                await client.query(`
                    INSERT INTO ${targetSchema}.${tableName} (${columns})
                    SELECT ${columns} FROM ${sourceSchema}.${tableName}
                `).catch(err => {
                    console.warn(`Warning copying ${tableName}: ${err.message}`);
                });
            }
        }
        
        await client.query('COMMIT');
        
        console.log(`✅ Successfully cloned ${sourceSchema} to ${targetSchema}`);
        
        return {
            success: true,
            schemaName: targetSchema
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error cloning schema:`, error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        client.release();
    }
};

/**
 * Initialize the public schema with base tables
 * Run this once when setting up the database
 */
const initializePublicSchema = async () => {
    const client = await pool.connect();
    
    try {
        const initPath = path.join(__dirname, 'init_multi_tenant.sql');
        const initSql = fs.readFileSync(initPath, 'utf8');
        
        // Split and execute statements
        const statements = initSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
        
        await client.query('BEGIN');
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                } catch (err) {
                    if (!err.message.includes('already exists') && 
                        !err.message.includes('duplicate key')) {
                        console.warn(`Warning: ${err.message}`);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        console.log('✅ Public schema initialized successfully');
        return { success: true };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error initializing public schema:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        client.release();
    }
};

module.exports = {
    generateSchemaName,
    schemaExists,
    createSchoolSchema,
    dropSchoolSchema,
    listSchoolSchemas,
    getSchemaStats,
    backupSchoolSchema,
    cloneSchoolSchema,
    initializePublicSchema
};
