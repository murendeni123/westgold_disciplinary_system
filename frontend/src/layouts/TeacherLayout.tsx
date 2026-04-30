import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuickStudentSearch from '../components/QuickStudentSearch';
import NotificationBell from '../components/NotificationBell';
import TokenExpirationWarning from '../components/TokenExpirationWarning';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { Menu, X, GraduationCap, Search } from 'lucide-react';

const TeacherLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { customizations } = useSchoolTheme();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on every navigation on mobile — prevents overlay getting stuck
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
      setSearchOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F2EBE2] relative overflow-hidden">
      {/* Premium Gradient Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-800/20 to-[#121821]/60 pointer-events-none" />
      
      {/* Radial Glow Effect — subtle cyan glow in top-left corner */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full filter blur-3xl" />
      </div>

      <TokenExpirationWarning />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-80 relative z-10">
        {/* Modern Header */}
        <header className="backdrop-blur-xl bg-card-bg/90 shadow-card sticky top-0 z-30 border-b border-border-line">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-border-line transition-all duration-200 text-text-main"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-green to-accent-cyan rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-accent-green to-accent-cyan p-2 rounded-xl">
                    <GraduationCap className="text-card-bg" size={24} />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
                    Teacher Portal
                  </h1>
                  <p className="text-xs text-text-muted">Manage your classes and students</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search icon — mobile only */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-border-line transition-all duration-200 text-text-main"
                aria-label="Search students"
              >
                {searchOpen ? <X size={22} /> : <Search size={22} />}
              </button>
              {/* Full search bar — desktop only */}
              <div className="hidden md:block flex-1 max-w-md">
                <QuickStudentSearch />
              </div>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 bg-card-bg/90 border-b border-border-line z-20">
            <QuickStudentSearch />
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;


