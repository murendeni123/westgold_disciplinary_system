import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
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

const ModernParentLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { customizations, getImageUrl } = useSchoolTheme();

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

          {/* Static orb — no infinite animation to avoid GPU overhead */}
          <div className="absolute top-0 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

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
          <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModernParentLayout;

