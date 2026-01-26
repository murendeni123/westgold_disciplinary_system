import axios from 'axios';

// Use environment variable for API base URL
// Falls back to /api for local development with proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Log the API base URL for debugging
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  mode: import.meta.env.MODE
});

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor - add JWT token and school context
axiosInstance.interceptors.request.use(
  (config) => {
    // Check for platform token first (for platform routes), then regular token
    const platformToken = localStorage.getItem('platform_token');
    const regularToken = localStorage.getItem('token');
    const token = platformToken || regularToken;
    
    // DIAGNOSTIC: Check if token exists and is valid
    if (!token) {
      console.error('❌ No token found in localStorage for request:', config.url);
    } else {
      // Check if token is expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const isExpired = now > expiresAt;
        
        if (isExpired) {
          console.error('❌ Token is EXPIRED:', {
            url: config.url,
            expiredAt: new Date(expiresAt).toISOString(),
            now: new Date(now).toISOString(),
            expiredAgo: Math.round((now - expiresAt) / 1000 / 60) + ' minutes ago'
          });
        } else {
          const expiresIn = Math.round((expiresAt - now) / 1000 / 60);
          console.log('✅ Token valid, expires in:', expiresIn, 'minutes');
        }
      } catch (e) {
        console.error('❌ Error decoding token:', e);
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add x-school-id header for school-scoped requests (not for platform routes)
    const schoolId = localStorage.getItem('schoolId');
    if (schoolId && !config.url?.includes('/platform/')) {
      config.headers['x-school-id'] = schoolId;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token,
        hasAuthHeader: !!config.headers.Authorization,
        schoolId: schoolId,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - log responses and handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.error || error.message,
      data: error.response?.data,
    });
    
    const originalRequest = error.config;
    
    // Handle 401 - Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const platformToken = localStorage.getItem('platform_token');
      const token = localStorage.getItem('token');
      const currentToken = platformToken || token;

      if (!currentToken) {
        // No token to refresh, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('platform_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });

        const newToken = response.data.token;
        
        // Update stored token
        if (platformToken) {
          localStorage.setItem('platform_token', newToken);
        } else {
          localStorage.setItem('token', newToken);
        }

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process queued requests
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, logout user
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('platform_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  // Students
  getStudents: (params?: any) => axiosInstance.get('/api/students', { params }),
  getStudent: (id: number) => axiosInstance.get(`/api/students/${id}`),
  createStudent: (data: any) => axiosInstance.post('/api/students', data),
  updateStudent: (id: number, data: any) => axiosInstance.put(`/api/students/${id}`, data),
  deleteStudent: (id: number) => axiosInstance.delete(`/api/students/${id}`),
  generateLinkCode: (id: number) => axiosInstance.post(`/api/students/${id}/generate-link`),
  assignStudentToClass: (id: number, data: { class_id: number | null; grade_level: string }) => 
    axiosInstance.put(`/api/students/${id}`, data),

  // Classes
  getClasses: () => axiosInstance.get('/api/classes'),
  getClass: (id: number) => axiosInstance.get(`/api/classes/${id}`),
  createClass: (data: any) => axiosInstance.post('/api/classes', data),
  updateClass: (id: number, data: any) => axiosInstance.put(`/api/classes/${id}`, data),
  deleteClass: (id: number) => axiosInstance.delete(`/api/classes/${id}`),

  // Teachers
  getTeachers: () => axiosInstance.get('/api/teachers'),
  getTeacher: (id: number) => axiosInstance.get(`/api/teachers/${id}`),
  createTeacher: (data: any) => axiosInstance.post('/api/teachers', data),
  updateTeacher: (id: number, data: any) => axiosInstance.put(`/api/teachers/${id}`, data),
  deleteTeacher: (id: number) => axiosInstance.delete(`/api/teachers/${id}`),

  // Auth - Signup
  signup: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    work_phone?: string;
    relationship_to_child?: string;
    emergency_contact_1_name?: string;
    emergency_contact_1_phone?: string;
    emergency_contact_2_name?: string;
    emergency_contact_2_phone?: string;
    home_address?: string;
    city?: string;
    postal_code?: string;
  }) => axiosInstance.post('/api/auth/signup', data),

  // Parents
  getParents: () => axiosInstance.get('/api/parents'),
  getParent: (id: number) => axiosInstance.get(`/api/parents/${id}`),
  getParentProfile: () => axiosInstance.get('/api/parents/profile/me'),
  updateParentProfile: (data: any) => axiosInstance.put('/api/parents/profile/me', data),
  linkChild: (linkCode: string) => axiosInstance.post('/api/parents/link-child', { link_code: linkCode }),
  linkSchoolByCode: (code: string) => axiosInstance.post('/api/parents/link-school', { school_code: code }),
  getLinkedSchools: () => axiosInstance.get('/api/parents/linked-schools'),
  switchSchool: (schoolId: number) => axiosInstance.post('/api/parents/switch-school', { school_id: schoolId }),

  // Behaviour
  getIncidents: (params?: any) => axiosInstance.get('/api/behaviour', { params }),
  getIncident: (id: number) => axiosInstance.get(`/api/behaviour/${id}`),
  createIncident: (data: any) => axiosInstance.post('/api/behaviour', data),
  updateIncident: (id: number, data: any) => axiosInstance.put(`/api/behaviour/${id}`, data),
  deleteIncident: (id: number) => axiosInstance.delete(`/api/behaviour/${id}`),
  approveIncident: (id: number) => axiosInstance.put(`/api/behaviour/${id}/approve`),
  declineIncident: (id: number, reason?: string) => axiosInstance.put(`/api/behaviour/${id}/decline`, { reason }),
  getBehaviourTimeline: (studentId: number) => axiosInstance.get(`/api/behaviour/timeline/${studentId}`),
  getBehaviourAnalytics: (params?: any) => axiosInstance.get('/api/behaviour/analytics', { params }),

  // Attendance
  getAttendance: (params?: any) => axiosInstance.get('/api/attendance', { params }),
  getAttendanceRecord: (id: number) => axiosInstance.get(`/api/attendance/${id}`),
  createAttendance: (data: any) => axiosInstance.post('/api/attendance', data),
  createBulkAttendance: (data: any) => axiosInstance.post('/api/attendance/bulk', data),
  updateAttendance: (id: number, data: any) => axiosInstance.put(`/api/attendance/${id}`, data),
  deleteAttendance: (id: number) => axiosInstance.delete(`/api/attendance/${id}`),

  // Messages
  getMessages: (type: 'sent' | 'received' = 'received') => axiosInstance.get('/api/messages', { params: { type } }),
  getMessage: (id: number) => axiosInstance.get(`/api/messages/${id}`),
  createMessage: (data: any, attachment?: File) => {
    if (attachment) {
      const formData = new FormData();
      formData.append('receiver_id', String(data.receiver_id));
      if (data.subject) formData.append('subject', data.subject);
      if (data.message) formData.append('message', data.message);
      formData.append('attachment', attachment);
      return axiosInstance.post('/api/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return axiosInstance.post('/api/messages', data);
  },
  markMessageRead: (id: number) => axiosInstance.put(`/api/messages/${id}/read`),
  deleteMessage: (id: number) => axiosInstance.delete(`/api/messages/${id}`),

  // Analytics
  getDashboardStats: () => axiosInstance.get('/api/analytics/dashboard'),
  getCriticalAlerts: () => axiosInstance.get('/api/analytics/critical-alerts'),
  getAtRiskStudents: () => axiosInstance.get('/api/analytics/at-risk-students'),
  getTeacherActivity: (teacherId: number) => axiosInstance.get(`/api/analytics/teacher-activity/${teacherId}`),
  getClassProfile: (classId: number) => axiosInstance.get(`/api/analytics/class-profile/${classId}`),

  // Timetables
  getTimetables: (params?: any) => axiosInstance.get('/api/timetables', { params }),
  createTimetable: (data: any) => axiosInstance.post('/api/timetables', data),
  createBulkTimetables: (data: any) => axiosInstance.post('/api/timetables/bulk', data),
  updateTimetable: (id: number, data: any) => axiosInstance.put(`/api/timetables/${id}`, data),
  deleteTimetable: (id: number) => axiosInstance.delete(`/api/timetables/${id}`),

  // Detentions
  getDetentionRules: () => axiosInstance.get('/api/detentions/rules'),
  saveDetentionRule: (data: any) => axiosInstance.post('/api/detentions/rules', data),
  getDetentions: (params?: any) => axiosInstance.get('/api/detentions', { params }),
  getDetention: (id: number) => axiosInstance.get(`/api/detentions/${id}`),
  createDetention: (data: any) => axiosInstance.post('/api/detentions', data),
  createRecurringDetentions: (data: any) => axiosInstance.post('/api/detentions/recurring', data),
  updateDetention: (id: number, data: any) => axiosInstance.put(`/api/detentions/${id}`, data),
  assignToDetention: (id: number, data: any) => axiosInstance.post(`/api/detentions/${id}/assign`, data),
  autoAssignDetention: (data: any) => axiosInstance.post('/api/detentions/auto-assign', data),
  evaluateDetentionRules: (studentId: number) => axiosInstance.post('/api/detentions/evaluate-rules', { student_id: studentId }),
  getStudentDetentionHistory: (studentId: number) => axiosInstance.get(`/api/detentions/student/${studentId}/history`),
  updateDetentionAttendance: (assignmentId: number, data: { status: string; attendance_time?: string; notes?: string }) => 
    axiosInstance.put(`/api/detentions/assignments/${assignmentId}`, data),
  updateDetentionSessionStatus: (sessionId: number, status: string) => 
    axiosInstance.put(`/api/detentions/sessions/${sessionId}/status`, { status }),
  markDetentionAttendance: (assignmentId: number, attendance_status: string, notes?: string) => 
    axiosInstance.put(`/api/detentions/assignments/${assignmentId}/attendance`, { attendance_status, notes }),
  deleteDetention: (id: number) => axiosInstance.delete(`/api/detentions/${id}`),
  getDetentionQueue: () => axiosInstance.get('/api/detentions/queue'),
  processDetentionQueue: (detentionId: number) => axiosInstance.post(`/api/detentions/${detentionId}/process-queue`),
  getQualifyingStudents: () => axiosInstance.get('/api/detentions/qualifying-students'),

  // Merits
  getMerits: (params?: any) => axiosInstance.get('/api/merits', { params }),
  createMerit: (data: any) => axiosInstance.post('/api/merits', data),
  updateMerit: (id: number, data: any) => axiosInstance.put(`/api/merits/${id}`, data),
  deleteMerit: (id: number) => axiosInstance.delete(`/api/merits/${id}`),

  // Exports
  exportStudentRecord: (id: number, format: 'pdf' | 'excel') => 
    axiosInstance.get(`/api/exports/students/${id}?format=${format}`, { responseType: 'blob' }),
  exportClassRecords: (id: number, format: 'pdf' | 'excel') => 
    axiosInstance.get(`/api/exports/class/${id}?format=${format}`, { responseType: 'blob' }),

  // Bulk Import
  bulkImportStudents: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/bulk-import/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkImportTeachers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/bulk-import/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkImportClasses: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/bulk-import/classes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadStudentsTemplate: () =>
    axiosInstance.get('/api/bulk-import/template/students', { responseType: 'blob' }),
  downloadTeachersTemplate: () =>
    axiosInstance.get('/api/bulk-import/template/teachers', { responseType: 'blob' }),
  downloadClassesTemplate: () =>
    axiosInstance.get('/api/bulk-import/template/classes', { responseType: 'blob' }),

  // Bulk Import V2 - Enhanced with validation, upsert, and auto-create
  validateStudentsImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/bulk-import-v2/students/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importStudentsV2: (file: File, options: { mode?: string; autoCreateClasses?: boolean; useSheetNames?: boolean; academicYear?: string } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', options.mode || 'upsert');
    formData.append('autoCreateClasses', String(options.autoCreateClasses !== false));
    formData.append('useSheetNames', String(options.useSheetNames !== false));
    if (options.academicYear) formData.append('academicYear', options.academicYear);
    return axiosInstance.post('/api/bulk-import-v2/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  validateTeachersImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/bulk-import-v2/teachers/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importTeachersV2: (file: File, options: { mode?: string } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', options.mode || 'upsert');
    return axiosInstance.post('/api/bulk-import-v2/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  validateClassesImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/bulk-import-v2/classes/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importClassesV2: (file: File, options: { mode?: string; academicYear?: string } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', options.mode || 'upsert');
    if (options.academicYear) formData.append('academicYear', options.academicYear);
    return axiosInstance.post('/api/bulk-import-v2/classes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadStudentsTemplateV2: () =>
    axiosInstance.get('/api/bulk-import-v2/template/students', { responseType: 'blob' }),
  downloadTeachersTemplateV2: () =>
    axiosInstance.get('/api/bulk-import-v2/template/teachers', { responseType: 'blob' }),
  downloadClassesTemplateV2: () =>
    axiosInstance.get('/api/bulk-import-v2/template/classes', { responseType: 'blob' }),
  exportImportErrors: (errors: any[], type: string) =>
    axiosInstance.post('/api/bulk-import-v2/export-errors', { errors, type }, { responseType: 'blob' }),
  
  // Import History
  getImportHistory: (limit = 20, offset = 0) =>
    axiosInstance.get(`/api/bulk-import-v2/history?limit=${limit}&offset=${offset}`),
  getImportHistoryDetail: (id: number) =>
    axiosInstance.get(`/api/bulk-import-v2/history/${id}`),

  // Photo uploads
  uploadStudentPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return axiosInstance.post(`/api/students/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadTeacherPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return axiosInstance.post(`/api/teachers/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Notifications
  getNotifications: (params?: any) => axiosInstance.get('/api/notifications', { params }),
  getUnreadCount: () => axiosInstance.get('/api/notifications/unread-count'),
  markNotificationRead: (id: number) => axiosInstance.put(`/api/notifications/${id}/read`),
  markAllNotificationsRead: () => axiosInstance.put('/api/notifications/read-all'),
  deleteNotification: (id: number) => axiosInstance.delete(`/api/notifications/${id}`),

  // Push Notifications
  getPushPublicKey: () => axiosInstance.get('/api/push/public-key'),
  subscribePush: (subscription: any) => axiosInstance.post('/api/push/subscribe', { subscription }),
  unsubscribePush: (endpoint: string) => axiosInstance.post('/api/push/unsubscribe', { endpoint }),

  // Auth
  updateProfile: (data: { name: string; email: string }) =>
    axiosInstance.put('/api/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosInstance.put('/api/auth/change-password', data),

  // User Management (Admin)
  getUsers: () => axiosInstance.get('/api/users'),
  getUser: (id: number) => axiosInstance.get(`/api/users/${id}`),
  createUser: (data: { name: string; email: string; password: string; role: string }) => 
    axiosInstance.post('/api/users', data),
  updateUserRole: (id: number, role: string) => axiosInstance.put(`/api/users/${id}/role`, { role }),
  deleteUser: (id: number) => axiosInstance.delete(`/api/users/${id}`),

  // Incident Types
  getIncidentTypes: (params?: any) => axiosInstance.get('/api/incident-types', { params }),
  getIncidentType: (id: number) => axiosInstance.get(`/api/incident-types/${id}`),
  createIncidentType: (data: any) => axiosInstance.post('/api/incident-types', data),
  updateIncidentType: (id: number, data: any) => axiosInstance.put(`/api/incident-types/${id}`, data),
  deleteIncidentType: (id: number) => axiosInstance.delete(`/api/incident-types/${id}`),

  // Merit Types
  getMeritTypes: (params?: any) => axiosInstance.get('/api/merit-types', { params }),
  getMeritType: (id: number) => axiosInstance.get(`/api/merit-types/${id}`),
  createMeritType: (data: any) => axiosInstance.post('/api/merit-types', data),
  updateMeritType: (id: number, data: any) => axiosInstance.put(`/api/merit-types/${id}`, data),
  deleteMeritType: (id: number) => axiosInstance.delete(`/api/merit-types/${id}`),

  // Interventions
  getInterventions: (params?: any) => axiosInstance.get('/api/interventions', { params }),
  getIntervention: (id: number) => axiosInstance.get(`/api/interventions/${id}`),
  createIntervention: (data: any) => axiosInstance.post('/api/interventions', data),
  updateIntervention: (id: number, data: any) => axiosInstance.put(`/api/interventions/${id}`, data),
  deleteIntervention: (id: number) => axiosInstance.delete(`/api/interventions/${id}`),
  getInterventionTypes: () => axiosInstance.get('/api/interventions/types/list'),
  createInterventionType: (data: any) => axiosInstance.post('/api/interventions/types', data),
  updateInterventionType: (id: number, data: any) => axiosInstance.put(`/api/interventions/types/${id}`, data),
  deleteInterventionType: (id: number) => axiosInstance.delete(`/api/interventions/types/${id}`),
  getInterventionSessions: (id: number) => axiosInstance.get(`/api/interventions/${id}/sessions`),
  createInterventionSession: (id: number, data: any) => axiosInstance.post(`/api/interventions/${id}/sessions`, data),
  updateInterventionProgress: (id: number, data: any) => axiosInstance.put(`/api/interventions/${id}/progress`, data),
  recordInterventionOutcome: (id: number, data: any) => axiosInstance.put(`/api/interventions/${id}/outcome`, data),
  getInterventionStats: () => axiosInstance.get('/api/interventions/stats/overview'),

  // Guided Interventions
  getBehaviourCategories: () => axiosInstance.get('/api/guided-interventions/categories'),
  getInterventionStrategies: (category?: string) => axiosInstance.get('/api/guided-interventions/strategies', { params: { category } }),
  getSuggestedStrategies: (studentId: number, category: string) => axiosInstance.get('/api/guided-interventions/suggested-strategies', { params: { student_id: studentId, category } }),
  getStudentInterventionHistory: (studentId: number) => axiosInstance.get(`/api/guided-interventions/student-history/${studentId}`),
  createGuidedIntervention: (data: any) => axiosInstance.post('/api/guided-interventions', data),
  updateInterventionOutcome: (id: number, data: any) => axiosInstance.put(`/api/guided-interventions/${id}/outcome`, data),
  getInterventionStatistics: (params?: any) => axiosInstance.get('/api/guided-interventions/statistics', { params }),

  // Consequences
  getConsequenceDefinitions: () => axiosInstance.get('/api/consequences/definitions'),
  createConsequenceDefinition: (data: any) => axiosInstance.post('/api/consequences/definitions', data),
  updateConsequenceDefinition: (id: number, data: any) => axiosInstance.put(`/api/consequences/definitions/${id}`, data),
  deleteConsequenceDefinition: (id: number) => axiosInstance.delete(`/api/consequences/definitions/${id}`),
  getConsequences: (params?: any) => axiosInstance.get('/api/consequences', { params }),
  getConsequence: (id: number) => axiosInstance.get(`/api/consequences/${id}`),
  getStudentConsequences: (studentId: number) => axiosInstance.get(`/api/consequences/student/${studentId}`),
  assignConsequence: (data: any) => axiosInstance.post('/api/consequences/assign', data),
  updateConsequence: (id: number, data: any) => axiosInstance.put(`/api/consequences/${id}`, data),
  approveSuspension: (id: number, data: { approval_status: 'approved' | 'denied', approval_notes?: string }) => axiosInstance.put(`/api/consequences/${id}/approval`, data),
  completeConsequence: (id: number) => axiosInstance.put(`/api/consequences/${id}/complete`),
  acknowledgeConsequence: (id: number, data?: { parent_notes?: string }) => axiosInstance.put(`/api/consequences/${id}/acknowledge`, data || {}),
  deleteConsequence: (id: number) => axiosInstance.delete(`/api/consequences/${id}`),

  // Consequence Assignments (Role-based)
  getConsequenceAssignments: (params?: any) => axiosInstance.get('/api/consequence-assignments', { params }),
  getAvailableConsequences: () => axiosInstance.get('/api/consequence-assignments/available-consequences'),
  assignConsequenceToStudent: (data: any) => axiosInstance.post('/api/consequence-assignments/assign', data),
  updateConsequenceAssignment: (id: number, data: any) => axiosInstance.put(`/api/consequence-assignments/${id}`, data),
  deleteConsequenceAssignment: (id: number) => axiosInstance.delete(`/api/consequence-assignments/${id}`),
  evaluateStudentConsequences: (studentId: number) => axiosInstance.post('/api/consequence-assignments/evaluate-student', { student_id: studentId }),
  getConsequenceStatistics: () => axiosInstance.get('/api/consequence-assignments/statistics'),

  // Platform (Super Admin)
  platformLogin: (email: string, password: string) => axiosInstance.post('/api/platform/login', { email, password }),
  getPlatformSettings: () => axiosInstance.get('/api/platform/settings'),
  updatePlatformSettings: (data: any) => axiosInstance.put('/api/platform/settings', data),
  getPlatformPlans: () => axiosInstance.get('/api/platform/plans'),
  createPlatformPlan: (data: any) => axiosInstance.post('/api/platform/plans', data),
  updatePlatformPlan: (id: number, data: any) => axiosInstance.put(`/api/platform/plans/${id}`, data),
  getPlatformSchools: (params?: any) => axiosInstance.get('/api/platform/schools', { params }),
  getPlatformSchool: (id: number) => axiosInstance.get(`/api/platform/schools/${id}`),
  getPlatformSchoolStats: (id: number) => axiosInstance.get(`/api/platform/schools/${id}/stats`),
  getPlatformSchoolAnalytics: (id: number, range?: string) => axiosInstance.get(`/api/platform/schools/${id}/analytics`, { params: { range } }),
  createPlatformSchool: (data: any) => axiosInstance.post('/api/platform/schools', data),
  onboardSchool: (data: any) => axiosInstance.post('/api/platform/schools/onboard', data),
  updatePlatformSchool: (id: number, data: any) => axiosInstance.put(`/api/platform/schools/${id}`, data),
  deletePlatformSchool: (id: number) => axiosInstance.delete(`/api/platform/schools/${id}`),
  bulkUpdateSchoolStatus: (schoolIds: number[], status: string) => axiosInstance.put('/api/platform/schools/bulk/status', { school_ids: schoolIds, status }),
  updateSchoolSubscription: (id: number, data: any) => axiosInstance.put(`/api/platform/schools/${id}/subscription`, data),
  // School Branding Management
  getSchoolBranding: (id: number) => axiosInstance.get(`/api/platform/schools/${id}/branding`),
  updateSchoolBranding: (id: number, data: any) => axiosInstance.put(`/api/platform/schools/${id}/branding`, data),
  getSchoolBrandingHistory: (id: number) => axiosInstance.get(`/api/platform/schools/${id}/branding/history`),
  revertSchoolBranding: (id: number) => axiosInstance.post(`/api/platform/schools/${id}/branding/revert`),
  // Platform Analytics & Logs
  getPlatformAnalytics: (params?: any) => axiosInstance.get('/api/platform/analytics', { params }),
  getPlatformBilling: (params?: any) => axiosInstance.get('/api/platform/billing', { params }),
  getPlatformLogs: (params?: any) => axiosInstance.get('/api/platform/logs', { params }),
  // Platform User Management
  getPlatformUsers: () => axiosInstance.get('/api/platform/users'),
  getPlatformUserProfile: () => axiosInstance.get('/api/platform/users/profile'),
  updatePlatformUserProfile: (data: any) => axiosInstance.put('/api/platform/users/profile', data),
  changePlatformUserPassword: (currentPassword: string, newPassword: string) => axiosInstance.put('/api/platform/users/password', { currentPassword, newPassword }),
  createPlatformUser: (data: any) => axiosInstance.post('/api/platform/users', data),
  updatePlatformUser: (id: number, data: any) => axiosInstance.put(`/api/platform/users/${id}`, data),
  deletePlatformUser: (id: number) => axiosInstance.delete(`/api/platform/users/${id}`),

  // School Information
  getCurrentSchoolInfo: () => axiosInstance.get('/api/school-info'),

  // School Customizations
  getSchoolCustomizations: (schoolId: number) => axiosInstance.get(`/api/school-customizations/${schoolId}`),
  updateSchoolCustomizations: (schoolId: number, data: any) => axiosInstance.put(`/api/school-customizations/${schoolId}`, data),
  uploadSchoolLogo: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return axiosInstance.post(`/api/school-customizations/${schoolId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadSchoolFavicon: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('favicon', file);
    return axiosInstance.post(`/api/school-customizations/${schoolId}/favicon`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadLoginBackground: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('background', file);
    return axiosInstance.post(`/api/school-customizations/${schoolId}/login-background`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDashboardBackground: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('background', file);
    return axiosInstance.post(`/api/school-customizations/${schoolId}/dashboard-background`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteSchoolLogo: (schoolId: number) => axiosInstance.delete(`/api/school-customizations/${schoolId}/logo`),
  deleteSchoolFavicon: (schoolId: number) => axiosInstance.delete(`/api/school-customizations/${schoolId}/favicon`),
  deleteLoginBackground: (schoolId: number) => axiosInstance.delete(`/api/school-customizations/${schoolId}/login-background`),
  deleteDashboardBackground: (schoolId: number) => axiosInstance.delete(`/api/school-customizations/${schoolId}/dashboard-background`),

  // Period Timetables
  getTimetableTemplates: () => axiosInstance.get('/api/period-timetables/templates'),
  getTimetableTemplate: (id: number) => axiosInstance.get(`/api/period-timetables/templates/${id}`),
  createTimetableTemplate: (data: any) => axiosInstance.post('/api/period-timetables/templates', data),
  updateTimetableTemplate: (id: number, data: any) => axiosInstance.put(`/api/period-timetables/templates/${id}`, data),
  deleteTimetableTemplate: (id: number) => axiosInstance.delete(`/api/period-timetables/templates/${id}`),
  getTimeSlots: (templateId: number) => axiosInstance.get(`/api/period-timetables/templates/${templateId}/slots`),
  createTimeSlot: (templateId: number, data: any) => axiosInstance.post(`/api/period-timetables/templates/${templateId}/slots`, data),
  bulkCreateTimeSlots: (templateId: number, data: any) => axiosInstance.post(`/api/period-timetables/templates/${templateId}/slots/bulk`, data),
  updateTimeSlot: (id: number, data: any) => axiosInstance.put(`/api/period-timetables/slots/${id}`, data),
  deleteTimeSlot: (id: number) => axiosInstance.delete(`/api/period-timetables/slots/${id}`),
  getSubjects: () => axiosInstance.get('/api/subjects'),
  getSubject: (id: number) => axiosInstance.get(`/api/subjects/${id}`),
  createSubject: (data: any) => axiosInstance.post('/api/subjects', data),
  updateSubject: (id: number, data: any) => axiosInstance.put(`/api/subjects/${id}`, data),
  deleteSubject: (id: number) => axiosInstance.delete(`/api/subjects/${id}`),
  getClassrooms: () => axiosInstance.get('/api/period-timetables/classrooms'),
  createClassroom: (data: any) => axiosInstance.post('/api/period-timetables/classrooms', data),
  getClassTimetable: (classId: number) => axiosInstance.get(`/api/period-timetables/class/${classId}`),
  getTeacherTimetable: (teacherId: number) => axiosInstance.get(`/api/period-timetables/teacher/${teacherId}`),
  assignClassPeriod: (classId: number, data: any) => axiosInstance.post(`/api/period-timetables/class/${classId}/assign`, data),
  updateClassTimetable: (id: number, data: any) => axiosInstance.put(`/api/period-timetables/class-timetable/${id}`, data),
  deleteClassTimetable: (id: number) => axiosInstance.delete(`/api/period-timetables/class-timetable/${id}`),

  // Period Register
  getTeacherPeriodsToday: (teacherId?: number) => axiosInstance.get('/api/period-register/teacher/today', { params: { teacher_id: teacherId } }),
  getTeacherPeriodsWeek: (teacherId?: number, startDate?: string) => axiosInstance.get('/api/period-register/teacher/week', { params: { teacher_id: teacherId, start_date: startDate } }),
  startPeriodSession: (data: any) => axiosInstance.post('/api/period-register/session/start', data),
  markAttendance: (data: any) => axiosInstance.post('/api/period-register/attendance/mark', data),
  bulkMarkAttendance: (data: any) => axiosInstance.post('/api/period-register/attendance/bulk-mark', data),
  completePeriodSession: (sessionId: number) => axiosInstance.post(`/api/period-register/session/${sessionId}/complete`),
  dismissStudent: (data: any) => axiosInstance.post('/api/period-register/dismiss', data),
  returnStudent: (data: any) => axiosInstance.post('/api/period-register/return', data),
  recordLateArrival: (data: any) => axiosInstance.post('/api/period-register/late-arrival', data),
  
  // Attendance Management (Enhanced)
  getTodayDismissals: () => axiosInstance.get('/api/period-register/dismissals/today'),
  getAttendanceFlags: (params?: any) => axiosInstance.get('/api/period-register/flags', { params }),
  resolveAttendanceFlag: (flagId: number, data: any) => axiosInstance.put(`/api/period-register/flags/${flagId}/resolve`, data),
  getAttendanceReport: (params: any) => axiosInstance.get('/api/period-register/reports/attendance', { params }),

  // Feature Flags
  getAllFeatureFlags: () => axiosInstance.get('/api/feature-flags/all'),
  getSchoolFeatureFlags: (schoolId: number) => axiosInstance.get(`/api/feature-flags/school/${schoolId}`),
  getCurrentFeatureFlags: () => axiosInstance.get('/api/feature-flags/current'),
  checkFeatureFlag: (featureName: string) => axiosInstance.get(`/api/feature-flags/check/${featureName}`),
  toggleFeatureFlag: (schoolId: number, featureName: string, enabled: boolean) => 
    axiosInstance.put(`/api/feature-flags/toggle/${schoolId}/${featureName}`, { enabled }),
  bulkToggleFeatureFlag: (featureName: string, schoolIds: number[], enabled: boolean) => 
    axiosInstance.put(`/api/feature-flags/bulk-toggle/${featureName}`, { schoolIds, enabled }),

  // Goldie Badge Configuration
  getGoldieBadgeConfig: () => axiosInstance.get('/api/goldie-badge/config'),
  updateGoldieBadgeConfig: (pointsThreshold: number) => 
    axiosInstance.put('/api/goldie-badge/config', { points_threshold: pointsThreshold }),
  checkBadgeEligibility: (studentId: number) => 
    axiosInstance.get(`/api/goldie-badge/check-eligibility/${studentId}`),
};

// Export the axios instance for direct use when needed
export { axiosInstance };
