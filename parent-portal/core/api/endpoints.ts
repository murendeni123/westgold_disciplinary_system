// API endpoint constants
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },

  // Behaviour
  BEHAVIOUR: {
    LIST: '/behaviour',
    DETAIL: (id: number) => `/behaviour/${id}`,
    STATS: '/behaviour/stats',
  },

  // Students (Children)
  STUDENTS: {
    LIST: '/students',
    DETAIL: (id: number) => `/students/${id}`,
  },

  // Merits
  MERITS: {
    LIST: '/merits',
    DETAIL: (id: number) => `/merits/${id}`,
  },

  // Detentions
  DETENTIONS: {
    LIST: '/detentions',
    DETAIL: (id: number) => `/detentions/${id}`,
  },

  // Attendance
  ATTENDANCE: {
    LIST: '/attendance',
    DETAIL: (date: string) => `/attendance/${date}`,
  },

  // Interventions
  INTERVENTIONS: {
    LIST: '/interventions',
    DETAIL: (id: number) => `/interventions/${id}`,
    GUIDED: '/guided-interventions',
  },

  // Messages
  MESSAGES: {
    LIST: '/messages',
    CREATE: '/messages',
    DETAIL: (id: number) => `/messages/${id}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE: (id: number) => `/notifications/${id}`,
  },

  // Parents
  PARENTS: {
    PROFILE: '/parents/profile',
    UPDATE_PROFILE: '/parents/profile',
    CHANGE_PASSWORD: '/parents/change-password',
    LINK_SCHOOL: '/parents/link-school',
    LINK_CHILD: '/parents/link-child',
    LINKED_SCHOOLS: '/parents/linked-schools',
    SWITCH_SCHOOL: '/parents/switch-school',
  },

  // Teachers (for messaging)
  TEACHERS: {
    LIST: '/teachers',
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD_STATS: '/analytics/dashboard-stats',
  },
} as const;
