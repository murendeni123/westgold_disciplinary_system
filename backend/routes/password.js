/**
 * Password Management Routes
 * Clean implementation for password changes
 */

const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../database/db');
const { authenticateToken, hashPassword, verifyPassword } = require('../middleware/auth');

/**
 * PUT /api/password/change
 * Change user password with current password verification
 */
router.put('/change', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        console.log('\n=== PASSWORD CHANGE REQUEST ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('User ID:', userId);
        console.log('User Email:', userEmail);
        console.log('User Role:', req.user.role);

        // Validate input
        if (!currentPassword || !newPassword) {
            console.log('❌ Validation failed: Missing required fields');
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            console.log('❌ Validation failed: Invalid data types');
            return res.status(400).json({ 
                error: 'Passwords must be strings' 
            });
        }

        if (newPassword.length < 6) {
            console.log('❌ Validation failed: New password too short');
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters long' 
            });
        }

        if (currentPassword === newPassword) {
            console.log('❌ Validation failed: Same password');
            return res.status(400).json({ 
                error: 'New password must be different from current password' 
            });
        }

        console.log('✅ Input validation passed');
        console.log('Current password length:', currentPassword.length);
        console.log('New password length:', newPassword.length);

        // Fetch user from database
        console.log('\n--- Fetching user from database ---');
        const user = await dbGet(
            'SELECT id, email, name, role, password_hash FROM public.users WHERE id = $1',
            [userId]
        );

        if (!user) {
            console.log('❌ User not found in database');
            return res.status(404).json({ 
                error: 'User not found. Please logout and login again.' 
            });
        }

        console.log('✅ User found in database');
        console.log('DB User ID:', user.id);
        console.log('DB User Email:', user.email);
        console.log('DB User Name:', user.name);
        console.log('Password hash length:', user.password_hash?.length || 0);

        // Verify current password
        console.log('\n--- Verifying current password ---');
        let isPasswordValid = false;
        
        try {
            isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
            console.log('Password verification result:', isPasswordValid);
        } catch (verifyError) {
            console.error('❌ Password verification error:', verifyError.message);
            return res.status(500).json({ 
                error: 'Error verifying password. Please try again.' 
            });
        }

        if (!isPasswordValid) {
            console.log('❌ Current password is incorrect');
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }

        console.log('✅ Current password verified successfully');

        // Hash new password
        console.log('\n--- Hashing new password ---');
        let newPasswordHash;
        
        try {
            newPasswordHash = await hashPassword(newPassword);
            console.log('✅ New password hashed successfully');
            console.log('New hash length:', newPasswordHash.length);
        } catch (hashError) {
            console.error('❌ Password hashing error:', hashError.message);
            return res.status(500).json({ 
                error: 'Error processing new password. Please try again.' 
            });
        }

        // Update password in database
        console.log('\n--- Updating password in database ---');
        let updateResult;
        
        try {
            updateResult = await dbRun(
                'UPDATE public.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newPasswordHash, userId]
            );
            
            console.log('Update query executed');
            console.log('Rows affected:', updateResult.changes);
        } catch (updateError) {
            console.error('❌ Database update error:', updateError.message);
            return res.status(500).json({ 
                error: 'Error updating password. Please try again.' 
            });
        }

        if (updateResult.changes === 0) {
            console.error('⚠️ WARNING: Update affected 0 rows');
            return res.status(500).json({ 
                error: 'Failed to update password. Please contact support.' 
            });
        }

        // Verify the update by fetching the user again
        console.log('\n--- Verifying password update ---');
        const updatedUser = await dbGet(
            'SELECT password_hash, updated_at FROM public.users WHERE id = $1',
            [userId]
        );

        if (updatedUser) {
            console.log('✅ Password updated in database');
            console.log('Updated at:', updatedUser.updated_at);
            
            // Verify new password works
            const newPasswordWorks = await verifyPassword(newPassword, updatedUser.password_hash);
            console.log('New password verification:', newPasswordWorks ? '✅ WORKS' : '❌ FAILED');
            
            if (!newPasswordWorks) {
                console.error('⚠️ WARNING: New password does not verify against stored hash!');
            }
        }

        const duration = Date.now() - startTime;
        console.log('\n✅ PASSWORD CHANGE SUCCESSFUL');
        console.log('Duration:', duration + 'ms');
        console.log('=== END PASSWORD CHANGE ===\n');

        res.json({ 
            message: 'Password changed successfully',
            success: true
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('\n❌ PASSWORD CHANGE ERROR');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Duration:', duration + 'ms');
        console.error('=== END PASSWORD CHANGE (ERROR) ===\n');
        
        res.status(500).json({ 
            error: 'An unexpected error occurred. Please try again.' 
        });
    }
});

module.exports = router;
