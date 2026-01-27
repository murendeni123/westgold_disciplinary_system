import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PlatformAuthProvider } from './contexts/PlatformAuthContext';
import { SchoolThemeProvider } from './contexts/SchoolThemeContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { ToastProvider } from './contexts/ToastContext';
import { setNavigationCallback } from './services/api';
import Login from './pages/Login';
import ParentSignup from './pages/ParentSignup';
import AuthCallback from './pages/AuthCallback';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import ModernParentLayout from './layouts/ModernParentLayout';
import PlatformLayout from './layouts/PlatformLayout';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGuard from './components/OnboardingGuard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Students from './pages/admin/Students';
import StudentProfile from './pages/admin/StudentProfile';
import Classes from './pages/admin/Classes';
import ClassDetail from './pages/admin/ClassDetail';
import Teachers from './pages/admin/Teachers';
import MeritsDemerits from './pages/admin/MeritsDemerits';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTeacherProfile from './pages/admin/TeacherProfile';
import Parents from './pages/admin/Parents';
import BulkImport from './pages/admin/BulkImport';
import BulkImportV2 from './pages/admin/BulkImportV2';
import UserManagement from './pages/admin/UserManagement';
import DisciplineCenter from './pages/admin/DisciplineCenter';
import DisciplineRules from './pages/admin/DisciplineRules';
import DetentionSessions from './pages/admin/DetentionSessions';
import AdminConsequences from './pages/admin/Consequences';
import ConsequenceManagement from './pages/admin/ConsequenceManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import BehaviourDashboard from './pages/admin/BehaviourDashboard';
import AdminNotifications from './pages/admin/NotificationsEnhanced';

// Platform pages
import PlatformLogin from './pages/platform/PlatformLogin';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import PlatformSettings from './pages/platform/PlatformSettings';
import PlatformSchools from './pages/platform/PlatformSchools';
import PlatformSchoolDetails from './pages/platform/PlatformSchoolDetails';
import SchoolCustomizations from './pages/platform/SchoolCustomizations';
import PlatformSubscriptions from './pages/platform/PlatformSubscriptions';
import PlatformAnalytics from './pages/platform/PlatformAnalytics';
import PlatformBilling from './pages/platform/PlatformBilling';
import PlatformLogs from './pages/platform/PlatformLogs';
import PlatformUsers from './pages/platform/PlatformUsers';
import SchoolOnboardingWizard from './pages/platform/SchoolOnboardingWizard';
import PlatformNotifications from './pages/platform/NotificationsPage';
import FeatureFlagsManagement from './pages/platform/FeatureFlagsManagement';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MyClasses from './pages/teacher/MyClasses';
import ClassDetails from './pages/teacher/ClassDetails';
import TeacherBehaviour from './pages/teacher/Behaviour';
import LogIncident from './pages/teacher/LogIncident';
import TeacherMerits from './pages/teacher/Merits';
import AwardMerit from './pages/teacher/AwardMerit';
import TeacherDetentions from './pages/teacher/Detentions';
import TeacherStudentProfile from './pages/teacher/StudentProfile';
import TeacherSettings from './pages/teacher/TeacherSettings';
import TeacherInterventions from './pages/teacher/Interventions';
import GuidedIntervention from './pages/teacher/GuidedIntervention';
import TeacherConsequences from './pages/teacher/Consequences';
import AssignConsequence from './pages/teacher/AssignConsequence';
import TeacherNotifications from './pages/teacher/NotificationsPage';

// Parent pages
import ModernParentDashboard from './pages/parent/ModernParentDashboard';
import LinkChild from './pages/parent/LinkChild';
import ModernMyChildren from './pages/parent/ModernMyChildren';
import ChildProfile from './pages/parent/ChildProfile';
import ModernBehaviourReport from './pages/parent/ModernBehaviourReport';
import BehaviourDetails from './pages/parent/BehaviourDetails';
import ModernViewMerits from './pages/parent/ModernViewMerits';
import ModernViewDetentions from './pages/parent/ModernViewDetentions';
import ParentMessages from './pages/parent/ParentMessages';
import ModernSettings from './pages/parent/ModernSettings';
import ModernNotifications from './pages/parent/ModernNotifications';
import ParentNotifications from './pages/parent/NotificationsPage';
import ModernInterventions from './pages/parent/ModernInterventions';
import ModernConsequences from './pages/parent/ModernConsequences';
import LinkSchool from './pages/parent/LinkSchool';
import ParentOnboarding from './pages/parent/Onboarding';
import ParentProfile from './pages/parent/ParentProfile';

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
    <Router>
      <AuthProvider>
        <SchoolThemeProvider>
          <NotificationProvider>
            <PlatformAuthProvider>
              <FeatureFlagsProvider>
                <ToastProvider>
                  <NavigationSetup />
            <Routes>
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
            <Route path="behaviour-dashboard" element={<BehaviourDashboard />} />
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
            <Route path="users" element={<PlatformUsers />} />
            <Route path="subscriptions" element={<PlatformSubscriptions />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="billing" element={<PlatformBilling />} />
            <Route path="logs" element={<PlatformLogs />} />
            <Route path="notifications" element={<PlatformNotifications />} />
            <Route path="feature-flags" element={<FeatureFlagsManagement />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
                </ToastProvider>
              </FeatureFlagsProvider>
            </PlatformAuthProvider>
          </NotificationProvider>
        </SchoolThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

