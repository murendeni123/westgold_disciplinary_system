const rateLimit = require('express-rate-limit');
const validator = require('validator');

// Rate limiting for import endpoints - 10 imports per 15 minutes per user
const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 imports per windowMs
  message: {
    error: 'Too many import requests. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Disable default key generator validation to allow custom key generator
  validate: { default: false },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use a sanitized IP
    if (req.user?.id) {
      return `user_${req.user.id}`;
    }
    // Sanitize IP for use as key (handle IPv6)
    const ip = req.ip || 'unknown';
    return `ip_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
  },
  skip: (req) => {
    // Skip rate limiting for validation endpoints (dry runs)
    return req.path.includes('/validate');
  }
});

// File size limit - 10MB max
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Allowed MIME types for Excel files
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/octet-stream' // Sometimes browsers send this for Excel files
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

// Validate file type and size middleware
const validateFile = (req, res, next) => {
  if (!req.file) {
    return next(); // Let the route handler deal with missing file
  }

  const file = req.file;

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      error: 'File too large',
      message: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
    });
  }

  // Check file extension
  const fileName = file.originalname.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only Excel files (.xlsx, .xls) are allowed.'
    });
  }

  // Check MIME type (with fallback for octet-stream)
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Double-check by extension if MIME type is unexpected
    if (!hasValidExtension) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only Excel files (.xlsx, .xls) are allowed.'
      });
    }
  }

  next();
};

// Sanitize string input - removes potentially dangerous characters
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Trim whitespace
  let sanitized = str.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Escape HTML entities to prevent XSS
  sanitized = validator.escape(sanitized);
  
  // Unescape common safe characters that were escaped
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
  
  return sanitized;
};

// Sanitize email - validates and normalizes email
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmed)) {
    return null;
  }
  
  return validator.normalizeEmail(trimmed) || trimmed;
};

// Sanitize phone number - removes non-numeric characters except + at start
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;
  
  let sanitized = phone.trim();
  
  // Keep only digits and + at the start
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.slice(1).replace(/[^\d]/g, '');
  } else {
    sanitized = sanitized.replace(/[^\d]/g, '');
  }
  
  return sanitized || null;
};

// Sanitize ID number - alphanumeric only
const sanitizeIdNumber = (id) => {
  if (typeof id !== 'string') return id;
  return id.trim().replace(/[^a-zA-Z0-9]/g, '');
};

// Validate and sanitize row data for students
const sanitizeStudentRow = (row) => {
  return {
    name: sanitizeString(row.name),
    email: sanitizeEmail(row.email),
    studentId: sanitizeIdNumber(row.studentId),
    idNumber: sanitizeIdNumber(row.idNumber),
    className: sanitizeString(row.className),
    gradeLevel: sanitizeString(row.gradeLevel),
    parentName: sanitizeString(row.parentName),
    parentEmail: sanitizeEmail(row.parentEmail),
    parentPhone: sanitizePhone(row.parentPhone),
    address: sanitizeString(row.address),
    dateOfBirth: row.dateOfBirth, // Keep as-is for date parsing
    gender: sanitizeString(row.gender),
  };
};

// Validate and sanitize row data for teachers
const sanitizeTeacherRow = (row) => {
  return {
    name: sanitizeString(row.name),
    email: sanitizeEmail(row.email),
    employeeId: sanitizeIdNumber(row.employeeId),
    phone: sanitizePhone(row.phone),
    password: row.password, // Don't sanitize passwords - they get hashed
  };
};

// Validate and sanitize row data for classes
const sanitizeClassRow = (row) => {
  return {
    className: sanitizeString(row.className),
    gradeLevel: sanitizeString(row.gradeLevel),
    teacherEmail: sanitizeEmail(row.teacherEmail),
    academicYear: sanitizeString(row.academicYear),
  };
};

// SQL injection prevention - validate that values don't contain SQL keywords
const containsSqlInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|FETCH|DECLARE|CAST)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
};

// Middleware to check for SQL injection in request body
const checkSqlInjection = (req, res, next) => {
  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && containsSqlInjection(value)) {
        console.warn(`Potential SQL injection detected in ${path}${key}: ${value}`);
        return true;
      }
      if (typeof value === 'object' && value !== null) {
        if (checkObject(value, `${path}${key}.`)) return true;
      }
    }
    return false;
  };

  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Request contains potentially malicious content.'
    });
  }

  next();
};

module.exports = {
  importRateLimiter,
  validateFile,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeIdNumber,
  sanitizeStudentRow,
  sanitizeTeacherRow,
  sanitizeClassRow,
  containsSqlInjection,
  checkSqlInjection,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
