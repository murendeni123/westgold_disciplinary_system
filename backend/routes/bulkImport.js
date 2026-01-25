const express = require('express');
const ExcelJS = require('exceljs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
    }
  },
});

// Helper function to validate email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper function to validate date
const isValidDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

// Bulk import students
router.post('/students', authenticateToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schoolId = getSchoolId(req);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ error: 'Excel file must contain at least one worksheet' });
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    // Expected headers (case-insensitive)
    const headerRow = worksheet.getRow(1);
    const headers = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = String(cell.value || '').trim().toLowerCase();
      headers[header] = colNumber;
    });

    // Validate required headers
    const requiredHeaders = ['student_id', 'first_name', 'last_name'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
        expectedColumns: ['Student ID', 'First Name', 'Last Name', 'Date of Birth (optional)', 'Grade Level (optional)', 'Class Name (optional)'],
      });
    }

    // Process rows (skip header row)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      results.total++;

      try {
        const studentId = String(row.getCell(headers['student_id'])?.value || '').trim();
        const firstName = String(row.getCell(headers['first_name'])?.value || '').trim();
        const lastName = String(row.getCell(headers['last_name'])?.value || '').trim();
        const dateOfBirth = isValidDate(row.getCell(headers['date_of_birth'] || headers['dob'])?.value);
        const gradeLevel = String(row.getCell(headers['grade_level'] || headers['grade'])?.value || '').trim() || null;
        const className = String(row.getCell(headers['class_name'] || headers['class'])?.value || '').trim() || null;

        // Validation
        if (!studentId) {
          throw new Error('Student ID is required');
        }
        if (!firstName) {
          throw new Error('First name is required');
        }
        if (!lastName) {
          throw new Error('Last name is required');
        }

        // Check if student ID already exists (school-specific table, use schema context from req)
        const existing = await dbGet('SELECT id FROM students WHERE student_id = $1', [studentId], req.schemaName);
        if (existing) {
          throw new Error(`Student ID ${studentId} already exists`);
        }

        // Get class_id if class name provided
        let classId = null;
        if (className) {
          const classData = await dbGet('SELECT id FROM classes WHERE name = $1', [className], req.schemaName);
          if (classData) {
            classId = classData.id;
          } else {
            throw new Error(`Class "${className}" not found. Please create the class first.`);
          }
        }

        // Generate parent link code
        const parentLinkCode = `LINK${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Insert student
        const result = await dbRun(
          `INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [studentId, firstName, lastName, dateOfBirth, classId, gradeLevel, parentLinkCode],
          req.schemaName
        );

        results.successful++;
        results.created.push({
          row: rowNumber,
          student_id: studentId,
          name: `${firstName} ${lastName}`,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Import completed: ${results.successful} successful, ${results.failed} failed out of ${results.total} rows`,
      results,
    });
  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Bulk import teachers
router.post('/teachers', authenticateToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schoolId = getSchoolId(req);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ error: 'Excel file must contain at least one worksheet' });
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    // Expected headers
    const headerRow = worksheet.getRow(1);
    const headers = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = String(cell.value || '').trim().toLowerCase();
      headers[header] = colNumber;
    });

    // Validate required headers
    const requiredHeaders = ['email', 'name', 'password'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
        expectedColumns: ['Email', 'Name', 'Password', 'Employee ID (optional)', 'Phone (optional)'],
      });
    }

    // Process rows
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      results.total++;

      try {
        const email = String(row.getCell(headers['email'])?.value || '').trim().toLowerCase();
        const name = String(row.getCell(headers['name'])?.value || '').trim();
        const password = String(row.getCell(headers['password'])?.value || '').trim();
        const employeeId = String(row.getCell(headers['employee_id'] || headers['employee id'])?.value || '').trim() || null;
        const phone = String(row.getCell(headers['phone'])?.value || '').trim() || null;

        // Validation
        if (!email) {
          throw new Error('Email is required');
        }
        if (!isValidEmail(email)) {
          throw new Error('Invalid email format');
        }
        if (!name) {
          throw new Error('Name is required');
        }
        if (!password) {
          throw new Error('Password is required');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Check if email already exists (public schema)
        const existingUser = await dbGet('SELECT id FROM public.users WHERE email = $1', [email]);
        if (existingUser) {
          throw new Error(`Email ${email} already exists`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate employee_id if not provided
        let finalEmployeeId = employeeId;
        if (!finalEmployeeId) {
          // Get max employee ID (school-specific)
          const maxEmpId = await dbGet(
            `SELECT MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)) as max_id 
             FROM teachers 
             WHERE employee_id LIKE $1`,
            ['EMP%'],
            req.schemaName
          );
          const nextId = (maxEmpId?.max_id || 0) + 1;
          finalEmployeeId = `EMP${String(nextId).padStart(4, '0')}`;
        } else {
          // Check if employee_id already exists
          const existingEmpId = await dbGet('SELECT id FROM teachers WHERE employee_id = $1', [finalEmployeeId], req.schemaName);
          if (existingEmpId) {
            throw new Error(`Employee ID ${finalEmployeeId} already exists`);
          }
        }

        // Create user in public schema
        const userResult = await dbRun(
          `INSERT INTO public.users (email, password_hash, name, role, primary_school_id)
           VALUES ($1, $2, $3, 'teacher', $4) RETURNING id`,
          [email, hashedPassword, name, schoolId]
        );

        // Link user to school in public schema
        await dbRun(
          `INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary)
           VALUES ($1, $2, 'teacher', true)`,
          [userResult.id, schoolId]
        );

        // Create teacher record in school schema
        await dbRun(
          `INSERT INTO teachers (user_id, employee_id, phone)
           VALUES ($1, $2, $3)`,
          [userResult.id, finalEmployeeId, phone],
          req.schemaName
        );

        results.successful++;
        results.created.push({
          row: rowNumber,
          email,
          name,
          employee_id: finalEmployeeId,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Import completed: ${results.successful} successful, ${results.failed} failed out of ${results.total} rows`,
      results,
    });
  } catch (error) {
    console.error('Error importing teachers:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Bulk import classes
router.post('/classes', authenticateToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schoolId = getSchoolId(req);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ error: 'Excel file must contain at least one worksheet' });
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    // Expected headers
    const headerRow = worksheet.getRow(1);
    const headers = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = String(cell.value || '').trim().toLowerCase();
      headers[header] = colNumber;
    });

    // Validate required headers
    const requiredHeaders = ['class_name'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
        expectedColumns: ['Class Name', 'Grade Level (optional)', 'Teacher Email (optional)', 'Academic Year (optional)'],
      });
    }

    // Process rows
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      results.total++;

      try {
        const className = String(row.getCell(headers['class_name'] || headers['class name'])?.value || '').trim();
        const gradeLevel = String(row.getCell(headers['grade_level'] || headers['grade level'])?.value || '').trim() || null;
        const teacherEmail = String(row.getCell(headers['teacher_email'] || headers['teacher email'])?.value || '').trim().toLowerCase() || null;
        const academicYear = String(row.getCell(headers['academic_year'] || headers['academic year'])?.value || '').trim() || '2024-2025';

        // Validation
        if (!className) {
          throw new Error('Class name is required');
        }

        // Check if class already exists (school schema)
        const existing = await dbGet('SELECT id FROM classes WHERE name = $1', [className], req.schemaName);
        if (existing) {
          throw new Error(`Class "${className}" already exists`);
        }

        // Get teacher_id if teacher email provided
        let teacherId = null;
        if (teacherEmail) {
          const teacher = await dbGet(
            `SELECT u.id FROM public.users u 
             WHERE u.email = $1 AND u.primary_school_id = $2 AND u.role = 'teacher'`,
            [teacherEmail, schoolId]
          );
          if (!teacher) {
            throw new Error(`Teacher with email ${teacherEmail} not found`);
          }
          teacherId = teacher.id;
        }

        // Insert class in school schema
        const result = await dbRun(
          `INSERT INTO classes (name, grade_level, teacher_id, academic_year)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [className, gradeLevel, teacherId, academicYear],
          req.schemaName
        );

        results.successful++;
        results.created.push({
          row: rowNumber,
          class_name: className,
          grade_level: gradeLevel,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Import completed: ${results.successful} successful, ${results.failed} failed out of ${results.total} rows`,
      results,
    });
  } catch (error) {
    console.error('Error importing classes:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Download template for students
router.get('/template/students', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Add headers
    worksheet.addRow(['Student ID', 'First Name', 'Last Name', 'Date of Birth', 'Grade Level', 'Class Name']);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add example row
    worksheet.addRow(['STU001', 'John', 'Doe', '2010-05-15', 'Grade 5', '5A']);

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // Student ID
      { width: 15 }, // First Name
      { width: 15 }, // Last Name
      { width: 15 }, // Date of Birth
      { width: 15 }, // Grade Level
      { width: 20 }, // Class Name
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_template.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download template for teachers
router.get('/template/teachers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teachers');

    // Add headers
    worksheet.addRow(['Email', 'Name', 'Password', 'Employee ID', 'Phone']);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add example row
    worksheet.addRow(['teacher@example.com', 'Jane Smith', 'password123', 'EMP0001', '+1234567890']);

    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Email
      { width: 20 }, // Name
      { width: 15 }, // Password
      { width: 15 }, // Employee ID
      { width: 15 }, // Phone
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=teachers_template.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download template for classes
router.get('/template/classes', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Classes');

    // Add headers
    worksheet.addRow(['Class Name', 'Grade Level', 'Teacher Email', 'Academic Year']);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add example row
    worksheet.addRow(['5A', 'Grade 5', 'teacher@example.com', '2024-2025']);

    // Set column widths
    worksheet.columns = [
      { width: 20 }, // Class Name
      { width: 15 }, // Grade Level
      { width: 25 }, // Teacher Email
      { width: 15 }, // Academic Year
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=classes_template.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

