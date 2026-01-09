const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get additional user info based on role
        let userInfo = { ...user };
        delete userInfo.password;

        if (user.role === 'teacher') {
            const teacher = await dbGet('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
            userInfo.teacher = teacher;
        }

        if (user.role === 'parent') {
            const children = await dbAll(
                `SELECT s.*, c.class_name 
                 FROM students s 
                 LEFT JOIN classes c ON s.class_id = c.id 
                 WHERE s.parent_id = ?`,
                [user.id]
            );
            userInfo.children = children;
        }

        res.json({
            token,
            user: userInfo
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await dbGet('SELECT id, email, role, name, school_id FROM users WHERE id = ?', [decoded.userId]);

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        let userInfo = { ...user };

        if (user.role === 'teacher') {
            const teacher = await dbGet('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
            userInfo.teacher = teacher;
        }

        if (user.role === 'parent') {
            const children = await dbAll(
                `SELECT s.*, c.class_name 
                 FROM students s 
                 LEFT JOIN classes c ON s.class_id = c.id 
                 WHERE s.parent_id = ?`,
                [user.id]
            );
            userInfo.children = children;
        }

        res.json({ user: userInfo });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        await dbRun('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);

        // Get updated user info
        const updatedUser = await dbGet('SELECT id, email, role, name, school_id FROM users WHERE id = ?', [req.user.id]);
        
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Parent Signup
router.post('/signup', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            work_phone,
            relationship_to_child,
            emergency_contact_1_name,
            emergency_contact_1_phone,
            emergency_contact_2_name,
            emergency_contact_2_phone,
            home_address,
            city,
            postal_code,
        } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        if (!relationship_to_child) {
            return res.status(400).json({ error: 'Relationship to child is required' });
        }

        if (!emergency_contact_1_name || !emergency_contact_1_phone) {
            return res.status(400).json({ error: 'Emergency contact 1 name and phone are required' });
        }

        if (!emergency_contact_2_name || !emergency_contact_2_phone) {
            return res.status(400).json({ error: 'Emergency contact 2 name and phone are required' });
        }

        if (!home_address) {
            return res.status(400).json({ error: 'Home address is required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if email already exists
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create parent user and get the created user in one query (PostgreSQL RETURNING)
        const user = await dbGet(
            'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?) RETURNING id, email, role, name, school_id',
            [email.toLowerCase(), hashedPassword, 'parent', name]
        );

        // Create parent profile record
        await dbRun(
            `INSERT INTO parents (
                user_id,
                phone,
                work_phone,
                relationship_to_child,
                emergency_contact_1_name,
                emergency_contact_1_phone,
                emergency_contact_2_name,
                emergency_contact_2_phone,
                home_address,
                city,
                postal_code,
                school_id,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
                user.id,
                String(phone).trim(),
                work_phone ? String(work_phone).trim() : null,
                String(relationship_to_child).trim(),
                String(emergency_contact_1_name).trim(),
                String(emergency_contact_1_phone).trim(),
                String(emergency_contact_2_name).trim(),
                String(emergency_contact_2_phone).trim(),
                String(home_address).trim(),
                city ? String(city).trim() : null,
                postal_code ? String(postal_code).trim() : null,
                user.school_id || null,
            ]
        );

        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;


