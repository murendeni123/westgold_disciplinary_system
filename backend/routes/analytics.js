const express = require('express');
const { schemaGet, schemaAll, getSchema } = require('../utils/schemaHelper');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get critical alerts for dashboard
router.get('/critical-alerts', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Students exceeding discipline thresholds (e.g., 50+ demerit points)
        const thresholdStudents = await schemaAll(req, `
            SELECT s.id, s.student_id, s.first_name || ' ' || s.last_name as name,
                   c.class_name,
                   COALESCE(SUM(bi.points_deducted), 0) as total_demerits,
                   COUNT(bi.id) as incident_count
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id
            WHERE s.is_active = true
            GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.class_name
            HAVING COALESCE(SUM(bi.points_deducted), 0) >= 50
            ORDER BY total_demerits DESC
            LIMIT 10
        `);

        // Classes that haven't submitted attendance today
        const today = new Date().toISOString().split('T')[0];
        const classesWithoutAttendance = await schemaAll(req, `
            SELECT c.id, c.class_name, u.name as teacher_name,
                   (SELECT COUNT(*) FROM students WHERE class_id = c.id AND is_active = true) as student_count
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
            WHERE c.is_active = 1
            AND c.id NOT IN (
                SELECT DISTINCT s.class_id 
                FROM attendance a
                INNER JOIN students s ON a.student_id = s.id
                WHERE a.date = $1 AND s.class_id IS NOT NULL
            )
            AND (SELECT COUNT(*) FROM students WHERE class_id = c.id AND is_active = 1) > 0
            ORDER BY c.class_name
        `, [today]);

        // Pending incidents requiring approval
        const pendingIncidents = await schemaAll(req, `
            SELECT bi.id, bi.description, bi.points_deducted, bi.created_at,
                   s.first_name || ' ' || s.last_name as student_name,
                   u.name as teacher_name
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            INNER JOIN teachers t ON bi.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
            WHERE bi.follow_up_required = true
            ORDER BY bi.created_at DESC
            LIMIT 5
        `);

        // Upcoming detentions today
        const todayDetentions = await schemaAll(req, `
            SELECT da.id, da.scheduled_date, da.scheduled_time, da.status,
                   s.first_name || ' ' || s.last_name as student_name,
                   c.class_name
            FROM detention_assignments da
            INNER JOIN students s ON da.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE da.scheduled_date = $1
            AND da.status = 'pending'
            ORDER BY da.scheduled_time
        `, [today]);

        res.json({
            thresholdStudents,
            classesWithoutAttendance,
            pendingIncidents,
            todayDetentions,
            alertCounts: {
                thresholdViolations: thresholdStudents.length,
                missingAttendance: classesWithoutAttendance.length,
                pendingApprovals: pendingIncidents.length,
                todayDetentions: todayDetentions.length
            }
        });
    } catch (error) {
        console.error('Error fetching critical alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get at-risk students
router.get('/at-risk-students', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        // Students with repeated absences (3+ in last 30 days)
        const repeatedAbsences = await schemaAll(req, `
            SELECT s.id, s.student_id, s.first_name || ' ' || s.last_name as name,
                   c.class_name,
                   COUNT(a.id) as absence_count,
                   MAX(a.date) as last_absence
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            INNER JOIN attendance a ON s.id = a.student_id
            WHERE s.is_active = 1
            AND a.status = 'absent'
            AND a.date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.class_name
            HAVING COUNT(a.id) >= 3
            ORDER BY absence_count DESC
            LIMIT 10
        `);

        // Students with repeat demerits (3+ incidents in last 30 days)
        const repeatDemerits = await schemaAll(req, `
            SELECT s.id, s.student_id, s.first_name || ' ' || s.last_name as name,
                   c.class_name,
                   COUNT(bi.id) as incident_count,
                   COALESCE(SUM(bi.points_deducted), 0) as total_points,
                   MAX(bi.created_at) as last_incident
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            INNER JOIN behaviour_incidents bi ON s.id = bi.student_id
            WHERE s.is_active = 1
            AND bi.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.class_name
            HAVING COUNT(bi.id) >= 3
            ORDER BY incident_count DESC, total_points DESC
            LIMIT 10
        `);

        res.json({
            repeatedAbsences,
            repeatDemerits,
            riskCounts: {
                absenceRisk: repeatedAbsences.length,
                behaviorRisk: repeatDemerits.length
            }
        });
    } catch (error) {
        console.error('Error fetching at-risk students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get teacher activity log
router.get('/teacher-activity/:teacherId', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }
        const { teacherId } = req.params;

        const teacher = await schemaGet(req, `
            SELECT t.id, t.name, t.email, t.employee_id
            FROM teachers t
            WHERE t.id = $1
        `, [teacherId]);

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const recentIncidents = await schemaAll(req, `
            SELECT bi.id, bi.description, bi.points_deducted, bi.created_at,
                   s.first_name || ' ' || s.last_name as student_name,
                   it.name as incident_type
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            LEFT JOIN incident_types it ON bi.incident_type_id = it.id
            WHERE bi.teacher_id = $1
            ORDER BY bi.created_at DESC
            LIMIT 20
        `, [teacherId]);

        const recentMerits = await schemaAll(req, `
            SELECT m.id, m.description, m.points, m.created_at,
                   s.first_name || ' ' || s.last_name as student_name,
                   mt.name as merit_type
            FROM merits m
            INNER JOIN students s ON m.student_id = s.id
            LEFT JOIN merit_types mt ON m.merit_type_id = mt.id
            WHERE m.teacher_id = $1
            ORDER BY m.created_at DESC
            LIMIT 20
        `, [teacherId]);

        const stats = await schemaGet(req, `
            SELECT 
                (SELECT COUNT(*) FROM behaviour_incidents WHERE teacher_id = $1) as total_incidents,
                (SELECT COUNT(*) FROM merits WHERE teacher_id = $1) as total_merits,
                (SELECT COUNT(*) FROM classes WHERE teacher_id = $1) as class_count
        `, [teacherId]);

        res.json({
            teacher,
            recentIncidents,
            recentMerits,
            stats
        });
    } catch (error) {
        console.error('Error fetching teacher activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get class profile/details
router.get('/class-profile/:classId', authenticateToken, async (req, res) => {
    try {
        const schema = getSchema(req);
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }
        const { classId } = req.params;

        const classInfo = await schemaGet(req, `
            SELECT c.id, c.class_name, c.grade_level, c.academic_year,
                   t.id as teacher_id, u.name as teacher_name
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
            WHERE c.id = $1
        `, [classId]);

        if (!classInfo) {
            return res.status(404).json({ error: 'Class not found' });
        }

        const students = await schemaAll(req, `
            SELECT s.id, s.student_id, s.first_name || ' ' || s.last_name as name,
                   COALESCE((SELECT SUM(points_deducted) FROM behaviour_incidents WHERE student_id = s.id), 0) as demerit_points,
                   COALESCE((SELECT SUM(points) FROM merits WHERE student_id = s.id), 0) as merit_points,
                   COALESCE((SELECT COUNT(*) FROM behaviour_incidents WHERE student_id = s.id), 0) as incident_count
            FROM students s
            WHERE s.class_id = $1 AND s.is_active = 1
            ORDER BY demerit_points DESC
        `, [classId]);

        const recentIncidents = await schemaAll(req, `
            SELECT bi.id, bi.description, bi.points_deducted, bi.created_at,
                   s.first_name || ' ' || s.last_name as student_name,
                   it.name as incident_type
            FROM behaviour_incidents bi
            INNER JOIN students s ON bi.student_id = s.id
            LEFT JOIN incident_types it ON bi.incident_type_id = it.id
            WHERE s.class_id = $1
            ORDER BY bi.created_at DESC
            LIMIT 10
        `, [classId]);

        const attendanceStats = await schemaGet(req, `
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count
            FROM attendance a
            INNER JOIN students s ON a.student_id = s.id
            WHERE s.class_id = $1
            AND a.date >= CURRENT_DATE - INTERVAL '30 days'
        `, [classId]);

        const stats = {
            studentCount: students.length,
            totalDemerits: students.reduce((sum, s) => sum + (parseInt(s.demerit_points) || 0), 0),
            totalMerits: students.reduce((sum, s) => sum + (parseInt(s.merit_points) || 0), 0),
            avgDemeritsPerStudent: students.length > 0 
                ? (students.reduce((sum, s) => sum + (parseInt(s.demerit_points) || 0), 0) / students.length).toFixed(1) 
                : 0,
            attendanceRate: attendanceStats?.total_records > 0
                ? ((parseInt(attendanceStats.present_count) / parseInt(attendanceStats.total_records)) * 100).toFixed(1)
                : 0
        };

        res.json({
            classInfo,
            students,
            recentIncidents,
            attendanceStats,
            stats
        });
    } catch (error) {
        console.error('Error fetching class profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get dashboard stats
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const role = req.user.role;
        const schema = getSchema(req);
        
        if (!schema) {
            return res.status(403).json({ error: 'School context required' });
        }

        let stats = {};

        if (role === 'admin') {
            const totalStudents = await schemaGet(req, 'SELECT COUNT(*) as count FROM students WHERE is_active = true');
            const totalIncidents = await schemaGet(req, 'SELECT COUNT(*) as count FROM behaviour_incidents');
            const totalMerits = await schemaGet(req, 'SELECT COUNT(*) as count FROM merits');
            const pendingApprovals = await schemaGet(req, 'SELECT COUNT(*) as count FROM behaviour_incidents WHERE follow_up_required = true');
            const scheduledDetentions = await schemaGet(req, "SELECT COUNT(*) as count FROM detention_assignments WHERE status = 'pending'");
            const todayAttendance = await schemaGet(req, `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                FROM attendance 
                WHERE date = CURRENT_DATE
            `);

            // Worst behaving students
            const worstStudents = await schemaAll(req, `
                SELECT s.id, s.student_id, s.first_name || ' ' || s.last_name as name,
                       COALESCE(SUM(bi.points_deducted), 0) as demerit_points,
                       COUNT(bi.id) as incident_count
                FROM students s
                LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id
                WHERE s.is_active = true
                GROUP BY s.id
                ORDER BY demerit_points DESC, incident_count DESC
                LIMIT 10
            `);

            // Worst behaving classes
            const worstClasses = await schemaAll(req, `
                SELECT c.id, c.class_name,
                       COALESCE(SUM(bi.points_deducted), 0) as total_demerit_points,
                       COUNT(DISTINCT bi.student_id) as students_with_incidents
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id
                LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id
                WHERE c.is_active = true
                GROUP BY c.id
                ORDER BY total_demerit_points DESC
                LIMIT 10
            `);

            // Teachers logging most incidents
            const topTeachers = await schemaAll(req, `
                SELECT t.id, t.name,
                       COUNT(bi.id) as incident_count,
                       COUNT(m.id) as merit_count
                FROM teachers t
                LEFT JOIN behaviour_incidents bi ON t.id = bi.teacher_id
                LEFT JOIN merits m ON t.id = m.teacher_id
                WHERE t.is_active = true
                GROUP BY t.id
                ORDER BY incident_count DESC, merit_count DESC
                LIMIT 10
            `);

            stats = {
                totalStudents: parseInt(totalStudents?.count) || 0,
                totalIncidents: parseInt(totalIncidents?.count) || 0,
                totalMerits: parseInt(totalMerits?.count) || 0,
                pendingApprovals: parseInt(pendingApprovals?.count) || 0,
                scheduledDetentions: parseInt(scheduledDetentions?.count) || 0,
                todayAttendance: todayAttendance || { total: 0, present: 0, absent: 0, late: 0 },
                worstStudents,
                worstClasses,
                topTeachers
            };
        } else if (role === 'teacher') {
            // Get teacher ID
            const teacher = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
            const teacherId = teacher?.id;

            const myClasses = await schemaGet(req, 'SELECT COUNT(*) as count FROM classes WHERE teacher_id = $1', [teacherId]);
            const myIncidents = await schemaGet(req, 'SELECT COUNT(*) as count FROM behaviour_incidents WHERE teacher_id = $1', [teacherId]);
            const myMerits = await schemaGet(req, 'SELECT COUNT(*) as count FROM merits WHERE teacher_id = $1', [teacherId]);
            const todayAttendance = await schemaGet(req, `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
                FROM attendance a
                INNER JOIN students s ON a.student_id = s.id
                INNER JOIN classes c ON s.class_id = c.id
                WHERE c.teacher_id = $1 AND a.date = CURRENT_DATE
            `, [teacherId]);

            stats = {
                myClasses: parseInt(myClasses?.count) || 0,
                myIncidents: parseInt(myIncidents?.count) || 0,
                myMerits: parseInt(myMerits?.count) || 0,
                todayAttendance: todayAttendance || { total: 0, present: 0 }
            };
        } else if (role === 'parent') {
            const myChildren = await schemaGet(req, 'SELECT COUNT(*) as count FROM students WHERE parent_id = $1', [req.user.id]);
            const childrenIncidents = await schemaGet(req, `
                SELECT COUNT(*) as count 
                FROM behaviour_incidents bi
                INNER JOIN students s ON bi.student_id = s.id
                WHERE s.parent_id = $1
            `, [req.user.id]);
            const childrenMerits = await schemaGet(req, `
                SELECT COUNT(*) as count 
                FROM merits m
                INNER JOIN students s ON m.student_id = s.id
                WHERE s.parent_id = $1
            `, [req.user.id]);

            stats = {
                myChildren: parseInt(myChildren?.count) || 0,
                childrenIncidents: parseInt(childrenIncidents?.count) || 0,
                childrenMerits: parseInt(childrenMerits?.count) || 0
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
