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

// Initialize database - run schema if needed
const initDatabase = async () => {
    try {
        // Test connection
        const client = await pool.connect();
        console.log('PostgreSQL connection established');
        
        // Check if we need to run migrations
        const result = await client.query('SELECT NOW()');
        console.log('Database time:', result.rows[0].now);
        
        // Read and execute init_postgres.sql if tables don't exist
        const fs = require('fs');
        const path = require('path');
        const initSqlPath = path.join(__dirname, 'init_postgres.sql');
        
        if (fs.existsSync(initSqlPath)) {
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            // Split by semicolon and execute each statement
            const statements = initSql.split(';').filter(s => s.trim().length > 0);
            
            for (const statement of statements) {
                if (statement.trim()) {
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

// Database helper functions
const dbRun = async (sql, params = []) => {
    const client = await pool.connect();
    try {
        // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
        const pgSql = convertToPostgresSQL(sql, params);
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Executing SQL:', pgSql.sql);
            console.log('With params:', pgSql.params);
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
        }
        throw error;
    } finally {
        client.release();
    }
};

const dbGet = async (sql, params = []) => {
    const client = await pool.connect();
    try {
        const pgSql = convertToPostgresSQL(sql, params);
        const result = await client.query(pgSql.sql, pgSql.params);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Database error:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('SQL:', sql);
            console.error('Params:', params);
        }
        throw error;
    } finally {
        client.release();
    }
};

const dbAll = async (sql, params = []) => {
    const client = await pool.connect();
    try {
        const pgSql = convertToPostgresSQL(sql, params);
        const result = await client.query(pgSql.sql, pgSql.params);
        return result.rows || [];
    } catch (error) {
        console.error('Database error:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('SQL:', sql);
            console.error('Params:', params);
        }
        throw error;
    } finally {
        client.release();
    }
};

// Get database instance (returns pool for PostgreSQL)
const getDb = () => {
    return pool;
};

module.exports = {
    initDatabase,
    getDb,
    dbRun,
    dbGet,
    dbAll,
    pool
};
