const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      is_read, 
      type, 
      priority,
      limit = 20, 
      offset = 0,
      start_date,
      end_date 
    } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    // Filter by read status
    if (is_read !== undefined && is_read !== '') {
      query += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    // Filter by type
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    // Filter by priority
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    // Filter by date range
    if (start_date) {
      query += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY created_at DESC';
    
    // Add pagination
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per request
    const offsetNum = parseInt(offset) || 0;
    query += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const notifications = await dbAll(query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ count: result.count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
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
    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
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
    await dbRun(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification details with related data
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const notification = await dbGet(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    let relatedData = null;

    // Fetch related data based on type
    if (notification.related_id && notification.related_type) {
      switch (notification.related_type) {
        case 'detention':
        case 'detention_assignment':
          // Get detention assignment with detention session and student info
          relatedData = await dbGet(`
            SELECT 
              da.id as assignment_id,
              da.reason,
              da.status as assignment_status,
              da.notes as assignment_notes,
              d.id as detention_id,
              d.detention_date,
              d.detention_time,
              d.duration,
              d.location,
              d.status as detention_status,
              d.notes as detention_notes,
              s.id as student_id,
              s.first_name as student_first_name,
              s.last_name as student_last_name,
              s.student_id as student_number,
              s.grade_level,
              c.class_name,
              t.name as teacher_name
            FROM detention_assignments da
            JOIN detentions d ON da.detention_id = d.id
            JOIN students s ON da.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users t ON d.teacher_on_duty_id = t.id
            WHERE da.id = ?
          `, [notification.related_id]);
          break;

        case 'incident':
        case 'behaviour_incident':
          // Get incident with student and teacher info
          relatedData = await dbGet(`
            SELECT 
              bi.id,
              bi.incident_date,
              bi.incident_time,
              bi.incident_type,
              bi.description,
              bi.severity,
              bi.points,
              bi.status,
              bi.admin_notes,
              s.id as student_id,
              s.first_name as student_first_name,
              s.last_name as student_last_name,
              s.student_id as student_number,
              s.grade_level,
              c.class_name,
              t.name as teacher_name
            FROM behaviour_incidents bi
            JOIN students s ON bi.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users t ON bi.teacher_id = t.id
            WHERE bi.id = ?
          `, [notification.related_id]);
          break;

        case 'merit':
          // Get merit with student and teacher info
          relatedData = await dbGet(`
            SELECT 
              m.id,
              m.merit_date,
              m.merit_type,
              m.description,
              m.points,
              s.id as student_id,
              s.first_name as student_first_name,
              s.last_name as student_last_name,
              s.student_id as student_number,
              s.grade_level,
              c.class_name,
              t.name as teacher_name
            FROM merits m
            JOIN students s ON m.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users t ON m.teacher_id = t.id
            WHERE m.id = ?
          `, [notification.related_id]);
          break;

        case 'attendance':
          // Get attendance record with student info
          relatedData = await dbGet(`
            SELECT 
              a.id,
              a.attendance_date,
              a.period,
              a.status,
              a.notes,
              s.id as student_id,
              s.first_name as student_first_name,
              s.last_name as student_last_name,
              s.student_id as student_number,
              s.grade_level,
              c.class_name,
              t.name as teacher_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN users t ON a.teacher_id = t.id
            WHERE a.id = ?
          `, [notification.related_id]);
          break;

        default:
          break;
      }
    }

    // Mark as read when viewing details
    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({
      notification,
      relatedData,
      type: notification.related_type || notification.type
    });
  } catch (error) {
    console.error('Error fetching notification details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to create notification (can be used by other routes)
const createNotification = async (userId, type, title, message, relatedId = null, relatedType = null) => {
  try {
    await dbRun(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedId, relatedType]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = { router, createNotification };



