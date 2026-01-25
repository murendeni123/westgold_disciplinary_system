/**
 * Migration Script: Single-Tenant to Multi-Tenant Architecture
 * 
 * This script migrates existing data from the old single-tenant structure
 * to the new schema-per-school multi-tenant architecture.
 * 
 * IMPORTANT: 
 * - Backup your database before running this migration
 * - Run this script only once
 * - Test in a staging environment first
 * 
 * Usage: node migrations/migrate_to_multi_tenant.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
});

// Migration state
const migrationLog = [];
const errors = [];

const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    migrationLog.push(logMessage);
};

const logError = (message, error) => {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message} - ${error.message}`;
    console.error(errorMessage);
    errors.push({ message, error: error.message, stack: error.stack });
};

/**
 * Step 1: Initialize public schema with new tables
 */
async function initializePublicSchema(client) {
    log('Step 1: Initializing public schema...');
    
    const initSqlPath = path.join(__dirname, '../init_multi_tenant.sql');
    
    if (!fs.existsSync(initSqlPath)) {
        throw new Error('init_multi_tenant.sql not found. Please create it first.');
    }
    
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    const statements = initSql.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
        if (statement.trim() && !statement.trim().startsWith('--') && !statement.trim().startsWith('/*')) {
            try {
                await client.query(statement);
            } catch (err) {
                if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                    log(`Warning: ${err.message}`);
                }
            }
        }
    }
    
    log('Public schema initialized.');
}

/**
 * Step 2: Migrate schools from old structure
 */
