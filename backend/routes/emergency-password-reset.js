/**
 * Emergency Password Reset Endpoint
 * Allows authenticated users to reset their password without knowing current password
 * TEMPORARY: Should be removed after password issues are resolved
 */

const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../database/db');
const { authenticateToken, hashPassword } = require('../middleware/auth');

/**
 * POST /api/emergency-password-reset
 * Reset password without requiring current password
 * Requires authentication (valid JWT token)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        console.log('🚨 EMERGENCY PASSWORD RESET requested by user:', {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role
        });

        // Verify user exists
        const user = await dbGet('SELECT * FROM public.users WHERE id = $1', [req.user.id]);

        if (!user) {
            console.error('❌ User not found:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ User found, proceeding with password reset');

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);
        
        console.log('🔐 Hashing new password...');
        console.log('Hash length:', hashedPassword.length);

        // Update password
        const updateResult = await dbRun(
            'UPDATE public.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, req.user.id]
        );

        console.log('💾 Update result:', {
            rowsAffected: updateResult.changes,
            userId: req.user.id
        });

        if (updateResult.changes === 0) {
            console.error('⚠️ WARNING: Update affected 0 rows!');
            return res.status(500).json({ error: 'Failed to update password' });
        }

        console.log('✅ Password reset successful for user:', user.email);

        res.json({ 
            message: 'Password reset successfully',
            email: user.email,
            userId: user.id
        });
    } catch (error) {
        console.error('Emergency password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
