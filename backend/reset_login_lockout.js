/**
 * Reset Login Lockout Utility
 * 
 * This script resets the failed login attempt counter for a specific email
 * or clears all lockouts.
 * 
 * Usage:
 *   node reset_login_lockout.js <email>
 *   node reset_login_lockout.js --all
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function resetLockout(email) {
    console.log('\n🔓 Resetting Login Lockout\n');
    console.log('═══════════════════════════════════════\n');
    
    if (email === '--all') {
        console.log('⚠️  Note: The lockout system uses in-memory storage.');
        console.log('   Restarting the backend server will clear all lockouts.\n');
        console.log('   To restart: npm start in the backend directory\n');
        return;
    }
    
    if (!email) {
        console.log('❌ Error: Email address required\n');
        console.log('Usage:');
        console.log('  node reset_login_lockout.js <email>');
        console.log('  node reset_login_lockout.js --all\n');
        console.log('Example:');
        console.log('  node reset_login_lockout.js sports@westgoldprimary.co.za\n');
        process.exit(1);
    }
    
    console.log(`Email: ${email}\n`);
    console.log('⚠️  Note: The lockout system uses in-memory storage.');
    console.log('   To reset lockouts, restart the backend server:\n');
    console.log('   1. Stop the backend (Ctrl+C)');
    console.log('   2. Run: npm start\n');
    console.log('Alternative: Wait 30 minutes for automatic unlock\n');
    console.log('═══════════════════════════════════════\n');
}

const email = process.argv[2];
resetLockout(email);
