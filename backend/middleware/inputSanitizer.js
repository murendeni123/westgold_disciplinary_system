/**
 * Input Sanitization Middleware
 * 
 * SECURITY: Protects against XSS, SQL injection, and malicious input
 * Sanitizes and validates all user inputs before processing
 */

const validator = require('validator');

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize string input - removes HTML tags and dangerous characters
 * @param {string} input - Input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, options = {}) => {
    if (typeof input !== 'string') {
        return input;
    }
    
    const {
        allowHTML = false,
        trim = true,
        maxLength = null,
        allowNewlines = true
    } = options;
    
    let sanitized = input;
    
    // Trim whitespace
    if (trim) {
        sanitized = sanitized.trim();
    }
    
    // Remove HTML tags if not allowed
    if (!allowHTML) {
        // Strip all HTML tags
        sanitized = validator.stripLow(sanitized);
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        
        // Escape remaining special characters
        sanitized = validator.escape(sanitized);
    }
    
    // Remove newlines if not allowed
    if (!allowNewlines) {
        sanitized = sanitized.replace(/[\r\n]/g, ' ');
    }
    
    // Enforce max length
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string|null} - Sanitized email or null if invalid
 */
const sanitizeEmail = (email) => {
    if (typeof email !== 'string') {
        return null;
    }
    
    // Normalize and validate
    const normalized = validator.normalizeEmail(email, {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_remove_subaddress: false,
        yahoo_remove_subaddress: false,
        icloud_remove_subaddress: false
    });
    
    if (!normalized || !validator.isEmail(normalized)) {
        return null;
    }
    
    return normalized.toLowerCase();
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') {
        return '';
    }
    
    // Remove all non-numeric characters except + at start
    let sanitized = phone.trim();
    
    // Keep leading + for international numbers
    const hasPlus = sanitized.startsWith('+');
    sanitized = sanitized.replace(/[^\d]/g, '');
    
    if (hasPlus) {
        sanitized = '+' + sanitized;
    }
    
    return sanitized;
};

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
const sanitizeUrl = (url) => {
    if (typeof url !== 'string') {
        return null;
    }
    
    const trimmed = url.trim();
    
    // Validate URL
    if (!validator.isURL(trimmed, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true
    })) {
        return null;
    }
    
    return trimmed;
};

/**
 * Sanitize integer
 * @param {any} input - Input to sanitize
 * @param {object} options - Options (min, max)
 * @returns {number|null} - Sanitized integer or null if invalid
 */
const sanitizeInteger = (input, options = {}) => {
    const { min = null, max = null } = options;
    
    const num = parseInt(input, 10);
    
    if (isNaN(num)) {
        return null;
    }
    
    if (min !== null && num < min) {
        return null;
    }
    
    if (max !== null && num > max) {
        return null;
    }
    
    return num;
};

/**
 * Sanitize boolean
 * @param {any} input - Input to sanitize
 * @returns {boolean} - Sanitized boolean
 */
const sanitizeBoolean = (input) => {
    if (typeof input === 'boolean') {
        return input;
    }
    
    if (typeof input === 'string') {
        const lower = input.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
    }
    
    return Boolean(input);
};

/**
 * Sanitize date
 * @param {any} input - Input to sanitize
 * @returns {Date|null} - Sanitized date or null if invalid
 */
