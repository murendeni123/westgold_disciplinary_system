const { schemaGet, schemaAll } = require('./schemaHelper');
const { createNotification } = require('../routes/notifications');

/**
 * Calculate student's badge eligibility based on merits and demerits
 * Badge eligibility: totalMerits >= 10 AND cleanPoints >= 10
 * Clean Points = Total Merits - Total Demerits
 */
async function calculateBadgeEligibility(req, studentId) {
  try {
    // Get total merits
    const meritStats = await schemaGet(req, `
      SELECT COALESCE(SUM(points), 0) as total_merits
      FROM merits
      WHERE student_id = $1
    `, [studentId]);

    // Get total demerits (points_deducted from behaviour_incidents)
    const demeritStats = await schemaGet(req, `
      SELECT COALESCE(SUM(points_deducted), 0) as total_demerits
      FROM behaviour_incidents
      WHERE student_id = $1
    `, [studentId]);

    const totalMerits = parseInt(meritStats?.total_merits || 0);
    const totalDemerits = parseInt(demeritStats?.total_demerits || 0);
    const cleanPoints = totalMerits - totalDemerits;

    // Badge eligibility: must have at least 10 total merits AND at least 10 clean points
    const isEligible = totalMerits >= 10 && cleanPoints >= 10;

    return {
      totalMerits,
      totalDemerits,
      cleanPoints,
      isEligible,
      wasEligible: false // Will be set by caller if checking previous state
    };
  } catch (error) {
    console.error('Error calculating badge eligibility:', error);
    throw error;
  }
}

/**
 * Check if badge status changed and send notifications if needed
 */
async function checkBadgeStatusChange(req, studentId, previousEligibility, currentEligibility) {
  try {
    // Get student details
    const student = await schemaGet(req, `
      SELECT s.*, 
             s.first_name || ' ' || s.last_name as student_name,
             c.teacher_id as class_teacher_id
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [studentId]);

    if (!student) {
      console.error('Student not found:', studentId);
      return { statusChanged: false };
    }

    const earnedBadge = !previousEligibility && currentEligibility;
    const lostBadge = previousEligibility && !currentEligibility;

    if (earnedBadge) {
      await sendBadgeEarnedNotifications(req, student);
      return { 
        statusChanged: true, 
        badgeEarned: true,
        studentName: student.student_name
      };
    }

    if (lostBadge) {
      await sendBadgeLostNotifications(req, student);
      return { 
        statusChanged: true, 
        badgeLost: true,
        studentName: student.student_name
      };
    }

    return { statusChanged: false };
  } catch (error) {
    console.error('Error checking badge status change:', error);
    throw error;
  }
}

/**
 * Send notifications when a student earns a Goldie Badge
 */
async function sendBadgeEarnedNotifications(req, student) {
  const message = `${student.student_name} has earned a Goldie Badge! 🌟`;

  // Notify parent
  if (student.parent_id) {
    await createNotification(
      req,
      student.parent_id,
      'goldie_badge_earned',
      'Goldie Badge Earned! 🌟',
      message,
      student.id,
      'student'
    );
  }

  // Notify class teacher
  if (student.class_teacher_id) {
    const classTeacher = await schemaGet(req, `
      SELECT user_id FROM teachers WHERE id = $1
    `, [student.class_teacher_id]);
    
    if (classTeacher?.user_id) {
      await createNotification(
        req,
        classTeacher.user_id,
        'goldie_badge_earned',
        'Student Earned Goldie Badge! 🌟',
        message,
        student.id,
        'student'
      );
    }
  }

  // Notify all admins
  const admins = await schemaAll(req, `
    SELECT DISTINCT u.id
    FROM public.users u
    WHERE u.role = 'admin' 
      AND u.school_id = (SELECT school_id FROM public.users WHERE id = $1)
      AND u.is_active = true
  `, [req.user.id]);

  for (const admin of admins) {
    await createNotification(
      req,
      admin.id,
      'goldie_badge_earned',
      'Student Earned Goldie Badge! 🌟',
      message,
      student.id,
      'student'
    );
  }
}

/**
 * Send notifications when a student loses a Goldie Badge
 */
async function sendBadgeLostNotifications(req, student) {
  const message = `${student.student_name} has lost their Goldie Badge privileges.`;

  // Notify parent
  if (student.parent_id) {
    await createNotification(
      req,
      student.parent_id,
      'goldie_badge_lost',
      'Goldie Badge Lost',
      message,
      student.id,
      'student'
    );
  }

  // Notify class teacher
  if (student.class_teacher_id) {
    const classTeacher = await schemaGet(req, `
      SELECT user_id FROM teachers WHERE id = $1
    `, [student.class_teacher_id]);
    
    if (classTeacher?.user_id) {
      await createNotification(
        req,
        classTeacher.user_id,
        'goldie_badge_lost',
        'Student Lost Goldie Badge',
        message,
        student.id,
        'student'
      );
    }
  }

  // Notify all admins
  const admins = await schemaAll(req, `
    SELECT DISTINCT u.id
    FROM public.users u
    WHERE u.role = 'admin' 
      AND u.school_id = (SELECT school_id FROM public.users WHERE id = $1)
      AND u.is_active = true
  `, [req.user.id]);

  for (const admin of admins) {
    await createNotification(
      req,
      admin.id,
      'goldie_badge_lost',
      'Student Lost Goldie Badge',
      message,
      student.id,
      'student'
    );
  }
}

module.exports = {
  calculateBadgeEligibility,
  checkBadgeStatusChange,
  sendBadgeEarnedNotifications,
  sendBadgeLostNotifications
};
