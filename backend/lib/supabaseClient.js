/**
 * Supabase Client for Backend
 * 
 * This module provides the Supabase client for server-side operations.
 * It uses the service role key for full database access (bypasses RLS).
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (for server-side, bypasses RLS)
 * - SUPABASE_ANON_KEY: Anonymous key (for client-side operations)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.warn('[Supabase] SUPABASE_URL not set - Supabase client will not be available');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY not set - using anon key (RLS will apply)');
}

/**
 * Supabase Admin Client (Service Role)
 * 
 * Use this for server-side operations that need to bypass Row Level Security.
 * This client has full access to all data.
 * 
 * SECURITY: Never expose this client or its key to the frontend!
 */
const supabaseAdmin = SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Supabase Public Client (Anon Key)
 * 
 * Use this for operations that should respect Row Level Security.
 * This is the same client that would be used on the frontend.
 */
const supabasePublic = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Check if Supabase is configured and available
 */
const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY));
};

/**
 * Get the appropriate Supabase client
 * @param {boolean} useServiceRole - If true, returns admin client (bypasses RLS)
 */
const getSupabaseClient = (useServiceRole = true) => {
  if (useServiceRole) {
    return supabaseAdmin;
  }
  return supabasePublic;
};

// ============================================================================
// DATABASE HELPER FUNCTIONS (Supabase-style)
// ============================================================================

/**
 * Execute a raw SQL query using Supabase
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{data: any[], error: any}>}
 */
const supabaseQuery = async (sql, params = []) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not configured');
  }

  // Replace ? placeholders with $1, $2, etc. for PostgreSQL
  let paramIndex = 1;
  const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

  const { data, error } = await supabaseAdmin.rpc('exec_sql', {
    query: pgSql,
    params: params,
  });

  if (error) {
    console.error('[Supabase Query Error]', error);
    throw error;
  }

  return { data, error: null };
};

/**
 * Insert a record using Supabase client
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<{data: any, error: any}>}
 */
const supabaseInsert = async (table, data) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not configured');
  }

  const result = await supabaseAdmin
    .from(table)
    .insert(data)
    .select()
    .single();

  return result;
};

/**
 * Update records using Supabase client
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} match - Where conditions
 * @returns {Promise<{data: any, error: any}>}
 */
const supabaseUpdate = async (table, data, match) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not configured');
  }

  let query = supabaseAdmin.from(table).update(data);
  
  // Apply match conditions
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const result = await query.select();
  return result;
};

/**
 * Delete records using Supabase client
 * @param {string} table - Table name
 * @param {Object} match - Where conditions
 * @returns {Promise<{data: any, error: any}>}
 */
const supabaseDelete = async (table, match) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not configured');
  }

  let query = supabaseAdmin.from(table).delete();
  
  // Apply match conditions
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const result = await query.select();
  return result;
};

/**
 * Select records using Supabase client
 * @param {string} table - Table name
 * @param {string} columns - Columns to select (default: *)
 * @param {Object} options - Query options (match, order, limit, etc.)
 * @returns {Promise<{data: any[], error: any}>}
 */
const supabaseSelect = async (table, columns = '*', options = {}) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not configured');
  }

  let query = supabaseAdmin.from(table).select(columns);

  // Apply match conditions
  if (options.match) {
    Object.entries(options.match).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Apply ordering
  if (options.order) {
    const { column, ascending = true } = options.order;
    query = query.order(column, { ascending });
  }

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  // Apply offset
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  // Single record
  if (options.single) {
    query = query.single();
  }

  const result = await query;
  return result;
};

module.exports = {
  supabaseAdmin,
  supabasePublic,
  isSupabaseConfigured,
  getSupabaseClient,
  supabaseQuery,
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
  supabaseSelect,
};
