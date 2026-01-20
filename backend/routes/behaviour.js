const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get all behaviour incidents
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { student_id, teacher_id, status, severity, start_date, end_date } = req.query;
        const schema = getSchema(req);
        
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        let query = `
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   t.name as teacher_name,
                   c.class_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN teachers t ON bi.teacher_id = t.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (student_id) {
            query += ` AND bi.student_id = $${paramIndex++}`;
            params.push(student_id);
        }
        if (teacher_id) {
            query += ` AND bi.teacher_id = $${paramIndex++}`;
            params.push(teacher_id);
        }
        if (status) {
            query += ` AND bi.status = $${paramIndex++}`;
            params.push(status);
        }
        if (severity) {
            query += ` AND bi.severity = $${paramIndex++}`;
            params.push(severity);
        }
        if (start_date) {
            query += ` AND bi.date >= $${paramIndex++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND bi.date <= $${paramIndex++}`;
            params.push(end_date);
        }

        query += ' ORDER BY bi.date DESC, bi.time DESC';

        const incidents = await schemaAll(req, query, params);
        res.json(incidents);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get incident by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const incident = await schemaGet(req, `
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   t.name as teacher_name,
                   c.class_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN teachers t ON bi.teacher_id = t.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE bi.id = $1
        `, [req.params.id]);

        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        res.json(incident);
    } catch (error) {
        console.error('Error fetching incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create incident
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { student_id, incident_date, incident_time, incident_type, incident_type_id, description, severity, points } = req.body;
        const schema = getSchema(req);

        if (!student_id || !incident_date) {
            return res.status(400).json({ error: 'Student ID and incident date are required' });
        }

        if (!description || !String(description).trim()) {
            return res.status(400).json({ error: 'Description is required' });
        }

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Get teacher ID from school schema
        const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
        if (!teacher) {
            return res.status(403).json({ error: 'Teacher record not found' });
        }

        const result = await schemaRun(req,
            `INSERT INTO behaviour_incidents 
             (student_id, teacher_id, date, time, incident_type_id, description, severity, points_deducted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [student_id, teacher.id, incident_date, incident_time || null, incident_type_id || null, 
             String(description).trim(), severity || 'minor', points || 0]
        );

        const incident = await schemaGet(req, 'SELECT * FROM behaviour_incidents WHERE id = $1', [result.id]);
        
        // Get student details for notification
        const student = await schemaGet(req, 
            'SELECT s.*, s.first_name || \' \' || s.last_name as student_name FROM students s WHERE s.id = $1', 
            [student_id]
        );
        
        // Notify parent if exists
        if (student && student.parent_id) {
            await createNotification(
                req,
                student.parent_id,
                'incident',
                'Behaviour Incident Reported',
                `Your child ${student.student_name} was involved in a ${severity || 'minor'} incident: ${String(description).trim().substring(0, 100)}`,
                result.id,
                'incident'
            );
        }
        
        res.status(201).json(incident);
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update incident
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { incident_date, incident_time, incident_type_id, description, severity, points, action_taken, parent_notified, follow_up_required } = req.body;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id, teacher_id FROM behaviour_incidents WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        // Get teacher ID
        const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
        
        // Only admin or the teacher who created can update
        if (req.user.role !== 'admin' && (!teacher || teacher.id !== existing.teacher_id)) {
            return res.status(403).json({ error: 'You can only update your own incidents' });
        }

        await schemaRun(req,
            `UPDATE behaviour_incidents 
             SET date = COALESCE($1, date), 
                 time = $2, 
                 incident_type_id = COALESCE($3, incident_type_id),
                 description = COALESCE($4, description), 
                 severity = COALESCE($5, severity), 
                 points_deducted = COALESCE($6, points_deducted),
                 action_taken = COALESCE($7, action_taken),
                 parent_notified = COALESCE($8, parent_notified),
                 follow_up_required = COALESCE($9, follow_up_required)
             WHERE id = $10`,
            [incident_date, incident_time, incident_type_id, description, severity, points, action_taken, parent_notified, follow_up_required, req.params.id]
        );

        const incident = await schemaGet(req, 'SELECT * FROM behaviour_incidents WHERE id = $1', [req.params.id]);
        res.json(incident);
    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete incident
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        const existing = await schemaGet(req, 'SELECT id, teacher_id FROM behaviour_incidents WHERE id = $1', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        // Get teacher ID
        const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);

        // Only admin or the teacher who created can delete
        if (req.user.role !== 'admin' && (!teacher || teacher.id !== existing.teacher_id)) {
            return res.status(403).json({ error: 'You can only delete your own incidents' });
        }

        await schemaRun(req, 'DELETE FROM behaviour_incidents WHERE id = $1', [req.params.id]);
        res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        console.error('Error deleting incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Behaviour timeline for a single student
router.get('/timeline/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const schema = getSchema(req);

        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Fetch incidents
        const incidents = await schemaAll(req,
            `SELECT bi.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code
             FROM behaviour_incidents bi
             INNER JOIN students s ON bi.student_id = s.id
             WHERE bi.student_id = $1`,
            [studentId]
        );

        // Fetch merits
        const merits = await schemaAll(req,
            `SELECT m.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code
             FROM merits m
             INNER JOIN students s ON m.student_id = s.id
             WHERE m.student_id = $1`,
            [studentId]
        );

        // Fetch assigned consequences
        const consequences = await schemaAll(req,
            `SELECT sc.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code,
                    c.name as consequence_name,
                    c.severity as consequence_severity
             FROM student_consequences sc
             INNER JOIN students s ON sc.student_id = s.id
             LEFT JOIN consequences c ON sc.consequence_id = c.id
             WHERE sc.student_id = $1`,
            [studentId]
        );

        // Fetch interventions
        const interventions = await schemaAll(req,
            `SELECT i.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code
             FROM interventions i
             INNER JOIN students s ON i.student_id = s.id
             WHERE i.student_id = $1`,
            [studentId]
        );

        // Normalise into a single list
        const timeline = [];

        incidents.forEach((row) => {
            timeline.push({
                source: 'incident',
                id: row.id,
                student_id: row.student_id,
                student_code: row.student_code,
                student_name: row.student_name,
                date: row.date,
                time: row.time,
                title: row.incident_type || 'Incident',
                description: row.description,
                severity: row.severity,
                points: row.points_deducted,
                status: row.status,
                created_at: row.created_at,
            });
        });

        merits.forEach((row) => {
            timeline.push({
                source: 'merit',
                id: row.id,
                student_id: row.student_id,
                student_code: row.student_code,
                student_name: row.student_name,
                date: row.date,
                time: null,
                title: row.merit_type || 'Merit',
                description: row.description,
                severity: null,
                points: row.points,
                status: null,
                created_at: row.created_at,
            });
        });

        consequences.forEach((row) => {
            timeline.push({
                source: 'consequence',
                id: row.id,
                student_id: row.student_id,
                student_code: row.student_code,
                student_name: row.student_name,
                date: row.assigned_date,
                time: null,
                title: row.consequence_name || 'Consequence',
                description: row.notes,
                severity: row.consequence_severity,
                points: null,
                status: row.status,
                created_at: row.created_at,
            });
        });

        interventions.forEach((row) => {
            timeline.push({
                source: 'intervention',
                id: row.id,
                student_id: row.student_id,
                student_code: row.student_code,
                student_name: row.student_name,
                date: row.start_date,
                time: null,
                title: row.type || 'Intervention',
                description: row.description,
                severity: null,
                points: null,
                status: row.status,
                created_at: row.created_at,
            });
        });

        // Sort newest first
        timeline.sort((a, b) => {
            const aKey = `${a.date || ''} ${a.time || ''} ${a.created_at || ''}`;
            const bKey = `${b.date || ''} ${b.time || ''} ${b.created_at || ''}`;
            return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
        });

        res.json(timeline);
    } catch (error) {
        console.error('Error building behaviour timeline:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
