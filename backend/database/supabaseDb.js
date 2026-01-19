/**
 * Supabase Database Layer
 * 
 * This module provides database functions using the Supabase JS client.
 * It's designed as a drop-in replacement for the old db.js functions.
 * 
 * Migration Strategy:
 * 1. Set USE_SUPABASE=true in .env to use Supabase client
 * 2. Set USE_SUPABASE=false to use the old pg Pool (fallback)
 * 
 * Both methods connect to the same Supabase PostgreSQL database,
 * but the Supabase client provides additional features like RLS support.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

// Validate configuration
if (USE_SUPABASE && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('ERROR: USE_SUPABASE is true but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  console.error('Please set these in your .env file or set USE_SUPABASE=false');
  process.exit(1);
}

// Create Supabase client (service role for full access)
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Convert SQLite/legacy SQL syntax to PostgreSQL
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {{sql: string, params: Array}}
 */
const convertToPostgresSQL = (sql, params = []) => {
  let pgSql = sql;
  let paramIndex = 1;
  const pgParams = [];

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
  pgSql = pgSql.replace(/DATE\('now'\)/gi, 'CURRENT_DATE');

  // Handle strftime for date formatting
  pgSql = pgSql.replace(/strftime\('%Y-%m',\s*(\w+)\)/gi, "TO_CHAR($1, 'YYYY-MM')");
  pgSql = pgSql.replace(/strftime\('%Y-%m',\s*created_at\)/gi, "TO_CHAR(created_at, 'YYYY-MM')");

  // Handle SUBSTR to SUBSTRING
  pgSql = pgSql.replace(/SUBSTR\(([^,]+),\s*(\d+)\)/gi, "SUBSTRING($1 FROM $2)");
  pgSql = pgSql.replace(/SUBSTR\(([^,]+),\s*(\d+),\s*(\d+)\)/gi, "SUBSTRING($1 FROM $2 FOR $3)");

  return { sql: pgSql, params: pgParams.length > 0 ? pgParams : params };
};

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 * Compatible with the old dbRun function signature
 * 
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{id: number|null, changes: number}>}
 */
const dbRun = async (sql, params = []) => {
  const pgQuery = convertToPostgresSQL(sql, params);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Supabase] Executing:', pgQuery.sql);
    console.log('[Supabase] Params:', pgQuery.params);
  }

  const { data, error } = await supabase.rpc('exec_sql_run', {
    query_text: pgQuery.sql,
    query_params: pgQuery.params,
  });

  if (error) {
    // Fallback: Use direct PostgreSQL query via Supabase's postgres connection
    // This happens when the RPC function doesn't exist
    console.warn('[Supabase] RPC not available, using direct query');
    
    // For INSERT with RETURNING, we need to handle it differently
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    const hasReturning = sql.toUpperCase().includes('RETURNING');
    
    if (isInsert && !hasReturning) {
      // Add RETURNING id to INSERT statements
      pgQuery.sql = pgQuery.sql.replace(/;?\s*$/, ' RETURNING id');
    }

    // Use the raw PostgreSQL connection through Supabase
    // Since we can't use RPC, we'll need to use the REST API approach
    // For now, throw the error to fall back to the old db.js
    throw new Error(`Supabase RPC not configured: ${error.message}`);
  }

  return {
    id: data?.id || null,
    changes: data?.changes || 0,
  };
};

/**
 * Execute a query that returns a single row
 * Compatible with the old dbGet function signature
 * 
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>}
 */
const dbGet = async (sql, params = []) => {
  const pgQuery = convertToPostgresSQL(sql, params);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Supabase] Get:', pgQuery.sql);
  }

  const { data, error } = await supabase.rpc('exec_sql_get', {
    query_text: pgQuery.sql,
    query_params: pgQuery.params,
  });

  if (error) {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  return data || null;
};

/**
 * Execute a query that returns multiple rows
 * Compatible with the old dbAll function signature
 * 
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
const dbAll = async (sql, params = []) => {
  const pgQuery = convertToPostgresSQL(sql, params);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Supabase] All:', pgQuery.sql);
  }

  const { data, error } = await supabase.rpc('exec_sql_all', {
    query_text: pgQuery.sql,
    query_params: pgQuery.params,
  });

  if (error) {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  return data || [];
};

/**
 * Initialize database connection
 * @returns {Promise<void>}
 */
const initDatabase = async () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    // Test connection by querying current timestamp
    const { data, error } = await supabase.rpc('exec_sql_get', {
      query_text: 'SELECT NOW() as now',
      query_params: [],
    });

    if (error) {
      // Try a simple table query instead
      const { data: testData, error: testError } = await supabase
        .from('schools')
        .select('id')
        .limit(1);

      if (testError) {
        throw testError;
      }
      console.log('[Supabase] Connection established (table query)');
    } else {
      console.log('[Supabase] Connection established:', data?.now);
    }

    return supabase;
  } catch (error) {
    console.error('[Supabase] Connection error:', error.message);
    throw error;
  }
};

/**
 * Get the Supabase client instance
 * @returns {Object}
 */
const getDb = () => supabase;

/**
 * Check if Supabase mode is enabled
 * @returns {boolean}
 */
const isSupabaseMode = () => USE_SUPABASE && !!supabase;

module.exports = {
  supabase,
  initDatabase,
  getDb,
  dbRun,
  dbGet,
  dbAll,
  isSupabaseMode,
  convertToPostgresSQL,
};
