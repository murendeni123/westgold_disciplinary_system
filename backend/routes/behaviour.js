const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Get all behaviour incidents
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { student_id, teacher_id, status, severity, start_date, end_date } = req.query;
        
        let query = `
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   u.name as teacher_name,
                   c.class_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN users u ON bi.teacher_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (student_id) {
            query += ' AND bi.student_id = ?';
            params.push(student_id);
        }
        if (teacher_id) {
            query += ' AND bi.teacher_id = ?';
            params.push(teacher_id);
        }
        if (status) {
            query += ' AND bi.status = ?';
            params.push(status);
        }
        if (severity) {
            query += ' AND bi.severity = ?';
            params.push(severity);
        }
        if (start_date) {
            query += ' AND bi.incident_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND bi.incident_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY bi.incident_date DESC, bi.incident_time DESC';

        const incidents = await dbAll(query, params);
        res.json(incidents);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get incident by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const incident = await dbGet(`
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id,
                   u.name as teacher_name,
                   c.class_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN users u ON bi.teacher_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE bi.id = ?
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
        const { student_id, incident_date, incident_time, incident_type, description, severity, points } = req.body;

        if (!student_id || !incident_date || !incident_type) {
            return res.status(400).json({ error: 'Student ID, incident date, and incident type are required' });
        }

        const result = await dbRun(
            `INSERT INTO behaviour_incidents 
             (student_id, teacher_id, incident_date, incident_time, incident_type, description, severity, points, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [student_id, req.user.id, incident_date, incident_time || null, incident_type, description || null, severity || 'low', points || 0]
        );

        const incident = await dbGet('SELECT * FROM behaviour_incidents WHERE id = ?', [result.id]);

        // Only send notification immediately for LOW severity incidents
        // HIGH and MEDIUM severity require admin approval first
        const incidentSeverity = (severity || 'low').toLowerCase();
        if (incidentSeverity === 'low') {
            notificationService.sendIncidentNotification({
                incidentId: result.id,
                studentId: student_id,
                incidentType: incident_type,
                description: description || '',
                severity: incidentSeverity,
                date: incident_date,
                schoolId: req.user.school_id,
            });
        }
        // For high/medium severity, notification will be sent when admin approves

        res.status(201).json(incident);
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Update incident
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { incident_date, incident_time, incident_type, description, severity, status, admin_notes } = req.body;

        const { points } = req.body;
        
        // Only admin can update status and admin_notes
        if (req.user.role === 'admin') {
            // Build update query dynamically based on provided fields
            const updates = [];
            const params = [];
            
            if (incident_date !== undefined) {
                updates.push('incident_date = ?');
                params.push(incident_date);
            }
            if (incident_time !== undefined) {
                updates.push('incident_time = ?');
                params.push(incident_time || null);
            }
            if (incident_type !== undefined) {
                updates.push('incident_type = ?');
                params.push(incident_type);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description || null);
            }
            if (severity !== undefined) {
                updates.push('severity = ?');
                params.push(severity || 'low');
            }
            if (points !== undefined) {
                updates.push('points = ?');
                params.push(points || 0);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (admin_notes !== undefined) {
                updates.push('admin_notes = ?');
                params.push(admin_notes || null);
            }
            
            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }
            
            params.push(req.params.id);
            
            // Get the incident before update to check if status is changing to approved
            const existingIncident = await dbGet('SELECT * FROM behaviour_incidents WHERE id = ?', [req.params.id]);
            
            await dbRun(
                `UPDATE behaviour_incidents 
                 SET ${updates.join(', ')}
                 WHERE id = ?`,
                params
            );

            // If admin is approving a high/medium severity incident, send notification to parent now
            if (status === 'approved' && existingIncident && existingIncident.status !== 'approved') {
                const incidentSeverity = (existingIncident.severity || 'low').toLowerCase();
                if (incidentSeverity === 'high' || incidentSeverity === 'medium') {
                    notificationService.sendIncidentNotification({
                        incidentId: existingIncident.id,
                        studentId: existingIncident.student_id,
                        incidentType: existingIncident.incident_type,
                        description: existingIncident.description || '',
                        severity: incidentSeverity,
                        date: existingIncident.incident_date,
                        schoolId: req.user.school_id,
                    });
                }
            }
        } else {
            // Teachers can only update their own incidents
            await dbRun(
                `UPDATE behaviour_incidents 
                 SET incident_date = ?, incident_time = ?, incident_type = ?, description = ?, severity = ?, points = ?
                 WHERE id = ? AND teacher_id = ?`,
                [incident_date, incident_time || null, incident_type, description || null, 
                 severity || 'low', points || 0, req.params.id, req.user.id]
            );
        }

        const incident = await dbGet('SELECT * FROM behaviour_incidents WHERE id = ?', [req.params.id]);
        res.json(incident);
    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete incident
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Only admin can delete, or teacher can delete their own
        if (req.user.role === 'admin') {
            await dbRun('DELETE FROM behaviour_incidents WHERE id = ?', [req.params.id]);
        } else {
            await dbRun('DELETE FROM behaviour_incidents WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id]);
        }
        res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        console.error('Error deleting incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Behaviour timeline for a single student
// Combines incidents, merits, consequences and interventions into
// a single chronological feed.
router.get('/timeline/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        // Fetch incidents
        const incidents = await dbAll(
            `SELECT bi.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code
             FROM behaviour_incidents bi
             INNER JOIN students s ON bi.student_id = s.id
             WHERE bi.student_id = ?
            `,
            [studentId]
        );

        // Fetch merits
        const merits = await dbAll(
            `SELECT m.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code
             FROM merits m
             INNER JOIN students s ON m.student_id = s.id
             WHERE m.student_id = ?
            `,
            [studentId]
        );

        // Fetch assigned consequences
        const consequences = await dbAll(
            `SELECT sc.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code,
                    c.name as consequence_name,
                    c.severity as consequence_severity
             FROM student_consequences sc
             INNER JOIN students s ON sc.student_id = s.id
             LEFT JOIN consequences c ON sc.consequence_id = c.id
             WHERE sc.student_id = ?
            `,
            [studentId]
        );

        // Fetch interventions
        const interventions = await dbAll(
            `SELECT i.*, 
                    s.first_name || ' ' || s.last_name as student_name,
                    s.student_id as student_code
             FROM interventions i
             INNER JOIN students s ON i.student_id = s.id
             WHERE i.student_id = ?
            `,
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
                date: row.incident_date,
                time: row.incident_time,
                title: row.incident_type,
                description: row.description,
                severity: row.severity,
                points: row.points,
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
                date: row.merit_date,
                time: null,
                title: row.merit_type,
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
                title: row.type,
                description: row.description,
                severity: null,
                points: null,
                status: row.status,
                created_at: row.created_at,
            });
        });

        // Sort newest first by date + time (fallback to created_at)
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

