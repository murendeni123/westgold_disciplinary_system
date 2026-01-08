const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all incident types
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active_only } = req.query;
    let query = 'SELECT * FROM incident_types';
    const params = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY name';

    const types = await dbAll(query, params);
    res.json(types);
  } catch (error) {
    console.error('Error fetching incident types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single incident type
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const type = await dbGet('SELECT * FROM incident_types WHERE id = ?', [req.params.id]);
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
    const { name, default_points, default_severity, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await dbRun(
      `INSERT INTO incident_types (name, default_points, default_severity, description)
       VALUES (?, ?, ?, ?)`,
      [name, default_points || 0, default_severity || 'low', description || null]
    );

    const type = await dbGet('SELECT * FROM incident_types WHERE id = ?', [result.id]);
    res.status(201).json(type);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Incident type with this name already exists' });
    }
    console.error('Error creating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update incident type (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, default_points, default_severity, description, is_active } = req.body;

    await dbRun(
      `UPDATE incident_types 
       SET name = ?, default_points = ?, default_severity = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [name, default_points || 0, default_severity || 'low', description || null, is_active !== undefined ? is_active : 1, req.params.id]
    );

    const type = await dbGet('SELECT * FROM incident_types WHERE id = ?', [req.params.id]);
    res.json(type);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Incident type with this name already exists' });
    }
    console.error('Error updating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete incident type (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await dbRun('DELETE FROM incident_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Incident type deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


