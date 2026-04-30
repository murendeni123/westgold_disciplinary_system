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
    <div className="flex h-screen relative bg-[#F2EBE2] overflow-hidden">
      {/* Premium Gradient Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-800/20 to-[#121821]/60 pointer-events-none" />
      
      {/* Radial Glow Effect — subtle cyan glow in top-left corner */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full filter blur-3xl" />
      </div>
      
      <TokenExpirationWarning />
      <ModernSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-80">
        {/* Premium Header - Aligned with Sidebar */}
        <header className="relative overflow-hidden z-50">
          {/* Gradient Background matching sidebar */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent-green to-accent-cyan" />
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23121821%22 fill-opacity=%221%22 fill-rule=%22evenodd%22%3E%3Cpath d=%22M0 40L40 0H20L0 20M40 40V20L20 40%22/%3E%3C/g%3E%3C/svg%3E')]" />

          {/* Static orb */}
          <div className="absolute top-0 right-20 w-32 h-32 bg-card-bg/10 rounded-full blur-2xl" />

          {/* Header Content */}
          <div className="relative z-50 flex items-center justify-between px-6 py-4 gap-4">
            {/* Left Section - Menu & Title */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-10 h-10 bg-card-bg/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-card-bg hover:bg-card-bg/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={20} />
              </motion.button>
              
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Sparkles size={20} className="text-card-bg/80" />
                  <h1 className="text-xl font-bold text-card-bg tracking-tight">
                    Parent Portal
                  </h1>
                </div>
                <span className="px-2 py-1 bg-card-bg/20 backdrop-blur-sm rounded-lg text-xs text-card-bg/80 font-medium">
                  Dashboard
                </span>
              </div>
            </div>

            {/* Center - Search — hidden on mobile to prevent header overcrowding */}
            <div className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full">
                <QuickStudentSearch />
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              <SchoolSwitcher />
              
              <NotificationBell />

              <motion.div 
                className="w-10 h-10 bg-card-bg/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-card-bg font-bold cursor-pointer border-2 border-card-bg/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'P'}
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModernParentLayout;

