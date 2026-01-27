import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuickStudentSearch from '../components/QuickStudentSearch';
import NotificationBell from '../components/NotificationBell';
import TokenExpirationWarning from '../components/TokenExpirationWarning';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { motion } from 'framer-motion';
import { Menu, X, GraduationCap } from 'lucide-react';

const TeacherLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const location = useLocation();
  const { customizations } = useSchoolTheme();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
      </div>

      <TokenExpirationWarning />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-80 relative z-10">
        {/* Modern Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-xl bg-white/80 shadow-lg sticky top-0 z-30 border-b border-white/20"
        >
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-white/50 transition-all duration-200"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex items-center space-x-3"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-xl">
                    <GraduationCap className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Teacher Portal
                  </h1>
                  <p className="text-xs text-gray-500">Manage your classes and students</p>
                </div>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-md hidden md:block">
                <QuickStudentSearch />
              </div>
              <NotificationBell />
            </div>
          </div>
        </motion.header>

        {/* Main content with smooth transitions */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6 lg:p-10 xl:p-12 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default TeacherLayout;


