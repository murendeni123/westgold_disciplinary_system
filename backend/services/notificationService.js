/**
 * Unified Notification Service
 * 
 * This service handles sending notifications through multiple channels:
 * - In-app notifications (stored in database, shown in UI)
 * - WhatsApp notifications (via WhatsApp Cloud API)
 * - Socket.io real-time updates
 * 
 * All notification types (incident, merit, detention, attendance) are handled here.
 */

const { dbRun, dbGet, dbAll } = require('../database/db');
const whatsappService = require('./whatsappService');

/**
 * Get Socket.io instance (set by server.js)
 */
let io = null;
const setSocketIO = (socketIO) => {
  io = socketIO;
};

/**
 * Create an in-app notification
 * @param {Object} params - Notification parameters
 * @returns {Object} - Created notification ID
 */
const createInAppNotification = async ({
  userId,
  type,
  title,
  message,
  relatedId = null,
  relatedType = null,
  schoolId = null,
}) => {
  try {
    const result = await dbRun(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type, is_read, school_id)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?) RETURNING id`,
      [userId, type, title, message, relatedId, relatedType, schoolId]
    );

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: result.id,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return { success: true, notificationId: result.id };
  } catch (error) {
    console.error('[NotificationService] Error creating in-app notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get parent info for a student
 * @param {number} studentId - Student ID
 * @returns {Object|null} - Parent user info
 */
const getParentForStudent = async (studentId) => {
  try {
    const parent = await dbGet(
      `SELECT u.id, u.name, u.email, u.phone, u.whatsapp_opt_in
       FROM users u
       INNER JOIN students s ON s.parent_id = u.id
       WHERE s.id = ?`,
      [studentId]
    );
    return parent;
  } catch (error) {
    console.error('[NotificationService] Error getting parent:', error);
    return null;
  }
};

/**
 * Get student info
 * @param {number} studentId - Student ID
 * @returns {Object|null} - Student info
 */
const getStudentInfo = async (studentId) => {
  try {
    const student = await dbGet(
      `SELECT s.*, c.class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [studentId]
    );
    return student;
  } catch (error) {
    console.error('[NotificationService] Error getting student:', error);
    return null;
  }
};

/**
 * Send incident notification (in-app + WhatsApp)
 * @param {Object} params - Incident parameters
 */
const sendIncidentNotification = async ({
  incidentId,
  studentId,
  incidentType,
  description,
  severity,
  date,
  schoolId = null,
}) => {
  const results = { inApp: null, whatsApp: null };

  try {
    // Get student and parent info
    const student = await getStudentInfo(studentId);
    const parent = await getParentForStudent(studentId);

    if (!student) {
      console.error('[NotificationService] Student not found:', studentId);
      return results;
    }

    const studentName = `${student.first_name} ${student.last_name}`;
    const title = 'New Incident Report';
    const message = `${studentName} was involved in a ${incidentType.toLowerCase()} incident. ${severity ? `Severity: ${severity}.` : ''} Please check the details.`;

    // Send in-app notification if parent exists
    if (parent) {
      results.inApp = await createInAppNotification({
        userId: parent.id,
        type: 'incident',
        title,
        message,
        relatedId: incidentId,
        relatedType: 'incident',
        schoolId,
      });

      // Send WhatsApp notification if opted in
      if (parent.whatsapp_opt_in && parent.phone) {
        results.whatsApp = await whatsappService.sendIncidentNotification({
          parentPhone: parent.phone,
          parentName: parent.name,
          studentName,
          incidentType,
          description: description || 'No description provided',
          date: date || new Date().toLocaleDateString(),
          userId: parent.id,
          studentId,
          schoolId,
        });
      }
    }

    console.log('[NotificationService] Incident notification sent:', { incidentId, inApp: results.inApp?.success, whatsApp: results.whatsApp?.success });
  } catch (error) {
    console.error('[NotificationService] Error sending incident notification:', error);
  }

  return results;
};

