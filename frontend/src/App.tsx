import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PlatformAuthProvider } from './contexts/PlatformAuthContext';
import { SchoolThemeProvider } from './contexts/SchoolThemeContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { ToastProvider } from './contexts/ToastContext';
import { setNavigationCallback } from './services/api';

// Layouts and guards remain static — needed immediately for routing
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import GradeHeadLayout from './layouts/GradeHeadLayout';
import ModernParentLayout from './layouts/ModernParentLayout';
import PlatformLayout from './layouts/PlatformLayout';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGuard from './components/OnboardingGuard';

// Auth pages — small, load eagerly
import Login from './pages/Login';
import ParentSignup from './pages/ParentSignup';
import AuthCallback from './pages/AuthCallback';
import PlatformLogin from './pages/platform/PlatformLogin';

// Admin pages — lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Students = lazy(() => import('./pages/admin/Students'));
const StudentProfile = lazy(() => import('./pages/admin/StudentProfile'));
const Classes = lazy(() => import('./pages/admin/Classes'));
const ClassDetail = lazy(() => import('./pages/admin/ClassDetail'));
const Teachers = lazy(() => import('./pages/admin/Teachers'));
const MeritsDemerits = lazy(() => import('./pages/admin/MeritsDemerits'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminTeacherProfile = lazy(() => import('./pages/admin/TeacherProfile'));
const Parents = lazy(() => import('./pages/admin/Parents'));
const BulkImport = lazy(() => import('./pages/admin/BulkImport'));
const BulkImportV2 = lazy(() => import('./pages/admin/BulkImportV2'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const DisciplineCenter = lazy(() => import('./pages/admin/DisciplineCenter'));
const DisciplineRules = lazy(() => import('./pages/admin/DisciplineRules'));
const DetentionSessions = lazy(() => import('./pages/admin/DetentionSessions'));
const AdminConsequences = lazy(() => import('./pages/admin/Consequences'));
const ConsequenceManagement = lazy(() => import('./pages/admin/ConsequenceManagement'));
const ReportsAnalytics = lazy(() => import('./pages/admin/ReportsAnalytics'));
const BehaviourDashboard = lazy(() => import('./pages/admin/BehaviourDashboard'));
const AdminNotifications = lazy(() => import('./pages/admin/NotificationsEnhanced'));

// Platform pages — lazy loaded
const PlatformDashboard = lazy(() => import('./pages/platform/PlatformDashboard'));
const PlatformSettings = lazy(() => import('./pages/platform/PlatformSettings'));
const PlatformSchools = lazy(() => import('./pages/platform/PlatformSchools'));
const PlatformSchoolDetails = lazy(() => import('./pages/platform/PlatformSchoolDetails'));
const SchoolCustomizations = lazy(() => import('./pages/platform/SchoolCustomizations'));
const ThemeBuilder = lazy(() => import('./pages/platform/ThemeBuilder'));
const PlatformSubscriptions = lazy(() => import('./pages/platform/PlatformSubscriptions'));
const PlatformAnalytics = lazy(() => import('./pages/platform/PlatformAnalytics'));
const PlatformBilling = lazy(() => import('./pages/platform/PlatformBilling'));
const PlatformLogs = lazy(() => import('./pages/platform/PlatformLogs'));
const PlatformUsers = lazy(() => import('./pages/platform/PlatformUsers'));
const SchoolOnboardingWizard = lazy(() => import('./pages/platform/SchoolOnboardingWizard'));
const PlatformNotifications = lazy(() => import('./pages/platform/NotificationsPage'));
const FeatureFlagsManagement = lazy(() => import('./pages/platform/FeatureFlagsManagement'));
const PlatformInvoiceTemplates = lazy(() => import('./pages/platform/PlatformInvoiceTemplates'));
const PlatformInvoices = lazy(() => import('./pages/platform/PlatformInvoices'));

// Teacher pages — lazy loaded
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const MyClasses = lazy(() => import('./pages/teacher/MyClasses'));
const ClassDetails = lazy(() => import('./pages/teacher/ClassDetails'));
const TeacherBehaviour = lazy(() => import('./pages/teacher/Behaviour'));
const LogIncident = lazy(() => import('./pages/teacher/LogIncident'));
const TeacherMerits = lazy(() => import('./pages/teacher/Merits'));
const AwardMerit = lazy(() => import('./pages/teacher/AwardMerit'));
const TeacherDetentions = lazy(() => import('./pages/teacher/Detentions'));
const TeacherStudentProfile = lazy(() => import('./pages/teacher/StudentProfile'));
const TeacherSettings = lazy(() => import('./pages/teacher/TeacherSettings'));
const TeacherInterventions = lazy(() => import('./pages/teacher/Interventions'));
const GuidedIntervention = lazy(() => import('./pages/teacher/GuidedIntervention'));
const TeacherConsequences = lazy(() => import('./pages/teacher/Consequences'));
const AssignConsequence = lazy(() => import('./pages/teacher/AssignConsequence'));
const TeacherNotifications = lazy(() => import('./pages/teacher/NotificationsPage'));
const TeacherReports = lazy(() => import('./pages/teacher/TeacherReports'));
const GradeHeadSettings = lazy(() => import('./pages/grade-head/GradeHeadSettings'));
const GradeHeadMyClass = lazy(() => import('./pages/grade-head/GradeHeadMyClass'));
const GradeHeadMyDashboard = lazy(() => import('./pages/grade-head/GradeHeadMyDashboard'));

// Parent pages — lazy loaded
const ModernParentDashboard = lazy(() => import('./pages/parent/ModernParentDashboard'));
const LinkChild = lazy(() => import('./pages/parent/LinkChild'));
const ModernMyChildren = lazy(() => import('./pages/parent/ModernMyChildren'));
const ChildProfile = lazy(() => import('./pages/parent/ChildProfile'));
const ModernBehaviourReport = lazy(() => import('./pages/parent/ModernBehaviourReport'));
const BehaviourDetails = lazy(() => import('./pages/parent/BehaviourDetails'));
const ModernViewMerits = lazy(() => import('./pages/parent/ModernViewMerits'));
const ModernViewDetentions = lazy(() => import('./pages/parent/ModernViewDetentions'));
const ParentMessages = lazy(() => import('./pages/parent/ParentMessages'));
const ModernSettings = lazy(() => import('./pages/parent/ModernSettings'));
const ModernNotifications = lazy(() => import('./pages/parent/ModernNotifications'));
const ParentNotifications = lazy(() => import('./pages/parent/NotificationsPage'));
const ModernInterventions = lazy(() => import('./pages/parent/ModernInterventions'));
const ModernConsequences = lazy(() => import('./pages/parent/ModernConsequences'));
const LinkSchool = lazy(() => import('./pages/parent/LinkSchool'));
const ParentOnboarding = lazy(() => import('./pages/parent/Onboarding'));
const ParentProfile = lazy(() => import('./pages/parent/ParentProfile'));

// Lightweight page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

// Component to set up navigation callback for API interceptor
function NavigationSetup() {
  const navigate = useNavigate();
  
  useEffect(() => {
    setNavigationCallback((path: string) => {
      navigate(path, { replace: true });
    });
  }, [navigate]);
  
  return null;
}

function App() {
  return (
    <DarkModeProvider>
    <Router>
      <AuthProvider>
        <SchoolThemeProvider>
          <NotificationProvider>
            <PlatformAuthProvider>
              <FeatureFlagsProvider>
                <ToastProvider>
                  <NavigationSetup />
            <Suspense fallback={<PageLoader />}>
            <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<ParentSignup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="teachers/:id" element={<AdminTeacherProfile />} />
            <Route path="parents" element={<Parents />} />
            <Route path="behaviour" element={<BehaviourDashboard />} />
            <Route path="behaviour-dashboard" element={<BehaviourDashboard />} />
            <Route path="behaviour/log" element={<LogIncident />} />
            <Route path="merits/award" element={<AwardMerit />} />
            <Route path="discipline" element={<DisciplineCenter />} />
            <Route path="discipline-rules" element={<DisciplineRules />} />
            <Route path="detention-sessions" element={<DetentionSessions />} />
            <Route path="consequences" element={<AdminConsequences />} />
            <Route path="consequence-management" element={<ConsequenceManagement />} />
            <Route path="merits" element={<MeritsDemerits />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="bulk-import" element={<BulkImport />} />
            <Route path="smart-import" element={<BulkImportV2 />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="classes" element={<MyClasses />} />
            <Route path="classes/:id" element={<ClassDetails />} />
            <Route path="behaviour" element={<TeacherBehaviour />} />
            <Route path="behaviour/log" element={<LogIncident />} />
            <Route path="merits" element={<TeacherMerits />} />
            <Route path="merits/award" element={<AwardMerit />} />
            <Route path="detentions" element={<TeacherDetentions />} />
            <Route path="interventions" element={<TeacherInterventions />} />
            <Route path="interventions/guided" element={<GuidedIntervention />} />
            <Route path="consequences" element={<TeacherConsequences />} />
            <Route path="assign-consequence" element={<AssignConsequence />} />
            <Route path="settings" element={<TeacherSettings />} />
            <Route path="students/:id" element={<TeacherStudentProfile />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="reports" element={<TeacherReports />} />
          </Route>

          <Route path="/grade-head" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><GradeHeadLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="behaviour" element={<BehaviourDashboard />} />
            <Route path="behaviour-dashboard" element={<BehaviourDashboard />} />
            <Route path="behaviour/log" element={<LogIncident />} />
            <Route path="merits/award" element={<AwardMerit />} />
            <Route path="discipline" element={<DisciplineCenter />} />
            <Route path="discipline-rules" element={<DisciplineRules />} />
            <Route path="detention-sessions" element={<DetentionSessions />} />
            <Route path="consequences" element={<AdminConsequences />} />
            <Route path="consequence-management" element={<ConsequenceManagement />} />
            <Route path="merits" element={<MeritsDemerits />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="bulk-import" element={<BulkImport />} />
            <Route path="my-dashboard" element={<GradeHeadMyDashboard />} />
            <Route path="my-class" element={<GradeHeadMyClass />} />
            <Route path="settings" element={<GradeHeadSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><OnboardingGuard><ModernParentLayout /></OnboardingGuard></ProtectedRoute>}>
            <Route index element={<ModernParentDashboard />} />
            <Route path="onboarding" element={<ParentOnboarding />} />
            <Route path="link-school" element={<LinkSchool />} />
            <Route path="link-child" element={<LinkChild />} />
            <Route path="children" element={<ModernMyChildren />} />
            <Route path="children/:id" element={<ChildProfile />} />
                       <Route path="behaviour" element={<ModernBehaviourReport />} />
            <Route path="behaviour/:id" element={<BehaviourDetails />} />
                       <Route path="merits" element={<ModernViewMerits />} />
                       <Route path="detentions" element={<ModernViewDetentions />} />
                       <Route path="interventions" element={<ModernInterventions />} />
                       <Route path="consequences" element={<ModernConsequences />} />
                       <Route path="messages" element={<ParentMessages />} />
                       <Route path="notifications" element={<ParentNotifications />} />
                       <Route path="profile" element={<ParentProfile />} />
                       <Route path="settings" element={<ModernSettings />} />
          </Route>

          <Route path="/platform/login" element={<PlatformLogin />} />
          <Route path="/platform" element={<ProtectedRoute allowedRoles={['platform_admin']}><PlatformLayout /></ProtectedRoute>}>
            <Route index element={<PlatformDashboard />} />
            <Route path="settings" element={<PlatformSettings />} />
            <Route path="schools" element={<PlatformSchools />} />
            <Route path="schools/onboard" element={<SchoolOnboardingWizard />} />
            <Route path="schools/:id" element={<PlatformSchoolDetails />} />
            <Route path="schools/:schoolId/customizations" element={<SchoolCustomizations />} />
            <Route path="schools/:schoolId/theme-builder" element={<ThemeBuilder />} />
            <Route path="users" element={<PlatformUsers />} />
            <Route path="subscriptions" element={<PlatformSubscriptions />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="billing" element={<PlatformBilling />} />
            <Route path="logs" element={<PlatformLogs />} />
            <Route path="notifications" element={<PlatformNotifications />} />
            <Route path="feature-flags" element={<FeatureFlagsManagement />} />
            <Route path="invoice-templates" element={<PlatformInvoiceTemplates />} />
            <Route path="invoices" element={<PlatformInvoices />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
            </Suspense>
                </ToastProvider>
              </FeatureFlagsProvider>
            </PlatformAuthProvider>
          </NotificationProvider>
        </SchoolThemeProvider>
      </AuthProvider>
    </Router>
    </DarkModeProvider>
  );
}

export default App;

