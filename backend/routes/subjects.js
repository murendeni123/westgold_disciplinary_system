const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getSchema, schemaRun, schemaGet, schemaAll } = require('../utils/schemaHelper');

// Get all subjects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    console.log(`Fetching subjects for schema: ${schema}`);
    const subjects = await schemaAll(req,
      'SELECT * FROM subjects WHERE is_active = 1 ORDER BY name ASC',
      []
    );

    console.log(`Found ${subjects.length} subjects:`, subjects.map(s => s.code).join(', '));
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get single subject
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const subject = await schemaGet(req,
      'SELECT * FROM subjects WHERE id = $1',
      [req.params.id]
    );

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Create subject
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    // Check if subject with this code already exists
    if (code) {
      const existing = await schemaGet(req,
        'SELECT * FROM subjects WHERE code = $1',
        [code]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Subject with this code already exists',
          subject: existing 
        });
      }
    }

    const insertResult = await schemaRun(req, `
      INSERT INTO subjects (name, code, description)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [name, code || null, description || null]);

    const subject = await schemaGet(req,
      'SELECT * FROM subjects WHERE id = $1',
      [insertResult.id]
    );

    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    
    // Handle duplicate key error specifically
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Subject with this code already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, code, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    await schemaRun(req, `
      UPDATE subjects 
      SET name = $1, code = $2, description = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [name, code || null, description || null, is_active !== undefined ? is_active : true, req.params.id]);

    const subject = await schemaGet(req,
      'SELECT * FROM subjects WHERE id = $1',
      [req.params.id]
    );

    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject (soft delete)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, `
      UPDATE subjects 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [req.params.id]);

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
