const express = require('express');
const { schemaGet, schemaRun, schemaAll } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { requireAdminOnly } = require('../middleware/permissions');
const { checkResourceLimit } = require('../utils/planEnforcement');

const router = express.Router();

// Assign Grade Head
router.post('/assign', requireAdminOnly, async (req, res) => {
  try {
    const { teacherId, grade } = req.body;

    // Validation
    if (!teacherId || !grade) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['teacherId', 'grade']
      });
    }

    // Free plan: maximum 1 grade head
    const schoolId = req.schoolId || req.user?.schoolId;
    const schemaName = req.schemaName || req.user?.schemaName;
    if (schoolId && schemaName) {
      const limitCheck = await checkResourceLimit(schoolId, schemaName, 'grade_head');
      if (!limitCheck.allowed) {
        return res.status(403).json({ error: limitCheck.message, code: 'PLAN_LIMIT_REACHED' });
      }
    }

    // Validate grade format (1-12 or string like "8", "9", etc.)
    const gradeStr = String(grade).trim();
    if (!gradeStr) {
      return res.status(400).json({ error: 'Grade cannot be empty' });
    }

    console.log(`📋 Assigning Grade Head: Teacher ${teacherId}, Grade: ${gradeStr}`);

    // Check if teacher exists
    const teacher = await schemaGet(req, 
      'SELECT id, user_id, is_grade_head, grade_head_for FROM teachers WHERE id = $1',
      [teacherId]
    );

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if another teacher is already grade head for this grade
    const existingGradeHead = await schemaGet(req,
      'SELECT id, user_id FROM teachers WHERE is_grade_head = TRUE AND grade_head_for = $1 AND id != $2',
      [gradeStr, teacherId]
    );

    if (existingGradeHead) {
      return res.status(409).json({ 
        error: `Another teacher is already assigned as Grade Head for Grade ${gradeStr}`,
        conflictingTeacherId: existingGradeHead.id
      });
    }

    // Check if teacher has a class (for roleType validation)
    const teacherClass = await schemaGet(req,
      'SELECT id, class_name FROM classes WHERE teacher_id = $1 AND is_active = TRUE LIMIT 1',
      [teacherId]
    );

    const hasClass = !!teacherClass;

    // Update teacher record
    await schemaRun(req,
      `UPDATE teachers 
       SET is_grade_head = TRUE, 
           grade_head_for = $1,
           has_class = $2
       WHERE id = $3`,
      [gradeStr, hasClass, teacherId]
    );

    console.log(`✅ Grade Head assigned successfully: Teacher ${teacherId} for Grade ${gradeStr}`);

    // Fetch updated teacher info
    const updatedTeacher = await schemaGet(req,
      `SELECT t.*, u.name, u.email 
       FROM teachers t
       LEFT JOIN public.users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [teacherId]
    );

    res.json({
      success: true,
      message: `Grade Head assigned successfully for Grade ${gradeStr}`,
      teacher: updatedTeacher,
      assignment: {
        grade: gradeStr,
        hasClass
      }
    });

  } catch (error) {
    console.error('❌ Error assigning Grade Head:', error);
    res.status(500).json({ 
      error: 'Failed to assign Grade Head',
      details: error.message 
    });
  }
});

// Remove Grade Head
router.post('/remove', requireAdminOnly, async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ error: 'teacherId is required' });
    }

    console.log(`📋 Removing Grade Head: Teacher ${teacherId}`);

    // Check if teacher exists and is a grade head
    const teacher = await schemaGet(req,
      'SELECT id, user_id, is_grade_head, grade_head_for FROM teachers WHERE id = $1',
      [teacherId]
    );

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (!teacher.is_grade_head) {
      return res.status(400).json({ 
        error: 'Teacher is not currently assigned as a Grade Head'
      });
    }

    const previousGrade = teacher.grade_head_for;

    // Check if teacher has a class to set has_class correctly
    const teacherClass = await schemaGet(req,
      'SELECT id FROM classes WHERE teacher_id = $1 AND is_active = TRUE LIMIT 1',
      [teacherId]
    );

    // Remove grade head assignment
    await schemaRun(req,
      `UPDATE teachers 
       SET is_grade_head = FALSE, 
           grade_head_for = NULL,
           has_class = $1
       WHERE id = $2`,
      [!!teacherClass, teacherId]
    );

    console.log(`✅ Grade Head removed: Teacher ${teacherId} (was Grade ${previousGrade})`);

    // Fetch updated teacher info
    const updatedTeacher = await schemaGet(req,
      `SELECT t.*, u.name, u.email 
       FROM teachers t
       LEFT JOIN public.users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [teacherId]
    );

    res.json({
      success: true,
      message: `Grade Head assignment removed (was Grade ${previousGrade})`,
      teacher: updatedTeacher,
      previousGrade
    });

  } catch (error) {
    console.error('❌ Error removing Grade Head:', error);
    res.status(500).json({ 
      error: 'Failed to remove Grade Head',
      details: error.message 
    });
  }
});

// Get all Grade Heads
router.get('/', requireAdminOnly, async (req, res) => {
  try {
    const gradeHeads = await schemaAll(req,
      `SELECT t.*, u.name, u.email,
              (SELECT COUNT(*) FROM classes WHERE teacher_id = t.id AND is_active = TRUE) as class_count,
              (SELECT class_name FROM classes WHERE teacher_id = t.id AND is_active = TRUE LIMIT 1) as assigned_class
       FROM teachers t
       LEFT JOIN public.users u ON t.user_id = u.id
       WHERE t.is_grade_head = TRUE
       ORDER BY t.grade_head_for, u.name`
    );

    res.json(gradeHeads);
  } catch (error) {
    console.error('❌ Error fetching Grade Heads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Grade Heads',
      details: error.message 
    });
  }
});

// Check if a grade already has a Grade Head assigned
router.get('/check-grade/:grade', requireAdminOnly, async (req, res) => {
  try {
    const { grade } = req.params;

    const gradeHead = await schemaGet(req,
      `SELECT t.id, t.grade_head_for, u.name, u.email
       FROM teachers t
       LEFT JOIN public.users u ON t.user_id = u.id
       WHERE t.is_grade_head = TRUE AND t.grade_head_for = $1`,
      [grade]
    );

    res.json({
      grade,
      hasGradeHead: !!gradeHead,
      gradeHead: gradeHead || null
    });
  } catch (error) {
    console.error('❌ Error checking grade:', error);
    res.status(500).json({ 
      error: 'Failed to check grade',
      details: error.message 
    });
  }
});

module.exports = router;