const sanitizeDate = (input) => {
    if (input instanceof Date) {
        return isNaN(input.getTime()) ? null : input;
    }
    
    if (typeof input === 'string' && validator.isISO8601(input)) {
        const date = new Date(input);
        return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
};

/**
 * Sanitize array of strings
 * @param {any} input - Input to sanitize
 * @param {object} options - Sanitization options for each string
 * @returns {array} - Sanitized array
 */
const sanitizeArray = (input, options = {}) => {
    if (!Array.isArray(input)) {
        return [];
    }
    
    return input
        .filter(item => item !== null && item !== undefined)
        .map(item => sanitizeString(String(item), options));
};

/**
 * Sanitize object recursively
 * @param {object} obj - Object to sanitize
 * @param {object} schema - Sanitization schema
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj, schema = {}) => {
    if (typeof obj !== 'object' || obj === null) {
        return {};
    }
    
    const sanitized = {};
    
    for (const key in schema) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const rule = schema[key];
            
            if (typeof rule === 'function') {
                sanitized[key] = rule(value);
            } else if (rule.type === 'string') {
                sanitized[key] = sanitizeString(value, rule.options || {});
            } else if (rule.type === 'email') {
                sanitized[key] = sanitizeEmail(value);
            } else if (rule.type === 'phone') {
                sanitized[key] = sanitizePhone(value);
            } else if (rule.type === 'integer') {
                sanitized[key] = sanitizeInteger(value, rule.options || {});
            } else if (rule.type === 'boolean') {
                sanitized[key] = sanitizeBoolean(value);
            } else if (rule.type === 'date') {
                sanitized[key] = sanitizeDate(value);
            } else if (rule.type === 'array') {
                sanitized[key] = sanitizeArray(value, rule.options || {});
            }
        }
    }
    
    return sanitized;
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
    return typeof email === 'string' && validator.isEmail(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
    if (typeof phone !== 'string') {
        return false;
    }
    
    // Basic phone validation (10-15 digits)
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} - True if valid
 */
const isValidLength = (str, min, max) => {
    if (typeof str !== 'string') {
        return false;
    }
    return str.length >= min && str.length <= max;
};

/**
 * Check if string contains only alphanumeric characters
 * @param {string} str - String to check
 * @returns {boolean} - True if alphanumeric
 */
const isAlphanumeric = (str) => {
    return typeof str === 'string' && validator.isAlphanumeric(str);
};

/**
 * Check if string is a valid UUID
 * @param {string} str - String to check
 * @returns {boolean} - True if valid UUID
 */
const isUUID = (str) => {
    return typeof str === 'string' && validator.isUUID(str);
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Sanitize request body middleware
 * Automatically sanitizes common fields in request body
 */
const sanitizeBody = (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
        return next();
    }
    
    const sanitized = {};
    
    for (const key in req.body) {
        const value = req.body[key];
        
        // Skip if value is null or undefined
        if (value === null || value === undefined) {
            sanitized[key] = value;
            continue;
        }
        
        // SECURITY: Skip sanitization for password fields - they should be hashed as-is
        // Sanitizing passwords with HTML escape breaks authentication
        if (key.toLowerCase().includes('password')) {
            sanitized[key] = value;
            continue;
        }
        
        // Sanitize based on common field names
        if (key.toLowerCase().includes('email')) {
            sanitized[key] = sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
            sanitized[key] = sanitizePhone(value);
        } else if (key.toLowerCase().includes('url') || key === 'website' || key === 'homepage') {
            // Only sanitize as URL for actual URL fields, not link codes
            sanitized[key] = sanitizeUrl(value);
        } else if (typeof value === 'string') {
            // Default string sanitization
            sanitized[key] = sanitizeString(value, {
                allowHTML: false,
                trim: true,
                maxLength: 10000 // Prevent extremely long inputs
            });
        } else if (typeof value === 'number') {
            sanitized[key] = value;
        } else if (typeof value === 'boolean') {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' 
                    ? sanitizeString(item, { allowHTML: false, trim: true, maxLength: 10000 })
                    : item
            );
        } else {
            sanitized[key] = value;
        }
    }
    
    req.body = sanitized;
    next();
};

/**
 * Sanitize query parameters middleware
 */
const sanitizeQuery = (req, res, next) => {
    if (!req.query || typeof req.query !== 'object') {
        return next();
    }
    
    const sanitized = {};
    
    for (const key in req.query) {
        const value = req.query[key];
        
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value, {
                allowHTML: false,
                trim: true,
                maxLength: 1000
            });
        } else {
            sanitized[key] = value;
        }
    }
    
    req.query = sanitized;
    next();
};

/**
 * Sanitize URL parameters middleware
 */
const sanitizeParams = (req, res, next) => {
    if (!req.params || typeof req.params !== 'object') {
        return next();
    }
    
    const sanitized = {};
    
    for (const key in req.params) {
        const value = req.params[key];
        
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value, {
                allowHTML: false,
                trim: true,
                maxLength: 255
            });
        } else {
            sanitized[key] = value;
        }
    }
    
    req.params = sanitized;
    next();
};

/**
 * Combined sanitization middleware (body + query + params)
 */
const sanitizeAll = (req, res, next) => {
    sanitizeBody(req, res, () => {
        sanitizeQuery(req, res, () => {
            sanitizeParams(req, res, next);
        });
    });
};

/**
 * Prevent SQL injection in search queries
 */
const sanitizeSearchQuery = (query) => {
    if (typeof query !== 'string') {
        return '';
    }
    
    // Remove SQL keywords and dangerous characters
    let sanitized = query.trim();
    
    // Remove SQL comments
    sanitized = sanitized.replace(/--.*$/gm, '');
    sanitized = sanitized.replace(/\/\*.*?\*\//g, '');
    
    // Remove semicolons (statement terminators)
    sanitized = sanitized.replace(/;/g, '');
    
    // Escape special characters
    sanitized = sanitized.replace(/['";\\]/g, '');
    
    // Limit length
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
    }
    
    return sanitized;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Sanitization functions
    sanitizeString,
    sanitizeEmail,
    sanitizePhone,
    sanitizeUrl,
    sanitizeInteger,
    sanitizeBoolean,
    sanitizeDate,
    sanitizeArray,
    sanitizeObject,
    sanitizeSearchQuery,
    
    // Validation functions
    isValidEmail,
    isValidPhone,
    isValidLength,
    isAlphanumeric,
    isUUID,
    
    // Middleware
    sanitizeBody,
    sanitizeQuery,
    sanitizeParams,
    sanitizeAll
};
