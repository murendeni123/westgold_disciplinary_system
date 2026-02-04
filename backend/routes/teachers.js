const express = require('express');
const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('../database/db');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const { uploadToSupabase, deleteFromSupabase } = require('../middleware/supabaseUpload');

// Use memory storage for Supabase upload (no local disk storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

const router = express.Router();

// Upload teacher photo (admin or teacher themselves)
// Note: :id here is the teacher table id, not the user_id
router.post('/:id/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // First, get the teacher record to find the user_id
        const teacherRecord = await schemaGet(req, 'SELECT id, user_id, photo_path FROM teachers WHERE id = $1', [req.params.id]);
        if (!teacherRecord) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Check if user is admin or uploading their own photo
        if (req.user.role !== 'admin' && req.user.id !== teacherRecord.user_id) {
            return res.status(403).json({ error: 'You can only upload your own photo' });
        }

        // Delete old photo from Supabase if exists
        if (teacherRecord.photo_path) {
            await deleteFromSupabase(teacherRecord.photo_path);
        }

        // Upload to Supabase Storage (persistent cloud storage)
        const publicUrl = await uploadToSupabase(req.file, `${schema}/teachers`);

        // Save public URL to database
        await schemaRun(req, 'UPDATE teachers SET photo_path = $1 WHERE id = $2', [publicUrl, req.params.id]);
        
        const teacher = await schemaGet(req, `
            SELECT t.*, u.email, u.name, u.role
            FROM teachers t
            INNER JOIN public.users u ON t.user_id = u.id
            WHERE t.id = $1
        `, [req.params.id]);
        res.json({ message: 'Photo uploaded successfully', teacher, photoUrl: publicUrl });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get all teachers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const query = `
            SELECT t.*, u.id as user_id, u.email, u.name, u.role, u.created_at,
                   (SELECT COUNT(*) FROM classes WHERE teacher_id = t.id) as class_count,
                   c.class_name as assigned_classroom_name
            FROM teachers t
            INNER JOIN public.users u ON t.user_id = u.id
            LEFT JOIN classes c ON t.class_teacher_of = c.id
            WHERE t.is_active = true
            ORDER BY u.name
        `;

        const teachers = await schemaAll(req, query);
        res.json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get teacher by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const teacher = await schemaGet(req, `
            SELECT t.*, u.id as user_id, u.email, u.name as user_name, u.role, u.created_at,
                   s.name as school_name, s.id as school_id
            FROM teachers t
            INNER JOIN public.users u ON t.user_id = u.id
            LEFT JOIN public.schools s ON u.primary_school_id = s.id
            WHERE t.id = $1
        `, [req.params.id]);

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Get classes assigned to this teacher
        const classes = await schemaAll(req, 'SELECT * FROM classes WHERE teacher_id = $1', [req.params.id]);
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
        const { email, password, name, employee_id, phone, department } = req.body;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in public.users
        const userResult = await dbRun(
            `INSERT INTO public.users (email, password, role, name, primary_school_id, is_active) 
             VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
            [email.toLowerCase(), hashedPassword, 'teacher', name, req.schoolId]
        );

        const userId = userResult.id;
        if (!userId) {
            return res.status(500).json({ error: 'Failed to create user record' });
        }

        // Link user to school
        await dbRun(
            `INSERT INTO public.user_schools (user_id, school_id, role_in_school, is_primary) 
             VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
            [userId, req.schoolId, 'teacher']
        );

        // Create teacher record in school schema
        const teacherEmployeeId = employee_id?.trim() || `EMP-${userId}-${Date.now()}`;
        
        const teacherResult = await schemaRun(req,
            `INSERT INTO teachers (user_id, employee_id, name, email, phone, department, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
            [userId, teacherEmployeeId, name, email.toLowerCase(), phone || null, department || null]
        );

        const teacher = await schemaGet(req, `
            SELECT t.*, u.email, u.name as user_name, u.role, u.created_at
            FROM teachers t
            INNER JOIN public.users u ON t.user_id = u.id
            WHERE t.id = $1
        `, [teacherResult.id]);

        res.status(201).json(teacher);
    } catch (error) {
        console.error('Error creating teacher:', error);
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
            res.status(400).json({ error: 'Email or employee ID already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update teacher
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, email, phone, password, department } = req.body;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id, user_id FROM teachers WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Update teacher record in school schema
        if (name || phone !== undefined || department !== undefined) {
            await schemaRun(req, `
                UPDATE teachers 
                SET name = COALESCE($1, name), 
                    phone = COALESCE($2, phone),
                    department = COALESCE($3, department)
                WHERE id = $4
            `, [name, phone, department, req.params.id]);
        }

        // Update user record in public schema
        if (name || email) {
            await dbRun(`
                UPDATE public.users 
                SET name = COALESCE($1, name), 
                    email = COALESCE($2, email),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [name, email?.toLowerCase(), existing.user_id]);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await dbRun('UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, existing.user_id]);
        }

        const teacher = await schemaGet(req, `
            SELECT t.*, u.email, u.name as user_name, u.role
            FROM teachers t
            INNER JOIN public.users u ON t.user_id = u.id
            WHERE t.id = $1
        `, [req.params.id]);

        res.json(teacher);
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete teacher (soft delete)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id, user_id FROM teachers WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Soft delete - set is_active to false
        await schemaRun(req, 'UPDATE teachers SET is_active = false WHERE id = $1', [req.params.id]);
        
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
