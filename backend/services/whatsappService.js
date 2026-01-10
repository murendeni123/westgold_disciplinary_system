/**
 * WhatsApp Cloud API Service
 * 
 * This service handles sending WhatsApp messages via Meta's Cloud API.
 * 
 * Required environment variables:
 * - WHATSAPP_TOKEN: Permanent access token from Meta
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
 * - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID
 * - WHATSAPP_ENABLED: Set to 'true' to enable sending (default: false)
 */

const { dbRun, dbGet } = require('../database/db');

// WhatsApp Cloud API base URL
const WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';

/**
 * Check if WhatsApp is enabled
 */
const isWhatsAppEnabled = () => {
  return process.env.WHATSAPP_ENABLED === 'true';
};

/**
 * Get WhatsApp configuration
 */
const getConfig = () => {
  return {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };
};

/**
 * Validate phone number format (E.164)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
const isValidE164 = (phone) => {
  if (!phone) return false;
  // E.164: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.replace(/\s/g, ''));
};

/**
 * Format phone number to E.164 (remove spaces, ensure + prefix)
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let formatted = phone.replace(/\s/g, '').replace(/-/g, '');
  if (!formatted.startsWith('+')) {
    // Assume South African number if no country code
    if (formatted.startsWith('0')) {
      formatted = '+27' + formatted.substring(1);
    } else {
      formatted = '+' + formatted;
    }
  }
  return formatted;
};

/**
 * Log notification attempt to database
 * @param {Object} params - Log parameters
 */
