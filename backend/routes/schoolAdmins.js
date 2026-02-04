const express = require('express');
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun } = require('../database/db');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const requirePlatformAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Platform admin access required' });
        }
        req.platformAdmin = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

router.get('/schools/:schoolId/admins', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;

        const school = await dbGet('SELECT * FROM schools WHERE id = $1', [schoolId]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        const admins = await dbAll(`
            SELECT u.id, u.name, u.email, u.role, u.created_at, u.last_login,
                   us.is_primary, us.role_in_school
            FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE us.school_id = $1 AND u.role = 'admin'
            ORDER BY us.is_primary DESC, u.created_at ASC
        `, [schoolId]);

        res.json({ admins });
    } catch (error) {
        console.error('Error fetching school admins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/schools/:schoolId/admins/:adminId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId, adminId } = req.params;

        const admin = await dbGet(`
            SELECT u.id, u.name, u.email, u.role, u.created_at, u.last_login,
                   us.is_primary, us.role_in_school
            FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE us.school_id = $1 AND u.id = $2 AND u.role = 'admin'
        `, [schoolId, adminId]);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json({ admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/schools/:schoolId/admins', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, email, password, is_primary = false } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const school = await dbGet('SELECT * FROM schools WHERE id = $1', [schoolId]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        const existingUser = await dbGet('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const result = await dbRun(
            `INSERT INTO users (email, password_hash, name, role, primary_school_id, created_at)
             VALUES ($1, $2, $3, 'admin', $4, CURRENT_TIMESTAMP) RETURNING id`,
            [email, hashedPassword, name, schoolId]
        );

        if (is_primary) {
            await dbRun('UPDATE user_schools SET is_primary = FALSE WHERE school_id = $1', [schoolId]);
        }

        await dbRun(
            `INSERT INTO user_schools (user_id, school_id, role_in_school, is_primary)
             VALUES ($1, $2, 'admin', $3)`,
            [result.id, schoolId, is_primary]
        );

        const schemaName = school.schema_name || `school_${school.school_code}`;
        try {
            await dbRun(`
                INSERT INTO teachers (user_id, is_active, department)
                VALUES ($1, $2, $3)
            `, [result.id, true, 'Administration'], schemaName);
        } catch (teacherError) {
            console.warn('Warning: Could not create teacher record in schema:', teacherError.message);
        }

        if (!password) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await dbRun(
                `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
                [resetToken, resetExpiry, result.id]
            );

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

            try {
                await sendEmail({
                    to: email,
                    subject: 'Welcome to Greenstem DMS - Set Your Password',
                    html: `
                        <h2>Welcome to Greenstem DMS</h2>
                        <p>Hello ${name},</p>
                        <p>You have been added as an administrator for <strong>${school.name}</strong>.</p>
                        <p>Please click the link below to set your password and activate your account:</p>
                        <p><a href="${resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Password</a></p>
                        <p>This link will expire in 24 hours.</p>
                        <p>Best regards,<br>Greenstem DMS Team</p>
                    `,
                    text: `Welcome to Greenstem DMS. Set your password: ${resetLink}`
                });
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
            }
        }

        const admin = await dbGet(`
            SELECT u.id, u.name, u.email, u.role, u.created_at,
                   us.is_primary, us.role_in_school
            FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE u.id = $1 AND us.school_id = $2
        `, [result.id, schoolId]);

        res.status(201).json({ 
            message: 'Admin created successfully',
            admin 
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/schools/:schoolId/admins/:adminId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId, adminId } = req.params;
        const { name, email, is_primary } = req.body;

        const admin = await dbGet(`
            SELECT u.* FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE us.school_id = $1 AND u.id = $2 AND u.role = 'admin'
        `, [schoolId, adminId]);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (email && email !== admin.email) {
            const existingUser = await dbGet('SELECT * FROM users WHERE email = $1 AND id != $2', [email, adminId]);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        await dbRun(
            `UPDATE users SET name = $1, email = $2 WHERE id = $3`,
            [name || admin.name, email || admin.email, adminId]
        );

        if (is_primary !== undefined) {
            if (is_primary) {
                await dbRun('UPDATE user_schools SET is_primary = FALSE WHERE school_id = $1', [schoolId]);
            }
            await dbRun('UPDATE user_schools SET is_primary = $1 WHERE user_id = $2 AND school_id = $3', 
                [is_primary, adminId, schoolId]);
        }

        const updatedAdmin = await dbGet(`
            SELECT u.id, u.name, u.email, u.role, u.created_at,
                   us.is_primary, us.role_in_school
            FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE u.id = $1 AND us.school_id = $2
        `, [adminId, schoolId]);

        res.json({ 
            message: 'Admin updated successfully',
            admin: updatedAdmin 
        });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/schools/:schoolId/admins/:adminId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId, adminId } = req.params;

        const admin = await dbGet(`
            SELECT u.*, us.is_primary
            FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE us.school_id = $1 AND u.id = $2 AND u.role = 'admin'
        `, [schoolId, adminId]);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const adminCount = await dbGet(`
            SELECT COUNT(*) as count FROM user_schools us
            INNER JOIN users u ON us.user_id = u.id
            WHERE us.school_id = $1 AND u.role = 'admin'
        `, [schoolId]);

        if (adminCount.count <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin. School must have at least one admin.' });
        }

        if (admin.is_primary) {
            return res.status(400).json({ error: 'Cannot delete primary admin. Assign another admin as primary first.' });
        }

        await dbRun('DELETE FROM user_schools WHERE user_id = $1 AND school_id = $2', [adminId, schoolId]);

        const otherSchools = await dbGet('SELECT COUNT(*) as count FROM user_schools WHERE user_id = $1', [adminId]);
        
        if (otherSchools.count === 0) {
            await dbRun('DELETE FROM users WHERE id = $1', [adminId]);
        }

        res.json({ message: 'Admin removed successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/schools/:schoolId/admins/:adminId/reset-password', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId, adminId } = req.params;
        const { send_email = true } = req.body;

        const admin = await dbGet(`
            SELECT u.*, s.name as school_name
            FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            INNER JOIN schools s ON us.school_id = s.id
            WHERE us.school_id = $1 AND u.id = $2 AND u.role = 'admin'
        `, [schoolId, adminId]);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await dbRun(
            `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
            [resetToken, resetExpiry, adminId]
        );

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

        if (send_email) {
            try {
                await sendEmail({
                    to: admin.email,
                    subject: 'Password Reset - Greenstem DMS',
                    html: `
                        <h2>Password Reset Request</h2>
                        <p>Hello ${admin.name},</p>
                        <p>A password reset has been requested for your administrator account at <strong>${admin.school_name}</strong>.</p>
                        <p>Click the link below to reset your password:</p>
                        <p><a href="${resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
                        <p>This link will expire in 24 hours.</p>
                        <p>If you did not request this reset, please contact support immediately.</p>
                        <p>Best regards,<br>Greenstem DMS Team</p>
                    `,
                    text: `Password reset link: ${resetLink}`
                });
            } catch (emailError) {
                console.error('Error sending reset email:', emailError);
                return res.status(500).json({ error: 'Failed to send reset email' });
            }
        }

        res.json({ 
            message: 'Password reset link generated successfully',
            reset_link: resetLink,
            expires_at: resetExpiry
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/schools/:schoolId/admins/:adminId/set-primary', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId, adminId } = req.params;

        const admin = await dbGet(`
            SELECT u.* FROM users u
            INNER JOIN user_schools us ON u.id = us.user_id
            WHERE us.school_id = $1 AND u.id = $2 AND u.role = 'admin'
        `, [schoolId, adminId]);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        await dbRun('UPDATE user_schools SET is_primary = FALSE WHERE school_id = $1', [schoolId]);
        await dbRun('UPDATE user_schools SET is_primary = TRUE WHERE user_id = $1 AND school_id = $2', 
            [adminId, schoolId]);

        res.json({ message: 'Primary admin updated successfully' });
    } catch (error) {
        console.error('Error setting primary admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
