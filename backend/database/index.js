/**
 * Unified Database Module
 * 
 * This module provides a unified interface for database operations.
 * It automatically selects between:
 * 1. Supabase JS Client (when USE_SUPABASE=true and properly configured)
 * 2. PostgreSQL Pool via pg (fallback, uses DATABASE_URL)
 * 
 * Migration Path:
 * - Phase 1: Use pg Pool with DATABASE_URL pointing to Supabase PostgreSQL
 * - Phase 2: Set USE_SUPABASE=true to use Supabase JS client (enables RLS, realtime)
 * - Phase 3: Freeze old DB, fully migrate to Supabase
 * 
 * Environment Variables:
 * - DATABASE_URL: PostgreSQL connection string (for pg Pool)
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (bypasses RLS)
 * - USE_SUPABASE: Set to 'true' to use Supabase JS client
 */

require('dotenv').config();

// Determine which database layer to use
const USE_SUPABASE_CLIENT = process.env.USE_SUPABASE === 'true';
const HAS_SUPABASE_CONFIG = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let dbModule;

if (USE_SUPABASE_CLIENT && HAS_SUPABASE_CONFIG) {
  console.log('[Database] Using Supabase JS Client');
  dbModule = require('./supabaseDb');
} else {
  console.log('[Database] Using PostgreSQL Pool (pg)');
  dbModule = require('./db');
}

// Re-export all functions from the selected module
module.exports = {
  initDatabase: dbModule.initDatabase,
  getDb: dbModule.getDb,
  dbRun: dbModule.dbRun,
  dbGet: dbModule.dbGet,
  dbAll: dbModule.dbAll,
  pool: dbModule.pool || dbModule.supabase,
  
  // Additional exports for migration support
  isSupabaseMode: () => USE_SUPABASE_CLIENT && HAS_SUPABASE_CONFIG,
  getDatabaseType: () => USE_SUPABASE_CLIENT && HAS_SUPABASE_CONFIG ? 'supabase' : 'pg',
};
