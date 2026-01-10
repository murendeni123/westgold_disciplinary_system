require('dotenv').config();
const { pool } = require('./database/db');

async function createTestNotification() {
  try {
    // Find a parent user with linked students
    let parentResult = await pool.query("SELECT id FROM users WHERE role = 'parent' LIMIT 1");
    
    if (parentResult.rows.length === 0) {
      console.log('No parent user found');
      return;
    }
    
    const userId = parentResult.rows[0].id;
    console.log('Creating notifications for parent user ID:', userId);

    // Find existing records to link notifications to
    const incident = await pool.query('SELECT id, student_id FROM behaviour_incidents LIMIT 1');
    const merit = await pool.query('SELECT id, student_id FROM merits LIMIT 1');
    const detention = await pool.query('SELECT da.id, da.student_id FROM detention_assignments da LIMIT 1');
    const attendance = await pool.query("SELECT id, student_id FROM attendance WHERE status = 'absent' LIMIT 1");

    const notifications = [];

    // Create notification with linked incident
    if (incident.rows.length > 0) {
      notifications.push({
        title: 'New Incident Report',
        message: 'Your child was involved in an incident. Click to view details.',
        type: 'incident',
        related_id: incident.rows[0].id,
        related_type: 'incident'
      });
    } else {
      notifications.push({
        title: 'New Incident Report',
        message: 'Your child was involved in a minor incident today.',
        type: 'incident',
        related_id: null,
        related_type: null
      });
    }

    // Create notification with linked merit
    if (merit.rows.length > 0) {
      notifications.push({
        title: 'Merit Awarded!',
        message: 'Congratulations! Your child received a merit. Click to view details.',
        type: 'merit',
        related_id: merit.rows[0].id,
        related_type: 'merit'
      });
    } else {
      notifications.push({
        title: 'Merit Awarded!',
        message: 'Congratulations! Your child received a merit for excellent work.',
        type: 'merit',
        related_id: null,
        related_type: null
      });
    }

    // Create notification with linked detention
    if (detention.rows.length > 0) {
      notifications.push({
        title: 'Detention Scheduled',
        message: 'Your child has been assigned detention. Click to view details.',
        type: 'detention',
        related_id: detention.rows[0].id,
        related_type: 'detention_assignment'
      });
    } else {
      notifications.push({
        title: 'Detention Scheduled',
        message: 'Your child has been assigned detention for tomorrow.',
        type: 'detention',
        related_id: null,
        related_type: null
      });
    }

    // Create notification with linked attendance
    if (attendance.rows.length > 0) {
      notifications.push({
        title: 'Attendance Alert',
        message: 'Your child was marked absent. Click to view details.',
        type: 'attendance',
        related_id: attendance.rows[0].id,
        related_type: 'attendance'
      });
    } else {
      notifications.push({
        title: 'Attendance Alert',
        message: 'Your child was marked absent today.',
        type: 'attendance',
        related_id: null,
        related_type: null
      });
    }

    // Insert notifications
    for (const notif of notifications) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, related_type, is_read) 
         VALUES ($1, $2, $3, $4, $5, $6, 0)`,
        [userId, notif.title, notif.message, notif.type, notif.related_id, notif.related_type]
      );
      console.log(`Created: ${notif.title}${notif.related_id ? ` (linked to ${notif.related_type} #${notif.related_id})` : ' (no linked data)'}`);
    }
    
    console.log(`\n✅ Created ${notifications.length} test notifications for user ID: ${userId}`);
    console.log('Refresh your browser to see them!');
    console.log('\nNote: Notifications with linked data will show full details when you click "View Details"');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestNotification();
