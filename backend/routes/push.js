const express = require('express');
const webpush = require('web-push');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// VAPID keys (should be in environment variables in production)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BA64WiZ37W6RyuyNYKFkulRJFMrmSIT79c9QvXoKZk5T1wnnfYUOvx1FNbWwgdTRWu4ZM00rPnqCl21qz9oTrBg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'uKE8p0tUTUqyavol0UpOPeyLn83Ql1EX3dnvirdLhCU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@school.com';

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Get public key (for frontend to subscribe)
router.get('/public-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Check if subscription already exists
        const existing = await dbGet(
            'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
            [userId, subscription.endpoint]
        );

        if (existing) {
            // Update existing subscription
            await dbRun(
                'UPDATE push_subscriptions SET p256dh = ?, auth = ? WHERE id = ?',
                [subscription.keys.p256dh, subscription.keys.auth, existing.id]
            );
            return res.json({ message: 'Subscription updated' });
        }

        // Create new subscription
        await dbRun(
            `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, device_type)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, 'web']
        );

        res.status(201).json({ message: 'Subscription saved' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticateToken, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint is required' });
        }

        await dbRun(
            'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
            [userId, endpoint]
        );

        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to send push notification
const sendPushNotification = async (userId, title, message, data = {}) => {
    try {
        const subscriptions = await dbAll(
            'SELECT * FROM push_subscriptions WHERE user_id = ?',
            [userId]
        );

        const notifications = subscriptions.map(sub => {
            const subscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            return webpush.sendNotification(
                subscription,
                JSON.stringify({
                    title,
                    message,
                    data,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png'
                })
            ).catch(error => {
                console.error('Error sending push notification:', error);
                // If subscription is invalid, remove it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    dbRun('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]).catch(console.error);
                }
            });
        });

        await Promise.all(notifications);
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
};

module.exports = { router, sendPushNotification };
