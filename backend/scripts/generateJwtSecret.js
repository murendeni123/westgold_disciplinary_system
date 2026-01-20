#!/usr/bin/env node

/**
 * JWT Secret Generator
 * 
 * Generates cryptographically secure JWT secrets for production use
 * Also validates existing secrets
 */

const { generateSecureSecret, validateJwtSecret } = require('../utils/jwtSecretValidator');

const args = process.argv.slice(2);
const command = args[0];

console.log('\n========================================');
console.log('🔐 JWT Secret Generator');
console.log('========================================\n');

if (command === 'generate' || !command) {
    // Generate a new secure secret
    const length = parseInt(args[1]) || 64;
    
    if (length < 32) {
        console.error('❌ Error: Secret length must be at least 32 characters');
        process.exit(1);
    }
    
    const secret = generateSecureSecret(length);
    
    console.log('✅ Generated secure JWT secret:\n');
    console.log(`${secret}\n`);
    console.log(`Length: ${secret.length} characters\n`);
    console.log('To use this secret:');
    console.log('1. Copy the secret above');
    console.log('2. Add to your .env file:');
    console.log(`   JWT_SECRET=${secret}`);
    console.log('3. Restart your server\n');
    console.log('⚠️  IMPORTANT: Keep this secret safe and never commit it to version control!\n');
    console.log('========================================\n');
    
} else if (command === 'validate') {
    // Validate an existing secret
    const secret = args[1];
    
    if (!secret) {
        console.error('❌ Error: Please provide a secret to validate');
        console.error('Usage: node generateJwtSecret.js validate <secret>');
        process.exit(1);
    }
    
    const environment = args[2] || 'production';
    const validation = validateJwtSecret(secret, environment);
    
    console.log(`Validating secret for ${environment} environment...\n`);
    
    if (validation.valid) {
        console.log('✅ Secret is valid!\n');
    } else {
        console.log('❌ Secret validation failed:\n');
        validation.errors.forEach(error => {
            console.log(`   ❌ ${error}`);
        });
        console.log('');
    }
    
    if (validation.warnings.length > 0) {
        console.log('⚠️  Warnings:\n');
        validation.warnings.forEach(warning => {
            console.log(`   ⚠️  ${warning}`);
        });
        console.log('');
    }
    
    console.log(`Secret length: ${secret.length} characters`);
    console.log('========================================\n');
    
} else if (command === 'help' || command === '--help' || command === '-h') {
    console.log('Usage:');
    console.log('  node generateJwtSecret.js generate [length]  - Generate a new secure secret (default: 64 chars)');
    console.log('  node generateJwtSecret.js validate <secret>  - Validate an existing secret');
    console.log('  node generateJwtSecret.js help               - Show this help message\n');
    console.log('Examples:');
    console.log('  node generateJwtSecret.js generate           - Generate 64-char secret');
    console.log('  node generateJwtSecret.js generate 128       - Generate 128-char secret');
    console.log('  node generateJwtSecret.js validate "my-secret" - Validate a secret\n');
    console.log('========================================\n');
    
} else {
    console.error(`❌ Unknown command: ${command}`);
    console.error('Run "node generateJwtSecret.js help" for usage information\n');
    process.exit(1);
}
