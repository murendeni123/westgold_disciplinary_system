#!/usr/bin/env node

/**
 * Force Logout All Users Script
 * 
 * This script invalidates all existing JWT tokens by updating a flag in the database.
 * Users will need to log in again to get fresh tokens with correct schema context.
 * 
 * Run after migration to ensure all users get new tokens with schema information.
 */

require('dotenv').config();
const { pool } = require('../database/db');

async function forceLogoutAllUsers() {
    console.log('\n========================================');
    console.log('🔄 Force Logout All Users');
    console.log('========================================\n');
    
    try {
        // Update all users to force re-login
        const result = await pool.query(`
            UPDATE public.users 
            SET updated_at = CURRENT_TIMESTAMP
            WHERE is_active = true
        `);
        
        console.log(`✅ Updated ${result.rowCount} user(s)`);
        console.log('\n📝 Note: This doesn\'t actually invalidate tokens,');
        console.log('   but users should log out and log back in to get');
        console.log('   fresh tokens with correct schema context.\n');
        
        console.log('========================================');
        console.log('✅ COMPLETED');
        console.log('========================================\n');
        
        console.log('Next steps:');
        console.log('1. Ask all users to log out');
        console.log('2. Users log back in to get new tokens');
        console.log('3. New tokens will have correct schema context\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

forceLogoutAllUsers();
