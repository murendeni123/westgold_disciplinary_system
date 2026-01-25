/**
 * JWT Secret Validation Utility
 * 
 * SECURITY: Ensures production environments use secure JWT secrets
 * Prevents token forgery by validating secret strength on startup
 */

const crypto = require('crypto');

// List of known weak/default secrets that should never be used in production
const FORBIDDEN_SECRETS = [
    'your-secret-key-change-in-production',
    'secret',
    'jwt-secret',
    'my-secret',
    'change-me',
    'default-secret',
    'test-secret',
    'dev-secret',
    'password',
    '12345',
    'admin',
    'secret123',
    'jwt_secret',
    'your-secret-key',
    'your_secret_key'
];

// Minimum secret length for production
const MIN_SECRET_LENGTH = 32;

// Recommended secret length
const RECOMMENDED_SECRET_LENGTH = 64;

/**
 * Check if secret is in the forbidden list (case-insensitive)
 * @param {string} secret - JWT secret to check
 * @returns {boolean} - True if secret is forbidden
 */
const isForbiddenSecret = (secret) => {
    if (!secret) return true;
    const lowerSecret = secret.toLowerCase();
    return FORBIDDEN_SECRETS.some(forbidden => lowerSecret === forbidden.toLowerCase());
};

/**
 * Calculate entropy of a string (measure of randomness)
 * @param {string} str - String to analyze
 * @returns {number} - Entropy value
 */
const calculateEntropy = (str) => {
    const len = str.length;
    const frequencies = {};
    
    // Count character frequencies
    for (let i = 0; i < len; i++) {
        const char = str[i];
        frequencies[char] = (frequencies[char] || 0) + 1;
    }
    
    // Calculate Shannon entropy
    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }
    
    return entropy;
};

/**
 * Check if secret has sufficient complexity
 * @param {string} secret - JWT secret to check
 * @returns {object} - { valid: boolean, reason?: string }
 */
const checkSecretComplexity = (secret) => {
    if (!secret || secret.length === 0) {
        return { valid: false, reason: 'Secret is empty' };
    }
    
    // Check length
    if (secret.length < MIN_SECRET_LENGTH) {
        return { 
            valid: false, 
            reason: `Secret is too short (${secret.length} chars). Minimum: ${MIN_SECRET_LENGTH} chars` 
        };
    }
    
    // Check entropy (randomness)
    const entropy = calculateEntropy(secret);
    const minEntropy = 3.5; // Reasonable threshold for randomness
    
    if (entropy < minEntropy) {
        return { 
            valid: false, 
            reason: `Secret has low entropy (${entropy.toFixed(2)}). Use a more random secret.` 
        };
    }
    
    // Check for common patterns
    if (/^(.)\1+$/.test(secret)) {
        return { valid: false, reason: 'Secret contains only repeated characters' };
    }
    
    if (/^(012|123|234|345|456|567|678|789|abc|bcd|cde)/.test(secret.toLowerCase())) {
        return { valid: false, reason: 'Secret contains sequential patterns' };
    }
    
    return { valid: true };
};

/**
 * Validate JWT secret for production use
 * @param {string} secret - JWT secret to validate
 * @param {string} environment - Current environment (production, development, test)
 * @returns {object} - { valid: boolean, warnings: string[], errors: string[] }
 */
const validateJwtSecret = (secret, environment = 'production') => {
    const warnings = [];
    const errors = [];
    
    // Check if secret exists
    if (!secret) {
        errors.push('JWT_SECRET environment variable is not set');
        return { valid: false, warnings, errors };
    }
    
    // Check if using forbidden/default secret
    if (isForbiddenSecret(secret)) {
        errors.push(`Using default/weak JWT secret: "${secret}"`);
        errors.push('CRITICAL: This allows anyone to forge authentication tokens!');
        return { valid: false, warnings, errors };
    }
    
    // Production-specific checks
    if (environment === 'production') {
        // Check complexity
        const complexityCheck = checkSecretComplexity(secret);
        if (!complexityCheck.valid) {
            errors.push(`JWT secret validation failed: ${complexityCheck.reason}`);
        }
        
        // Warn if secret is shorter than recommended
        if (secret.length < RECOMMENDED_SECRET_LENGTH) {
            warnings.push(`JWT secret is ${secret.length} chars. Recommended: ${RECOMMENDED_SECRET_LENGTH}+ chars for maximum security`);
        }
        
        // Check character diversity
        const hasUpperCase = /[A-Z]/.test(secret);
        const hasLowerCase = /[a-z]/.test(secret);
        const hasNumbers = /[0-9]/.test(secret);
        const hasSpecialChars = /[^A-Za-z0-9]/.test(secret);
        
        const charTypeCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
        
        if (charTypeCount < 3) {
            warnings.push('JWT secret should contain a mix of uppercase, lowercase, numbers, and special characters');
        }
    } else {
        // Development/test environment
        if (isForbiddenSecret(secret)) {
            warnings.push(`Using default JWT secret in ${environment} environment`);
        }
    }
    
    return { 
        valid: errors.length === 0, 
        warnings, 
        errors 
    };
};

