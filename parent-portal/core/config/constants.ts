// Application constants

export const APP_NAME = 'Parent Portal';
export const APP_VERSION = '1.0.0';

export const QUERY_KEYS = {
  AUTH: 'auth',
  USER: 'user',
  INCIDENTS: 'incidents',
  INCIDENT: 'incident',
  BEHAVIOUR_STATS: 'behaviour-stats',
  STUDENTS: 'students',
  STUDENT: 'student',
  MERITS: 'merits',
  DETENTIONS: 'detentions',
  ATTENDANCE: 'attendance',
  INTERVENTIONS: 'interventions',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  TEACHERS: 'teachers',
  DASHBOARD_STATS: 'dashboard-stats',
} as const;

export const SEVERITY_COLORS = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
} as const;

export const STATUS_COLORS = {
  pending: 'warning',
  resolved: 'success',
  escalated: 'error',
  active: 'info',
  completed: 'success',
  paused: 'warning',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;