/**
 * Send merit notification (in-app + WhatsApp)
 * @param {Object} params - Merit parameters
 */
const sendMeritNotification = async ({
  meritId,
  studentId,
  meritType,
  points,
  description,
  date,
  schoolId = null,
}) => {
  const results = { inApp: null, whatsApp: null };

  try {
    const student = await getStudentInfo(studentId);
    const parent = await getParentForStudent(studentId);

    if (!student) {
      console.error('[NotificationService] Student not found:', studentId);
      return results;
    }

    const studentName = `${student.first_name} ${student.last_name}`;
    const title = 'Merit Awarded!';
    const message = `Congratulations! ${studentName} received a merit for ${meritType}. ${points ? `+${points} points!` : ''}`;

    if (parent) {
      results.inApp = await createInAppNotification({
        userId: parent.id,
        type: 'merit',
        title,
        message,
        relatedId: meritId,
        relatedType: 'merit',
        schoolId,
      });

      if (parent.whatsapp_opt_in && parent.phone) {
        results.whatsApp = await whatsappService.sendMeritNotification({
          parentPhone: parent.phone,
          parentName: parent.name,
          studentName,
          meritType,
          points: points || 0,
          description: description || 'Great work!',
          date: date || new Date().toLocaleDateString(),
          userId: parent.id,
          studentId,
          schoolId,
        });
      }
    }

    console.log('[NotificationService] Merit notification sent:', { meritId, inApp: results.inApp?.success, whatsApp: results.whatsApp?.success });
  } catch (error) {
    console.error('[NotificationService] Error sending merit notification:', error);
  }

  return results;
};

/**
 * Send detention notification (in-app + WhatsApp)
 * @param {Object} params - Detention parameters
 */
const sendDetentionNotification = async ({
  detentionAssignmentId,
  studentId,
  detentionDate,
  detentionTime,
  duration,
  location,
  reason,
  schoolId = null,
}) => {
  const results = { inApp: null, whatsApp: null };

  try {
    const student = await getStudentInfo(studentId);
    const parent = await getParentForStudent(studentId);

    if (!student) {
      console.error('[NotificationService] Student not found:', studentId);
      return results;
    }

    const studentName = `${student.first_name} ${student.last_name}`;
    const title = 'Detention Scheduled';
    const message = `${studentName} has been assigned detention on ${detentionDate} at ${detentionTime}. Duration: ${duration} minutes. Location: ${location || 'TBA'}.`;

    if (parent) {
      results.inApp = await createInAppNotification({
        userId: parent.id,
        type: 'detention',
        title,
        message,
        relatedId: detentionAssignmentId,
        relatedType: 'detention_assignment',
        schoolId,
      });

      if (parent.whatsapp_opt_in && parent.phone) {
        results.whatsApp = await whatsappService.sendDetentionNotification({
          parentPhone: parent.phone,
          parentName: parent.name,
          studentName,
          detentionDate,
          detentionTime,
          duration,
          location: location || 'School',
          reason: reason || 'Behaviour issue',
          userId: parent.id,
          studentId,
          schoolId,
        });
      }
    }

    console.log('[NotificationService] Detention notification sent:', { detentionAssignmentId, inApp: results.inApp?.success, whatsApp: results.whatsApp?.success });
  } catch (error) {
    console.error('[NotificationService] Error sending detention notification:', error);
  }

  return results;
};

/**
 * Send attendance notification (in-app + WhatsApp)
 * @param {Object} params - Attendance parameters
 */
