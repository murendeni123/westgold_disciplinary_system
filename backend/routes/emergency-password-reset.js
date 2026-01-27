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
    const startTime = Date.now();
    
    try {
        const { newPassword } = req.body;

        console.log('\n=== EMERGENCY PASSWORD RESET REQUEST ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('User ID:', req.user.id);
        console.log('User Email:', req.user.email);
        console.log('User Role:', req.user.role);

        if (!newPassword) {
            console.log('❌ Validation failed: New password is required');
            return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 6) {
            console.log('❌ Validation failed: Password too short');
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        console.log('✅ Input validation passed');
        console.log('New password length:', newPassword.length);

        // Verify user exists
        console.log('\n--- Fetching user from database ---');
        const user = await dbGet('SELECT id, email, name, role, password FROM public.users WHERE id = $1', [req.user.id]);

        if (!user) {
            console.error('❌ User not found in database:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ User found in database');
        console.log('DB User ID:', user.id);
        console.log('DB User Email:', user.email);
        console.log('DB User Name:', user.name);

        // Hash new password
        console.log('\n--- Hashing new password ---');
        let hashedPassword;
        
        try {
            hashedPassword = await hashPassword(newPassword);
            console.log('✅ Password hashed successfully');
            console.log('Hash length:', hashedPassword.length);
        } catch (hashError) {
            console.error('❌ Password hashing error:', hashError.message);
            console.error('Stack:', hashError.stack);
            return res.status(500).json({ error: 'Error processing password. Please try again.' });
        }

        // Update password
        console.log('\n--- Updating password in database ---');
        let updateResult;
        
        try {
            updateResult = await dbRun(
                'UPDATE public.users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [hashedPassword, req.user.id]
            );
            
            console.log('Update query executed');
            console.log('Rows affected:', updateResult.changes);
        } catch (updateError) {
            console.error('❌ Database update error:', updateError.message);
            console.error('Stack:', updateError.stack);
            return res.status(500).json({ error: 'Error updating password. Please try again.' });
        }

        if (updateResult.changes === 0) {
            console.error('⚠️ WARNING: Update affected 0 rows!');
            return res.status(500).json({ error: 'Failed to update password. Please contact support.' });
        }

        // Verify the update
        console.log('\n--- Verifying password update ---');
        const updatedUser = await dbGet(
            'SELECT password, updated_at FROM public.users WHERE id = $1',
            [req.user.id]
        );

        if (updatedUser) {
            console.log('✅ Password updated in database');
            console.log('Updated at:', updatedUser.updated_at);
        }

        const duration = Date.now() - startTime;
        console.log('\n✅ EMERGENCY PASSWORD RESET SUCCESSFUL');
        console.log('Duration:', duration + 'ms');
        console.log('=== END EMERGENCY PASSWORD RESET ===\n');

        res.json({ 
            message: 'Password reset successfully',
            email: user.email,
            userId: user.id,
            success: true
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('\n❌ EMERGENCY PASSWORD RESET ERROR');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Duration:', duration + 'ms');
        console.error('=== END EMERGENCY PASSWORD RESET (ERROR) ===\n');
        
        res.status(500).json({ 
            error: 'An unexpected error occurred. Please try again.',
            details: error.message
        });
    }
});

module.exports = router;
