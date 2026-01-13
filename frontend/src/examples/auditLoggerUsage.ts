/**
 * Audit Logger Usage Examples
 * 
 * This file demonstrates how to integrate the audit logger
 * into various CRUD operations throughout the application.
 */

import { logAuditEvent, AUDIT_ACTIONS, ENTITY_TYPES } from '../lib/auditLogger';

// ============================================================================
// STUDENT OPERATIONS
// ============================================================================

/**
 * Example: Create a student and log the action
 */
export async function createStudentWithAudit(studentData: any, schoolId: string) {
  // Create the student (your actual API call here)
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
  
  const student = await response.json();

  // Log the audit event
  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.STUDENT,
    entityId: student.id,
    description: `Student ${student.first_name} ${student.last_name} created`,
    metadata: {
      grade: student.grade,
      class_id: student.class_id,
      admission_number: student.admission_number,
    },
  });

  return student;
}

/**
 * Example: Update a student and log the action
 */
export async function updateStudentWithAudit(
  studentId: string,
  updates: any,
  schoolId: string,
  previousData?: any
) {
  const response = await fetch(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  const student = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.STUDENT,
    entityId: studentId,
    description: `Student ${student.first_name} ${student.last_name} updated`,
    metadata: {
      changes: updates,
      previous: previousData,
    },
  });

  return student;
}

/**
 * Example: Delete a student and log the action
 */
export async function deleteStudentWithAudit(
  studentId: string,
  studentName: string,
  schoolId: string
) {
  await fetch(`/api/students/${studentId}`, {
    method: 'DELETE',
  });

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.STUDENT,
    entityId: studentId,
    description: `Student ${studentName} deleted`,
    metadata: {
      deleted_at: new Date().toISOString(),
    },
  });
}

// ============================================================================
// INCIDENT OPERATIONS
// ============================================================================

/**
 * Example: Create an incident and log the action
 */
export async function createIncidentWithAudit(incidentData: any, schoolId: string) {
  const response = await fetch('/api/behaviour', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentData),
  });
  
  const incident = await response.json();

  // Log the incident creation with severity and points
  await logAuditEvent({
    schoolId,
    action: 'INCIDENT_LOGGED',
    entityType: 'behaviour_incident',
    entityId: incident.id,
    description: `Incident logged for student ID ${incident.student_id}`,
    metadata: {
      severity: incident.severity,
      points: incident.points,
      incident_type: incident.incident_type,
      student_id: incident.student_id,
    },
  });

  return incident;
}

/**
 * Example: Approve an incident and log the action
 */
export async function approveIncidentWithAudit(
  incidentId: string,
  schoolId: string,
  adminNotes?: string
) {
  const response = await fetch(`/api/behaviour/${incidentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'approved',
      admin_notes: adminNotes,
    }),
  });
  
  const incident = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: ENTITY_TYPES.INCIDENT,
    entityId: incidentId,
    description: `Incident #${incidentId} approved`,
    metadata: {
      severity: incident.severity,
      admin_notes: adminNotes,
      previous_status: 'pending',
    },
  });

  return incident;
}

/**
 * Example: Reject an incident and log the action
 */
export async function rejectIncidentWithAudit(
  incidentId: string,
  schoolId: string,
  reason: string
) {
  const response = await fetch(`/api/behaviour/${incidentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'rejected',
      admin_notes: reason,
    }),
  });
  
  const incident = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.REJECT,
    entityType: ENTITY_TYPES.INCIDENT,
    entityId: incidentId,
    description: `Incident #${incidentId} rejected`,
    metadata: {
      reason,
      previous_status: 'pending',
    },
  });

  return incident;
}

// ============================================================================
// MERIT OPERATIONS
// ============================================================================

/**
 * Example: Award a merit and log the action
 */
export async function awardMeritWithAudit(meritData: any, schoolId: string) {
  const response = await fetch('/api/merits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meritData),
  });
  
  const merit = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.MERIT,
    entityId: merit.id,
    description: `Merit awarded to student ID ${merit.student_id}`,
    metadata: {
      points: merit.points,
      reason: merit.reason,
      student_id: merit.student_id,
    },
  });

  return merit;
}

// ============================================================================
// ATTENDANCE OPERATIONS
// ============================================================================

/**
 * Example: Mark attendance and log the action
 */
export async function markAttendanceWithAudit(attendanceData: any, schoolId: string) {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attendanceData),
  });
  
  const attendance = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.ATTENDANCE,
    entityId: attendance.id,
    description: `Attendance marked for ${attendanceData.students?.length || 1} student(s)`,
    metadata: {
      date: attendanceData.date,
      class_id: attendanceData.class_id,
      absent_count: attendanceData.students?.filter((s: any) => s.status === 'absent').length,
    },
  });

  return attendance;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Example: Bulk import students and log the action
 */
export async function bulkImportStudentsWithAudit(
  students: any[],
  schoolId: string
) {
  const response = await fetch('/api/students/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students }),
  });
  
  const result = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.IMPORT,
    entityType: ENTITY_TYPES.STUDENT,
    description: `Bulk imported ${result.success_count} students`,
    metadata: {
      total_attempted: students.length,
      success_count: result.success_count,
      failed_count: result.failed_count,
      errors: result.errors,
    },
  });

  return result;
}

/**
 * Example: Export student data and log the action
 */
export async function exportStudentsWithAudit(
  filters: any,
  schoolId: string
) {
  const response = await fetch('/api/students/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  
  const blob = await response.blob();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.EXPORT,
    entityType: ENTITY_TYPES.STUDENT,
    description: 'Student data exported',
    metadata: {
      filters,
      format: 'excel',
      exported_at: new Date().toISOString(),
    },
  });

  return blob;
}

// ============================================================================
// USER MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Example: Create a teacher account and log the action
 */
export async function createTeacherWithAudit(teacherData: any, schoolId: string) {
  const response = await fetch('/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacherData),
  });
  
  const teacher = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.TEACHER,
    entityId: teacher.id,
    description: `Teacher ${teacher.first_name} ${teacher.last_name} created`,
    metadata: {
      email: teacher.email,
      subjects: teacher.subjects,
    },
  });

  return teacher;
}

/**
 * Example: Assign a teacher to a class and log the action
 */
export async function assignTeacherToClassWithAudit(
  teacherId: string,
  classId: string,
  schoolId: string
) {
  const response = await fetch(`/api/classes/${classId}/assign-teacher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacher_id: teacherId }),
  });
  
  const result = await response.json();

  await logAuditEvent({
    schoolId,
    action: AUDIT_ACTIONS.ASSIGN,
    entityType: ENTITY_TYPES.TEACHER,
    entityId: teacherId,
    description: `Teacher assigned to class ${classId}`,
    metadata: {
      class_id: classId,
      teacher_id: teacherId,
    },
  });

  return result;
}