async function migrateSchools(client) {
    log('Step 2: Migrating schools...');
    
    // Check if old schools table exists and has data
    const oldSchools = await client.query(`
        SELECT * FROM schools 
        WHERE id NOT IN (SELECT id FROM public.schools WHERE schema_name IS NOT NULL)
    `).catch(() => ({ rows: [] }));
    
    if (oldSchools.rows.length === 0) {
        // No old schools or already migrated - create a default school
        const existingSchool = await client.query('SELECT id FROM public.schools LIMIT 1');
        
        if (existingSchool.rows.length === 0) {
            log('No schools found. Creating default school...');
            
            const result = await client.query(`
                INSERT INTO public.schools (name, code, subdomain, schema_name, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, ['Default School', 'DEFAULT', 'default', 'school_default', 'active']);
            
            log(`Created default school with ID: ${result.rows[0].id}`);
            return [{ id: result.rows[0].id, code: 'DEFAULT', schema_name: 'school_default' }];
        }
        
        return existingSchool.rows;
    }
    
    const migratedSchools = [];
    
    for (const school of oldSchools.rows) {
        const code = school.code || `SCH${school.id}`;
        const schemaName = `school_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        try {
            // Update or insert school with schema_name
            await client.query(`
                UPDATE public.schools 
                SET schema_name = $1, subdomain = $2
                WHERE id = $3 AND (schema_name IS NULL OR schema_name = '')
            `, [schemaName, code.toLowerCase(), school.id]);
            
            migratedSchools.push({ ...school, code, schema_name: schemaName });
            log(`Migrated school: ${school.name} (${code})`);
        } catch (err) {
            logError(`Failed to migrate school ${school.name}`, err);
        }
    }
    
    return migratedSchools;
}

/**
 * Step 3: Create school schemas and tables
 */
async function createSchoolSchemas(client, schools) {
    log('Step 3: Creating school schemas...');
    
    const templatePath = path.join(__dirname, '../school_schema_template.sql');
    
    if (!fs.existsSync(templatePath)) {
        throw new Error('school_schema_template.sql not found.');
    }
    
    const templateSql = fs.readFileSync(templatePath, 'utf8');
    
    for (const school of schools) {
        const schemaName = school.schema_name;
        
        try {
            // Check if schema already exists
            const schemaExists = await client.query(`
                SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
            `, [schemaName]);
            
            if (schemaExists.rows.length > 0) {
                log(`Schema ${schemaName} already exists, skipping creation.`);
                continue;
            }
            
            // Replace template placeholder with actual schema name
            const schemaSql = templateSql.replace(/{SCHEMA_NAME}/g, schemaName);
            
            // Split and execute statements
            const statements = schemaSql.split(';').filter(s => s.trim().length > 0);
            
            for (const statement of statements) {
                if (statement.trim() && !statement.trim().startsWith('--')) {
                    try {
                        await client.query(statement);
                    } catch (err) {
                        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                            log(`Warning in ${schemaName}: ${err.message}`);
                        }
                    }
                }
            }
            
            log(`Created schema: ${schemaName}`);
        } catch (err) {
            logError(`Failed to create schema ${schemaName}`, err);
        }
    }
}

/**
 * Step 4: Migrate users to public.users with password_hash
 */
async function migrateUsers(client, schools) {
    log('Step 4: Migrating users...');
    
    // Get all users from old structure
    const oldUsers = await client.query(`
        SELECT * FROM users WHERE id NOT IN (
            SELECT id FROM public.users WHERE password_hash IS NOT NULL
        )
    `).catch(() => ({ rows: [] }));
    
    if (oldUsers.rows.length === 0) {
        log('No users to migrate or already migrated.');
        return;
    }
    
    for (const user of oldUsers.rows) {
        try {
            // Determine password_hash (old column might be 'password')
            const passwordHash = user.password_hash || user.password;
            
            // Get school for this user
            let schoolId = user.school_id || user.primary_school_id;
            if (!schoolId && schools.length > 0) {
                schoolId = schools[0].id;
            }
            
            // Check if user already exists in new structure
            const existing = await client.query(
                'SELECT id FROM public.users WHERE email = $1',
                [user.email]
            );
            
            if (existing.rows.length > 0) {
                // Update existing user
                await client.query(`
                    UPDATE public.users 
                    SET password_hash = COALESCE(password_hash, $1),
                        primary_school_id = COALESCE(primary_school_id, $2),
                        is_active = true
                    WHERE id = $3
                `, [passwordHash, schoolId, existing.rows[0].id]);
            } else {
                // Insert new user
                await client.query(`
                    INSERT INTO public.users (id, email, password_hash, name, role, primary_school_id, is_active, phone)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (id) DO UPDATE SET
                        password_hash = COALESCE(public.users.password_hash, EXCLUDED.password_hash),
                        primary_school_id = COALESCE(public.users.primary_school_id, EXCLUDED.primary_school_id)
                `, [user.id, user.email, passwordHash, user.name, user.role, schoolId, true, user.phone]);
            }
            
            // Link user to school
            if (schoolId) {
                await client.query(`
                    INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
                    VALUES ($1, $2, $3, true)
                    ON CONFLICT (user_id, school_id) DO NOTHING
                `, [user.id, schoolId, user.role]);
            }
            
        } catch (err) {
            logError(`Failed to migrate user ${user.email}`, err);
        }
    }
    
    log(`Migrated ${oldUsers.rows.length} users.`);
}

/**
 * Step 5: Migrate data to school schemas
 */
async function migrateSchoolData(client, schools) {
    log('Step 5: Migrating school data to schemas...');
    
    const tablesToMigrate = [
        'classes',
        'students',
        'teachers',
        'parents',
        'behaviour_incidents',
        'merits',
        'attendance',
        'detentions',
        'detention_assignments',
        'messages',
        'notifications',
        'incident_types',
        'merit_types',
        'detention_rules',
        'interventions',
        'consequences',
        'student_consequences',
        'timetables'
    ];
    
    for (const school of schools) {
        const schemaName = school.schema_name;
        const schoolId = school.id;
        
        log(`Migrating data for school: ${school.name || school.code} (${schemaName})`);
        
        for (const tableName of tablesToMigrate) {
            try {
                // Check if source table exists
                const tableExists = await client.query(`
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = $1
                `, [tableName]);
                
                if (tableExists.rows.length === 0) {
                    continue;
                }
                
                // Check if table has school_id column
                const hasSchoolId = await client.query(`
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'school_id'
                `, [tableName]);
                
                // Get columns from target table (excluding id for auto-increment)
                const columnsResult = await client.query(`
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_schema = $1 AND table_name = $2 AND column_name != 'id'
                    ORDER BY ordinal_position
                `, [schemaName, tableName]);
                
                if (columnsResult.rows.length === 0) {
                    continue;
                }
                
                // Get matching columns from source
                const sourceColumnsResult = await client.query(`
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = $1
                `, [tableName]);
                
                const sourceColumns = sourceColumnsResult.rows.map(r => r.column_name);
                const targetColumns = columnsResult.rows.map(r => r.column_name);
                
                // Find common columns
                const commonColumns = targetColumns.filter(c => sourceColumns.includes(c));
                
                if (commonColumns.length === 0) {
                    continue;
                }
                
                const columnList = commonColumns.join(', ');
                
                // Build query based on whether source has school_id
                let query;
                if (hasSchoolId.rows.length > 0) {
                    query = `
                        INSERT INTO ${schemaName}.${tableName} (${columnList})
                        SELECT ${columnList} FROM public.${tableName}
                        WHERE school_id = $1 OR school_id IS NULL
                        ON CONFLICT DO NOTHING
                    `;
                } else {
                    query = `
                        INSERT INTO ${schemaName}.${tableName} (${columnList})
                        SELECT ${columnList} FROM public.${tableName}
                        ON CONFLICT DO NOTHING
                    `;
                }
                
                const result = await client.query(query, hasSchoolId.rows.length > 0 ? [schoolId] : []);
                
                if (result.rowCount > 0) {
                    log(`  - Migrated ${result.rowCount} rows to ${schemaName}.${tableName}`);
                }
                
            } catch (err) {
                // Only log if it's not a "table doesn't exist" error
                if (!err.message.includes('does not exist') && !err.message.includes('duplicate')) {
                    logError(`Failed to migrate ${tableName} for ${schemaName}`, err);
                }
            }
        }
    }
}

/**
 * Step 6: Create platform admin if not exists
 */
async function createPlatformAdmin(client) {
    log('Step 6: Creating platform admin...');
    
    const existing = await client.query(
        'SELECT id FROM public.platform_users LIMIT 1'
    );
    
    if (existing.rows.length > 0) {
        log('Platform admin already exists.');
        return;
    }
    
    const email = process.env.PLATFORM_ADMIN_EMAIL || 'superadmin@pds.com';
    const password = process.env.PLATFORM_ADMIN_PASSWORD || 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await client.query(`
        INSERT INTO public.platform_users (email, password_hash, name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
    `, [email, hashedPassword, 'Super Admin', 'platform_admin', true]);
    
    log(`Created platform admin: ${email}`);
    log(`IMPORTANT: Change the default password immediately!`);
}

/**
 * Step 7: Update sequences
 */
async function updateSequences(client, schools) {
    log('Step 7: Updating sequences...');
    
    const tables = ['students', 'teachers', 'classes', 'behaviour_incidents', 'merits', 'attendance'];
    
    for (const school of schools) {
        const schemaName = school.schema_name;
        
        for (const tableName of tables) {
            try {
                await client.query(`
                    SELECT setval('${schemaName}.${tableName}_id_seq', 
                        COALESCE((SELECT MAX(id) FROM ${schemaName}.${tableName}), 0) + 1, false)
                `);
            } catch (err) {
                // Ignore sequence errors
            }
        }
    }
    
    log('Sequences updated.');
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('='.repeat(60));
    console.log('MULTI-TENANT MIGRATION SCRIPT');
    console.log('='.repeat(60));
    console.log('');
    
    const client = await pool.connect();
    
    try {
        // Start transaction
        await client.query('BEGIN');
        
        // Run migration steps
        await initializePublicSchema(client);
        const schools = await migrateSchools(client);
        await createSchoolSchemas(client, schools);
        await migrateUsers(client, schools);
        await migrateSchoolData(client, schools);
        await createPlatformAdmin(client);
        await updateSequences(client, schools);
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log('');
        console.log('='.repeat(60));
        console.log('MIGRATION COMPLETED SUCCESSFULLY');
        console.log('='.repeat(60));
        
        if (errors.length > 0) {
            console.log('');
            console.log('Warnings/Errors encountered:');
            errors.forEach(e => console.log(`  - ${e.message}: ${e.error}`));
        }
        
        // Save migration log
        const logPath = path.join(__dirname, `migration_log_${Date.now()}.txt`);
        fs.writeFileSync(logPath, migrationLog.join('\n'));
        console.log(`\nMigration log saved to: ${logPath}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('');
        console.error('='.repeat(60));
        console.error('MIGRATION FAILED');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Save error log
        const errorLogPath = path.join(__dirname, `migration_error_${Date.now()}.txt`);
        fs.writeFileSync(errorLogPath, JSON.stringify({ error: error.message, stack: error.stack, log: migrationLog }, null, 2));
        console.error(`\nError log saved to: ${errorLogPath}`);
        
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration();
