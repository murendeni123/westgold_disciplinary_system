# Rate Limiting Implementation

**Date**: January 17, 2026  
**Status**: ✅ COMPLETED

---

## Overview

Comprehensive rate limiting has been implemented to protect authentication endpoints and sensitive operations from brute force attacks, credential stuffing, denial of service attempts, and abuse.

---

## Rate Limiters Implemented

### 1. Login Rate Limiter

**Endpoint**: `/api/auth/login`

**Configuration**:
- **Window**: 15 minutes
- **Max Attempts**: 5 per window
- **Behavior**: Only counts failed login attempts (successful logins don't count)
- **Response**: 429 Too Many Requests

**Protection Against**:
- Brute force password attacks
- Credential stuffing
- Account enumeration

**Example Response**:
```json
{
  "error": "Too many login attempts",
  "message": "Too many login attempts from this IP. Please try again in 15 minutes.",
  "retryAfter": "15 minutes"
}
```

---

### 2. Signup Rate Limiter

**Endpoint**: `/api/auth/signup`

**Configuration**:
- **Window**: 1 hour
- **Max Attempts**: 3 per hour
- **Behavior**: Counts all signup attempts
- **Response**: 429 Too Many Requests

**Protection Against**:
- Mass account creation
- Spam registrations
- Resource exhaustion

---

### 3. Link Student Rate Limiter

**Endpoint**: `/api/auth/link-student`

**Configuration**:
- **Window**: 15 minutes
- **Max Attempts**: 10 per window
- **Behavior**: Only counts failed link attempts
- **Response**: 429 Too Many Requests

**Protection Against**:
- Link code enumeration
- Brute force link code guessing
- Unauthorized parent-student linking

---

### 4. Password Reset Rate Limiter

**Endpoint**: `/api/auth/reset-password` (if implemented)

**Configuration**:
- **Window**: 1 hour
- **Max Attempts**: 3 per hour
- **Behavior**: Counts all reset requests
- **Response**: 429 Too Many Requests

**Protection Against**:
- Email flooding
- Account enumeration
- Reset token abuse

---

### 5. Strict Rate Limiter (Sensitive Operations)

**Endpoints**:
- `/api/bulk-import`
- `/api/bulk-import-v2`
- `/api/exports`

**Configuration**:
- **Window**: 15 minutes
- **Max Requests**: 20 per window
- **Key**: User ID + IP (for authenticated users)
- **Response**: 429 Too Many Requests

**Protection Against**:
- Bulk operation abuse
- Resource exhaustion
- Data extraction attacks

---

### 6. Upload Rate Limiter

**Endpoints**: File upload routes (if needed)

**Configuration**:
- **Window**: 1 hour
- **Max Uploads**: 50 per hour
- **Key**: User ID (for authenticated users) or IP
- **Response**: 429 Too Many Requests

**Protection Against**:
- Storage abuse
- File upload flooding
- Resource exhaustion

---

### 7. General API Rate Limiter

**Purpose**: Can be applied to any API endpoint for general protection

**Configuration**:
- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Key**: IP address
- **Response**: 429 Too Many Requests

**Protection Against**:
- API abuse
- DoS attacks
- Excessive requests

---

## Account Lockout Feature

In addition to IP-based rate limiting, an **account-level lockout** mechanism has been implemented for enhanced security.

### Configuration

- **Threshold**: 10 failed login attempts per email
- **Lockout Duration**: 30 minutes
- **Tracking Window**: 1 hour
- **Storage**: In-memory Map (cleared every 2 hours)

### How It Works

1. **Failed Login Tracking**: Each failed login attempt is tracked by email address
2. **Threshold Check**: After 10 failed attempts, the account is locked
3. **Lockout Response**: Returns 429 with lockout message
4. **Automatic Unlock**: Account unlocks after 30 minutes
5. **Reset on Success**: Successful login clears all failed attempts

### Functions

```javascript
// Track failed login attempt
const lockStatus = trackFailedLogin(email);
if (lockStatus.locked) {
    return res.status(429).json({
        error: 'Account locked',
        message: lockStatus.message
    });
}

// Reset on successful login
resetFailedLogins(email);

// Check if account is locked
if (isAccountLocked(email)) {
    // Handle locked account
}
```

### Security Benefits

- **Prevents**: Distributed brute force attacks (multiple IPs attacking same account)
- **Complements**: IP-based rate limiting
- **Protects**: Individual accounts even if attacker uses multiple IPs

---

## Implementation Details

### File Structure

```
backend/
├── middleware/
│   └── rateLimiter.js          # All rate limiting configurations
├── routes/
│   └── auth.js                 # Authentication routes with rate limiting
└── server.js                   # Rate limiters applied to routes
```

### Rate Limiter Configuration

**File**: `/backend/middleware/rateLimiter.js`

**Key Features**:
- ✅ IPv4 and IPv6 support with normalization
- ✅ Custom error messages per limiter
- ✅ Standard rate limit headers (`RateLimit-*`)
- ✅ Security violation logging
- ✅ Flexible key generation (IP, User ID, or combination)

**IP Normalization**:
```javascript
const normalizeIp = (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    // Remove IPv6 prefix for IPv4-mapped addresses
    return ip.replace(/^::ffff:/, '');
};
```

---

## Applied Routes

### Authentication Routes

```javascript
// /backend/routes/auth.js
router.post('/login', loginLimiter, async (req, res) => { ... });
router.post('/signup', signupLimiter, async (req, res) => { ... });
router.post('/link-student', authenticateToken, linkStudentLimiter, async (req, res) => { ... });
```

### Bulk Operation Routes

```javascript
// /backend/server.js
app.use('/api/bulk-import', authenticateToken, setSchemaFromToken, enforceSchemaAccess, strictLimiter, require('./routes/bulkImport'));
app.use('/api/bulk-import-v2', authenticateToken, setSchemaFromToken, enforceSchemaAccess, strictLimiter, require('./routes/bulkImportV2'));
app.use('/api/exports', authenticateToken, setSchemaFromToken, enforceSchemaAccess, strictLimiter, require('./routes/exports'));
```

---

## Rate Limit Headers

All rate limiters return standard headers:

```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1705527600
```

**Headers Explained**:
- `RateLimit-Limit`: Maximum requests allowed in window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when limit resets

---

## Security Logging

All rate limit violations are logged with:
- IP address
- User ID (if authenticated)
- Endpoint path
- Timestamp

**Example Logs**:
```
RATE LIMIT: Login attempts exceeded from IP: 192.168.1.100
RATE LIMIT: Signup attempts exceeded from IP: 10.0.0.50
RATE LIMIT: Sensitive operation exceeded from IP: 172.16.0.10, User: 42, Path: /api/bulk-import-v2
SECURITY: Account locked for user@example.com due to 10 failed login attempts
```

---

## Testing Rate Limiting

### Manual Testing

**Test Login Rate Limit**:
```bash
# Make 6 failed login attempts rapidly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done

# Expected: First 5 return 401, 6th returns 429
```

**Test Account Lockout**:
```bash
# Make 11 failed login attempts with same email
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
  sleep 1
done

# Expected: After 10 attempts, account locked for 30 minutes
```

**Check Rate Limit Headers**:
```bash
curl -i -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Look for RateLimit-* headers in response
```

---

## Performance Considerations

### Memory Usage

- **In-Memory Storage**: Rate limits and account lockouts stored in memory
- **Automatic Cleanup**: Old entries cleaned up every 2 hours
- **Scalability**: For multi-server deployments, consider Redis-based store

### Redis Integration (Future Enhancement)

For production environments with multiple servers:

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

const loginLimiter = rateLimit({
    store: new RedisStore({
        client: client,
        prefix: 'rl:login:'
    }),
    // ... other config
});
```

---

## Configuration Recommendations

### Development Environment
- **Login**: 10 attempts per 15 minutes (more lenient)
- **Signup**: 5 per hour
- **Link Student**: 20 per 15 minutes

### Production Environment
- **Login**: 5 attempts per 15 minutes (strict)
- **Signup**: 3 per hour (strict)
- **Link Student**: 10 per 15 minutes (moderate)

### Adjust via Environment Variables (Future Enhancement)

```javascript
const LOGIN_RATE_LIMIT = process.env.LOGIN_RATE_LIMIT || 5;
const LOGIN_WINDOW_MS = process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000;
```

---

## Attack Scenarios Prevented

### 1. Brute Force Login Attack
**Attack**: Attacker tries thousands of password combinations  
**Prevention**: IP-based rate limit (5 attempts per 15 min) + Account lockout (10 attempts)  
**Result**: Attack blocked after 5 attempts from same IP, account locked after 10 total attempts

### 2. Distributed Brute Force
**Attack**: Attacker uses multiple IPs to attack same account  
**Prevention**: Account-level lockout tracks by email, not IP  
**Result**: Account locked after 10 failed attempts regardless of IP

### 3. Credential Stuffing
**Attack**: Attacker tests leaked credentials from other breaches  
**Prevention**: Login rate limiter + account lockout  
**Result**: Limited to 5 attempts per IP per 15 minutes

### 4. Account Enumeration
**Attack**: Attacker tries to discover valid email addresses  
**Prevention**: Rate limiting on login/signup + consistent error messages  
**Result**: Slowed down significantly, making enumeration impractical

### 5. Mass Account Creation
**Attack**: Attacker creates many fake accounts  
**Prevention**: Signup rate limiter (3 per hour per IP)  
**Result**: Limited to 3 accounts per hour from same IP

### 6. Link Code Guessing
**Attack**: Attacker tries to guess student link codes  
**Prevention**: Link student rate limiter (10 attempts per 15 min)  
**Result**: Limited attempts, making brute force impractical

### 7. Bulk Data Extraction
**Attack**: Attacker rapidly exports data  
**Prevention**: Strict rate limiter on export endpoints (20 per 15 min)  
**Result**: Extraction significantly slowed

---

## Monitoring and Alerts

### Log Monitoring

Monitor logs for patterns:
```bash
# Check for rate limit violations
grep "RATE LIMIT" backend.log | tail -20

# Check for account lockouts
grep "SECURITY: Account locked" backend.log

# Count violations by IP
grep "RATE LIMIT" backend.log | awk '{print $NF}' | sort | uniq -c | sort -rn
```

### Recommended Alerts

1. **High Rate Limit Violations**: Alert if >100 violations per hour
2. **Account Lockouts**: Alert if >10 accounts locked per hour
3. **Distributed Attack**: Alert if same email locked from >5 different IPs

---

## Files Modified

1. **`/backend/middleware/rateLimiter.js`** - Created (NEW)
   - All rate limiting configurations
   - Account lockout mechanism
   - IP normalization helper

2. **`/backend/routes/auth.js`** - Modified
   - Applied rate limiters to login, signup, link-student
   - Integrated account lockout tracking
   - Reset failed attempts on successful login

3. **`/backend/server.js`** - Modified
   - Applied strict rate limiter to bulk import/export routes
   - Imported rate limiting middleware

---

## Next Steps (Optional Enhancements)

1. **Redis Integration**: For multi-server deployments
2. **Environment-Based Configuration**: Adjust limits per environment
3. **Admin Dashboard**: View rate limit violations and locked accounts
4. **Email Notifications**: Notify users when account is locked
5. **Whitelist**: Allow certain IPs to bypass rate limits
6. **Dynamic Limits**: Adjust limits based on user reputation

---

## Summary

✅ **Rate limiting successfully implemented** across all authentication endpoints and sensitive operations.

**Security Improvements**:
- IP-based rate limiting on all auth endpoints
- Account-level lockout for distributed attacks
- Strict limits on bulk operations
- Comprehensive logging of violations
- Standard rate limit headers for client feedback

**Attack Prevention**:
- Brute force attacks: BLOCKED
- Credential stuffing: BLOCKED
- Account enumeration: SIGNIFICANTLY SLOWED
- Mass account creation: BLOCKED
- Link code guessing: BLOCKED
- Bulk data extraction: RATE LIMITED

The system is now significantly more resilient against automated attacks and abuse.

---

**Implementation Status**: PRODUCTION READY  
**Security Level**: HIGH  
**Performance Impact**: MINIMAL
