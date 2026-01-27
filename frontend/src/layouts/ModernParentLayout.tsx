import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ModernSidebar from '../components/ModernSidebar';
import QuickStudentSearch from '../components/QuickStudentSearch';
import NotificationBell from '../components/NotificationBell';
import TokenExpirationWarning from '../components/TokenExpirationWarning';
import SchoolSwitcher from '../components/SchoolSwitcher';
import PageTransition from '../components/PageTransition';
import AnimatedBackground from '../components/AnimatedBackground';
import { Menu, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { api } from '../services/api';

const ModernParentLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { customizations, getImageUrl } = useSchoolTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [setupChecked, setSetupChecked] = useState(false);
  const [hasLinkedSchool, setHasLinkedSchool] = useState(false);
  const [hasLinkedChild, setHasLinkedChild] = useState(false);

  // Check setup status only on mount, not on every route change
  useEffect(() => {
    if (user && !setupChecked) {
      checkSetupStatus();
    }
  }, [user]);

  const checkSetupStatus = async () => {
    if (!user) return;

    try {
      // Check if parent has linked a school from user data (no API call needed)
      const hasSchool = !!user.school_id;
      setHasLinkedSchool(hasSchool);

      // Check if parent has linked children from user data (no API call needed)
      const hasChildren = !!(user?.children && user.children.length > 0);
      setHasLinkedChild(hasChildren);

      setSetupChecked(true);

      // Define allowed paths during setup
      const setupPaths = ['/parent/link-school', '/parent/link-child', '/parent/settings', '/parent/onboarding'];
      const currentPath = location.pathname;

      // If not on a setup path, enforce setup completion
      if (!setupPaths.includes(currentPath)) {
        if (!hasSchool) {
          navigate('/parent/link-school', { replace: true });
        } else if (!hasChildren) {
          navigate('/parent/link-child', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupChecked(true);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply dashboard background if available
  useEffect(() => {
    if (customizations?.dashboard_background_path) {
      const bgUrl = getImageUrl(customizations.dashboard_background_path);
      if (bgUrl) {
        document.body.style.backgroundImage = `url(${bgUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
    } else {
      document.body.style.backgroundImage = '';
    }

    return () => {
      document.body.style.backgroundImage = '';
    };
  }, [customizations?.dashboard_background_path, getImageUrl]);

  return (
    <div className="flex h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      <TokenExpirationWarning />
      <ModernSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-80">
        {/* Premium Header - Aligned with Sidebar */}
        <header className="relative overflow-hidden z-50">
          {/* Gradient Background matching sidebar */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700" />
          
          {/* Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Floating Orbs */}
          <motion.div
            className="absolute top-0 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Header Content */}
          <div className="relative z-50 flex items-center justify-between px-6 py-4 gap-4">
            {/* Left Section - Menu & Title */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={20} />
              </motion.button>
              
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Sparkles size={20} className="text-yellow-300" />
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Parent Portal
                  </h1>
                </div>
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white/80 font-medium">
                  Dashboard
                </span>
              </div>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <QuickStudentSearch />
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              <SchoolSwitcher />
              
              <NotificationBell />

              <motion.div 
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold cursor-pointer border-2 border-white/30"
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'P'}
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-10 xl:p-12 max-w-[1600px] mx-auto">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModernParentLayout;

