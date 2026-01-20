const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get timetables
router.get('/', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { class_id, student_id, teacher_id, day_of_week } = req.query;
    
    let query = `
      SELECT t.*, 
             c.class_name,
             te.name as teacher_name
      FROM timetable_entries t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (class_id) {
      query += ` AND t.class_id = $${paramIndex++}`;
      params.push(class_id);
    }
    if (teacher_id) {
      query += ` AND t.teacher_id = $${paramIndex++}`;
      params.push(teacher_id);
    }
    if (day_of_week !== undefined) {
      query += ` AND t.day_of_week = $${paramIndex++}`;
      params.push(day_of_week);
    }

    query += ' ORDER BY t.day_of_week, t.period_number';

    const timetables = await schemaAll(req, query, params);
    res.json(timetables);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create timetable
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { class_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room } = req.body;

    const result = await schemaRun(req,
      `INSERT INTO timetable_entries (class_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [class_id || null, teacher_id || null, day_of_week, period_number, subject || null, start_time || null, end_time || null, room || null]
    );

    const timetable = await schemaGet(req, 'SELECT * FROM timetable_entries WHERE id = $1', [result.id]);
    res.status(201).json(timetable);
  } catch (error) {
    console.error('Error creating timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk create timetables
router.post('/bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { timetables } = req.body;
    const results = [];

    for (const tt of timetables) {
      const result = await schemaRun(req,
        `INSERT INTO timetable_entries (class_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [tt.class_id || null, tt.teacher_id || null, tt.day_of_week, tt.period_number, tt.subject || null, tt.start_time || null, tt.end_time || null, tt.room || null]
      );
      const timetable = await schemaGet(req, 'SELECT * FROM timetable_entries WHERE id = $1', [result.id]);
      results.push(timetable);
    }

    res.status(201).json({ message: 'Timetables created', timetables: results });
  } catch (error) {
    console.error('Error creating bulk timetables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update timetable
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { day_of_week, period_number, subject, start_time, end_time, room } = req.body;

    await schemaRun(req,
      `UPDATE timetable_entries 
       SET day_of_week = $1, period_number = $2, subject = $3, start_time = $4, end_time = $5, room = $6
       WHERE id = $7`,
      [day_of_week, period_number, subject || null, start_time || null, end_time || null, room || null, req.params.id]
    );

    const timetable = await schemaGet(req, 'SELECT * FROM timetable_entries WHERE id = $1', [req.params.id]);
    res.json(timetable);
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete timetable
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM timetable_entries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
