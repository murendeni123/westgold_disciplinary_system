/**
 * Rate Limiting Middleware
 * 
 * Protects authentication and sensitive endpoints from brute force attacks,
 * credential stuffing, and denial of service attempts.
 * 
 * SECURITY: Different rate limits for different endpoint types
 */

const rateLimit = require('express-rate-limit');

// Helper function to normalize IP addresses (handle IPv4 and IPv6)
const normalizeIp = (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    // Remove IPv6 prefix for IPv4-mapped addresses
    return ip.replace(/^::ffff:/, '');
};

// ============================================================================
// AUTHENTICATION RATE LIMITERS
// ============================================================================

/**
 * Strict rate limiter for login attempts
 * Prevents brute force password attacks
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many login attempts',
        message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    
    // Skip successful requests (only count failures)
    skipSuccessfulRequests: true,
    
    // Use IP address as key (handle IPv6)
    keyGenerator: normalizeIp,
    
    // Disable validation to suppress IPv6 warnings
    validate: false,
    
    // Log rate limit violations
    handler: (req, res) => {
        console.warn(`RATE LIMIT: Login attempts exceeded from IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many login attempts',
            message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Moderate rate limiter for signup
 * Prevents mass account creation
 */
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 signups per hour per IP
    message: {
        error: 'Too many signup attempts',
        message: 'Too many accounts created from this IP. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: normalizeIp,
    validate: false,
    
    handler: (req, res) => {
        console.warn(`RATE LIMIT: Signup attempts exceeded from IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many signup attempts',
            message: 'Too many accounts created from this IP. Please try again in 1 hour.',
            retryAfter: '1 hour'
        });
    }
});

/**
 * Rate limiter for password reset requests
 * Prevents email flooding and enumeration
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset requests per hour
    message: {
        error: 'Too many password reset requests',
        message: 'Too many password reset requests. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: normalizeIp,
    validate: false,
    
    handler: (req, res) => {
        console.warn(`RATE LIMIT: Password reset attempts exceeded from IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many password reset requests',
            message: 'Too many password reset requests. Please try again in 1 hour.',
            retryAfter: '1 hour'
        });
    }
});

/**
 * Rate limiter for parent-student linking
 * Prevents link code enumeration
 */
const linkStudentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 link attempts per 15 minutes
    message: {
        error: 'Too many link attempts',
        message: 'Too many student link attempts. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    skipSuccessfulRequests: true,
    
    keyGenerator: normalizeIp,
    validate: false,
    
    handler: (req, res) => {
        console.warn(`RATE LIMIT: Link student attempts exceeded from IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many link attempts',
            message: 'Too many student link attempts. Please try again in 15 minutes.',
            retryAfter: '15 minutes'
        });
    }
});

// ============================================================================
// GENERAL API RATE LIMITERS
// ============================================================================

/**
 * General API rate limiter
 * Prevents API abuse and DoS attacks
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP. Please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: normalizeIp,
    validate: false,
    
    handler: (req, res) => {
        console.warn(`RATE LIMIT: API requests exceeded from IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'Too many requests from this IP. Please slow down.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Strict rate limiter for sensitive operations
 * Used for delete, bulk operations, etc.
 */
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes
    message: {
        error: 'Too many requests',
        message: 'Too many sensitive operations. Please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => {
        const normalizedIp = normalizeIp(req);
        // For authenticated users, use user ID + IP
        if (req.user && req.user.id) {
            return `user_${req.user.id}_${normalizedIp}`;
        }
        return normalizedIp;
    },
    validate: false,
    
    handler: (req, res) => {
        console.warn(`RATE LIMIT: Sensitive operation exceeded from IP: ${req.ip}, User: ${req.user?.id}, Path: ${req.path}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'Too many sensitive operations. Please slow down.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Rate limiter for file uploads
 * Prevents storage abuse
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
        error: 'Too many uploads',
        message: 'Too many file uploads. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => {
        if (req.user && req.user.id) {
            return `user_${req.user.id}`;
        }
        return normalizeIp(req);
    },
    validate: false,
    
    handler: (req, res) => {
        console.warn(`RATE LIMIT: Upload limit exceeded from IP: ${req.ip}, User: ${req.user?.id}`);
        res.status(429).json({
            error: 'Too many uploads',
            message: 'Too many file uploads. Please try again in 1 hour.',
            retryAfter: '1 hour'
        });
    }
});

// ============================================================================
// ACCOUNT LOCKOUT (Enhanced Security)
// ============================================================================

// Store for tracking failed login attempts per email
const failedLoginAttempts = new Map();
const LOCKOUT_THRESHOLD = 10; // Lock account after 10 failed attempts
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Track failed login attempts per email address
 * Provides account-level lockout in addition to IP-based rate limiting
 */
const trackFailedLogin = (email) => {
    const now = Date.now();
    const attempts = failedLoginAttempts.get(email) || { count: 0, firstAttempt: now, lockedUntil: null };
    
    // Check if account is locked
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
        return {
            locked: true,
            remainingMinutes,
            message: `Account temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`
        };
    }
    
    // Reset if window expired (1 hour)
    if (now - attempts.firstAttempt > 60 * 60 * 1000) {
        attempts.count = 0;
        attempts.firstAttempt = now;
        attempts.lockedUntil = null;
    }
    
    // Increment failed attempts
    attempts.count++;
    
    // Lock account if threshold exceeded
    if (attempts.count >= LOCKOUT_THRESHOLD) {
        attempts.lockedUntil = now + LOCKOUT_DURATION;
        failedLoginAttempts.set(email, attempts);
        
        console.error(`SECURITY: Account locked for ${email} due to ${attempts.count} failed login attempts`);
        
        return {
            locked: true,
            remainingMinutes: Math.ceil(LOCKOUT_DURATION / 60000),
            message: `Account temporarily locked due to too many failed login attempts. Try again in ${Math.ceil(LOCKOUT_DURATION / 60000)} minutes.`
        };
    }
    
    failedLoginAttempts.set(email, attempts);
    
    return {
        locked: false,
        attemptsRemaining: LOCKOUT_THRESHOLD - attempts.count
    };
};

/**
 * Reset failed login attempts for an email (call on successful login)
 */
const resetFailedLogins = (email) => {
    failedLoginAttempts.delete(email);
};

/**
 * Check if account is locked
 */
const isAccountLocked = (email) => {
    const attempts = failedLoginAttempts.get(email);
    if (!attempts || !attempts.lockedUntil) return false;
    
    const now = Date.now();
    if (now >= attempts.lockedUntil) {
        // Lockout expired, reset
        failedLoginAttempts.delete(email);
        return false;
    }
    
    return true;
};

// Cleanup old entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [email, attempts] of failedLoginAttempts.entries()) {
        // Remove entries older than 2 hours
        if (now - attempts.firstAttempt > 2 * 60 * 60 * 1000) {
            failedLoginAttempts.delete(email);
        }
    }
}, 60 * 60 * 1000);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Authentication rate limiters
    loginLimiter,
    signupLimiter,
    passwordResetLimiter,
    linkStudentLimiter,
    
    // General rate limiters
    apiLimiter,
    strictLimiter,
    uploadLimiter,
    
    // Account lockout functions
    trackFailedLogin,
    resetFailedLogins,
    isAccountLocked
};
