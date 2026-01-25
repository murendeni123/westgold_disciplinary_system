const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { is_read } = req.query;
    const schema = getSchema(req);

    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }
    
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (is_read !== undefined) {
      query += ` AND is_read = $${paramIndex++}`;
      params.push(is_read === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await schemaAll(req, query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const result = await schemaGet(req,
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result?.count) || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req,
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req,
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req,
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to create notification (can be used by other routes)
const createNotification = async (req, userId, type, title, message, relatedId = null, relatedType = null) => {
  try {
    const schema = getSchema(req);
    if (!schema) return;

    await schemaRun(req,
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, relatedId, relatedType]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to get all school admins
const getSchoolAdmins = async (schoolId) => {
  try {
    const admins = await dbAll(
      'SELECT id FROM public.users WHERE role = $1 AND school_id = $2',
      ['admin', schoolId]
    );
    return admins || [];
  } catch (error) {
    console.error('Error getting school admins:', error);
    return [];
  }
};

// Helper function to notify all school admins
const notifySchoolAdmins = async (req, type, title, message, relatedId = null, relatedType = null) => {
  try {
    const admins = await getSchoolAdmins(req.schoolId);
    for (const admin of admins) {
      await createNotification(req, admin.id, type, title, message, relatedId, relatedType);
    }
  } catch (error) {
    console.error('Error notifying school admins:', error);
  }
};

module.exports = { router, createNotification, getSchoolAdmins, notifySchoolAdmins };
