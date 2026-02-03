const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// TIMETABLE TEMPLATES
// =====================================================

// Get all timetable templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const templates = await schemaAll(req, `
      SELECT * FROM timetable_templates 
      ORDER BY academic_year DESC, created_at DESC
    `);

    res.json(templates);
  } catch (error) {
    console.error('Error fetching timetable templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single timetable template
router.get('/templates/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const template = await schemaGet(req, 
      'SELECT * FROM timetable_templates WHERE id = $1',
      [req.params.id]
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create timetable template
router.post('/templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, academic_year, timetable_type, cycle_length } = req.body;

    if (!name || !academic_year || !timetable_type) {
      return res.status(400).json({ error: 'Name, academic year, and timetable type are required' });
    }

    // Use schemaRun to insert and get the ID
    const insertResult = await schemaRun(req, `
      INSERT INTO timetable_templates (name, academic_year, timetable_type, cycle_length)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [name, academic_year, timetable_type, cycle_length || 1]);

    // Fetch the complete template record
    const template = await schemaGet(req, 
      'SELECT * FROM timetable_templates WHERE id = $1',
      [insertResult.id]
    );

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update timetable template
router.put('/templates/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, academic_year, timetable_type, cycle_length, is_active } = req.body;

    const result = await schemaRun(req, `
      UPDATE timetable_templates 
      SET name = COALESCE($1, name),
          academic_year = COALESCE($2, academic_year),
          timetable_type = COALESCE($3, timetable_type),
          cycle_length = COALESCE($4, cycle_length),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, academic_year, timetable_type, cycle_length, is_active, req.params.id]);

    if (!result) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete timetable template
router.delete('/templates/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM timetable_templates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// TIME SLOTS
// =====================================================

// Get time slots for a template
router.get('/templates/:templateId/slots', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const slots = await schemaAll(req, `
      SELECT * FROM time_slots 
      WHERE template_id = $1 
      ORDER BY period_number
    `, [req.params.templateId]);

    res.json(slots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create time slot
router.post('/templates/:templateId/slots', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { period_number, period_name, start_time, end_time, slot_type } = req.body;

    if (!period_number || !period_name) {
      return res.status(400).json({ error: 'Period number and name are required' });
    }

    const insertResult = await schemaRun(req, `
      INSERT INTO time_slots (template_id, period_number, period_name, start_time, end_time, slot_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [req.params.templateId, period_number, period_name, start_time || '00:00', end_time || '00:00', slot_type || 'lesson']);

    // Fetch the complete slot record
    const slot = await schemaGet(req,
      'SELECT * FROM time_slots WHERE id = $1',
      [insertResult.id]
    );

    res.status(201).json(slot);
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk create time slots (for quick setup)
router.post('/templates/:templateId/slots/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Slots array is required' });
    }

    // Delete existing time slots for this template to avoid duplicates
    await schemaRun(req, 
      'DELETE FROM time_slots WHERE template_id = $1',
      [req.params.templateId]
    );

    const results = [];
    for (const slot of slots) {
      const insertResult = await schemaRun(req, `
        INSERT INTO time_slots (template_id, period_number, period_name, start_time, end_time, slot_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        req.params.templateId,
        slot.period_number,
        slot.period_name,
        slot.start_time || '00:00',
        slot.end_time || '00:00',
        slot.slot_type || 'lesson'
      ]);
      
      // Fetch the complete slot record
      const createdSlot = await schemaGet(req,
        'SELECT * FROM time_slots WHERE id = $1',
        [insertResult.id]
      );
      results.push(createdSlot);
    }

    res.status(201).json(results);
  } catch (error) {
    console.error('Error bulk creating time slots:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      detail: error.detail || null
    });
  }
});

// Update time slot
router.put('/slots/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { period_name, start_time, end_time, slot_type } = req.body;

    const result = await schemaRun(req, `
      UPDATE time_slots 
      SET period_name = COALESCE($1, period_name),
          start_time = COALESCE($2, start_time),
          end_time = COALESCE($3, end_time),
          slot_type = COALESCE($4, slot_type)
      WHERE id = $5
      RETURNING id
    `, [period_name, start_time, end_time, slot_type, req.params.id]);

    if (!result) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete time slot
router.delete('/slots/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM time_slots WHERE id = $1', [req.params.id]);
    res.json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// SUBJECTS
// =====================================================

// Get all subjects
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const subjects = await schemaAll(req, `
      SELECT * FROM subjects 
      WHERE is_active = true 
      ORDER BY name
    `);

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create subject
router.post('/subjects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const result = await schemaRun(req, `
      INSERT INTO subjects (name, code, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, code, description]);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// CLASSROOMS
// =====================================================

// Get all classrooms
router.get('/classrooms', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const classrooms = await schemaAll(req, `
      SELECT * FROM classrooms 
      WHERE is_active = true 
      ORDER BY name
    `);

    res.json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create classroom
router.post('/classrooms', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, room_number, capacity, building } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Classroom name is required' });
    }

    const result = await schemaRun(req, `
      INSERT INTO classrooms (name, room_number, capacity, building)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, room_number, capacity, building]);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// CLASS TIMETABLES
// =====================================================

// Get timetable for a class
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const timetable = await schemaAll(req, `
      SELECT ct.*, 
             ts.period_number, ts.period_name, ts.start_time, ts.end_time, 
             ts.slot_type,
             s.name as subject_name,
             t.name as teacher_name,
             c.name as classroom_name
      FROM class_timetables ct
      JOIN time_slots ts ON ct.time_slot_id = ts.id
      LEFT JOIN subjects s ON ct.subject_id = s.id
      LEFT JOIN teachers t ON ct.teacher_id = t.id
      LEFT JOIN classrooms c ON ct.classroom_id = c.id
      WHERE ct.class_id = $1 
        AND ct.is_active = true
        AND (ct.effective_to IS NULL OR ct.effective_to >= CURRENT_DATE)
      ORDER BY ts.period_number
    `, [req.params.classId]);

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching class timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher's timetable
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const timetable = await schemaAll(req, `
      SELECT ct.*, 
             ts.period_number, ts.period_name, ts.start_time, ts.end_time, 
             ts.slot_type,
             s.name as subject_name,
             cl.class_name,
             c.name as classroom_name
      FROM class_timetables ct
      JOIN time_slots ts ON ct.time_slot_id = ts.id
      JOIN classes cl ON ct.class_id = cl.id
      LEFT JOIN subjects s ON ct.subject_id = s.id
      LEFT JOIN classrooms c ON ct.classroom_id = c.id
      WHERE ct.teacher_id = $1 
        AND ct.is_active = true
        AND (ct.effective_to IS NULL OR ct.effective_to >= CURRENT_DATE)
      ORDER BY ts.period_number
    `, [req.params.teacherId]);

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign period to class (create class timetable entry)
router.post('/class/:classId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { template_id, time_slot_id, subject_id, teacher_id, classroom_id, effective_from } = req.body;

    if (!template_id || !time_slot_id) {
      return res.status(400).json({ error: 'Template ID and time slot ID are required' });
    }

    // Check for teacher clash
    if (teacher_id) {
      const teacherClash = await schemaGet(req, 
        'SELECT check_teacher_clash($1, $2, NULL) as is_available',
        [teacher_id, time_slot_id]
      );

      if (!teacherClash.is_available) {
        return res.status(409).json({ error: 'Teacher is already assigned to another class at this time' });
      }
    }

    // Check for room clash
    if (classroom_id) {
      const roomClash = await schemaGet(req,
        'SELECT check_room_clash($1, $2, NULL) as is_available',
        [classroom_id, time_slot_id]
      );

      if (!roomClash.is_available) {
        return res.status(409).json({ error: 'Classroom is already assigned to another class at this time' });
      }
    }

    const result = await schemaRun(req, `
      INSERT INTO class_timetables (
        class_id, template_id, time_slot_id, subject_id, teacher_id, classroom_id, effective_from, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      req.params.classId,
      template_id,
      time_slot_id,
      subject_id,
      teacher_id,
      classroom_id,
      effective_from || new Date(),
      req.user.id
    ]);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error assigning period:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class timetable entry
router.put('/class-timetable/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { subject_id, teacher_id, classroom_id } = req.body;

    const result = await schemaRun(req, `
      UPDATE class_timetables 
      SET subject_id = COALESCE($1, subject_id),
          teacher_id = COALESCE($2, teacher_id),
          classroom_id = COALESCE($3, classroom_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [subject_id, teacher_id, classroom_id, req.params.id]);

    if (!result) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class timetable entry
router.delete('/class-timetable/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM class_timetables WHERE id = $1', [req.params.id]);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
