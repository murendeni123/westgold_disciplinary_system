/**
 * WhatsApp Routes
 * 
 * Handles:
 * - Webhook verification and incoming events from WhatsApp
 * - Admin endpoints for managing WhatsApp settings
 * - Manual notification sending
 * - Notification logs viewing
 */

const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// ============================================================================
// WEBHOOK ENDPOINTS (for WhatsApp Cloud API)
// ============================================================================

/**
 * Webhook verification (GET)
 * WhatsApp sends a GET request to verify the webhook URL
 */
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'pds_whatsapp_verify_token';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    console.log('[WhatsApp Webhook] Verification failed');
    res.status(403).send('Forbidden');
  }
});

/**
 * Webhook events (POST)
 * Receives delivery receipts, read receipts, and incoming messages
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if this is a WhatsApp status update
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field === 'messages') {
            const value = change.value;

            // Handle status updates (delivery receipts)
            if (value.statuses) {
              for (const status of value.statuses) {
                const messageId = status.id;
                const statusValue = status.status; // 'sent', 'delivered', 'read', 'failed'

                console.log(`[WhatsApp Webhook] Status update: ${messageId} -> ${statusValue}`);

                // Update notification log
                await whatsappService.updateNotificationStatus(messageId, statusValue);

                // Update timestamps based on status
                if (statusValue === 'delivered') {
                  await dbRun(
                    `UPDATE notification_logs SET delivered_at = CURRENT_TIMESTAMP WHERE message_id = ?`,
                    [messageId]
                  );
                } else if (statusValue === 'read') {
                  await dbRun(
                    `UPDATE notification_logs SET read_at = CURRENT_TIMESTAMP WHERE message_id = ?`,
                    [messageId]
                  );
                }
              }
            }

            // Handle incoming messages (replies from parents)
            if (value.messages) {
              for (const message of value.messages) {
                console.log('[WhatsApp Webhook] Incoming message:', message);

                // Store incoming message for admin review
                const from = message.from;
                const messageType = message.type;
                const text = message.text?.body || '';
                const timestamp = message.timestamp;

                await dbRun(
                  `INSERT INTO whatsapp_incoming_messages 
                   (from_phone, message_type, message_text, whatsapp_message_id, received_at)
                   VALUES (?, ?, ?, ?, datetime(?, 'unixepoch'))`,
                  [from, messageType, text, message.id, timestamp]
                );
              }
            }
          }
        }
      }

      res.status(200).send('OK');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Get WhatsApp configuration status
 */