/**
 * Generate a secure random JWT secret
 * @param {number} length - Length of secret to generate (default: 64)
 * @returns {string} - Cryptographically secure random secret
 */
const generateSecureSecret = (length = 64) => {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
};

/**
 * Validate JWT secret and exit if invalid in production
 * Call this on server startup
 * @param {string} secret - JWT secret to validate
 * @param {string} environment - Current environment
 * @param {boolean} exitOnError - Whether to exit process on validation failure (default: true in production)
 */
const validateAndEnforce = (secret, environment = process.env.NODE_ENV || 'development', exitOnError = null) => {
    const shouldExit = exitOnError !== null ? exitOnError : (environment === 'production');
    
    console.log('\n========================================');
    console.log('🔐 JWT Secret Validation');
    console.log('========================================');
    console.log(`Environment: ${environment}`);
    
    const validation = validateJwtSecret(secret, environment);
    
    // Display errors
    if (validation.errors.length > 0) {
        console.error('\n❌ JWT SECRET VALIDATION FAILED:\n');
        validation.errors.forEach(error => {
            console.error(`   ❌ ${error}`);
        });
        
        if (shouldExit) {
            console.error('\n🚨 CRITICAL SECURITY ERROR 🚨');
            console.error('Server startup aborted to prevent security vulnerability.\n');
            console.error('To fix this issue:');
            console.error('1. Generate a secure secret:');
            console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'base64\'))"');
            console.error('\n2. Set it in your .env file:');
            console.error('   JWT_SECRET=<generated-secret>');
            console.error('\n3. Restart the server\n');
            console.error('========================================\n');
            process.exit(1);
        } else {
            console.warn('\n⚠️  WARNING: Continuing with invalid JWT secret (non-production environment)');
        }
    } else {
        console.log('✅ JWT secret validation passed');
    }
    
    // Display warnings
    if (validation.warnings.length > 0) {
        console.warn('\n⚠️  WARNINGS:\n');
        validation.warnings.forEach(warning => {
            console.warn(`   ⚠️  ${warning}`);
        });
    }
    
    // Show secret info (masked)
    if (secret) {
        const maskedSecret = secret.length > 8 
            ? `${secret.substring(0, 4)}${'*'.repeat(secret.length - 8)}${secret.substring(secret.length - 4)}`
            : '****';
        console.log(`\nSecret length: ${secret.length} characters`);
        console.log(`Secret (masked): ${maskedSecret}`);
        
        const entropy = calculateEntropy(secret);
        console.log(`Entropy: ${entropy.toFixed(2)} bits/char (higher is better)`);
    }
    
    console.log('========================================\n');
    
    return validation;
};

/**
 * Get JWT secret with validation
 * Throws error if secret is invalid in production
 * @returns {string} - Validated JWT secret
 */
const getValidatedJwtSecret = () => {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const environment = process.env.NODE_ENV || 'development';
    
    const validation = validateJwtSecret(secret, environment);
    
    if (!validation.valid && environment === 'production') {
        throw new Error('Invalid JWT secret in production environment. Server cannot start.');
    }
    
    return secret;
};

module.exports = {
    validateJwtSecret,
    validateAndEnforce,
    generateSecureSecret,
    getValidatedJwtSecret,
    isForbiddenSecret,
    checkSecretComplexity,
    MIN_SECRET_LENGTH,
    RECOMMENDED_SECRET_LENGTH
};
