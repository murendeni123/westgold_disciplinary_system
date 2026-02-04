const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all merit types
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== MERIT TYPES REQUEST ===');
    console.log('req.user:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role, schemaName: req.user.schemaName } : 'undefined');
    console.log('req.schemaName:', req.schemaName);
    console.log('req.schoolId:', req.schoolId);
    
    const schema = getSchema(req);
    console.log('getSchema returned:', schema);
    
    if (!schema) {
      console.log('ERROR: No schema context!');
      return res.status(403).json({ error: 'School context required' });
    }

    const { active_only } = req.query;
    let query = 'SELECT * FROM merit_types';

    if (active_only === 'true') {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY name';

    console.log('Executing query in schema:', schema);
    const types = await schemaAll(req, query);
    console.log('Query successful, returned', types.length, 'types');
    res.json(types);
  } catch (error) {
    console.error('Error fetching merit types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single merit type
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const type = await schemaGet(req, 'SELECT * FROM merit_types WHERE id = $1', [req.params.id]);
    if (!type) {
      return res.status(404).json({ error: 'Merit type not found' });
    }
    res.json(type);
  } catch (error) {
    console.error('Error fetching merit type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create merit type (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, points, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await schemaRun(req,
      `INSERT INTO merit_types (name, points, description, category, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, points || 1, description || null, category || null, true]
    );

    const type = await schemaGet(req, 'SELECT * FROM merit_types WHERE id = $1', [result.id]);
    res.status(201).json(type);
  } catch (error) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return res.status(400).json({ error: 'Merit type with this name already exists' });
    }
    console.error('Error creating merit type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update merit type (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, points, description, category, is_active } = req.body;

    await schemaRun(req,
      `UPDATE merit_types 
       SET name = $1, points = $2, description = $3, category = $4, is_active = $5
       WHERE id = $6`,
      [name, points || 1, description || null, category || null, is_active !== undefined ? is_active : true, req.params.id]
    );

    const type = await schemaGet(req, 'SELECT * FROM merit_types WHERE id = $1', [req.params.id]);
    res.json(type);
  } catch (error) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return res.status(400).json({ error: 'Merit type with this name already exists' });
    }
    console.error('Error updating merit type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete merit type (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM merit_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Merit type deleted successfully' });
  } catch (error) {
    console.error('Error deleting merit type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
