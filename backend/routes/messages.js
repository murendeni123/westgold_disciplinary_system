const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get messages (sent or received)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const { type = 'received' } = req.query;
        
        let query;
        if (type === 'sent') {
            query = `
                SELECT m.*, 
                       u1.name as sender_name, u1.email as sender_email,
                       u2.name as receiver_name, u2.email as receiver_email
                FROM messages m
                INNER JOIN public.users u1 ON m.sender_id = u1.id
                INNER JOIN public.users u2 ON m.receiver_id = u2.id
                WHERE m.sender_id = $1
                ORDER BY m.created_at DESC
            `;
        } else {
            query = `
                SELECT m.*, 
                       u1.name as sender_name, u1.email as sender_email,
                       u2.name as receiver_name, u2.email as receiver_email
                FROM messages m
                INNER JOIN public.users u1 ON m.sender_id = u1.id
                INNER JOIN public.users u2 ON m.receiver_id = u2.id
                WHERE m.receiver_id = $1
                ORDER BY m.is_read ASC, m.created_at DESC
            `;
        }

        const messages = await schemaAll(req, query, [req.user.id]);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get message by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const message = await schemaGet(req, `
            SELECT m.*, 
                   u1.name as sender_name, u1.email as sender_email,
                   u2.name as receiver_name, u2.email as receiver_email
            FROM messages m
            INNER JOIN public.users u1 ON m.sender_id = u1.id
            INNER JOIN public.users u2 ON m.receiver_id = u2.id
            WHERE m.id = $1 AND (m.sender_id = $2 OR m.receiver_id = $2)
        `, [req.params.id, req.user.id]);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Mark as read if receiver
        if (message.receiver_id === req.user.id && !message.is_read) {
            await schemaRun(req, 'UPDATE messages SET is_read = 1 WHERE id = $1', [req.params.id]);
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
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const { receiver_id, subject, message } = req.body;

        if (!receiver_id || !message) {
            return res.status(400).json({ error: 'Receiver ID and message are required' });
        }

        const result = await schemaRun(req,
            `INSERT INTO messages (sender_id, receiver_id, subject, content)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [req.user.id, receiver_id, subject || null, message]
        );

        const newMessage = await schemaGet(req, 'SELECT * FROM messages WHERE id = $1', [result.id]);
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        await schemaRun(req,
            'UPDATE messages SET is_read = 1 WHERE id = $1 AND receiver_id = $2',
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
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        await schemaRun(req,
            'DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