const logNotification = async ({
  userId,
  studentId,
  channel = 'whatsapp',
  type,
  templateName,
  recipientPhone,
  payload,
  status,
  messageId = null,
  errorMessage = null,
  schoolId = null,
}) => {
  try {
    await dbRun(
      `INSERT INTO notification_logs 
       (user_id, student_id, channel, type, template_name, recipient_phone, payload_json, status, message_id, error_message, school_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        studentId,
        channel,
        type,
        templateName,
        recipientPhone,
        JSON.stringify(payload),
        status,
        messageId,
        errorMessage,
        schoolId,
      ]
    );
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};

/**
 * Update notification log status
 * @param {string} messageId - WhatsApp message ID
 * @param {string} status - New status
 */
const updateNotificationStatus = async (messageId, status) => {
  try {
    await dbRun(
      `UPDATE notification_logs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE message_id = ?`,
      [status, messageId]
    );
  } catch (error) {
    console.error('Error updating notification status:', error);
  }
};

/**
 * Send a template message via WhatsApp Cloud API
 * @param {Object} params - Message parameters
 * @param {string} params.to - Recipient phone number (E.164 format)
 * @param {string} params.templateName - Name of the approved template
 * @param {string} params.languageCode - Language code (e.g., 'en', 'en_US')
 * @param {Array} params.components - Template components with parameters
 * @param {Object} params.metadata - Additional metadata for logging
 * @returns {Object} - Result with success status and message ID or error
 */
const sendTemplateMessage = async ({
  to,
  templateName,
  languageCode = 'en',
  components = [],
  metadata = {},
}) => {
  const config = getConfig();

  // Check if WhatsApp is enabled
  if (!isWhatsAppEnabled()) {
    console.log('[WhatsApp] Service disabled. Would send to:', to, 'template:', templateName);
    await logNotification({
      ...metadata,
      templateName,
      recipientPhone: to,
      payload: { templateName, languageCode, components },
      status: 'disabled',
      errorMessage: 'WhatsApp service is disabled',
    });
    return { success: false, error: 'WhatsApp service is disabled' };
  }

  // Validate configuration
  if (!config.token || !config.phoneNumberId) {
    console.error('[WhatsApp] Missing configuration');
    await logNotification({
      ...metadata,
      templateName,
      recipientPhone: to,
      payload: { templateName, languageCode, components },
      status: 'failed',
      errorMessage: 'Missing WhatsApp configuration',
    });
    return { success: false, error: 'Missing WhatsApp configuration' };
  }

  // Format and validate phone number
  const formattedPhone = formatPhoneNumber(to);
  if (!isValidE164(formattedPhone)) {
    console.error('[WhatsApp] Invalid phone number:', to);
    await logNotification({
      ...metadata,
      templateName,
      recipientPhone: to,
      payload: { templateName, languageCode, components },
      status: 'failed',
      errorMessage: 'Invalid phone number format',
    });
    return { success: false, error: 'Invalid phone number format' };
  }

  // Build the request payload
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone.replace('+', ''), // WhatsApp API expects number without +
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  // Add components if provided (for template parameters)
  if (components && components.length > 0) {
    payload.template.components = components;
  }

  try {
    // Make the API request
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (response.ok && data.messages && data.messages[0]) {
      const messageId = data.messages[0].id;
      console.log('[WhatsApp] Message sent successfully:', messageId);
      
      await logNotification({
        ...metadata,
        templateName,
        recipientPhone: formattedPhone,
        payload,
        status: 'sent',
        messageId,
      });

      return { success: true, messageId };
    } else {
      const errorMsg = data.error?.message || 'Unknown error';
      console.error('[WhatsApp] API error:', data);
      
      await logNotification({
        ...metadata,
        templateName,
        recipientPhone: formattedPhone,
        payload,
        status: 'failed',
        errorMessage: errorMsg,
      });

      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('[WhatsApp] Request failed:', error);
    
    await logNotification({
      ...metadata,
      templateName,
      recipientPhone: formattedPhone,
      payload,
      status: 'failed',
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
};

/**
 * Send a text message (for testing/development - requires 24h window)
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @returns {Object} - Result
 */
const sendTextMessage = async (to, text) => {
  const config = getConfig();

  if (!isWhatsAppEnabled()) {
    console.log('[WhatsApp] Service disabled. Would send text to:', to);
    return { success: false, error: 'WhatsApp service is disabled' };
  }

  const formattedPhone = formatPhoneNumber(to);
  if (!isValidE164(formattedPhone)) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone.replace('+', ''),
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (response.ok && data.messages && data.messages[0]) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { success: false, error: data.error?.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================================
// NOTIFICATION HELPER FUNCTIONS
// These are convenience functions for common notification types
// ============================================================================

/**
 * Send attendance absence notification to parent
 * @param {Object} params - Notification parameters
 */
const sendAbsenceNotification = async ({
  parentPhone,
  parentName,
  studentName,
  className,
  date,
  period = null,
  userId = null,
  studentId = null,
  schoolId = null,
}) => {
  // Build template components with parameters
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: parentName || 'Parent' },
        { type: 'text', text: studentName },
        { type: 'text', text: className },
        { type: 'text', text: date },
        { type: 'text', text: period || 'the day' },
      ],
    },
  ];

  return sendTemplateMessage({
    to: parentPhone,
    templateName: 'student_absent',
    languageCode: 'en',
    components,
    metadata: {
      userId,
      studentId,
      schoolId,
      type: 'attendance_absent',
    },
  });
};

/**
 * Send behaviour incident notification to parent
 * @param {Object} params - Notification parameters
 */
const sendIncidentNotification = async ({
  parentPhone,
  parentName,
  studentName,
  incidentType,
  description,
  date,
  userId = null,
  studentId = null,
  schoolId = null,
}) => {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: parentName || 'Parent' },
        { type: 'text', text: studentName },
        { type: 'text', text: incidentType },
        { type: 'text', text: description.substring(0, 100) }, // Limit description length
        { type: 'text', text: date },
      ],
    },
  ];

  return sendTemplateMessage({
    to: parentPhone,
    templateName: 'incident_logged',
    languageCode: 'en',
    components,
    metadata: {
      userId,
      studentId,
      schoolId,
      type: 'behaviour_incident',
    },
  });
};

/**
 * Send merit notification to parent
 * @param {Object} params - Notification parameters
 */
const sendMeritNotification = async ({
  parentPhone,
  parentName,
  studentName,
  meritType,
  points,
  description,
  date,
  userId = null,
  studentId = null,
  schoolId = null,
}) => {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: parentName || 'Parent' },
        { type: 'text', text: studentName },
        { type: 'text', text: meritType },
        { type: 'text', text: String(points) },
        { type: 'text', text: description || 'Great work!' },
      ],
    },
  ];

  return sendTemplateMessage({
    to: parentPhone,
    templateName: 'merit_awarded',
    languageCode: 'en',
    components,
    metadata: {
      userId,
      studentId,
      schoolId,
      type: 'merit_awarded',
    },
  });
};

/**
 * Send detention notification to parent
 * @param {Object} params - Notification parameters
 */
const sendDetentionNotification = async ({
  parentPhone,
  parentName,
  studentName,
  detentionDate,
  detentionTime,
  duration,
  reason,
  location,
  userId = null,
  studentId = null,
  schoolId = null,
}) => {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: parentName || 'Parent' },
        { type: 'text', text: studentName },
        { type: 'text', text: detentionDate },
        { type: 'text', text: detentionTime },
        { type: 'text', text: `${duration} minutes` },
        { type: 'text', text: location || 'School' },
        { type: 'text', text: reason || 'Behaviour issue' },
      ],
    },
  ];

  return sendTemplateMessage({
    to: parentPhone,
    templateName: 'detention_scheduled',
    languageCode: 'en',
    components,
    metadata: {
      userId,
      studentId,
      schoolId,
      type: 'detention_scheduled',
    },
  });
};

/**
 * Send late arrival notification to parent
 * @param {Object} params - Notification parameters
 */
const sendLateNotification = async ({
  parentPhone,
  parentName,
  studentName,
  className,
  date,
  arrivalTime,
  userId = null,
  studentId = null,
  schoolId = null,
}) => {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: parentName || 'Parent' },
        { type: 'text', text: studentName },
        { type: 'text', text: className },
        { type: 'text', text: date },
        { type: 'text', text: arrivalTime || 'late' },
      ],
    },
  ];

  return sendTemplateMessage({
    to: parentPhone,
    templateName: 'student_late',
    languageCode: 'en',
    components,
    metadata: {
      userId,
      studentId,
      schoolId,
      type: 'attendance_late',
    },
  });
};

/**
 * Get parent contact info for a student
 * @param {number} studentId - Student ID
 * @returns {Object|null} - Parent info with phone and opt-in status
 */
const getParentContactForStudent = async (studentId) => {
  try {
    const parent = await dbGet(
      `SELECT u.id, u.name, u.email, u.phone, u.whatsapp_opt_in
       FROM users u
       INNER JOIN parents p ON u.id = p.user_id
       INNER JOIN students s ON p.id = s.parent_id
       WHERE s.id = ? AND u.whatsapp_opt_in = 1`,
      [studentId]
    );
    return parent;
  } catch (error) {
    console.error('Error getting parent contact:', error);
    return null;
  }
};

/**
 * Check if parent has opted in for WhatsApp notifications
 * @param {number} userId - User ID
 * @returns {boolean} - True if opted in
 */
const hasWhatsAppOptIn = async (userId) => {
  try {
    const user = await dbGet(
      `SELECT whatsapp_opt_in FROM users WHERE id = ?`,
      [userId]
    );
    return user?.whatsapp_opt_in === 1 || user?.whatsapp_opt_in === true;
  } catch (error) {
    console.error('Error checking WhatsApp opt-in:', error);
    return false;
  }
};

module.exports = {
  isWhatsAppEnabled,
  getConfig,
  isValidE164,
  formatPhoneNumber,
  sendTemplateMessage,
  sendTextMessage,
  updateNotificationStatus,
  // Notification helpers
  sendAbsenceNotification,
  sendIncidentNotification,
  sendMeritNotification,
  sendDetentionNotification,
  sendLateNotification,
  // Utility functions
  getParentContactForStudent,
  hasWhatsAppOptIn,
};
