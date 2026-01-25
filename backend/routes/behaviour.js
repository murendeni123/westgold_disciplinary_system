const express = require('express');
const { schemaAll, schemaGet, schemaRun, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');
const { createNotification, notifySchoolAdmins } = require('./notifications');
const { calculateBadgeEligibility, checkBadgeStatusChange } = require('../utils/goldieBadgeHelper');

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
                   bi.date as incident_date,
                   bi.points_deducted as points,
                   s.first_name || ' ' || s.last_name as student_name,
                   s.student_id as student_number,
                   s.id as student_id,
                   u.name as teacher_name,
                   c.class_name,
                   COALESCE(it.name, bi.incident_type) as incident_type_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN teachers t ON bi.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN incident_types it ON bi.incident_type_id = it.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        // If user is a parent, only show incidents for their linked children
        if (req.user.role === 'parent') {
            query += ` AND s.parent_id = $${paramIndex++}`;
            params.push(req.user.id);
        }

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
                   u.name as teacher_name,
                   c.class_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN teachers t ON bi.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
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

        // Check badge eligibility BEFORE logging incident
        const beforeEligibility = await calculateBadgeEligibility(req, student_id);

        const result = await schemaRun(req,
            `INSERT INTO behaviour_incidents 
             (student_id, teacher_id, date, time, incident_type_id, description, severity, points_deducted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [student_id, teacher.id, incident_date, incident_time || null, incident_type_id || null, 
             String(description).trim(), severity || 'minor', points || 0]
        );

        const incident = await schemaGet(req, 'SELECT * FROM behaviour_incidents WHERE id = $1', [result.id]);
        
        // Check badge eligibility AFTER logging incident
        const afterEligibility = await calculateBadgeEligibility(req, student_id);
        
        // Get student details for notification
        const student = await schemaGet(req, 
            'SELECT s.*, s.first_name || \' \' || s.last_name as student_name, s.class_id FROM students s WHERE s.id = $1', 
            [student_id]
        );
        
        // Get logging teacher details
        const loggingTeacher = await schemaGet(req,
            'SELECT t.id, u.name as teacher_name FROM teachers t JOIN public.users u ON t.user_id = u.id WHERE t.id = $1',
            [teacher.id]
        );
        
        // Get class teacher if student has a class
        let classTeacher = null;
        if (student && student.class_id) {
            classTeacher = await schemaGet(req,
                'SELECT t.id, t.user_id, u.name as teacher_name FROM teachers t JOIN public.users u ON t.user_id = u.id WHERE t.id = (SELECT teacher_id FROM classes WHERE id = $1)',
                [student.class_id]
            );
        }
        
        const isHighSeverity = severity === 'high' || severity === 'critical';
        
        // Notify parent
        if (student && student.parent_id) {
            const parentMessage = isHighSeverity 
                ? `Your child, ${student.student_name}, was involved in a high-severity incident on ${incident_date}. Details: ${String(description).trim().substring(0, 100)}. This incident is pending admin review.`
                : `Your child, ${student.student_name}, was involved in a ${severity || 'minor'} incident: ${String(description).trim().substring(0, 100)}`;
            
            await createNotification(
                req,
                student.parent_id,
                'incident',
                isHighSeverity ? '⚠️ High-Severity Incident Notification' : 'Behaviour Incident Reported',
                parentMessage,
                result.id,
                'incident'
            );
        }
        
        // Notify admins for high severity incidents
        if (isHighSeverity) {
            await notifySchoolAdmins(
                req,
                'high_severity_incident',
                '⚠️ High-Severity Incident Requires Review',
                `${loggingTeacher?.teacher_name || 'A teacher'} logged a ${severity} incident for ${student.student_name}: ${String(description).trim().substring(0, 100)}. Please review and approve/decline.`,
                result.id,
                'incident'
            );
        }
        
        // Notify logging teacher (confirmation)
        if (loggingTeacher && loggingTeacher.user_id !== req.user.id) {
            await createNotification(
                req,
                req.user.id,
                'incident',
                'Incident Logged Successfully',
                `You logged a ${severity || 'minor'} incident for ${student.student_name}. ${isHighSeverity ? 'This incident is pending admin approval.' : 'The incident has been recorded.'}`,
                result.id,
                'incident'
            );
        }
        
        // Notify class teacher (if different from logging teacher)
        if (classTeacher && classTeacher.user_id && classTeacher.user_id !== req.user.id) {
            await createNotification(
                req,
                classTeacher.user_id,
                'incident',
                isHighSeverity ? '⚠️ High-Severity Incident - Your Student' : 'Incident Reported - Your Student',
                `${loggingTeacher?.teacher_name || 'A teacher'} logged a ${severity || 'minor'} incident for your student ${student.student_name}: ${String(description).trim().substring(0, 100)}`,
                result.id,
                'incident'
            );
        }

        // Check if badge status changed and send notifications
        const badgeStatusChange = await checkBadgeStatusChange(
            req, 
            student_id, 
            beforeEligibility.isEligible, 
            afterEligibility.isEligible
        );
        
        // Automatically evaluate detention rules for this student
        try {
            const axios = require('axios');
            const detentionEvalUrl = `${req.protocol}://${req.get('host')}/api/detentions/evaluate-rules`;
            await axios.post(detentionEvalUrl, 
                { student_id }, 
                { headers: { Authorization: req.headers.authorization } }
            );
        } catch (detentionError) {
            console.error('Error evaluating detention rules:', detentionError.message);
            // Don't fail the incident creation if detention evaluation fails
        }
        
        // Return incident with badge status information
        res.status(201).json({
            ...incident,
            badgeStatusChange: badgeStatusChange.statusChanged ? {
                badgeEarned: badgeStatusChange.badgeEarned || false,
                badgeLost: badgeStatusChange.badgeLost || false,
                studentName: badgeStatusChange.studentName,
                cleanPoints: afterEligibility.cleanPoints,
                totalMerits: afterEligibility.totalMerits
            } : null
        });
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

// Analytics endpoint for Behaviour Dashboard
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, days = 30 } = req.query;
        const schema = getSchema(req);
        
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Calculate date range
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));

        // Get incidents within date range
        const incidents = await schemaAll(req, `
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   COALESCE(it.name, bi.incident_type) as incident_type_name
            FROM behaviour_incidents bi
            JOIN students s ON bi.student_id = s.id
            LEFT JOIN incident_types it ON bi.incident_type_id = it.id
            WHERE bi.date >= $1 AND bi.date <= $2
            ORDER BY bi.date DESC
        `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

        // Severity breakdown
        const severityBreakdown = {
            high: incidents.filter(i => i.severity === 'high' || i.severity === 'critical').length,
            medium: incidents.filter(i => i.severity === 'medium' || i.severity === 'moderate').length,
            low: incidents.filter(i => i.severity === 'low' || i.severity === 'minor').length
        };

        // Incident trends (group by date)
        const trendsByDate = {};
        incidents.forEach(incident => {
            const date = incident.date.toISOString().split('T')[0];
            if (!trendsByDate[date]) {
                trendsByDate[date] = { date, high: 0, medium: 0, low: 0, total: 0 };
            }
            trendsByDate[date].total++;
            if (incident.severity === 'high' || incident.severity === 'critical') {
                trendsByDate[date].high++;
            } else if (incident.severity === 'medium' || incident.severity === 'moderate') {
                trendsByDate[date].medium++;
            } else {
                trendsByDate[date].low++;
            }
        });
        const trends = Object.values(trendsByDate).sort((a, b) => a.date.localeCompare(b.date));

        // Top incident types
        const incidentTypeCount = {};
        incidents.forEach(incident => {
            const type = incident.incident_type_name || 'Unspecified';
            incidentTypeCount[type] = (incidentTypeCount[type] || 0) + 1;
        });
        const topIncidentTypes = Object.entries(incidentTypeCount)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Student behavior patterns (top 10 students with most incidents)
        const studentIncidentCount = {};
        incidents.forEach(incident => {
            const studentId = incident.student_id;
            const studentName = incident.student_name;
            if (!studentIncidentCount[studentId]) {
                studentIncidentCount[studentId] = { studentId, studentName, count: 0 };
            }
            studentIncidentCount[studentId].count++;
        });
        const topStudents = Object.values(studentIncidentCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Overall stats
        const stats = {
            totalIncidents: incidents.length,
            highSeverity: severityBreakdown.high,
            mediumSeverity: severityBreakdown.medium,
            lowSeverity: severityBreakdown.low,
            averagePerDay: incidents.length / parseInt(days),
            pendingApproval: incidents.filter(i => i.status === 'pending' && (i.severity === 'high' || i.severity === 'critical')).length
        };

        res.json({
            stats,
            severityBreakdown,
            trends,
            topIncidentTypes,
            topStudents,
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
                days: parseInt(days)
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
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
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve incident (admin only)
router.put('/:id/approve', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Only admins can approve incidents
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can approve incidents' });
        }

        const incident = await schemaGet(req, `
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.parent_id,
                   s.class_id,
                   t.user_id as teacher_user_id
            FROM behaviour_incidents bi
            JOIN students s ON bi.student_id = s.id
            JOIN teachers t ON bi.teacher_id = t.id
            WHERE bi.id = $1
        `, [req.params.id]);

        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        // Update incident status to approved
        await schemaRun(req,
            `UPDATE behaviour_incidents SET status = 'approved' WHERE id = $1`,
            [req.params.id]
        );

        // Get admin name
        const admin = await schemaGet(req,
            'SELECT name FROM public.users WHERE id = $1',
            [req.user.id]
        );

        // Get class teacher
        let classTeacher = null;
        if (incident.class_id) {
            classTeacher = await schemaGet(req,
                'SELECT t.user_id FROM teachers t JOIN classes c ON t.id = c.teacher_id WHERE c.id = $1',
                [incident.class_id]
            );
        }

        // Notify logging teacher
        if (incident.teacher_user_id) {
            await createNotification(
                req,
                incident.teacher_user_id,
                'incident_approved',
                '✅ Incident Approved',
                `The high-severity incident you logged for ${incident.student_name} has been approved by ${admin?.name || 'an admin'}.`,
                req.params.id,
                'incident'
            );
        }

        // Notify parent
        if (incident.parent_id) {
            await createNotification(
                req,
                incident.parent_id,
                'incident_approved',
                'Incident Confirmed',
                `The incident involving your child, ${incident.student_name}, has been reviewed and confirmed. Points deducted: ${incident.points_deducted || 0}. Please contact the school if you have questions.`,
                req.params.id,
                'incident'
            );
        }

        // Notify class teacher (if different from logging teacher)
        if (classTeacher && classTeacher.user_id && classTeacher.user_id !== incident.teacher_user_id) {
            await createNotification(
                req,
                classTeacher.user_id,
                'incident_approved',
                'Incident Approved - Your Student',
                `A high-severity incident for your student ${incident.student_name} has been approved by ${admin?.name || 'an admin'}.`,
                req.params.id,
                'incident'
            );
        }

        // Emit Socket.io event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`school_${req.schoolId}`).emit('incident_updated', {
                id: req.params.id,
                status: 'approved'
            });
        }

        const updatedIncident = await schemaGet(req, 'SELECT * FROM behaviour_incidents WHERE id = $1', [req.params.id]);
        res.json(updatedIncident);
    } catch (error) {
        console.error('Error approving incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Decline incident (admin only)
router.put('/:id/decline', authenticateToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const schema = getSchema(req);
        
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Only admins can decline incidents
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can decline incidents' });
        }

        const incident = await schemaGet(req, `
            SELECT bi.*, 
                   s.first_name || ' ' || s.last_name as student_name,
                   s.parent_id,
                   s.class_id,
                   t.user_id as teacher_user_id
            FROM behaviour_incidents bi
            JOIN students s ON bi.student_id = s.id
            JOIN teachers t ON bi.teacher_id = t.id
            WHERE bi.id = $1
        `, [req.params.id]);

        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        // Update incident status to declined
        await schemaRun(req,
            `UPDATE behaviour_incidents SET status = 'declined' WHERE id = $1`,
            [req.params.id]
        );

        // Get admin name
        const admin = await schemaGet(req,
            'SELECT name FROM public.users WHERE id = $1',
            [req.user.id]
        );

        // Get class teacher
        let classTeacher = null;
        if (incident.class_id) {
            classTeacher = await schemaGet(req,
                'SELECT t.user_id FROM teachers t JOIN classes c ON t.id = c.teacher_id WHERE c.id = $1',
                [incident.class_id]
            );
        }

        // Notify logging teacher
        if (incident.teacher_user_id) {
            const declineMessage = reason 
                ? `The high-severity incident you logged for ${incident.student_name} has been declined by ${admin?.name || 'an admin'}. Reason: ${reason}`
                : `The high-severity incident you logged for ${incident.student_name} has been declined by ${admin?.name || 'an admin'}.`;
            
            await createNotification(
                req,
                incident.teacher_user_id,
                'incident_declined',
                '❌ Incident Declined',
                declineMessage,
                req.params.id,
                'incident'
            );
        }

        // Notify parent
        if (incident.parent_id) {
            await createNotification(
                req,
                incident.parent_id,
                'incident_declined',
                'Incident Review Update',
                `The incident involving your child, ${incident.student_name}, has been reviewed and will not be processed further.`,
                req.params.id,
                'incident'
            );
        }

        // Notify class teacher (if different from logging teacher)
        if (classTeacher && classTeacher.user_id && classTeacher.user_id !== incident.teacher_user_id) {
            await createNotification(
                req,
                classTeacher.user_id,
                'incident_declined',
                'Incident Declined - Your Student',
                `A high-severity incident for your student ${incident.student_name} has been declined by ${admin?.name || 'an admin'}.`,
                req.params.id,
                'incident'
            );
        }

        // Emit Socket.io event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`school_${req.schoolId}`).emit('incident_updated', {
                id: req.params.id,
                status: 'declined'
            });
        }

        const updatedIncident = await schemaGet(req, 'SELECT * FROM behaviour_incidents WHERE id = $1', [req.params.id]);
        res.json(updatedIncident);
    } catch (error) {
        console.error('Error declining incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
