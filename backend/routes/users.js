const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database/db');
const { schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Get users linked to this school via user_schools or teachers table
        const users = await dbAll(`
            SELECT DISTINCT u.id, u.name, u.email, u.role, u.created_at
            FROM public.users u
            LEFT JOIN public.user_schools us ON u.id = us.user_id
            LEFT JOIN public.schools s ON us.school_id = s.id
            WHERE s.schema_name = $1 OR u.id IN (
                SELECT user_id FROM ${schema}.teachers WHERE user_id IS NOT NULL
            )
            ORDER BY u.created_at DESC
        `, [schema]);

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const user = await dbGet(
            `SELECT id, name, email, role, created_at 
             FROM public.users 
             WHERE id = $1`,
            [req.params.id]
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const { role } = req.body;
        const userId = req.params.id;
        
        // Validate role
        const validRoles = ['admin', 'teacher', 'parent'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be admin, teacher, or parent' });
        }
        
        // Check if user exists
        const user = await dbGet('SELECT * FROM public.users WHERE id = $1', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent changing own role (safety measure)
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }
        
        // Update role
        await dbRun('UPDATE public.users SET role = $1 WHERE id = $2', [role, userId]);
        
        // If changing to teacher, create teacher record in school schema if not exists
        if (role === 'teacher') {
            const existingTeacher = await schemaGet(req, 'SELECT * FROM teachers WHERE user_id = $1', [userId]);
            if (!existingTeacher) {
                await schemaRun(req,
                    'INSERT INTO teachers (user_id, name, email) VALUES ($1, $2, $3)',
                    [userId, user.name, user.email]
                );
            }
        }
        
        res.json({ message: 'Role updated successfully', role });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Delete user (admin only) - soft delete
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const userId = req.params.id;
        
        // Check if user exists
        const user = await dbGet('SELECT * FROM public.users WHERE id = $1', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent deleting own account
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Soft delete related records based on role
        if (user.role === 'teacher') {
            await schemaRun(req, 'UPDATE teachers SET is_active = false WHERE user_id = $1', [userId]);
        }
        
        // Soft delete the user
        await dbRun('UPDATE public.users SET is_active = false WHERE id = $1', [userId]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