router.get('/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const config = whatsappService.getConfig();
    const enabled = whatsappService.isWhatsAppEnabled();

    // Get notification stats
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM notification_logs
      WHERE channel = 'whatsapp'
        AND created_at >= date('now', '-30 days')
    `);

    res.json({
      enabled,
      configured: !!(config.token && config.phoneNumberId),
      phoneNumberId: config.phoneNumberId ? '***' + config.phoneNumberId.slice(-4) : null,
      stats: {
        last30Days: stats || { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
      },
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get notification logs
 */
router.get('/logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { student_id, user_id, type, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT nl.*, 
             s.first_name || ' ' || s.last_name as student_name,
             u.name as parent_name
      FROM notification_logs nl
      LEFT JOIN students s ON nl.student_id = s.id
      LEFT JOIN users u ON nl.user_id = u.id
      WHERE nl.channel = 'whatsapp'
    `;
    const params = [];

    if (student_id) {
      query += ' AND nl.student_id = ?';
      params.push(student_id);
    }
    if (user_id) {
      query += ' AND nl.user_id = ?';
      params.push(user_id);
    }
    if (type) {
      query += ' AND nl.type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND nl.status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND nl.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND nl.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY nl.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await dbAll(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notification_logs nl
      WHERE nl.channel = 'whatsapp'
    `;
    const countParams = [];

    if (student_id) {
      countQuery += ' AND nl.student_id = ?';
      countParams.push(student_id);
    }
    if (type) {
      countQuery += ' AND nl.type = ?';
      countParams.push(type);
    }
    if (status) {
      countQuery += ' AND nl.status = ?';
      countParams.push(status);
    }

    const countResult = await dbGet(countQuery, countParams);

    res.json({
      logs,
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get WhatsApp templates
 */
router.get('/templates', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const templates = await dbAll(`
      SELECT * FROM whatsapp_templates
      ORDER BY template_type, template_name
    `);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update template status (after approval in WhatsApp Business Manager)
 */
router.put('/templates/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, template_name } = req.body;

    await dbRun(
      `UPDATE whatsapp_templates 
       SET status = ?, template_name = COALESCE(?, template_name), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, template_name, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get users with WhatsApp opt-in
 */
router.get('/opted-in-users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT u.id, u.name, u.email, u.phone, u.whatsapp_number, u.role,
             COUNT(DISTINCT s.id) as linked_students
      FROM users u
      LEFT JOIN parents p ON u.id = p.user_id
      LEFT JOIN students s ON p.id = s.parent_id
      WHERE u.whatsapp_opt_in = 1
      GROUP BY u.id
      ORDER BY u.name
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching opted-in users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send a test notification
 */
router.post('/test', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { phone, template_name = 'student_absent' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Send test message with dummy data
    const result = await whatsappService.sendTemplateMessage({
      to: phone,
      templateName: template_name,
      languageCode: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Test Parent' },
            { type: 'text', text: 'Test Student' },
            { type: 'text', text: 'Test Class' },
            { type: 'text', text: new Date().toLocaleDateString() },
            { type: 'text', text: 'Period 1' },
          ],
        },
      ],
      metadata: {
        type: 'test',
        userId: req.user.id,
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Manually send notification to a parent
 */
router.post('/send', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { student_id, type, custom_message } = req.body;

    if (!student_id || !type) {
      return res.status(400).json({ error: 'Student ID and notification type are required' });
    }

    // Get student and parent info
    const student = await dbGet(`
      SELECT s.*, 
             u.id as parent_user_id, u.name as parent_name, u.phone as parent_phone,
             u.whatsapp_number, u.whatsapp_opt_in,
             c.class_name
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [student_id]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.whatsapp_opt_in) {
      return res.status(400).json({ error: 'Parent has not opted in for WhatsApp notifications' });
    }

    const phone = student.whatsapp_number || student.parent_phone;
    if (!phone) {
      return res.status(400).json({ error: 'No phone number available for parent' });
    }

    let result;
    const today = new Date().toLocaleDateString();

    switch (type) {
      case 'attendance_absent':
        result = await whatsappService.sendAbsenceNotification({
          parentPhone: phone,
          parentName: student.parent_name,
          studentName: `${student.first_name} ${student.last_name}`,
          className: student.class_name,
          date: today,
          userId: student.parent_user_id,
          studentId: student.id,
          schoolId: student.school_id,
        });
        break;

      case 'attendance_late':
        result = await whatsappService.sendLateNotification({
          parentPhone: phone,
          parentName: student.parent_name,
          studentName: `${student.first_name} ${student.last_name}`,
          className: student.class_name,
          date: today,
          arrivalTime: new Date().toLocaleTimeString(),
          userId: student.parent_user_id,
          studentId: student.id,
          schoolId: student.school_id,
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update user's WhatsApp opt-in status
 */
router.put('/opt-in/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { opt_in, whatsapp_number, notification_preferences } = req.body;

    // Users can only update their own opt-in, admins can update anyone
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await dbRun(
      `UPDATE users 
       SET whatsapp_opt_in = ?,
           whatsapp_number = COALESCE(?, whatsapp_number),
           notification_preferences = COALESCE(?, notification_preferences)
       WHERE id = ?`,
      [opt_in ? 1 : 0, whatsapp_number, JSON.stringify(notification_preferences), userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating opt-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get notification statistics
 */
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date) {
      dateFilter += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += ' AND created_at <= ?';
      params.push(end_date);
    }

    // Overall stats
    const overall = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM notification_logs
      WHERE channel = 'whatsapp' ${dateFilter}
    `, params);

    // Stats by type
    const byType = await dbAll(`
      SELECT 
        type,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM notification_logs
      WHERE channel = 'whatsapp' ${dateFilter}
      GROUP BY type
      ORDER BY total DESC
    `, params);

    // Daily trend (last 7 days)
    const dailyTrend = await dbAll(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 ELSE 0 END) as successful
      FROM notification_logs
      WHERE channel = 'whatsapp'
        AND created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date
    `);

    // Opted-in users count
    const optedInCount = await dbGet(`
      SELECT COUNT(*) as count FROM users WHERE whatsapp_opt_in = 1
    `);

    res.json({
      overall: overall || { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
      byType: byType || [],
      dailyTrend: dailyTrend || [],
      optedInUsers: optedInCount?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
