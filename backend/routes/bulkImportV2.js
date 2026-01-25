const express = require('express');
const ExcelJS = require('exceljs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun, pool } = require('../database/db');
const { schemaAll, schemaGet, schemaRun, getSchema, getSchemaClient } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  importRateLimiter, 
  validateFile, 
  sanitizeString, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizeIdNumber,
  checkSqlInjection 
} = require('../middleware/importSecurity');

const router = express.Router();

// Batch size for bulk inserts
const BATCH_SIZE = 50;

// Helper to emit progress updates via Socket.io
const emitProgress = (req, data) => {
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  const userId = req.user?.id;
  
  if (io && userId && userSockets) {
    const socket = userSockets.get(userId);
    if (socket) {
      socket.emit('import-progress', data);
    }
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
    }
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Column name aliases for smarter mapping
const COLUMN_ALIASES = {
  // Student columns
  'student_id': ['student_id', 'student id', 'studentid', 'student number', 'student no', 'id number', 'learner id', 'learner number'],
  'first_name': ['first_name', 'first name', 'firstname', 'first', 'given name', 'name'],
  'last_name': ['last_name', 'last name', 'lastname', 'surname', 'family name'],
  'date_of_birth': ['date_of_birth', 'date of birth', 'dob', 'birth date', 'birthdate', 'birthday'],
  'grade_level': ['grade_level', 'grade level', 'grade', 'class level', 'year', 'form'],
  'class_name': ['class_name', 'class name', 'class', 'classroom', 'section', 'division'],
  // Teacher columns
  'email': ['email', 'e-mail', 'email address', 'mail'],
  'name': ['name', 'full name', 'fullname', 'teacher name'],
  'password': ['password', 'pass', 'pwd'],
  'employee_id': ['employee_id', 'employee id', 'emp id', 'staff id', 'staff number', 'employee number'],
  'phone': ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell'],
  // Class columns
  'teacher_email': ['teacher_email', 'teacher email', 'teacher', 'assigned teacher'],
  'academic_year': ['academic_year', 'academic year', 'year', 'school year', 'term'],
};

// Find column by checking aliases
const findColumn = (headers, columnName) => {
  const aliases = COLUMN_ALIASES[columnName] || [columnName];
  for (const alias of aliases) {
    if (headers[alias] !== undefined) {
      return headers[alias];
    }
  }
  return null;
};

// Validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validate and parse date
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Handle Excel date serial numbers
    if (typeof dateValue === 'number') {
      // Validate the number is reasonable (between 1900 and 2100)
      if (dateValue < 0 || dateValue > 73050) {
        console.warn(`Invalid Excel date serial: ${dateValue}`);
        return null;
      }
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date from Excel serial: ${dateValue}`);
        return null;
      }
      return date.toISOString().split('T')[0];
    }
    
    // Handle string dates
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateValue}`);
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn(`Error parsing date: ${dateValue}`, error.message);
    return null;
  }
};

// Get current academic year
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // If after July, use current year - next year
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

// Generate unique parent link code
const generateParentLinkCode = () => {
  return `LINK${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};

// Split array into chunks for batch processing
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Execute batch insert with transaction
const executeBatchInsert = async (client, tableName, columns, rows) => {
  if (rows.length === 0) return [];
  
  const placeholders = rows.map((_, rowIdx) => 
    `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(', ')})`
  ).join(', ');
  
  const values = rows.flat();
  const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders} RETURNING id`;
  
  const result = await client.query(query, values);
  return result.rows.map(r => r.id);
};

// Execute batch update with transaction
const executeBatchUpdate = async (client, updates) => {
  const results = [];
  for (const update of updates) {
    const result = await client.query(update.query, update.params);
    results.push(result);
  }
  return results;
};

// Parse headers from worksheet row
const parseHeaders = (worksheet) => {
  const headerRow = worksheet.getRow(1);
  const headers = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = String(cell.value || '').trim().toLowerCase();
    headers[header] = colNumber;
  });
  return headers;
};

// ============================================
// STUDENTS IMPORT - ENHANCED
// ============================================