const sendAttendanceNotification = async ({
  attendanceId,
  studentId,
  status, // 'absent', 'late'
  date,
  period = null,
  className = null,
  arrivalTime = null,
  schoolId = null,
}) => {
  const results = { inApp: null, whatsApp: null };

  try {
    const student = await getStudentInfo(studentId);
    const parent = await getParentForStudent(studentId);

    if (!student) {
      console.error('[NotificationService] Student not found:', studentId);
      return results;
    }

    const studentName = `${student.first_name} ${student.last_name}`;
    const classNameFinal = className || student.class_name || 'class';
    
    let title, message;
    
    if (status === 'absent') {
      title = 'Attendance Alert';
      message = `${studentName} was marked absent from ${classNameFinal} on ${date}${period ? ` (${period})` : ''}.`;
    } else if (status === 'late') {
      title = 'Late Arrival Notice';
      message = `${studentName} arrived late to ${classNameFinal} on ${date}${arrivalTime ? ` at ${arrivalTime}` : ''}.`;
    } else {
      return results; // Only notify for absent/late
    }

    if (parent) {
      results.inApp = await createInAppNotification({
        userId: parent.id,
        type: 'attendance',
        title,
        message,
        relatedId: attendanceId,
        relatedType: 'attendance',
        schoolId,
      });

      if (parent.whatsapp_opt_in && parent.phone) {
        if (status === 'absent') {
          results.whatsApp = await whatsappService.sendAbsenceNotification({
            parentPhone: parent.phone,
            parentName: parent.name,
            studentName,
            className: classNameFinal,
            date,
            period,
            userId: parent.id,
            studentId,
            schoolId,
          });
        } else if (status === 'late') {
          results.whatsApp = await whatsappService.sendLateNotification({
            parentPhone: parent.phone,
            parentName: parent.name,
            studentName,
            className: classNameFinal,
            date,
            arrivalTime,
            userId: parent.id,
            studentId,
            schoolId,
          });
        }
      }
    }

    console.log('[NotificationService] Attendance notification sent:', { attendanceId, status, inApp: results.inApp?.success, whatsApp: results.whatsApp?.success });
  } catch (error) {
    console.error('[NotificationService] Error sending attendance notification:', error);
  }

  return results;
};

/**
 * Send demerit notification (in-app + WhatsApp)
 * Uses incident notification for WhatsApp since it's similar
 * @param {Object} params - Demerit parameters
 */
const sendDemeritNotification = async ({
  incidentId,
  studentId,
  demeritType,
  points,
  description,
  date,
  schoolId = null,
}) => {
  const results = { inApp: null, whatsApp: null };

  try {
    const student = await getStudentInfo(studentId);
    const parent = await getParentForStudent(studentId);

    if (!student) {
      console.error('[NotificationService] Student not found:', studentId);
      return results;
    }

    const studentName = `${student.first_name} ${student.last_name}`;
    const title = 'Demerit Issued';
    const message = `${studentName} received a demerit for ${demeritType}. ${points ? `-${points} points.` : ''} ${description || ''}`;

    if (parent) {
      results.inApp = await createInAppNotification({
        userId: parent.id,
        type: 'demerit',
        title,
        message,
        relatedId: incidentId,
        relatedType: 'incident',
        schoolId,
      });

      // Use incident notification for WhatsApp (similar format)
      if (parent.whatsapp_opt_in && parent.phone) {
        results.whatsApp = await whatsappService.sendIncidentNotification({
          parentPhone: parent.phone,
          parentName: parent.name,
          studentName,
          incidentType: demeritType,
          description: description || 'Demerit issued',
          date: date || new Date().toLocaleDateString(),
          userId: parent.id,
          studentId,
          schoolId,
        });
      }
    }

    console.log('[NotificationService] Demerit notification sent:', { incidentId, inApp: results.inApp?.success, whatsApp: results.whatsApp?.success });
  } catch (error) {
    console.error('[NotificationService] Error sending demerit notification:', error);
  }

  return results;
};

module.exports = {
  setSocketIO,
  createInAppNotification,
  getParentForStudent,
  getStudentInfo,
  // Unified notification functions
  sendIncidentNotification,
  sendMeritNotification,
  sendDetentionNotification,
  sendAttendanceNotification,
  sendDemeritNotification,
};
