const express = require('express');
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Upload teacher photo (admin or teacher themselves)
router.post('/:id/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Check if user is admin or uploading their own photo
        if (req.user.role !== 'admin' && req.user.id !== Number(req.params.id)) {
            return res.status(403).json({ error: 'You can only upload your own photo' });
        }

        const photoPath = `/uploads/teachers/${req.file.filename}`;
        await dbRun('UPDATE teachers SET photo_path = ? WHERE user_id = ?', [photoPath, req.params.id]);
        
        const teacher = await dbGet(`
            SELECT u.id, u.email, u.name, u.role, t.employee_id, t.phone, t.photo_path
            FROM users u
            INNER JOIN teachers t ON u.id = t.user_id
            WHERE u.id = ?
        `, [req.params.id]);
        res.json({ message: 'Photo uploaded successfully', teacher });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all teachers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        let query = `
            SELECT u.id, u.email, u.name, u.role, u.created_at,
                   t.employee_id, t.phone, t.photo_path,
                   (SELECT COUNT(*) FROM classes WHERE teacher_id = u.id) as class_count
            FROM users u
            INNER JOIN teachers t ON u.id = t.user_id
            WHERE 1=1
        `;
        const params = [];

        // Platform admin can view across schools
        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            query += ' AND t.school_id = ?';
            params.push(schoolId);
        }

        query += ' ORDER BY u.name';

        const teachers = await dbAll(query, params);
        res.json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get teacher by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const teacher = await dbGet(`
            SELECT u.id, u.email, u.name, u.role, u.created_at, u.school_id,
                   t.employee_id, t.phone, t.photo_path,
                   s.name as school_name
            FROM users u
            INNER JOIN teachers t ON u.id = t.user_id
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.id = ?
        `, [req.params.id]);

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (teacher.school_id !== schoolId) {
                return res.status(404).json({ error: 'Teacher not found' });
            }
        }

        // Get classes assigned to this teacher
        const classes = await dbAll(`
            SELECT c.* FROM classes c WHERE c.teacher_id = ?
        `, [req.params.id]);

        teacher.classes = classes;
        res.json(teacher);
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create teacher
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        console.log('=== CREATE TEACHER REQUEST ===');
        console.log('Request body:', req.body);
        console.log('User:', req.user);
        
        const { email, password, name, employee_id, phone } = req.body;
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        console.log('Extracted values:', { email, name, employee_id, phone, schoolId });

        if (!email || !password || !name) {
            console.error('Missing required fields:', { email: !!email, password: !!password, name: !!name });
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        // Create user (PostgreSQL uses RETURNING id)
        console.log('Creating user record...');
        const userResult = await dbRun(
            `INSERT INTO users (email, password, role, name, school_id) VALUES (?, ?, ?, ?, ?) RETURNING id`,
            [email, hashedPassword, 'teacher', name, schoolId]
        );

        console.log('User creation result:', userResult);

        // Get the user ID from the result (PostgreSQL uses RETURNING clause)
        const userId = userResult.id;
        console.log('Extracted user ID:', userId);
        
        if (!userId) {
            console.error('❌ No user ID returned from INSERT');
            console.error('User result:', userResult);
            return res.status(500).json({ error: 'Failed to create user record - no ID returned' });
        }

        console.log('✅ User created successfully with ID:', userId);

        // Create teacher record
        // Auto-generate employee_id if not provided
        const teacherEmployeeId = employee_id && employee_id.trim() !== '' 
            ? employee_id.trim() 
            : `EMP-${userId}-${Date.now()}`;
        
        console.log('Creating teacher record with:', {
            userId,
            employee_id: teacherEmployeeId,
            phone: phone || null,
            schoolId
        });
        
        let teacherResult;
        try {
            const insertSql = `INSERT INTO teachers (user_id, employee_id, phone, school_id) VALUES (?, ?, ?, ?) RETURNING id`;
            const insertParams = [userId, teacherEmployeeId, phone || null, schoolId];
            
            console.log('Executing INSERT:', insertSql);
            console.log('With params:', insertParams);
            
            teacherResult = await dbRun(insertSql, insertParams);
            
            console.log('INSERT result:', teacherResult);
        } catch (insertError) {
            console.error('❌ ERROR inserting teacher record:', insertError);
            console.error('Error name:', insertError.name);
            console.error('Error message:', insertError.message);
            
            // Try to clean up the user record
            try {
                await dbRun('DELETE FROM users WHERE id = ?', [userId]);
                console.log('Cleaned up user record due to teacher insert failure.');
            } catch (deleteError) {
                console.error('Error cleaning up user record:', deleteError);
            }
            
            if (insertError.message && (insertError.message.includes('UNIQUE constraint') || insertError.message.includes('duplicate key'))) {
                return res.status(400).json({ error: 'Employee ID already exists for this school' });
            } else {
                return res.status(500).json({ 
                    error: 'Failed to create teacher record',
                    details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
                });
            }
        }

        if (!teacherResult || !teacherResult.changes || teacherResult.changes === 0) {
            console.error('Failed to create teacher record - no rows affected');
            console.error('Teacher result:', teacherResult);
            // Try to clean up the user record
            try {
                await dbRun('DELETE FROM users WHERE id = ?', [userId]);
                console.log('Cleaned up user record due to no rows affected in teacher insert.');
            } catch (deleteError) {
                console.error('Error cleaning up user record:', deleteError);
            }
            return res.status(500).json({ error: 'Failed to create teacher record - no rows affected' });
        }

        console.log(`Successfully created teacher record: user_id=${userId}, employee_id=${teacherEmployeeId}, school_id=${schoolId}`);

        // Fetch the created teacher with all fields
        const teacher = await dbGet(`
            SELECT u.id, u.email, u.name, u.role, u.created_at, u.school_id,
                   t.employee_id, t.phone, t.photo_path, t.school_id as teacher_school_id
            FROM users u
            INNER JOIN teachers t ON u.id = t.user_id
            WHERE u.id = ?
        `, [userId]);

        if (!teacher) {
            console.error('Created teacher not found after creation');
            // Attempt to fetch directly from teachers table if JOIN failed
            const teacherCheck = await dbGet('SELECT * FROM teachers WHERE user_id = ?', [userId]);
            if (teacherCheck) {
                console.log('Teacher record exists but JOIN failed:', teacherCheck);
                // Return a basic teacher object
                const userData = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
                return res.status(201).json({
                    id: userId,
                    email: userData?.email || email,
                    name: userData?.name || name,
                    role: 'teacher',
                    employee_id: teacherCheck.employee_id || teacherEmployeeId,
                    phone: teacherCheck.phone || phone || null,
                    created_at: userData?.created_at || new Date().toISOString(),
                    school_id: schoolId
                });
            } else {
                console.error('Teacher record does not exist in teachers table');
                return res.status(500).json({ error: 'Teacher record was not created in teachers table' });
            }
        }

        console.log('Teacher created and fetched successfully:', teacher);
        res.status(201).json(teacher);
    } catch (error) {
        console.error('❌❌❌ TOP LEVEL ERROR creating teacher ❌❌❌');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        
        if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate key'))) {
            res.status(400).json({ error: 'Email or employee ID already exists' });
        } else {
            res.status(500).json({ 
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

// Update teacher
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT t.user_id, t.school_id FROM teachers t WHERE t.user_id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        if (name) {
            await dbRun('UPDATE users SET name = ? WHERE id = ?', [name, req.params.id]);
        }

        if (email) {
            await dbRun('UPDATE users SET email = ? WHERE id = ?', [email, req.params.id]);
        }

        if (phone !== undefined) {
            await dbRun('UPDATE teachers SET phone = ? WHERE user_id = ?', [phone, req.params.id]);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
        }

        const teacher = await dbGet(`
            SELECT u.id, u.email, u.name, u.role, t.employee_id, t.phone
            FROM users u
            INNER JOIN teachers t ON u.id = t.user_id
            WHERE u.id = ?
        `, [req.params.id]);

        res.json(teacher);
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete teacher
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await dbGet('SELECT user_id, school_id FROM teachers WHERE user_id = ?', [req.params.id]);
        if (!existing || existing.school_id !== schoolId) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        await dbRun('DELETE FROM teachers WHERE user_id = ?', [req.params.id]);
        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