// Validate students (dry run)
router.post('/students/validate', authenticateToken, requireRole('admin'), upload.single('file'), validateFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const validation = await validateStudentsWorkbook(req, workbook);
    res.json(validation);
  } catch (error) {
    console.error('Error validating students:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Import students with options
router.post('/students', authenticateToken, requireRole('admin'), importRateLimiter, upload.single('file'), validateFile, async (req, res) => {
  let historyId = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const userId = req.user.id;
    const mode = req.body.mode || 'upsert'; // create, update, upsert
    const autoCreateClasses = req.body.autoCreateClasses !== 'false';
    const useSheetNames = req.body.useSheetNames !== 'false';
    const academicYear = req.body.academicYear || getCurrentAcademicYear();

    // Create import history record
    historyId = await createImportHistory(req, userId, {
      type: 'students',
      fileName: req.file.originalname,
      mode,
      academicYear
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    // Emit start progress
    emitProgress(req, { type: 'students', status: 'starting', message: 'Starting import...' });

    const results = await importStudentsWorkbook(req, workbook, {
      mode,
      autoCreateClasses,
      useSheetNames,
      academicYear,
      onProgress: (progress) => emitProgress(req, { type: 'students', ...progress }),
    });

    // Update import history with results
    await updateImportHistory(historyId, results, schema);

    // Emit completion
    emitProgress(req, { type: 'students', status: 'complete', ...results.summary });

    res.json(results);
  } catch (error) {
    console.error('Error importing students:', error);
    // Update history with error if we have a historyId
    if (historyId) {
      await pool.query(
        `UPDATE import_history SET status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [error.message, historyId]
      );
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Validate students workbook
async function validateStudentsWorkbook(req, workbook) {
  const validation = {
    valid: true,
    sheets: [],
    summary: {
      totalRows: 0,
      toCreate: 0,
      toUpdate: 0,
      toSkip: 0,
      errors: 0,
      classesToCreate: [],
    },
    errors: [],
    warnings: [],
  };

  // Get existing students and classes from school schema
  const existingStudents = await schemaAll(req, 'SELECT student_id, id FROM students');
  const existingStudentMap = new Map(existingStudents.map(s => [s.student_id, s.id]));
  
  const existingClasses = await schemaAll(req, 'SELECT class_name, id FROM classes');
  const existingClassMap = new Map(existingClasses.map(c => [c.class_name.toLowerCase(), c.id]));

  const seenStudentIds = new Set();
  const classesToCreate = new Set();

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    const headers = parseHeaders(worksheet);
    
    // Check required headers
    const studentIdCol = findColumn(headers, 'student_id');
    const firstNameCol = findColumn(headers, 'first_name');
    const lastNameCol = findColumn(headers, 'last_name');

    if (!studentIdCol || !firstNameCol || !lastNameCol) {
      validation.errors.push({
        sheet: sheetName,
        row: 1,
        error: 'Missing required columns: Student ID, First Name, Last Name',
      });
      validation.valid = false;
      continue;
    }

    const classNameCol = findColumn(headers, 'class_name');
    const sheetResults = {
      name: sheetName,
      rows: [],
      toCreate: 0,
      toUpdate: 0,
      toSkip: 0,
      errors: 0,
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      validation.summary.totalRows++;

      const studentId = String(row.getCell(studentIdCol)?.value || '').trim();
      const firstName = String(row.getCell(firstNameCol)?.value || '').trim();
      const lastName = String(row.getCell(lastNameCol)?.value || '').trim();
      const className = classNameCol 
        ? String(row.getCell(classNameCol)?.value || '').trim() 
        : sheetName; // Use sheet name as class if no column

      // Skip empty rows
      if (!studentId && !firstName && !lastName) {
        continue;
      }

      const rowResult = {
        row: rowNumber,
        studentId,
        name: `${firstName} ${lastName}`,
        action: 'create',
        errors: [],
        warnings: [],
      };

      // Validate required fields
      if (!studentId) {
        rowResult.errors.push('Student ID is required');
      }
      if (!firstName) {
        rowResult.errors.push('First name is required');
      }
      if (!lastName) {
        rowResult.errors.push('Last name is required');
      }

      // Check for duplicates within file
      if (studentId && seenStudentIds.has(studentId)) {
        rowResult.errors.push(`Duplicate Student ID "${studentId}" in file`);
      }
      seenStudentIds.add(studentId);

      // Check if exists in DB
      if (existingStudentMap.has(studentId)) {
        rowResult.action = 'update';
        sheetResults.toUpdate++;
        validation.summary.toUpdate++;
      } else {
        sheetResults.toCreate++;
        validation.summary.toCreate++;
      }

      // Check class exists
      if (className && !existingClassMap.has(className.toLowerCase())) {
        classesToCreate.add(className);
        rowResult.warnings.push(`Class "${className}" will be auto-created`);
      }

      if (rowResult.errors.length > 0) {
        rowResult.action = 'error';
        sheetResults.errors++;
        validation.summary.errors++;
        validation.errors.push({
          sheet: sheetName,
          row: rowNumber,
          studentId,
          errors: rowResult.errors,
        });
      }

      sheetResults.rows.push(rowResult);
    }

    validation.sheets.push(sheetResults);
  }

  validation.summary.classesToCreate = Array.from(classesToCreate);
  if (validation.summary.errors > 0) {
    validation.valid = false;
  }

  return validation;
}

// Import students workbook with batch processing and transactions
async function importStudentsWorkbook(req, workbook, options) {
  const { mode, autoCreateClasses, useSheetNames, academicYear, onProgress } = options;
  const targetAcademicYear = academicYear || getCurrentAcademicYear();
  const schema = getSchema(req);
  
  const results = {
    success: true,
    message: '',
    summary: {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      classesCreated: 0,
      batchesProcessed: 0,
    },
    details: [],
    errors: [],
    classesCreated: [],
  };

  // Get existing data from school schema
  const existingStudents = await schemaAll(req, 'SELECT * FROM students');
  const existingStudentMap = new Map(existingStudents.map(s => [s.student_id, s]));
  
  const existingClasses = await schemaAll(req, 'SELECT * FROM classes');
  // Create composite key: className_academicYear for smart linking
  const existingClassMap = new Map(existingClasses.map(c => [c.class_name.toLowerCase(), c]));
  const existingClassByYearMap = new Map(existingClasses.map(c => [`${c.class_name.toLowerCase()}_${c.academic_year}`, c]));

  // Process each worksheet
  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    const headers = parseHeaders(worksheet);
    
    const studentIdCol = findColumn(headers, 'student_id');
    const firstNameCol = findColumn(headers, 'first_name');
    const lastNameCol = findColumn(headers, 'last_name');
    const dobCol = findColumn(headers, 'date_of_birth');
    const gradeCol = findColumn(headers, 'grade_level');
    const classNameCol = findColumn(headers, 'class_name');

    if (!studentIdCol || !firstNameCol || !lastNameCol) {
      results.errors.push({
        sheet: sheetName,
        row: 1,
        error: 'Missing required columns',
      });
      continue;
    }

    // Collect all rows for batch processing
    const rowsToProcess = [];
    
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Extract and sanitize input data
      const studentId = sanitizeIdNumber(String(row.getCell(studentIdCol)?.value || '').trim());
      const firstName = sanitizeString(String(row.getCell(firstNameCol)?.value || '').trim());
      const lastName = sanitizeString(String(row.getCell(lastNameCol)?.value || '').trim());
      const dateOfBirth = dobCol ? parseDate(row.getCell(dobCol)?.value) : null;
      const gradeLevel = gradeCol ? sanitizeString(String(row.getCell(gradeCol)?.value || '').trim()) || null : null;
      
      // Determine class name
      let className = null;
      if (classNameCol) {
        className = sanitizeString(String(row.getCell(classNameCol)?.value || '').trim()) || null;
      }
      if (!className && useSheetNames && sheetName !== 'Students' && sheetName !== 'Sheet1') {
        className = sanitizeString(sheetName);
      }

      // Skip empty rows
      if (!studentId && !firstName && !lastName) {
        continue;
      }

      rowsToProcess.push({
        rowNumber,
        studentId,
        firstName,
        lastName,
        dateOfBirth,
        gradeLevel,
        className,
        sheetName,
      });
    }

    // Process in batches with transactions
    const batches = chunkArray(rowsToProcess, BATCH_SIZE);
    const totalBatches = batches.length;
    let currentBatch = 0;
    
    for (const batch of batches) {
      currentBatch++;
      const client = await pool.connect();
      
      // Emit batch progress
      if (onProgress) {
        onProgress({
          status: 'processing',
          currentBatch,
          totalBatches,
          processed: results.summary.totalProcessed,
          total: rowsToProcess.length,
          percent: Math.round((currentBatch / totalBatches) * 100),
          message: `Processing batch ${currentBatch} of ${totalBatches}...`,
        });
      }
      
      try {
        await client.query('BEGIN');
        // Set schema for this transaction
        await client.query(`SET search_path TO ${schema}, public`);
        
        const toInsert = [];
        const toUpdate = [];
        const batchDetails = [];
        const batchErrors = [];
        
        for (const rowData of batch) {
          results.summary.totalProcessed++;
          
          try {
            const { rowNumber, studentId, firstName, lastName, dateOfBirth, gradeLevel, className, sheetName } = rowData;
            
            // Validate
            if (!studentId || !firstName || !lastName) {
              throw new Error('Missing required fields');
            }

            // Get or create class - smart linking by name + academic year
            let classId = null;
            if (className) {
              const compositeKey = `${className.toLowerCase()}_${targetAcademicYear}`;
              // First try to match by name + academic year (smart linking)
              let existingClass = existingClassByYearMap.get(compositeKey);
              // Fall back to matching by name only
              if (!existingClass) {
                existingClass = existingClassMap.get(className.toLowerCase());
              }
              
              if (existingClass) {
                classId = existingClass.id;
              } else if (autoCreateClasses) {
                // Auto-create class within transaction for the target academic year
                const classResult = await client.query(
                  `INSERT INTO classes (class_name, grade_level, academic_year)
                   VALUES ($1, $2, $3) RETURNING id`,
                  [className, gradeLevel, targetAcademicYear]
                );
                classId = classResult.rows[0].id;
                const newClass = { id: classId, class_name: className, academic_year: targetAcademicYear };
                existingClassMap.set(className.toLowerCase(), newClass);
                existingClassByYearMap.set(compositeKey, newClass);
                results.classesCreated.push(`${className} (${targetAcademicYear})`);
                results.summary.classesCreated++;
              } else {
                throw new Error(`Class "${className}" not found for ${targetAcademicYear}`);
              }
            }

            const existingStudent = existingStudentMap.get(studentId);

            if (existingStudent) {
              // Student exists
              if (mode === 'create') {
                results.summary.skipped++;
                batchDetails.push({
                  sheet: sheetName,
                  row: rowNumber,
                  studentId,
                  action: 'skipped',
                  reason: 'Already exists (create mode)',
                });
                continue;
              }

              // Queue for batch update
              toUpdate.push({
                query: `UPDATE students SET first_name = $1, last_name = $2, date_of_birth = $3, class_id = $4, grade_level = $5 WHERE id = $6`,
                params: [firstName, lastName, dateOfBirth, classId, gradeLevel, existingStudent.id],
                detail: {
                  sheet: sheetName,
                  row: rowNumber,
                  studentId,
                  name: `${firstName} ${lastName}`,
                  action: 'updated',
                },
              });
            } else {
              // New student
              if (mode === 'update') {
                results.summary.skipped++;
                batchDetails.push({
                  sheet: sheetName,
                  row: rowNumber,
                  studentId,
                  action: 'skipped',
                  reason: 'Does not exist (update mode)',
                });
                continue;
              }

              // Queue for batch insert
              const parentLinkCode = generateParentLinkCode();
              toInsert.push({
                values: [studentId, firstName, lastName, dateOfBirth, classId, gradeLevel, parentLinkCode],
                detail: {
                  sheet: sheetName,
                  row: rowNumber,
                  studentId,
                  name: `${firstName} ${lastName}`,
                  action: 'created',
                },
              });
            }
          } catch (error) {
            batchErrors.push({
              sheet: rowData.sheetName,
              row: rowData.rowNumber,
              error: error.message,
            });
          }
        }

        // Execute batch inserts
        if (toInsert.length > 0) {
          const insertColumns = ['student_id', 'first_name', 'last_name', 'date_of_birth', 'class_id', 'grade_level', 'parent_link_code'];
          const insertRows = toInsert.map(item => item.values);
          
          try {
            const insertedIds = await executeBatchInsert(client, 'students', insertColumns, insertRows);
            
            // Update maps and results
            toInsert.forEach((item, idx) => {
              existingStudentMap.set(item.detail.studentId, { id: insertedIds[idx], student_id: item.detail.studentId });
              results.summary.created++;
              batchDetails.push(item.detail);
            });
          } catch (insertError) {
            // If batch insert fails, try individual inserts
            for (const item of toInsert) {
              try {
                const result = await client.query(
                  `INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code)
                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                  item.values
                );
                existingStudentMap.set(item.detail.studentId, { id: result.rows[0].id, student_id: item.detail.studentId });
                results.summary.created++;
                batchDetails.push(item.detail);
              } catch (individualError) {
                batchErrors.push({
                  sheet: item.detail.sheet,
                  row: item.detail.row,
                  error: individualError.message,
                });
              }
            }
          }
        }

        // Execute batch updates
        for (const update of toUpdate) {
          try {
            await client.query(update.query, update.params);
            results.summary.updated++;
            batchDetails.push(update.detail);
          } catch (updateError) {
            batchErrors.push({
              sheet: update.detail.sheet,
              row: update.detail.row,
              error: updateError.message,
            });
          }
        }

        // Commit transaction for this batch
        await client.query('COMMIT');
        results.summary.batchesProcessed++;
        
        // Add batch results
        results.details.push(...batchDetails);
        results.errors.push(...batchErrors);
        results.summary.failed += batchErrors.length;
        
      } catch (batchError) {
        // Rollback entire batch on critical error
        await client.query('ROLLBACK');
        console.error('Batch rollback:', batchError);
        
        // Mark all rows in batch as failed
        for (const rowData of batch) {
          results.summary.failed++;
          results.errors.push({
            sheet: rowData.sheetName,
            row: rowData.rowNumber,
            error: `Batch failed: ${batchError.message}`,
          });
        }
      } finally {
        client.release();
      }
    }
  }

  results.message = `Import completed: ${results.summary.created} created, ${results.summary.updated} updated, ${results.summary.skipped} skipped, ${results.summary.failed} failed`;
  if (results.summary.classesCreated > 0) {
    results.message += `. ${results.summary.classesCreated} classes auto-created.`;
  }
  results.message += ` (${results.summary.batchesProcessed} batches processed)`;

  return results;
}

