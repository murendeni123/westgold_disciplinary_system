const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all incident types
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== INCIDENT TYPES REQUEST ===');
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
    let query = 'SELECT * FROM incident_types';

    if (active_only === 'true') {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY name';

    console.log('Executing query in schema:', schema);
    const types = await schemaAll(req, query);
    console.log('Query successful, returned', types.length, 'types');
    res.json(types);
  } catch (error) {
    console.error('Error fetching incident types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single incident type
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const type = await schemaGet(req, 'SELECT * FROM incident_types WHERE id = $1', [req.params.id]);
    if (!type) {
      return res.status(404).json({ error: 'Incident type not found' });
    }
    res.json(type);
  } catch (error) {
    console.error('Error fetching incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create incident type (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, points, severity, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await schemaRun(req,
      `INSERT INTO incident_types (name, points, severity, description, category, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, points || 0, severity || 'low', description || null, category || null, true]
    );

    const type = await schemaGet(req, 'SELECT * FROM incident_types WHERE id = $1', [result.id]);
    res.status(201).json(type);
  } catch (error) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return res.status(400).json({ error: 'Incident type with this name already exists' });
    }
    console.error('Error creating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update incident type (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { name, points, severity, description, category, is_active } = req.body;

    await schemaRun(req,
      `UPDATE incident_types 
       SET name = $1, points = $2, severity = $3, description = $4, category = $5, is_active = $6
       WHERE id = $7`,
      [name, points || 0, severity || 'low', description || null, category || null, is_active !== undefined ? is_active : true, req.params.id]
    );

    const type = await schemaGet(req, 'SELECT * FROM incident_types WHERE id = $1', [req.params.id]);
    res.json(type);
  } catch (error) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return res.status(400).json({ error: 'Incident type with this name already exists' });
    }
    console.error('Error updating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete incident type (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    await schemaRun(req, 'DELETE FROM incident_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Incident type deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
