const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database/db');
const { authenticateToken, requireRole, getSchoolId } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);

        let query = `SELECT id, name, email, role, school_id, created_at FROM users WHERE 1=1`;
        const params = [];

        // Platform admin can view across schools
        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            query += ' AND school_id = ?';
            params.push(schoolId);
        }

        query += ' ORDER BY created_at DESC';

        const users = await dbAll(query, params);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        const user = await dbGet(
            `SELECT id, name, email, role, school_id, created_at 
             FROM users 
             WHERE id = ?`,
            [req.params.id]
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (user.school_id !== schoolId) {
                return res.status(404).json({ error: 'User not found' });
            }
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
        const { role } = req.body;
        const userId = req.params.id;
        const schoolId = getSchoolId(req);
        
        // Validate role
        const validRoles = ['admin', 'teacher', 'parent'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be admin, teacher, or parent' });
        }
        
        // Check if user exists
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (user.school_id !== schoolId) {
                return res.status(404).json({ error: 'User not found' });
            }
        }
        
        // Prevent changing own role (safety measure)
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }
        
        // Update role
        await dbRun('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        
        // If changing to teacher, create teacher record if not exists
        if (role === 'teacher') {
            const existingTeacher = await dbGet('SELECT * FROM teachers WHERE user_id = ?', [userId]);
            if (!existingTeacher) {
                await dbRun(
                    'INSERT INTO teachers (user_id, name, email, school_id) VALUES (?, ?, ?, ?)',
                    [userId, user.name, user.email, user.school_id]
                );
            }
        }
        
        res.json({ message: 'Role updated successfully', role });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const schoolId = getSchoolId(req);
        
        // Check if user exists
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user?.role !== 'platform_admin') {
            if (!schoolId) {
                return res.status(403).json({ error: 'School context required' });
            }
            if (user.school_id !== schoolId) {
                return res.status(404).json({ error: 'User not found' });
            }
        }
        
        // Prevent deleting own account
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Delete related records based on role
        if (user.role === 'teacher') {
            await dbRun('DELETE FROM teachers WHERE user_id = ?', [userId]);
        }
        
        // Delete the user
        await dbRun('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
