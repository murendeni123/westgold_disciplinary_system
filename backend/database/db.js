require('dotenv').config();

// PostgreSQL connection is required
if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    console.error('Please set DATABASE_URL in your .env file');
    process.exit(1);
}

const { Pool } = require('pg');

// PostgreSQL/Supabase connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false,
    max: 30, // Increased for multi-tenant workload
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000, // Increased for complex queries
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// ============================================================================
// SCHEMA CONTEXT MANAGEMENT
// ============================================================================

/**
 * Set the search_path for a database client to use a specific school schema
 * @param {object} client - PostgreSQL client from pool
 * @param {string} schemaName - The schema name (e.g., "school_ws2025")
 */
const setClientSchema = async (client, schemaName) => {
    if (schemaName && schemaName !== 'public') {
        await client.query(`SET search_path TO ${schemaName}, public`);
    } else {
        await client.query('SET search_path TO public');
    }
};

/**
 * Get a database client with schema context already set
 * @param {string} schemaName - The schema name to use
 * @returns {Promise<object>} - PostgreSQL client with schema set
 */
const getSchemaClient = async (schemaName) => {
    const client = await pool.connect();
    await setClientSchema(client, schemaName);
    return client;
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

// Initialize database - run schema if needed
const initDatabase = async () => {
    try {
        // Test connection
        const client = await pool.connect();
        console.log('PostgreSQL connection established');
        
        // Check if we need to run migrations
        const result = await client.query('SELECT NOW()');
        console.log('Database time:', result.rows[0].now);
        
        // Read and execute init_multi_tenant.sql for public schema
        const fs = require('fs');
        const path = require('path');
        
        // First, try the new multi-tenant schema
        let initSqlPath = path.join(__dirname, 'init_multi_tenant.sql');
        
        // Fallback to old schema if new one doesn't exist
        if (!fs.existsSync(initSqlPath)) {
            initSqlPath = path.join(__dirname, 'init_postgres.sql');
        }
        
        if (fs.existsSync(initSqlPath)) {
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            // Split by semicolon and execute each statement
            const statements = initSql.split(';').filter(s => s.trim().length > 0);
            
            for (const statement of statements) {
                if (statement.trim() && !statement.trim().startsWith('--') && !statement.trim().startsWith('/*')) {
                    try {
                        await client.query(statement);
                    } catch (err) {
                        // Ignore "already exists" errors
                        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                            console.warn('Migration warning:', err.message);
                        }
                    }
                }
            }
            console.log('Database schema initialized');
        }
        
        client.release();
        return pool;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};

// ============================================================================
// SQL CONVERSION UTILITIES
// ============================================================================

// Convert SQLite-style syntax to PostgreSQL
const convertToPostgresSQL = (sql, params) => {
    let pgSql = sql;
    const pgParams = [];
    let paramIndex = 1;
    
    // Replace ? with $1, $2, etc.
    pgSql = pgSql.replace(/\?/g, () => {
        if (paramIndex <= params.length) {
            pgParams.push(params[paramIndex - 1]);
        }
        return `$${paramIndex++}`;
    });
    
    // Handle datetime functions
    pgSql = pgSql.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
    pgSql = pgSql.replace(/date\('now'\)/gi, 'CURRENT_DATE');
    
    // Handle strftime for date formatting (PostgreSQL uses TO_CHAR)
    pgSql = pgSql.replace(/strftime\('%Y-%m',\s*(\w+)\)/gi, "TO_CHAR($1, 'YYYY-MM')");
    pgSql = pgSql.replace(/strftime\('%Y-%m',\s*created_at\)/gi, "TO_CHAR(created_at, 'YYYY-MM')");
    
    // Handle SUBSTR to SUBSTRING conversion for PostgreSQL
    pgSql = pgSql.replace(/SUBSTR\(([^,]+),\s*(\d+)\)/gi, "SUBSTRING($1 FROM $2)");
    pgSql = pgSql.replace(/SUBSTR\(([^,]+),\s*(\d+),\s*(\d+)\)/gi, "SUBSTRING($1 FROM $2 FOR $3)");
    
    return { sql: pgSql, params: pgParams.length > 0 ? pgParams : params };
};

// ============================================================================
// DATABASE HELPER FUNCTIONS (Schema-Aware)
// ============================================================================

/**
 * Execute a SQL command (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @param {string} schemaName - Optional schema name for multi-tenant queries
 * @returns {Promise<{id: number|null, changes: number}>}
 */
const dbRun = async (sql, params = [], schemaName = null) => {
    const client = await pool.connect();
    try {
        // Set schema context if provided
        if (schemaName) {
            await setClientSchema(client, schemaName);
        }
        
        // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
        const pgSql = convertToPostgresSQL(sql, params);
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Executing SQL:', pgSql.sql);
            console.log('With params:', pgSql.params);
            if (schemaName) console.log('Schema:', schemaName);
        }
        
        const result = await client.query(pgSql.sql, pgSql.params);
        
        // Extract id from RETURNING clause or result
        let id = null;
        if (result.rows && result.rows.length > 0) {
            // PostgreSQL returns lowercase column names
            if (result.rows[0].id !== undefined) {
                id = result.rows[0].id;
            } else if (result.rows[0].ID !== undefined) {
                id = result.rows[0].ID;
            } else {
                // Try to get first column value if it's numeric (likely the id)
                const firstRow = result.rows[0];
                const firstKey = Object.keys(firstRow)[0];
                if (firstKey && typeof firstRow[firstKey] === 'number') {
                    id = firstRow[firstKey];
                }
            }
        }
        
        return {
            id: id,
            changes: result.rowCount || 0
        };
    } catch (error) {
        console.error('Database error:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('SQL:', sql);
            console.error('Params:', params);
            if (schemaName) console.error('Schema:', schemaName);
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get a single row from the database
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @param {string} schemaName - Optional schema name for multi-tenant queries
 * @returns {Promise<object|null>}
 */
const dbGet = async (sql, params = [], schemaName = null) => {
    const client = await pool.connect();
    try {
        // Set schema context if provided
        if (schemaName) {
            await setClientSchema(client, schemaName);
        }
        
        const pgSql = convertToPostgresSQL(sql, params);
        const result = await client.query(pgSql.sql, pgSql.params);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Database error:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('SQL:', sql);
            console.error('Params:', params);
            if (schemaName) console.error('Schema:', schemaName);
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get all rows from the database
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @param {string} schemaName - Optional schema name for multi-tenant queries
 * @returns {Promise<array>}
 */
const dbAll = async (sql, params = [], schemaName = null) => {
    const client = await pool.connect();
    try {
        // Set schema context if provided
        if (schemaName) {
            await setClientSchema(client, schemaName);
        }
        
        const pgSql = convertToPostgresSQL(sql, params);
        const result = await client.query(pgSql.sql, pgSql.params);
        return result.rows || [];
    } catch (error) {
        console.error('Database error:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('SQL:', sql);
            console.error('Params:', params);
            if (schemaName) console.error('Schema:', schemaName);
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Execute a transaction with multiple queries
 * @param {function} callback - Async function that receives (client, schemaName)
 * @param {string} schemaName - Optional schema name for multi-tenant queries
 * @returns {Promise<any>} - Result from callback
 */
const dbTransaction = async (callback, schemaName = null) => {
    const client = await pool.connect();
    try {
        // Set schema context if provided
        if (schemaName) {
            await setClientSchema(client, schemaName);
        }
        
        await client.query('BEGIN');
        const result = await callback(client, schemaName);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Execute a raw query with schema context
 * @param {string} sql - SQL query (already in PostgreSQL format)
 * @param {array} params - Query parameters
 * @param {string} schemaName - Optional schema name
 * @returns {Promise<object>} - Full query result
 */
const dbQuery = async (sql, params = [], schemaName = null) => {
    const client = await pool.connect();
    try {
        if (schemaName) {
            await setClientSchema(client, schemaName);
        }
        return await client.query(sql, params);
    } finally {
        client.release();
    }
};

// Get database instance (returns pool for PostgreSQL)
const getDb = () => {
    return pool;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Initialization
    initDatabase,
    getDb,
    pool,
    
    // Schema management
    setClientSchema,
    getSchemaClient,
    
    // Database operations (schema-aware)
    dbRun,
    dbGet,
    dbAll,
    dbTransaction,
    dbQuery,
    
    // Utilities
    convertToPostgresSQL
};
