const express = require('express');
const { dbGet, dbAll } = require('../database/db');
const { authenticateToken, getSchoolId } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const role = req.user.role;
        const schoolId = getSchoolId(req);
        let stats = {};

        if (role === 'admin') {
            let whereClause = '';
            const params = [];

            // Platform admin can view across schools
            if (req.user?.role !== 'platform_admin') {
                if (!schoolId) {
                    return res.status(403).json({ error: 'School context required' });
                }
                whereClause = ' WHERE school_id = ?';
                params.push(schoolId);
            }

            const totalStudents = await dbGet(`SELECT COUNT(*) as count FROM students${whereClause}`, params);
            const totalIncidents = await dbGet(`SELECT COUNT(*) as count FROM behaviour_incidents${whereClause}`, params);
            const totalMerits = await dbGet(`SELECT COUNT(*) as count FROM merits${whereClause}`, params);
            const pendingApprovals = await dbGet(`SELECT COUNT(*) as count FROM behaviour_incidents${whereClause ? whereClause + ' AND' : ' WHERE'} status = 'pending'`, whereClause ? [...params, ...params] : []);
            const scheduledDetentions = await dbGet(`SELECT COUNT(*) as count FROM detentions${whereClause ? whereClause + ' AND' : ' WHERE'} status = 'scheduled'`, whereClause ? [...params, ...params] : []);
            const todayAttendance = await dbGet(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                FROM attendance 
                WHERE attendance_date = date('now')
            `);

            // Worst behaving students
            const worstStudents = await dbAll(`
                SELECT s.id, s.student_id, s.first_name || ' ' || s.last_name as name,
                       COALESCE(SUM(bi.points), 0) as demerit_points,
                       COUNT(bi.id) as incident_count
                FROM students s
                LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id AND bi.status = 'approved'
                ${whereClause ? 'WHERE s.school_id = ?' : ''}
                GROUP BY s.id
                ORDER BY demerit_points DESC, incident_count DESC
                LIMIT 10
            `, params);

            // Worst behaving classes
            const worstClasses = await dbAll(`
                SELECT c.id, c.class_name,
                       COALESCE(SUM(bi.points), 0) as total_demerit_points,
                       COUNT(DISTINCT bi.student_id) as students_with_incidents
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id
                LEFT JOIN behaviour_incidents bi ON s.id = bi.student_id AND bi.status = 'approved'
                ${whereClause ? 'WHERE c.school_id = ?' : ''}
                GROUP BY c.id
                ORDER BY total_demerit_points DESC
                LIMIT 10
            `, params);

            // Teachers logging most incidents
            const topTeachers = await dbAll(`
                SELECT u.id, u.name,
                       COUNT(bi.id) as incident_count,
                       COUNT(m.id) as merit_count
                FROM users u
                LEFT JOIN behaviour_incidents bi ON u.id = bi.teacher_id
                LEFT JOIN merits m ON u.id = m.teacher_id
                WHERE u.role = 'teacher'${whereClause ? ' AND u.school_id = ?' : ''}
                GROUP BY u.id
                ORDER BY incident_count DESC, merit_count DESC
                LIMIT 10
            `, params);

            stats = {
                totalStudents: totalStudents.count,
                totalIncidents: totalIncidents.count,
                totalMerits: totalMerits.count,
                pendingApprovals: pendingApprovals.count,
                scheduledDetentions: scheduledDetentions.count,
                todayAttendance: todayAttendance || { total: 0, present: 0, absent: 0, late: 0 },
                worstStudents,
                worstClasses,
                topTeachers
            };
        } else if (role === 'teacher') {
            const myClasses = await dbGet(
                'SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?',
                [req.user.id]
            );
            const myIncidents = await dbGet(
                'SELECT COUNT(*) as count FROM behaviour_incidents WHERE teacher_id = ?',
                [req.user.id]
            );
            const myMerits = await dbGet(
                'SELECT COUNT(*) as count FROM merits WHERE teacher_id = ?',
                [req.user.id]
            );
            const todayAttendance = await dbGet(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
                FROM attendance a
                INNER JOIN students s ON a.student_id = s.id
                INNER JOIN classes c ON s.class_id = c.id
                WHERE c.teacher_id = ? AND a.attendance_date = date('now')
            `, [req.user.id]);

            stats = {
                myClasses: myClasses.count || 0,
                myIncidents: myIncidents.count || 0,
                myMerits: myMerits.count || 0,
                todayAttendance: todayAttendance || { total: 0, present: 0 }
            };
        } else if (role === 'parent') {
            const myChildren = await dbGet(
                'SELECT COUNT(*) as count FROM students WHERE parent_id = ?',
                [req.user.id]
            );
            const childrenIncidents = await dbGet(`
                SELECT COUNT(*) as count 
                FROM behaviour_incidents bi
                INNER JOIN students s ON bi.student_id = s.id
                WHERE s.parent_id = ?
            `, [req.user.id]);
            const childrenMerits = await dbGet(`
                SELECT COUNT(*) as count 
                FROM merits m
                INNER JOIN students s ON m.student_id = s.id
                WHERE s.parent_id = ?
            `, [req.user.id]);

            stats = {
                myChildren: myChildren.count || 0,
                childrenIncidents: childrenIncidents.count || 0,
                childrenMerits: childrenMerits.count || 0
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

