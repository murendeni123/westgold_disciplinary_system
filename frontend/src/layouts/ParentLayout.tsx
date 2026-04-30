import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuickStudentSearch from '../components/QuickStudentSearch';
import SchoolSwitcher from '../components/SchoolSwitcher';
import { motion } from 'framer-motion';
import { Menu, X, Users } from 'lucide-react';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';

const ParentLayout: React.FC = () => {
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
    <div className="min-h-screen bg-[#F2EBE2] relative overflow-hidden">
      {/* Premium Gradient Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-800/20 to-[#121821]/60 pointer-events-none" />
      
      {/* Radial Glow Effect — subtle cyan glow in top-left corner */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full filter blur-3xl" />
      </div>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 relative z-10">
        {/* Modern Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-xl bg-card-bg/90 shadow-card sticky top-0 z-30 border-b border-border-line"
        >
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-border-line transition-all duration-200 text-text-main"
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
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-green to-accent-cyan rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-accent-green to-accent-cyan p-2 rounded-xl">
                    <Users className="text-card-bg" size={24} />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
                    Parent Portal
                  </h1>
                  <p className="text-xs text-text-muted">Stay connected with your child's education</p>
                </div>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-md hidden md:block">
                <QuickStudentSearch />
              </div>
              <SchoolSwitcher />
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
          className="flex-1 overflow-y-auto p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default ParentLayout;


