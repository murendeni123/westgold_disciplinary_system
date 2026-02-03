const nodemailer = require('nodemailer');

// Create reusable transporter using Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Configuration Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

/**
 * Send email using Brevo SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional, uses FROM_EMAIL from env)
 * @returns {Promise} - Resolves with info about sent message
 */
const sendEmail = async ({ to, subject, text, html, from }) => {
  const timestamp = new Date().toISOString();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 EMAIL SEND ATTEMPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`📬 To: ${to}`);
  console.log(`📝 Subject: ${subject}`);
  console.log(`👤 From: ${from || `"${process.env.FROM_NAME || 'LearsKool DMS'}" <${process.env.FROM_EMAIL}>`}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const mailOptions = {
      from: from || `"${process.env.FROM_NAME || 'LearsKool DMS'}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log(`📧 Recipient: ${to}`);
    console.log(`🆔 Message ID: ${info.messageId}`);
    console.log(`📊 Response: ${info.response}`);
    console.log(`✉️ Accepted: ${info.accepted?.join(', ') || 'N/A'}`);
    console.log(`❌ Rejected: ${info.rejected?.length > 0 ? info.rejected.join(', ') : 'None'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return info;
  } catch (error) {
    console.error('❌ EMAIL SEND FAILED');
    console.error(`📧 Recipient: ${to}`);
    console.error(`📝 Subject: ${subject}`);
    console.error(`⚠️ Error Code: ${error.code || 'N/A'}`);
    console.error(`⚠️ Error Message: ${error.message}`);
    console.error(`⚠️ Full Error:`, error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    throw error;
  }
};

/**
 * Send notification email for behaviour incident
 */
const sendIncidentNotificationEmail = async (recipientEmail, recipientName, studentName, incidentType, severity, description, date) => {
  const subject = `Behaviour Incident Alert - ${studentName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .incident-box { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; border-radius: 4px; }
        .severity-high { border-left-color: #ef4444; }
        .severity-medium { border-left-color: #f59e0b; }
        .severity-low { border-left-color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Behaviour Incident Notification</h2>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>This is to inform you that a behaviour incident has been logged for <strong>${studentName}</strong>.</p>
          
          <div class="incident-box severity-${severity}">
            <p><strong>Incident Type:</strong> ${incidentType}</p>
            <p><strong>Severity:</strong> <span style="text-transform: capitalize;">${severity}</span></p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Description:</strong> ${description}</p>
          </div>
          
          <p>Please log in to the system to view full details and take any necessary action.</p>
          
          <a href="${process.env.FRONTEND_URL || 'https://westgold-disciplinary-system-hv69eeo2c.vercel.app'}" class="button">View in Dashboard</a>
          
          <div class="footer">
            <p>This is an automated notification from LearsKool Disciplinary Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Behaviour Incident Notification

Dear ${recipientName},

A behaviour incident has been logged for ${studentName}.

Incident Type: ${incidentType}
Severity: ${severity}
Date: ${new Date(date).toLocaleDateString()}
Description: ${description}

Please log in to the system to view full details.

---
This is an automated notification from LearsKool DMS.
  `;

  return sendEmail({ to: recipientEmail, subject, text, html });
};

/**
 * Send detention notification email
 */
const sendDetentionNotificationEmail = async (recipientEmail, recipientName, studentName, detentionDate, detentionTime, duration, location, reason) => {
  const subject = `Detention Scheduled - ${studentName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .detention-box { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⏰ Detention Notification</h2>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>This is to inform you that <strong>${studentName}</strong> has been scheduled for detention.</p>
          
          <div class="detention-box">
            <p><strong>Date:</strong> ${new Date(detentionDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${detentionTime}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            <p><strong>Location:</strong> ${location || 'TBA'}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>Please ensure the student attends the detention session at the scheduled time.</p>
          
          <a href="${process.env.FRONTEND_URL || 'https://westgold-disciplinary-system-hv69eeo2c.vercel.app'}" class="button">View Details</a>
          
          <div class="footer">
            <p>This is an automated notification from LearsKool Disciplinary Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Detention Notification

Dear ${recipientName},

${studentName} has been scheduled for detention.

Date: ${new Date(detentionDate).toLocaleDateString()}
Time: ${detentionTime}
Duration: ${duration} minutes
Location: ${location || 'TBA'}
${reason ? `Reason: ${reason}` : ''}

Please ensure the student attends the detention session.

---
This is an automated notification from LearsKool DMS.
  `;

  return sendEmail({ to: recipientEmail, subject, text, html });
};

/**
 * Send merit award notification email
 */
const sendMeritNotificationEmail = async (recipientEmail, recipientName, studentName, meritType, points, description, date) => {
  const subject = `Merit Awarded - ${studentName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .merit-box { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🌟 Merit Award Notification</h2>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>Great news! <strong>${studentName}</strong> has been awarded a merit.</p>
          
          <div class="merit-box">
            <p><strong>Merit Type:</strong> ${meritType}</p>
            <p><strong>Points:</strong> +${points}</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Description:</strong> ${description}</p>
          </div>
          
          <p>Keep up the excellent work!</p>
          
          <a href="${process.env.FRONTEND_URL || 'https://westgold-disciplinary-system-hv69eeo2c.vercel.app'}" class="button">View Details</a>
          
          <div class="footer">
            <p>This is an automated notification from LearsKool Disciplinary Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Merit Award Notification

Dear ${recipientName},

Great news! ${studentName} has been awarded a merit.

Merit Type: ${meritType}
Points: +${points}
Date: ${new Date(date).toLocaleDateString()}
Description: ${description}

Keep up the excellent work!

---
This is an automated notification from LearsKool DMS.
  `;

  return sendEmail({ to: recipientEmail, subject, text, html });
};

/**
 * Send message notification email
 */
const sendMessageNotificationEmail = async (recipientEmail, recipientName, senderName, subject, messagePreview) => {
  const emailSubject = `New Message from ${senderName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>💬 New Message</h2>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>You have received a new message from <strong>${senderName}</strong>.</p>
          
          <div class="message-box">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Preview:</strong> ${messagePreview}</p>
          </div>
          
          <p>Please log in to view the full message and respond.</p>
          
          <a href="${process.env.FRONTEND_URL || 'https://westgold-disciplinary-system-hv69eeo2c.vercel.app'}" class="button">View Message</a>
          
          <div class="footer">
            <p>This is an automated notification from LearsKool Disciplinary Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Message Notification

Dear ${recipientName},

You have received a new message from ${senderName}.

Subject: ${subject}
Preview: ${messagePreview}

Please log in to view the full message.

---
This is an automated notification from LearsKool DMS.
  `;

  return sendEmail({ to: recipientEmail, subject: emailSubject, text, html });
};

/**
 * Send generic notification email
 */
const sendGenericNotificationEmail = async (recipientEmail, recipientName, title, message, actionUrl) => {
  const subject = title;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .notification-box { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 Notification</h2>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          
          <div class="notification-box">
            <h3>${title}</h3>
            <p>${message}</p>
          </div>
          
          ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
          
          <div class="footer">
            <p>This is an automated notification from LearsKool Disciplinary Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${title}

Dear ${recipientName},

${message}

${actionUrl ? `View details: ${actionUrl}` : ''}

---
This is an automated notification from LearsKool DMS.
  `;

  return sendEmail({ to: recipientEmail, subject, text, html });
};

module.exports = {
  sendEmail,
  sendIncidentNotificationEmail,
  sendDetentionNotificationEmail,
  sendMeritNotificationEmail,
  sendMessageNotificationEmail,
  sendGenericNotificationEmail,
};
