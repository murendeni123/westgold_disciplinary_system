const en = {
  // Common
  save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
  loading: 'Loading...',
  search: 'Search',
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  confirm: 'Confirm',
  yes: 'Yes',
  no: 'No',
  back: 'Back',
  next: 'Next',
  submit: 'Submit',
  update: 'Update',
  remove: 'Remove',
  view: 'View',
  download: 'Download',
  export: 'Export',
  import: 'Import',
  actions: 'Actions',
  status: 'Status',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  role: 'Role',
  date: 'Date',
  time: 'Time',
  notes: 'Notes',
  description: 'Description',
  type: 'Type',
  grade: 'Grade',
  class: 'Class',
  school: 'School',
  active: 'Active',
  inactive: 'Inactive',
  all: 'All',
  none: 'None',
  required: 'Required',
  optional: 'Optional',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Info',

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    students: 'Students',
    teachers: 'Teachers',
    parents: 'Parents',
    classes: 'Classes',
    behaviour: 'Behaviour',
    merits: 'Merits',
    detentions: 'Detentions',
    interventions: 'Interventions',
    reports: 'Reports & Analytics',
    settings: 'Settings',
    notifications: 'Notifications',
    messages: 'Messages',
    attendance: 'Attendance',
    timetable: 'Timetable',
    logout: 'Logout',
    profile: 'Profile',
    myClass: 'My Class',
    mySchedule: 'My Schedule',
    myChildren: 'My Children',
  },

  // Settings page
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account settings and preferences',
    profile: 'Profile',
    password: 'Password',
    schoolInfo: 'School Info',
    preferences: 'Preferences',
    language: 'Language',
    profileInfo: 'Profile Information',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    updateProfile: 'Update Profile',
    updating: 'Updating...',
    employeeId: 'Employee ID',
    assignedSchool: 'Assigned School',
    gradeResponsibility: 'Grade Responsibility',
    schoolCode: 'School Code',
    shareCode: 'Share this code with parents to link their accounts',
    copied: 'Copied!',
    copy: 'Copy',
    schoolName: 'School Name',
    schoolEmail: 'School Email',
    schoolPhone: 'School Phone',
    schoolAddress: 'School Address',
  },

  // Language settings
  language: {
    title: 'Language Settings',
    subtitle: 'Choose the display language for your portal',
    myLanguage: 'My Portal Language',
    myLanguageDesc: 'Only changes the language for your own portal. This overrides the school default.',
    globalLanguage: 'Default Language for All Portals',
    globalLanguageDesc: 'Sets the default language for all users who have not chosen their own. Existing personal preferences are not affected.',
    currentLanguage: 'Currently active language',
    saveMyLanguage: 'Save My Language',
    saveGlobalLanguage: 'Save Default Language',
    saving: 'Saving...',
    savedSuccess: 'Language preference saved!',
    globalSavedSuccess: 'Global language updated for all portals!',
    resetToGlobal: 'Reset to school default',
    usingGlobal: 'Using school default',
    usingPersonal: 'Using your personal preference',
    adminNote: 'As admin, you can set both your personal language and the school-wide default.',
    hierarchyNote: 'Language priority: Your preference → School default → English',
  },

  // Language names
  languages: {
    en: 'English',
    af: 'Afrikaans',
    zu: 'isiZulu',
    xh: 'isiXhosa',
  },

  // Auth
  auth: {
    login: 'Log In',
    logout: 'Log Out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signUp: 'Sign Up',
    welcome: 'Welcome back',
  },

  // Dashboard
  dashboard: {
    welcome: 'Welcome',
    overview: 'Overview',
    recentActivity: 'Recent Activity',
    totalStudents: 'Total Students',
    totalTeachers: 'Total Teachers',
    activeClasses: 'Active Classes',
  },

  // Students
  students: {
    title: 'Students',
    addStudent: 'Add Student',
    studentProfile: 'Student Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    studentId: 'Student ID',
    dateOfBirth: 'Date of Birth',
    noStudents: 'No students found',
  },

  // Behaviour
  behaviour: {
    title: 'Behaviour',
    logIncident: 'Log Incident',
    incidentType: 'Incident Type',
    severity: 'Severity',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    noIncidents: 'No incidents found',
  },

  // Detentions
  detentions: {
    title: 'Detentions',
    addDetention: 'Add Detention',
    detentionDate: 'Detention Date',
    venue: 'Venue',
    attended: 'Attended',
    absent: 'Absent',
    noDetentions: 'No detentions found',
  },

  // Merits
  merits: {
    title: 'Merits',
    awardMerit: 'Award Merit',
    meritPoints: 'Merit Points',
    noMerits: 'No merits found',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark All Read',
    noNotifications: 'No notifications',
    emailNotifications: 'Email Notifications',
    notifyOnBehaviour: 'Notify on Behaviour Incidents',
    notifyOnMerits: 'Notify on Merits',
    notifyOnDetention: 'Notify on Detentions',
    notifyOnAbsence: 'Notify on Absence',
  },

  // Password
  password: {
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordChanged: 'Password changed successfully!',
    passwordMismatch: 'Passwords do not match',
  },

  // Errors
  errors: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    networkError: 'Network error. Please try again.',
    unauthorized: 'You are not authorized to perform this action',
    notFound: 'The requested resource was not found',
  },
};

export type TranslationKeys = typeof en;
export default en;