// ============================================
// TEACHERS IMPORT - ENHANCED
// ============================================

// Validate teachers (dry run)
router.post('/teachers/validate', authenticateToken, requireRole('admin'), upload.single('file'), validateFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const validation = await validateTeachersWorkbook(req, workbook);
    res.json(validation);
  } catch (error) {
    console.error('Error validating teachers:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Import teachers with options
router.post('/teachers', authenticateToken, requireRole('admin'), importRateLimiter, upload.single('file'), validateFile, async (req, res) => {
  let historyId = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const userId = req.user.id;
    const mode = req.body.mode || 'upsert';

    // Create import history record
    historyId = await createImportHistory(req, userId, {
      type: 'teachers',
      fileName: req.file.originalname,
      mode,
      academicYear: null
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    emitProgress(req, { type: 'teachers', status: 'starting', message: 'Starting import...' });

    const results = await importTeachersWorkbook(req, workbook, { 
      mode,
      onProgress: (progress) => emitProgress(req, { type: 'teachers', ...progress }),
    });

    // Update import history with results
    await updateImportHistory(historyId, results, schema);

    emitProgress(req, { type: 'teachers', status: 'complete', ...results.summary });

    res.json(results);
  } catch (error) {
    console.error('Error importing teachers:', error);
    if (historyId) {
      await pool.query(
        `UPDATE import_history SET status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [error.message, historyId]
      );
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Validate teachers workbook
async function validateTeachersWorkbook(req, workbook) {
  const validation = {
    valid: true,
    summary: {
      totalRows: 0,
      toCreate: 0,
      toUpdate: 0,
      toSkip: 0,
      errors: 0,
    },
    rows: [],
    errors: [],
  };

  // Get existing teachers from school schema
  const existingTeachers = await schemaAll(req, 'SELECT t.id, u.email FROM teachers t INNER JOIN public.users u ON t.user_id = u.id');
  const existingEmailMap = new Map(existingTeachers.map(t => [t.email.toLowerCase(), t.id]));
  const seenEmails = new Set();

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    validation.valid = false;
    validation.errors.push({ row: 0, error: 'No worksheet found' });
    return validation;
  }

  const headers = parseHeaders(worksheet);
  const emailCol = findColumn(headers, 'email');
  const nameCol = findColumn(headers, 'name');
  const passwordCol = findColumn(headers, 'password');

  if (!emailCol || !nameCol) {
    validation.valid = false;
    validation.errors.push({ row: 1, error: 'Missing required columns: Email, Name' });
    return validation;
  }

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    validation.summary.totalRows++;

    const email = String(row.getCell(emailCol)?.value || '').trim().toLowerCase();
    const name = String(row.getCell(nameCol)?.value || '').trim();
    const password = passwordCol ? String(row.getCell(passwordCol)?.value || '').trim() : '';

    if (!email && !name) continue;

    const rowResult = {
      row: rowNumber,
      email,
      name,
      action: 'create',
      errors: [],
    };

    if (!email) rowResult.errors.push('Email is required');
    if (email && !isValidEmail(email)) rowResult.errors.push('Invalid email format');
    if (!name) rowResult.errors.push('Name is required');

    if (seenEmails.has(email)) {
      rowResult.errors.push(`Duplicate email "${email}" in file`);
    }
    seenEmails.add(email);

    if (existingEmailMap.has(email)) {
      rowResult.action = 'update';
      validation.summary.toUpdate++;
    } else {
      // Set default password if not provided
      if (!password) {
        row.password = 'teacher123'; // Default password for new teachers
      }
      if (password && password.length < 6) rowResult.errors.push('Password must be at least 6 characters');
      validation.summary.toCreate++;
    }

    if (rowResult.errors.length > 0) {
      rowResult.action = 'error';
      validation.summary.errors++;
      validation.errors.push({ row: rowNumber, email, errors: rowResult.errors });
    }

    validation.rows.push(rowResult);
  }

  if (validation.summary.errors > 0) validation.valid = false;
  return validation;
}

// Import teachers workbook with batch processing and transactions
async function importTeachersWorkbook(req, workbook, options) {
  const { mode, onProgress } = options;
  const schema = getSchema(req);

  const results = {
    success: true,
    message: '',
    summary: {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      batchesProcessed: 0,
    },
    details: [],
    errors: [],
  };

  // Get existing teachers with user info from school schema
  const existingTeachers = await schemaAll(req,
    `SELECT t.*, u.email, u.name 
     FROM teachers t 
     INNER JOIN public.users u ON t.user_id = u.id`
  );
  const existingEmailMap = new Map(existingTeachers.map(t => [t.email.toLowerCase(), t]));

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    results.errors.push({ row: 0, error: 'No worksheet found' });
    return results;
  }

  const headers = parseHeaders(worksheet);
  const emailCol = findColumn(headers, 'email');
  const nameCol = findColumn(headers, 'name');
  const passwordCol = findColumn(headers, 'password');
  const employeeIdCol = findColumn(headers, 'employee_id');
  const phoneCol = findColumn(headers, 'phone');

  if (!emailCol || !nameCol) {
    results.errors.push({ row: 1, error: 'Missing required columns' });
    return results;
  }

  // Get max employee ID for auto-generation from school schema
  const maxEmpIdResult = await schemaGet(req,
    `SELECT MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)) as max_id 
     FROM teachers WHERE employee_id LIKE $1`,
    ['EMP%']
  );
  let nextEmpId = (maxEmpIdResult?.max_id || 0) + 1;

  // Collect all rows for batch processing
  const rowsToProcess = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    // Extract and sanitize input data
    const email = sanitizeEmail(String(row.getCell(emailCol)?.value || '').trim());
    const name = sanitizeString(String(row.getCell(nameCol)?.value || '').trim());
    let password = passwordCol ? String(row.getCell(passwordCol)?.value || '').trim() : ''; // Don't sanitize passwords
    // Set default password if not provided
    if (!password) password = 'teacher123';
    const employeeId = employeeIdCol ? sanitizeIdNumber(String(row.getCell(employeeIdCol)?.value || '').trim()) : '';
    const phone = phoneCol ? sanitizePhone(String(row.getCell(phoneCol)?.value || '').trim()) : '';

    if (!email && !name) continue;

    rowsToProcess.push({ rowNumber, email, name, password, employeeId, phone });
  }

  // Process in batches with transactions
  const batches = chunkArray(rowsToProcess, BATCH_SIZE);
  const totalBatches = batches.length;
  let currentBatch = 0;

  for (const batch of batches) {
    currentBatch++;
    const client = await pool.connect();
    
    // Emit batch progress
    if (onProgress) {
      onProgress({
        status: 'processing',
        currentBatch,
        totalBatches,
        processed: results.summary.totalProcessed,
        total: rowsToProcess.length,
        percent: Math.round((currentBatch / totalBatches) * 100),
        message: `Processing batch ${currentBatch} of ${totalBatches}...`,
      });
    }
    
    try {
      await client.query('BEGIN');
      // Set schema for this transaction
      await client.query(`SET search_path TO ${schema}, public`);
      
      const batchDetails = [];
      const batchErrors = [];

      for (const rowData of batch) {
        results.summary.totalProcessed++;
        const { rowNumber, email, name, password, employeeId, phone } = rowData;

        try {
          if (!email || !isValidEmail(email) || !name) {
            throw new Error('Invalid email or missing name');
          }

          const existingUser = existingEmailMap.get(email);

          if (existingUser) {
            if (mode === 'create') {
              results.summary.skipped++;
              batchDetails.push({ row: rowNumber, email, action: 'skipped', reason: 'Already exists' });
              continue;
            }

            // Update existing teacher within transaction - update user in public schema
            await client.query('UPDATE public.users SET name = $1 WHERE id = $2', [name, existingUser.user_id]);
            
            if (phone || employeeId) {
              await client.query(
                `UPDATE teachers SET phone = COALESCE($1, phone), employee_id = COALESCE($2, employee_id) WHERE user_id = $3`,
                [phone || null, employeeId || null, existingUser.user_id]
              );
            }

            results.summary.updated++;
            batchDetails.push({ row: rowNumber, email, name, action: 'updated' });
          } else {
            if (mode === 'update') {
              results.summary.skipped++;
              batchDetails.push({ row: rowNumber, email, action: 'skipped', reason: 'Does not exist' });
              continue;
            }

            // Password is already set to 'teacher123' if not provided
            if (password.length < 6) {
              throw new Error('Password must be at least 6 characters');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const finalEmployeeId = employeeId || `EMP${String(nextEmpId++).padStart(4, '0')}`;

            // Insert user in public schema
            const userResult = await client.query(
              `INSERT INTO public.users (email, password, name, role, school_id)
               VALUES ($1, $2, $3, 'teacher', (SELECT id FROM public.schools WHERE schema_name = $4)) RETURNING id`,
              [email, hashedPassword, name, schema]
            );

            // Insert teacher in school schema (search_path already set)
            await client.query(
              `INSERT INTO teachers (user_id, employee_id, phone)
               VALUES ($1, $2, $3)`,
              [userResult.rows[0].id, finalEmployeeId, phone || null]
            );

            existingEmailMap.set(email, { id: userResult.rows[0].id, email });
            results.summary.created++;
            batchDetails.push({ row: rowNumber, email, name, employeeId: finalEmployeeId, action: 'created' });
          }
        } catch (error) {
          batchErrors.push({ row: rowNumber, error: error.message });
        }
      }

      // Commit transaction for this batch
      await client.query('COMMIT');
      results.summary.batchesProcessed++;
      
      results.details.push(...batchDetails);
      results.errors.push(...batchErrors);
      results.summary.failed += batchErrors.length;

    } catch (batchError) {
      await client.query('ROLLBACK');
      console.error('Teacher batch rollback:', batchError);
      
      for (const rowData of batch) {
        results.summary.failed++;
        results.errors.push({
          row: rowData.rowNumber,
          error: `Batch failed: ${batchError.message}`,
        });
      }
    } finally {
      client.release();
    }
  }

  results.message = `Import completed: ${results.summary.created} created, ${results.summary.updated} updated, ${results.summary.skipped} skipped, ${results.summary.failed} failed (${results.summary.batchesProcessed} batches)`;
  return results;
}

// ============================================
// CLASSES IMPORT - ENHANCED
// ============================================

// Validate classes (dry run)
router.post('/classes/validate', authenticateToken, requireRole('admin'), upload.single('file'), validateFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const validation = await validateClassesWorkbook(req, workbook);
    res.json(validation);
  } catch (error) {
    console.error('Error validating classes:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Import classes with options
router.post('/classes', authenticateToken, requireRole('admin'), importRateLimiter, upload.single('file'), validateFile, async (req, res) => {
  let historyId = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const userId = req.user.id;
    const mode = req.body.mode || 'upsert';
    const academicYear = req.body.academicYear || getCurrentAcademicYear();

    // Create import history record
    historyId = await createImportHistory(req, userId, {
      type: 'classes',
      fileName: req.file.originalname,
      mode,
      academicYear
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    emitProgress(req, { type: 'classes', status: 'starting', message: 'Starting import...' });

    const results = await importClassesWorkbook(req, workbook, { 
      mode, 
      academicYear,
      onProgress: (progress) => emitProgress(req, { type: 'classes', ...progress }),
    });

    // Update import history with results
    await updateImportHistory(historyId, results, schema);

    emitProgress(req, { type: 'classes', status: 'complete', ...results.summary });

    res.json(results);
  } catch (error) {
    console.error('Error importing classes:', error);
    if (historyId) {
      await pool.query(
        `UPDATE import_history SET status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [error.message, historyId]
      );
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Validate classes workbook
async function validateClassesWorkbook(req, workbook) {
  const validation = {
    valid: true,
    summary: {
      totalRows: 0,
      toCreate: 0,
      toUpdate: 0,
      errors: 0,
    },
    rows: [],
    errors: [],
    warnings: [],
  };

  // Get existing classes from school schema
  const existingClasses = await schemaAll(req, 'SELECT class_name, id FROM classes');
  const existingClassMap = new Map(existingClasses.map(c => [c.class_name.toLowerCase(), c.id]));

  // Get existing teachers from school schema
  const existingTeachers = await schemaAll(req,
    `SELECT t.id, u.email FROM teachers t 
     INNER JOIN public.users u ON t.user_id = u.id`
  );
  const teacherEmailMap = new Map(existingTeachers.map(t => [t.email.toLowerCase(), t.id]));

  const seenClassNames = new Set();

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    validation.valid = false;
    validation.errors.push({ row: 0, error: 'No worksheet found' });
    return validation;
  }

  const headers = parseHeaders(worksheet);
  const classNameCol = findColumn(headers, 'class_name');

  if (!classNameCol) {
    validation.valid = false;
    validation.errors.push({ row: 1, error: 'Missing required column: Class Name' });
    return validation;
  }

  const teacherEmailCol = findColumn(headers, 'teacher_email');

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    validation.summary.totalRows++;

    const className = String(row.getCell(classNameCol)?.value || '').trim();
    const teacherEmail = teacherEmailCol 
      ? String(row.getCell(teacherEmailCol)?.value || '').trim().toLowerCase() 
      : '';

    if (!className) continue;

    const rowResult = {
      row: rowNumber,
      className,
      action: 'create',
      errors: [],
      warnings: [],
    };

    if (seenClassNames.has(className.toLowerCase())) {
      rowResult.errors.push(`Duplicate class name "${className}" in file`);
    }
    seenClassNames.add(className.toLowerCase());

    if (existingClassMap.has(className.toLowerCase())) {
      rowResult.action = 'update';
      validation.summary.toUpdate++;
    } else {
      validation.summary.toCreate++;
    }

    if (teacherEmail && !teacherEmailMap.has(teacherEmail)) {
      rowResult.warnings.push(`Teacher "${teacherEmail}" not found`);
    }

    if (rowResult.errors.length > 0) {
      rowResult.action = 'error';
      validation.summary.errors++;
      validation.errors.push({ row: rowNumber, className, errors: rowResult.errors });
    }

    validation.rows.push(rowResult);
  }

  if (validation.summary.errors > 0) validation.valid = false;
  return validation;
}

// Import classes workbook with batch processing and transactions
async function importClassesWorkbook(req, workbook, options) {
  const { mode, academicYear: providedAcademicYear, onProgress } = options;
  const defaultAcademicYear = providedAcademicYear || getCurrentAcademicYear();
  const schema = getSchema(req);

  const results = {
    success: true,
    message: '',
    summary: {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      batchesProcessed: 0,
    },
    details: [],
    errors: [],
  };

  // Get existing classes from school schema
  const existingClasses = await schemaAll(req, 'SELECT * FROM classes');
  const existingClassMap = new Map(existingClasses.map(c => [c.class_name.toLowerCase(), c]));

  // Get existing teachers from school schema
  const existingTeachers = await schemaAll(req,
    `SELECT t.user_id, u.email FROM teachers t 
     INNER JOIN public.users u ON t.user_id = u.id`
  );
  const teacherEmailMap = new Map(existingTeachers.map(t => [t.email.toLowerCase(), t.user_id]));

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    results.errors.push({ row: 0, error: 'No worksheet found' });
    return results;
  }

  const headers = parseHeaders(worksheet);
  const classNameCol = findColumn(headers, 'class_name');
  const gradeLevelCol = findColumn(headers, 'grade_level');
  const teacherEmailCol = findColumn(headers, 'teacher_email');
  const academicYearCol = findColumn(headers, 'academic_year');

  if (!classNameCol) {
    results.errors.push({ row: 1, error: 'Missing required column: Class Name' });
    return results;
  }

  // Collect all rows for batch processing
  const rowsToProcess = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    // Extract and sanitize input data
    const className = sanitizeString(String(row.getCell(classNameCol)?.value || '').trim());
    const gradeLevel = gradeLevelCol ? sanitizeString(String(row.getCell(gradeLevelCol)?.value || '').trim()) || null : null;
    const teacherEmail = teacherEmailCol 
      ? sanitizeEmail(String(row.getCell(teacherEmailCol)?.value || '').trim())
      : null;
    const academicYear = academicYearCol 
      ? sanitizeString(String(row.getCell(academicYearCol)?.value || '').trim()) || defaultAcademicYear
      : defaultAcademicYear;

    if (!className) continue;

    rowsToProcess.push({ rowNumber, className, gradeLevel, teacherEmail, academicYear });
  }

  // Process in batches with transactions
  const batches = chunkArray(rowsToProcess, BATCH_SIZE);
  const totalBatches = batches.length;
  let currentBatch = 0;

  for (const batch of batches) {
    currentBatch++;
    const client = await pool.connect();
    
    // Emit batch progress
    if (onProgress) {
      onProgress({
        status: 'processing',
        currentBatch,
        totalBatches,
        processed: results.summary.totalProcessed,
        total: rowsToProcess.length,
        percent: Math.round((currentBatch / totalBatches) * 100),
        message: `Processing batch ${currentBatch} of ${totalBatches}...`,
      });
    }
    
    try {
      await client.query('BEGIN');
      // Set schema for this transaction
      await client.query(`SET search_path TO ${schema}, public`);
      
      const batchDetails = [];
      const batchErrors = [];

      for (const rowData of batch) {
        results.summary.totalProcessed++;
        const { rowNumber, className, gradeLevel, teacherEmail, academicYear } = rowData;

        try {
          let teacherId = null;
          if (teacherEmail) {
            teacherId = teacherEmailMap.get(teacherEmail) || null;
          }

          const existingClass = existingClassMap.get(className.toLowerCase());

          if (existingClass) {
            if (mode === 'create') {
              results.summary.skipped++;
              batchDetails.push({ row: rowNumber, className, action: 'skipped', reason: 'Already exists' });
              continue;
            }

            await client.query(
              `UPDATE classes SET grade_level = $1, teacher_id = $2, academic_year = $3 WHERE id = $4`,
              [gradeLevel, teacherId, academicYear, existingClass.id]
            );

            results.summary.updated++;
            batchDetails.push({ row: rowNumber, className, action: 'updated' });
          } else {
            if (mode === 'update') {
              results.summary.skipped++;
              batchDetails.push({ row: rowNumber, className, action: 'skipped', reason: 'Does not exist' });
              continue;
            }

            const insertResult = await client.query(
              `INSERT INTO classes (class_name, grade_level, teacher_id, academic_year)
               VALUES ($1, $2, $3, $4) RETURNING id`,
              [className, gradeLevel, teacherId, academicYear]
            );

            existingClassMap.set(className.toLowerCase(), { id: insertResult.rows[0].id, class_name: className });
            results.summary.created++;
            batchDetails.push({ row: rowNumber, className, action: 'created' });
          }
        } catch (error) {
          batchErrors.push({ row: rowNumber, error: error.message });
        }
      }

      // Commit transaction for this batch
      await client.query('COMMIT');
      results.summary.batchesProcessed++;
      
      results.details.push(...batchDetails);
      results.errors.push(...batchErrors);
      results.summary.failed += batchErrors.length;

    } catch (batchError) {
      await client.query('ROLLBACK');
      console.error('Class batch rollback:', batchError);
      
      for (const rowData of batch) {
        results.summary.failed++;
        results.errors.push({
          row: rowData.rowNumber,
          error: `Batch failed: ${batchError.message}`,
        });
      }
    } finally {
      client.release();
    }
  }

  results.message = `Import completed: ${results.summary.created} created, ${results.summary.updated} updated, ${results.summary.skipped} skipped, ${results.summary.failed} failed (${results.summary.batchesProcessed} batches)`;
  return results;
}

// ============================================
// TEMPLATES - ENHANCED
// ============================================

router.get('/template/students', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.addRow(['Student ID', 'First Name', 'Last Name', 'Date of Birth', 'Grade Level', 'Class Name']);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    worksheet.addRow(['STU001', 'John', 'Doe', '2010-05-15', 'Grade 5', '5A']);
    worksheet.addRow(['STU002', 'Jane', 'Smith', '2010-08-22', 'Grade 5', '5A']);

    // Add instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.addRow(['IMPORT INSTRUCTIONS']);
    instructionsSheet.addRow(['']);
    instructionsSheet.addRow(['Required Columns: Student ID, First Name, Last Name']);
    instructionsSheet.addRow(['Optional Columns: Date of Birth, Grade Level, Class Name']);
    instructionsSheet.addRow(['']);
    instructionsSheet.addRow(['MULTI-SHEET IMPORT:']);
    instructionsSheet.addRow(['- Create separate sheets for each class (e.g., "Grade 5A", "Grade 5B")']);
    instructionsSheet.addRow(['- Students in each sheet will be auto-assigned to that class']);
    instructionsSheet.addRow(['- Classes will be auto-created if they don\'t exist']);
    instructionsSheet.addRow(['']);
    instructionsSheet.addRow(['IMPORT MODES:']);
    instructionsSheet.addRow(['- Create: Only add new students (skip existing)']);
    instructionsSheet.addRow(['- Update: Only update existing students (skip new)']);
    instructionsSheet.addRow(['- Upsert: Create new AND update existing (recommended)']);

    worksheet.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 20 },
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

router.get('/template/teachers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teachers');

    worksheet.addRow(['Email', 'Name', 'Password', 'Employee ID', 'Phone']);
    
    const headerRow = worksheet.getRow(1);
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    worksheet.addRow(['teacher@example.com', 'Jane Smith', 'password123', 'EMP0001', '+1234567890']);

    worksheet.columns = [
      { width: 25 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
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

router.get('/template/classes', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Classes');

    worksheet.addRow(['Class Name', 'Grade Level', 'Teacher Email', 'Academic Year']);
    
    const headerRow = worksheet.getRow(1);
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    worksheet.addRow(['5A', 'Grade 5', 'teacher@example.com', getCurrentAcademicYear()]);

    worksheet.columns = [
      { width: 20 }, { width: 15 }, { width: 25 }, { width: 15 },
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

// ============================================
// ERROR EXPORT
// ============================================

router.post('/export-errors', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { errors, type } = req.body;
    
    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      return res.status(400).json({ error: 'No errors to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Failed Rows');

    // Add headers based on type
    if (type === 'students') {
      worksheet.addRow(['Row', 'Student ID', 'Error']);
    } else if (type === 'teachers') {
      worksheet.addRow(['Row', 'Email', 'Error']);
    } else {
      worksheet.addRow(['Row', 'Class Name', 'Error']);
    }

    const headerRow = worksheet.getRow(1);
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    errors.forEach(err => {
      worksheet.addRow([
        err.row,
        err.studentId || err.email || err.className || '',
        Array.isArray(err.errors) ? err.errors.join('; ') : err.error,
      ]);
    });

    worksheet.columns = [{ width: 10 }, { width: 25 }, { width: 50 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=import_errors_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting errors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// IMPORT HISTORY
// ============================================

// Create import history record
const createImportHistory = async (req, userId, data) => {
  const schoolId = req.schoolId || req.user?.schoolId;
  
  if (!schoolId) {
    throw new Error('School context is required for import history');
  }
  
  const result = await schemaRun(req,
    `INSERT INTO import_history (school_id, user_id, import_type, file_name, mode, academic_year, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'processing') RETURNING id`,
    [schoolId, userId, data.type, data.fileName, data.mode, data.academicYear]
  );
  return result.id;
};

// Update import history with results - uses pool directly since we need to update by ID
const updateImportHistory = async (historyId, results, schema) => {
  const client = await pool.connect();
  try {
    if (schema) {
      await client.query(`SET search_path TO ${schema}, public`);
    }
    await client.query(
      `UPDATE import_history SET 
        total_rows = $1, created_count = $2, updated_count = $3, 
        skipped_count = $4, failed_count = $5, classes_created = $6,
        status = $7, error_message = $8, completed_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        results.summary.totalProcessed,
        results.summary.created,
        results.summary.updated,
        results.summary.skipped,
        results.summary.failed,
        results.summary.classesCreated || 0,
        results.summary.failed > 0 ? 'completed_with_errors' : 'completed',
        results.errors.length > 0 ? JSON.stringify(results.errors.slice(0, 10)) : null,
        historyId
      ]
    );
  } finally {
    client.release();
  }
};

// Get import history
router.get('/history', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = await schemaAll(req,
      `SELECT ih.*, u.name as user_name, u.email as user_email
       FROM import_history ih
       JOIN public.users u ON ih.user_id = u.id
       ORDER BY ih.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await schemaGet(req,
      'SELECT COUNT(*) as total FROM import_history'
    );

    res.json({
      history,
      total: parseInt(countResult.total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single import history detail
router.get('/history/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    const historyId = req.params.id;

    const history = await schemaGet(req,
      `SELECT ih.*, u.name as user_name, u.email as user_email
       FROM import_history ih
       JOIN public.users u ON ih.user_id = u.id
       WHERE ih.id = $1`,
      [historyId]
    );

    if (!history) {
      return res.status(404).json({ error: 'Import history not found' });
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
