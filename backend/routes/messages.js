const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get messages (sent or received)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type = 'received' } = req.query; // 'sent' or 'received'
        
        let query;
        if (type === 'sent') {
            query = `
                SELECT m.*, 
                       u1.name as sender_name, u1.email as sender_email,
                       u2.name as receiver_name, u2.email as receiver_email
                FROM messages m
                INNER JOIN users u1 ON m.sender_id = u1.id
                INNER JOIN users u2 ON m.receiver_id = u2.id
                WHERE m.sender_id = ?
                ORDER BY m.created_at DESC
            `;
        } else {
            query = `
                SELECT m.*, 
                       u1.name as sender_name, u1.email as sender_email,
                       u2.name as receiver_name, u2.email as receiver_email
                FROM messages m
                INNER JOIN users u1 ON m.sender_id = u1.id
                INNER JOIN users u2 ON m.receiver_id = u2.id
                WHERE m.receiver_id = ?
                ORDER BY m.is_read ASC, m.created_at DESC
            `;
        }

        const messages = await dbAll(query, [req.user.id]);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get message by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const message = await dbGet(`
            SELECT m.*, 
                   u1.name as sender_name, u1.email as sender_email,
                   u2.name as receiver_name, u2.email as receiver_email
            FROM messages m
            INNER JOIN users u1 ON m.sender_id = u1.id
            INNER JOIN users u2 ON m.receiver_id = u2.id
            WHERE m.id = ? AND (m.sender_id = ? OR m.receiver_id = ?)
        `, [req.params.id, req.user.id, req.user.id]);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Mark as read if receiver
        if (message.receiver_id === req.user.id && !message.is_read) {
            await dbRun('UPDATE messages SET is_read = 1 WHERE id = ?', [req.params.id]);
            message.is_read = 1;
        }

        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create message
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { receiver_id, subject, message } = req.body;

        if (!receiver_id || !message) {
            return res.status(400).json({ error: 'Receiver ID and message are required' });
        }

        const result = await dbRun(
            `INSERT INTO messages (sender_id, receiver_id, subject, message)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, receiver_id, subject || null, message]
        );

        const newMessage = await dbGet('SELECT * FROM messages WHERE id = ?', [result.id]);
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        await dbRun(
            'UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await dbRun(
            'DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
            [req.params.id, req.user.id, req.user.id]
        );
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;



