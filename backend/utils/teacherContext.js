/**
 * Helpers for resolving the current teacher within a school schema and for
 * notifying parents of attendance events. Shared by the morning- and
 * lesson-register routes.
 */

const { schemaGet, schemaAll } = require('./schemaHelper');

/**
 * Resolve the teachers.id for the authenticated user.
 * Prefers req.user.teacherId (populated by auth middleware for teachers/grade
 * heads) and falls back to a lookup by user_id.
 * @returns {Promise<number|null>}
 */
async function getTeacherId(req) {
    if (req.user && req.user.teacherId) return req.user.teacherId;
    if (!req.user || !req.user.id) return null;
    const row = await schemaGet(req, 'SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    return row ? row.id : null;
}

/**
 * Notify the parent(s) of a student that they were marked absent/late.
 * Uses the existing in-app + email notification helper. Silently no-ops if the
 * student has no linked parent. Never throws — notification failure must not
 * break register submission.
 *
 * @param {object} req
 * @param {object} student  { id, parent_id, secondary_parent_id, first_name, last_name }
 * @param {string} status   'absent' | 'late' | ...
 * @param {string} context  e.g. "morning register" or "Period 3 (Mathematics)"
 * @param {string} dateStr  YYYY-MM-DD
 */
async function notifyParentOfAttendance(req, student, status, context, dateStr) {
    try {
        const { createNotification } = require('../routes/notifications');
        const name = `${student.first_name} ${student.last_name}`;
        const statusLabel = status === 'late' ? 'marked late' : 'marked absent';
        const title = status === 'late' ? '🕐 Attendance: Late' : '⚠️ Attendance: Absent';
        const message = `${name} was ${statusLabel} for ${context} on ${dateStr}.`;

        const parentIds = [student.parent_id, student.secondary_parent_id].filter(Boolean);
        for (const parentId of parentIds) {
            await createNotification(
                req,
                parentId,
                'attendance',
                title,
                message,
                student.id,
                'attendance',
                { sendEmail: true, actionUrl: '/parent/attendance' }
            );
        }
    } catch (err) {
        console.error('notifyParentOfAttendance failed (non-fatal):', err.message);
    }
}

module.exports = { getTeacherId, notifyParentOfAttendance };
