/**
 * Audit Logger Utility
 * 
 * Provides centralized audit logging for tracking user actions across the system.
 * Logs are stored in the audit_logs table with actor information, action details,
 * and optional metadata.
 * 
 * Usage:
 * ```typescript
 * await logAuditEvent({
 *   schoolId: '123',
 *   action: 'create',
 *   entityType: 'student',
 *   entityId: '456',
 *   description: 'Created new student John Doe',
 *   metadata: { grade: '10', class: 'A' }
 * });
 * ```
 */

import { supabase } from './supabaseClient';
import type { Database } from '../types/supabase';

export type AuditLogInput = {
  schoolId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
};

/**
 * Log an audit event to the audit_logs table
 * 
 * Automatically captures the current user and their role from the session.
 * Fails silently if user is not authenticated or if logging fails.
 * 
 * @param input - Audit log details
 */
export async function logAuditEvent({
  schoolId,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
}: AuditLogInput): Promise<void> {
  try {
    // Get current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Failed to get user for audit log:', userError);
      return;
    }

    if (!user) {
      console.warn('No authenticated user - skipping audit log');
      return;
    }

    // Get user role from user_metadata or fetch from profile
    let actorRole = user.user_metadata?.role ?? 'unknown';

    // If role not in metadata, try to fetch from profile
    if (actorRole === 'unknown') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        actorRole = (profile as any).role ?? 'unknown';
      }
    }

    // Insert audit log with explicit type casting for compatibility
    const auditLogData: Database['public']['Tables']['audit_logs']['Insert'] = {
      school_id: schoolId,
      actor_user_id: user.id,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      description: description ?? null,
      metadata: metadata ?? null,
    };

    // Type assertion needed due to Supabase client type inference limitations
    const { error } = await (supabase.from('audit_logs') as any).insert(auditLogData);

    if (error) {
      console.error('Audit log failed:', error);
    }
  } catch (err) {
    // Fail silently - audit logging should not break the main flow
    console.error('Unexpected error in audit logging:', err);
  }
}

/**
 * Retrieve audit logs for a school
 * 
 * Fetches the most recent audit logs for a given school.
 * Returns up to 50 logs by default, ordered by creation time (newest first).
 * 
 * @param schoolId - The school ID to fetch logs for
 * @param limit - Maximum number of logs to retrieve (default: 50)
 * @returns Array of audit log records
 */
export async function getAuditLogs(
  schoolId: string,
  limit: number = 50
): Promise<Database['public']['Tables']['audit_logs']['Row'][]> {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return logs || [];
  } catch (err) {
    console.error('Unexpected error fetching audit logs:', err);
    return [];
  }
}

/**
 * Retrieve audit logs filtered by entity type
 * 
 * @param schoolId - The school ID to fetch logs for
 * @param entityType - The entity type to filter by
 * @param limit - Maximum number of logs to retrieve (default: 50)
 */
export async function getAuditLogsByEntity(
  schoolId: string,
  entityType: string,
  limit: number = 50
): Promise<Database['public']['Tables']['audit_logs']['Row'][]> {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return logs || [];
  } catch (err) {
    console.error('Unexpected error fetching audit logs:', err);
    return [];
  }
}

/**
 * Retrieve audit logs filtered by action
 * 
 * @param schoolId - The school ID to fetch logs for
 * @param action - The action to filter by
 * @param limit - Maximum number of logs to retrieve (default: 50)
 */
export async function getAuditLogsByAction(
  schoolId: string,
  action: string,
  limit: number = 50
): Promise<Database['public']['Tables']['audit_logs']['Row'][]> {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return logs || [];
  } catch (err) {
    console.error('Unexpected error fetching audit logs:', err);
    return [];
  }
}

/**
 * Retrieve audit logs for a specific entity
 * 
 * @param schoolId - The school ID to fetch logs for
 * @param entityType - The entity type
 * @param entityId - The specific entity ID
 * @param limit - Maximum number of logs to retrieve (default: 50)
 */
export async function getAuditLogsForEntity(
  schoolId: string,
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<Database['public']['Tables']['audit_logs']['Row'][]> {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return logs || [];
  } catch (err) {
    console.error('Unexpected error fetching audit logs:', err);
    return [];
  }
}

/**
 * Common audit actions for consistency
 */
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject',
  ASSIGN: 'assign',
  UNASSIGN: 'unassign',
  INCIDENT_LOGGED: 'INCIDENT_LOGGED',
  WHATSAPP_SENT: 'WHATSAPP_SENT',
  WHATSAPP_FAILED: 'WHATSAPP_FAILED',
} as const;

/**
 * Common entity types for consistency
 */
export const ENTITY_TYPES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  CLASS: 'class',
  SCHOOL: 'school',
  INCIDENT: 'incident',
  BEHAVIOUR_INCIDENT: 'behaviour_incident',
  MERIT: 'merit',
  DETENTION: 'detention',
  ATTENDANCE: 'attendance',
  USER: 'user',
  NOTIFICATION: 'notification',
  REPORT: 'report',
} as const;

export default logAuditEvent;
