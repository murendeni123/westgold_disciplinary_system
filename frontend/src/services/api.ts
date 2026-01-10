import axios from 'axios';

// Use network IP when accessed from mobile, otherwise use proxy
const getApiBaseUrl = () => {
  // Check if we're accessing from network (not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Accessing from network, use the computer's IP
      return 'http://192.168.18.160:5000/api';
    }
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor - add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    // Check for platform token first (for Super Admin), then regular token
    const platformToken = localStorage.getItem('platform_token');
    const token = localStorage.getItem('token');
    
    if (platformToken) {
      config.headers.Authorization = `Bearer ${platformToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

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
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.error || error.message,
      data: error.response?.data,
    });
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  // Students
  getStudents: () => axiosInstance.get('/students'),
  getStudent: (id: number) => axiosInstance.get(`/students/${id}`),
  createStudent: (data: any) => axiosInstance.post('/students', data),
  updateStudent: (id: number, data: any) => axiosInstance.put(`/students/${id}`, data),
  deleteStudent: (id: number) => axiosInstance.delete(`/students/${id}`),
  generateLinkCode: (id: number) => axiosInstance.post(`/students/${id}/generate-link`),
  assignStudentToClass: (id: number, data: { class_id: number | null; grade_level: string }) => 
    axiosInstance.put(`/students/${id}`, data),

  // Classes
  getClasses: () => axiosInstance.get('/classes'),
  getClass: (id: number) => axiosInstance.get(`/classes/${id}`),
  createClass: (data: any) => axiosInstance.post('/classes', data),
  updateClass: (id: number, data: any) => axiosInstance.put(`/classes/${id}`, data),
  deleteClass: (id: number) => axiosInstance.delete(`/classes/${id}`),

  // Teachers
  getTeachers: () => axiosInstance.get('/teachers'),
  getTeacher: (id: number) => axiosInstance.get(`/teachers/${id}`),
  createTeacher: (data: any) => axiosInstance.post('/teachers', data),
  updateTeacher: (id: number, data: any) => axiosInstance.put(`/teachers/${id}`, data),
  deleteTeacher: (id: number) => axiosInstance.delete(`/teachers/${id}`),

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
  }) => axiosInstance.post('/auth/signup', data),

  // Parents
  getParents: () => axiosInstance.get('/parents'),
  getParent: (id: number) => axiosInstance.get(`/parents/${id}`),
  getParentProfile: () => axiosInstance.get('/parents/profile/me'),
  updateParentProfile: (data: any) => axiosInstance.put('/parents/profile/me', data),
  linkChild: (linkCode: string) => axiosInstance.post('/parents/link-child', { link_code: linkCode }),
  linkSchoolByCode: (code: string) => axiosInstance.post('/parents/link-school', { school_code: code }),
  getLinkedSchools: () => axiosInstance.get('/parents/linked-schools'),
  switchSchool: (schoolId: number) => axiosInstance.post('/parents/switch-school', { school_id: schoolId }),

  // Behaviour
  getIncidents: (params?: any) => axiosInstance.get('/behaviour', { params }),
  getIncident: (id: number) => axiosInstance.get(`/behaviour/${id}`),
  createIncident: (data: any) => axiosInstance.post('/behaviour', data),
  updateIncident: (id: number, data: any) => axiosInstance.put(`/behaviour/${id}`, data),
  deleteIncident: (id: number) => axiosInstance.delete(`/behaviour/${id}`),
  getBehaviourTimeline: (studentId: number) => axiosInstance.get(`/behaviour/timeline/${studentId}`),

  // Attendance
  getAttendance: (params?: any) => axiosInstance.get('/attendance', { params }),
  getAttendanceRecord: (id: number) => axiosInstance.get(`/attendance/${id}`),
  createAttendance: (data: any) => axiosInstance.post('/attendance', data),
  createBulkAttendance: (data: any) => axiosInstance.post('/attendance/bulk', data),
  updateAttendance: (id: number, data: any) => axiosInstance.put(`/attendance/${id}`, data),
  deleteAttendance: (id: number) => axiosInstance.delete(`/attendance/${id}`),

  // Messages
  getMessages: (type: 'sent' | 'received' = 'received') => axiosInstance.get('/messages', { params: { type } }),
  getMessage: (id: number) => axiosInstance.get(`/messages/${id}`),
  createMessage: (data: any, attachment?: File) => {
    if (attachment) {
      const formData = new FormData();
      formData.append('receiver_id', String(data.receiver_id));
      if (data.subject) formData.append('subject', data.subject);
      if (data.message) formData.append('message', data.message);
      formData.append('attachment', attachment);
      return axiosInstance.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return axiosInstance.post('/messages', data);
  },
  markMessageRead: (id: number) => axiosInstance.put(`/messages/${id}/read`),
  deleteMessage: (id: number) => axiosInstance.delete(`/messages/${id}`),

  // Analytics
  getDashboardStats: () => axiosInstance.get('/analytics/dashboard'),

  // Timetables
  getTimetables: (params?: any) => axiosInstance.get('/timetables', { params }),
  createTimetable: (data: any) => axiosInstance.post('/timetables', data),
  createBulkTimetables: (data: any) => axiosInstance.post('/timetables/bulk', data),
  updateTimetable: (id: number, data: any) => axiosInstance.put(`/timetables/${id}`, data),
  deleteTimetable: (id: number) => axiosInstance.delete(`/timetables/${id}`),

  // Detentions
  getDetentionRules: () => axiosInstance.get('/detentions/rules'),
  saveDetentionRule: (data: any) => axiosInstance.post('/detentions/rules', data),
  getDetentions: (params?: any) => axiosInstance.get('/detentions', { params }),
  getDetention: (id: number) => axiosInstance.get(`/detentions/${id}`),
  createDetention: (data: any) => axiosInstance.post('/detentions', data),
  updateDetention: (id: number, data: any) => axiosInstance.put(`/detentions/${id}`, data),
  assignToDetention: (id: number, data: any) => axiosInstance.post(`/detentions/${id}/assign`, data),
  autoAssignDetention: (data: any) => axiosInstance.post('/detentions/auto-assign', data),
  updateDetentionAttendance: (assignmentId: number, data: { status: string; attendance_time?: string; notes?: string }) => 
    axiosInstance.put(`/detentions/assignments/${assignmentId}`, data),
  deleteDetention: (id: number) => axiosInstance.delete(`/detentions/${id}`),

  // Merits
  getMerits: (params?: any) => axiosInstance.get('/merits', { params }),
  createMerit: (data: any) => axiosInstance.post('/merits', data),
  updateMerit: (id: number, data: any) => axiosInstance.put(`/merits/${id}`, data),
  deleteMerit: (id: number) => axiosInstance.delete(`/merits/${id}`),

  // Exports
  exportStudentRecord: (id: number, format: 'pdf' | 'excel') => 
    axiosInstance.get(`/exports/students/${id}?format=${format}`, { responseType: 'blob' }),
  exportClassRecords: (id: number, format: 'pdf' | 'excel') => 
    axiosInstance.get(`/exports/class/${id}?format=${format}`, { responseType: 'blob' }),

  // Bulk Import
  bulkImportStudents: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/bulk-import/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkImportTeachers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/bulk-import/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkImportClasses: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/bulk-import/classes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadStudentsTemplate: () =>
    axiosInstance.get('/bulk-import/template/students', { responseType: 'blob' }),
  downloadTeachersTemplate: () =>
    axiosInstance.get('/bulk-import/template/teachers', { responseType: 'blob' }),
  downloadClassesTemplate: () =>
    axiosInstance.get('/bulk-import/template/classes', { responseType: 'blob' }),

  // Photo uploads
  uploadStudentPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return axiosInstance.post(`/students/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadTeacherPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return axiosInstance.post(`/teachers/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Notifications
  getNotifications: (params?: any) => axiosInstance.get('/notifications', { params }),
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count'),
  getNotificationDetails: (id: number) => axiosInstance.get(`/notifications/${id}/details`),
  markNotificationRead: (id: number) => axiosInstance.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => axiosInstance.put('/notifications/read-all'),
  deleteNotification: (id: number) => axiosInstance.delete(`/notifications/${id}`),

  // Push Notifications
  getPushPublicKey: () => axiosInstance.get('/push/public-key'),
  subscribePush: (subscription: any) => axiosInstance.post('/push/subscribe', { subscription }),
  unsubscribePush: (endpoint: string) => axiosInstance.post('/push/unsubscribe', { endpoint }),

  // Auth
  updateProfile: (data: { name: string; email: string }) =>
    axiosInstance.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosInstance.put('/auth/change-password', data),

  // User Management (Admin)
  getUsers: () => axiosInstance.get('/users'),
  getUser: (id: number) => axiosInstance.get(`/users/${id}`),
  updateUserRole: (id: number, role: string) => axiosInstance.put(`/users/${id}/role`, { role }),
  deleteUser: (id: number) => axiosInstance.delete(`/users/${id}`),

  // Incident Types
  getIncidentTypes: (params?: any) => axiosInstance.get('/incident-types', { params }),
  getIncidentType: (id: number) => axiosInstance.get(`/incident-types/${id}`),
  createIncidentType: (data: any) => axiosInstance.post('/incident-types', data),
  updateIncidentType: (id: number, data: any) => axiosInstance.put(`/incident-types/${id}`, data),
  deleteIncidentType: (id: number) => axiosInstance.delete(`/incident-types/${id}`),

  // Merit Types
  getMeritTypes: (params?: any) => axiosInstance.get('/merit-types', { params }),
  getMeritType: (id: number) => axiosInstance.get(`/merit-types/${id}`),
  createMeritType: (data: any) => axiosInstance.post('/merit-types', data),
  updateMeritType: (id: number, data: any) => axiosInstance.put(`/merit-types/${id}`, data),
  deleteMeritType: (id: number) => axiosInstance.delete(`/merit-types/${id}`),

  // Interventions
  getInterventions: (params?: any) => axiosInstance.get('/interventions', { params }),
  getIntervention: (id: number) => axiosInstance.get(`/interventions/${id}`),
  createIntervention: (data: any) => axiosInstance.post('/interventions', data),
  updateIntervention: (id: number, data: any) => axiosInstance.put(`/interventions/${id}`, data),
  deleteIntervention: (id: number) => axiosInstance.delete(`/interventions/${id}`),
  getInterventionTypes: () => axiosInstance.get('/interventions/types/list'),
  createInterventionType: (data: any) => axiosInstance.post('/interventions/types', data),
  updateInterventionType: (id: number, data: any) => axiosInstance.put(`/interventions/types/${id}`, data),
  deleteInterventionType: (id: number) => axiosInstance.delete(`/interventions/types/${id}`),
  getInterventionSessions: (id: number) => axiosInstance.get(`/interventions/${id}/sessions`),
  createInterventionSession: (id: number, data: any) => axiosInstance.post(`/interventions/${id}/sessions`, data),

  // Consequences
  getConsequenceDefinitions: () => axiosInstance.get('/consequences/definitions'),
  createConsequenceDefinition: (data: any) => axiosInstance.post('/consequences/definitions', data),
  updateConsequenceDefinition: (id: number, data: any) => axiosInstance.put(`/consequences/definitions/${id}`, data),
  deleteConsequenceDefinition: (id: number) => axiosInstance.delete(`/consequences/definitions/${id}`),
  getConsequences: (params?: any) => axiosInstance.get('/consequences', { params }),
  getConsequence: (id: number) => axiosInstance.get(`/consequences/${id}`),
  getStudentConsequences: (studentId: number) => axiosInstance.get(`/consequences/student/${studentId}`),
  assignConsequence: (data: any) => axiosInstance.post('/consequences/assign', data),
  updateConsequence: (id: number, data: any) => axiosInstance.put(`/consequences/${id}`, data),
  completeConsequence: (id: number) => axiosInstance.put(`/consequences/${id}/complete`),
  acknowledgeConsequence: (id: number, data?: { parent_notes?: string }) => axiosInstance.put(`/consequences/${id}/acknowledge`, data || {}),
  deleteConsequence: (id: number) => axiosInstance.delete(`/consequences/${id}`),

  // Platform (Super Admin)
  platformLogin: (email: string, password: string) => axiosInstance.post('/platform/login', { email, password }),
  getPlatformSettings: () => axiosInstance.get('/platform/settings'),
  updatePlatformSettings: (data: any) => axiosInstance.put('/platform/settings', data),
  getPlatformPlans: () => axiosInstance.get('/platform/plans'),
  createPlatformPlan: (data: any) => axiosInstance.post('/platform/plans', data),
  updatePlatformPlan: (id: number, data: any) => axiosInstance.put(`/platform/plans/${id}`, data),
  getPlatformSchools: (params?: any) => axiosInstance.get('/platform/schools', { params }),
  getPlatformSchool: (id: number) => axiosInstance.get(`/platform/schools/${id}`),
  createPlatformSchool: (data: any) => axiosInstance.post('/platform/schools', data),
  updatePlatformSchool: (id: number, data: any) => axiosInstance.put(`/platform/schools/${id}`, data),
  deletePlatformSchool: (id: number) => axiosInstance.delete(`/platform/schools/${id}`),
  bulkUpdateSchoolStatus: (schoolIds: number[], status: string) => axiosInstance.put('/platform/schools/bulk/status', { school_ids: schoolIds, status }),
  updateSchoolSubscription: (id: number, data: any) => axiosInstance.put(`/platform/schools/${id}/subscription`, data),
  getPlatformAnalytics: (params?: any) => axiosInstance.get('/platform/analytics', { params }),
  getPlatformBilling: (params?: any) => axiosInstance.get('/platform/billing', { params }),
  getPlatformLogs: (params?: any) => axiosInstance.get('/platform/logs', { params }),
  // Platform User Management
  getPlatformUsers: () => axiosInstance.get('/platform/users'),
  getPlatformUserProfile: () => axiosInstance.get('/platform/users/profile'),
  updatePlatformUserProfile: (data: any) => axiosInstance.put('/platform/users/profile', data),
  changePlatformUserPassword: (currentPassword: string, newPassword: string) => axiosInstance.put('/platform/users/password', { currentPassword, newPassword }),
  createPlatformUser: (data: any) => axiosInstance.post('/platform/users', data),
  updatePlatformUser: (id: number, data: any) => axiosInstance.put(`/platform/users/${id}`, data),
  deletePlatformUser: (id: number) => axiosInstance.delete(`/platform/users/${id}`),

  // School Customizations
  getSchoolCustomizations: (schoolId: number) => axiosInstance.get(`/school-customizations/${schoolId}`),
  updateSchoolCustomizations: (schoolId: number, data: any) => axiosInstance.put(`/school-customizations/${schoolId}`, data),
  uploadSchoolLogo: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return axiosInstance.post(`/school-customizations/${schoolId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadSchoolFavicon: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('favicon', file);
    return axiosInstance.post(`/school-customizations/${schoolId}/favicon`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadLoginBackground: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('background', file);
    return axiosInstance.post(`/school-customizations/${schoolId}/login-background`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDashboardBackground: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('background', file);
    return axiosInstance.post(`/school-customizations/${schoolId}/dashboard-background`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteSchoolLogo: (schoolId: number) => axiosInstance.delete(`/school-customizations/${schoolId}/logo`),
  deleteSchoolFavicon: (schoolId: number) => axiosInstance.delete(`/school-customizations/${schoolId}/favicon`),
  deleteLoginBackground: (schoolId: number) => axiosInstance.delete(`/school-customizations/${schoolId}/login-background`),
  deleteDashboardBackground: (schoolId: number) => axiosInstance.delete(`/school-customizations/${schoolId}/dashboard-background`),

  // Medical Information
  getMedicalInfo: (studentId: number) => axiosInstance.get(`/medical-info/${studentId}`),
  saveMedicalInfo: (studentId: number, data: any) => axiosInstance.post(`/medical-info/${studentId}`, data),
  getEmergencyContacts: (studentId: number) => axiosInstance.get(`/medical-info/${studentId}/emergency-contacts`),
  addEmergencyContact: (studentId: number, data: any) => axiosInstance.post(`/medical-info/${studentId}/emergency-contacts`, data),
  updateEmergencyContact: (contactId: number, data: any) => axiosInstance.put(`/medical-info/emergency-contacts/${contactId}`, data),
  deleteEmergencyContact: (contactId: number) => axiosInstance.delete(`/medical-info/emergency-contacts/${contactId}`),

  // WhatsApp Notifications
  getWhatsAppStatus: () => axiosInstance.get('/whatsapp/status'),
  getWhatsAppLogs: (params?: { student_id?: number; type?: string; status?: string; start_date?: string; end_date?: string; limit?: number; offset?: number }) => 
    axiosInstance.get('/whatsapp/logs', { params }),
  getWhatsAppTemplates: () => axiosInstance.get('/whatsapp/templates'),
  updateWhatsAppTemplate: (id: number, data: { status?: string; template_name?: string }) => 
    axiosInstance.put(`/whatsapp/templates/${id}`, data),
  getWhatsAppOptedInUsers: () => axiosInstance.get('/whatsapp/opted-in-users'),
  sendWhatsAppTest: (phone: string, template_name?: string) => 
    axiosInstance.post('/whatsapp/test', { phone, template_name }),
  sendWhatsAppNotification: (data: { student_id: number; type: string; custom_message?: string }) => 
    axiosInstance.post('/whatsapp/send', data),
  updateWhatsAppOptIn: (userId: number, data: { opt_in: boolean; whatsapp_number?: string; notification_preferences?: object }) => 
    axiosInstance.put(`/whatsapp/opt-in/${userId}`, data),
  getWhatsAppStats: (params?: { start_date?: string; end_date?: string }) => 
    axiosInstance.get('/whatsapp/stats', { params }),
};

