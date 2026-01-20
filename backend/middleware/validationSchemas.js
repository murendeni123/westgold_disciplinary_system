/**
 * Validation Schemas for Input Validation
 * 
 * Defines validation rules for different endpoints
 * Used in conjunction with input sanitization
 */

const { 
    sanitizeString, 
    sanitizeEmail, 
    sanitizePhone,
    sanitizeInteger,
    sanitizeBoolean,
    isValidEmail,
    isValidPhone,
    isValidLength
} = require('./inputSanitizer');

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Validate login request
 */
const validateLogin = (req, res, next) => {
    const { email, password, schoolCode } = req.body;
    const errors = [];
    
    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Invalid email format');
    }
    
    // Password validation
    if (!password) {
        errors.push('Password is required');
    } else if (typeof password !== 'string' || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    // School code validation (optional)
    if (schoolCode && !isValidLength(schoolCode, 2, 50)) {
        errors.push('Invalid school code');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

/**
 * Validate signup request
 */
const validateSignup = (req, res, next) => {
    const { name, email, password, phone } = req.body;
    const errors = [];
    
    // Name validation
    if (!name) {
        errors.push('Name is required');
    } else if (!isValidLength(name, 2, 100)) {
        errors.push('Name must be between 2 and 100 characters');
    }
    
    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Invalid email format');
    }
    
    // Password validation
    if (!password) {
        errors.push('Password is required');
    } else if (typeof password !== 'string' || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    } else if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
    }
    
    // Phone validation
    if (!phone) {
        errors.push('Phone number is required');
    } else if (!isValidPhone(phone)) {
        errors.push('Invalid phone number format');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

/**
 * Validate link student request
 */
const validateLinkStudent = (req, res, next) => {
    const { linkCode } = req.body;
    const errors = [];
    
    if (!linkCode) {
        errors.push('Link code is required');
    } else if (!isValidLength(linkCode, 5, 50)) {
        errors.push('Invalid link code format');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

// ============================================================================
// STUDENT SCHEMAS
// ============================================================================

/**
 * Validate create/update student request
 */
const validateStudent = (req, res, next) => {
    const { student_id, first_name, last_name, grade_level, class_id } = req.body;
    const errors = [];
    
    // Student ID validation
    if (student_id && !isValidLength(student_id, 1, 50)) {
        errors.push('Student ID must be between 1 and 50 characters');
    }
    
    // First name validation
    if (!first_name) {
        errors.push('First name is required');
    } else if (!isValidLength(first_name, 1, 100)) {
        errors.push('First name must be between 1 and 100 characters');
    }
    
    // Last name validation
    if (!last_name) {
        errors.push('Last name is required');
    } else if (!isValidLength(last_name, 1, 100)) {
        errors.push('Last name must be between 1 and 100 characters');
    }
    
    // Grade level validation
    if (grade_level !== undefined && grade_level !== null) {
        const grade = sanitizeInteger(grade_level, { min: 0, max: 13 });
        if (grade === null) {
            errors.push('Grade level must be between 0 and 13');
        }
    }
    
    // Class ID validation
    if (class_id !== undefined && class_id !== null) {
        const classId = sanitizeInteger(class_id);
        if (classId === null) {
            errors.push('Invalid class ID');
        }
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

// ============================================================================
// INCIDENT SCHEMAS
// ============================================================================

/**
 * Validate create/update incident request
 */
const validateIncident = (req, res, next) => {
    const { student_id, incident_type_id, description, severity } = req.body;
    const errors = [];
    
    // Student ID validation
    if (!student_id) {
        errors.push('Student ID is required');
    } else if (sanitizeInteger(student_id) === null) {
        errors.push('Invalid student ID');
    }
    
    // Incident type ID validation
    if (!incident_type_id) {
        errors.push('Incident type ID is required');
    } else if (sanitizeInteger(incident_type_id) === null) {
        errors.push('Invalid incident type ID');
    }
    
    // Description validation
    if (description && !isValidLength(description, 0, 5000)) {
        errors.push('Description must not exceed 5000 characters');
    }
    
    // Severity validation
    if (severity !== undefined && severity !== null) {
        const sev = sanitizeInteger(severity, { min: 1, max: 5 });
        if (sev === null) {
            errors.push('Severity must be between 1 and 5');
        }
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

// ============================================================================
// CLASS SCHEMAS
// ============================================================================

/**
 * Validate create/update class request
 */
const validateClass = (req, res, next) => {
    const { class_name, grade_level, teacher_id, academic_year } = req.body;
    const errors = [];
    
    // Class name validation
    if (!class_name) {
        errors.push('Class name is required');
    } else if (!isValidLength(class_name, 1, 100)) {
        errors.push('Class name must be between 1 and 100 characters');
    }
    
    // Grade level validation
    if (grade_level !== undefined && grade_level !== null) {
        const grade = sanitizeInteger(grade_level, { min: 0, max: 13 });
        if (grade === null) {
            errors.push('Grade level must be between 0 and 13');
        }
    }
    
    // Teacher ID validation
    if (teacher_id !== undefined && teacher_id !== null) {
        const teacherId = sanitizeInteger(teacher_id);
        if (teacherId === null) {
            errors.push('Invalid teacher ID');
        }
    }
    
    // Academic year validation
    if (academic_year && !isValidLength(academic_year, 4, 20)) {
        errors.push('Academic year must be between 4 and 20 characters');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

// ============================================================================
// TEACHER SCHEMAS
// ============================================================================

/**
 * Validate create/update teacher request
 */
const validateTeacher = (req, res, next) => {
    const { name, email, phone, employee_id } = req.body;
    const errors = [];
    
    // Name validation
    if (!name) {
        errors.push('Name is required');
    } else if (!isValidLength(name, 2, 100)) {
        errors.push('Name must be between 2 and 100 characters');
    }
    
    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Invalid email format');
    }
    
    // Phone validation (optional)
    if (phone && !isValidPhone(phone)) {
        errors.push('Invalid phone number format');
    }
    
    // Employee ID validation (optional)
    if (employee_id && !isValidLength(employee_id, 1, 50)) {
        errors.push('Employee ID must be between 1 and 50 characters');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors 
        });
    }
    
    next();
};

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

/**
 * Validate search query
 */
const validateSearch = (req, res, next) => {
    const { q, query, search } = req.query;
    const searchQuery = q || query || search;
    
    if (searchQuery && searchQuery.length > 100) {
        return res.status(400).json({ 
            error: 'Search query too long (max 100 characters)' 
        });
    }
    
    next();
};

// ============================================================================
// ID PARAMETER VALIDATION
// ============================================================================

/**
 * Validate numeric ID parameter
 */
const validateIdParam = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({ 
                error: `${paramName} is required` 
            });
        }
        
        const numericId = sanitizeInteger(id, { min: 1 });
        
        if (numericId === null) {
            return res.status(400).json({ 
                error: `Invalid ${paramName} format` 
            });
        }
        
        // Store sanitized ID back to params
        req.params[paramName] = numericId;
        
        next();
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Authentication
    validateLogin,
    validateSignup,
    validateLinkStudent,
    
    // Entities
    validateStudent,
    validateIncident,
    validateClass,
    validateTeacher,
    
    // Search
    validateSearch,
    
    // Parameters
    validateIdParam
};
