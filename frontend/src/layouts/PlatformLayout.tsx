import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '../contexts/PlatformAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  Building2,
  CreditCard,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  Sparkles,
  Bell,
  ToggleLeft,
  Receipt,
  FileStack,
} from 'lucide-react';
import Button from '../components/Button';

const PlatformLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { user, logout } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { path: '/platform', label: 'Dashboard', icon: LayoutDashboard, color: 'from-purple-500 to-pink-500' },
    { path: '/platform/schools', label: 'Schools', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { path: '/platform/users', label: 'Platform Users', icon: Shield, color: 'from-indigo-500 to-purple-500' },
    { path: '/platform/subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'from-green-500 to-emerald-500' },
    { path: '/platform/invoice-templates', label: 'Invoice Templates', icon: FileStack, color: 'from-violet-500 to-fuchsia-500' },
    { path: '/platform/invoices', label: 'Invoices', icon: Receipt, color: 'from-emerald-500 to-teal-500' },
    { path: '/platform/analytics', label: 'Analytics', icon: BarChart3, color: 'from-orange-500 to-red-500' },
    { path: '/platform/billing', label: 'Billing', icon: CreditCard, color: 'from-teal-500 to-blue-500' },
    { path: '/platform/logs', label: 'Activity Logs', icon: FileText, color: 'from-gray-500 to-slate-500' },
    { path: '/platform/feature-flags', label: 'Feature Flags', icon: ToggleLeft, color: 'from-amber-500 to-orange-500' },
    { path: '/platform/notifications', label: 'Notifications', icon: Bell, color: 'from-blue-500 to-indigo-500' },
    { path: '/platform/settings', label: 'Settings', icon: Settings, color: 'from-violet-500 to-purple-500' },
  ];

  const isActive = (path: string) => {
    if (path === '/platform') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/platform/login');
  };

  return (
    <div className="min-h-screen bg-[#F2EBE2] relative overflow-hidden">
      {/* Premium Gradient Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-800/20 to-[#121821]/60 pointer-events-none" />
      
      {/* Radial Glow Effect — subtle cyan glow in top-left corner */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full filter blur-3xl" />
      </div>

      {/* Header */}
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
                  <Shield className="text-card-bg" size={24} />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
                  Platform Admin
                </h1>
                <p className="text-xs text-text-muted">Manage all schools</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-muted">{user?.email}</span>
            <motion.button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 hover:shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`fixed top-[73px] left-0 z-50 h-full w-72 backdrop-blur-xl bg-card-bg shadow-card border-r border-border-line lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex flex-col h-full">
                {/* User info */}
                <div className="p-6 border-b border-border-line bg-gradient-to-r from-accent-green/10 to-accent-cyan/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent-green to-accent-cyan flex items-center justify-center shadow-primary">
                      <span className="text-card-bg text-lg font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">{user?.name || 'Super Admin'}</p>
                      <p className="text-xs text-text-muted">Platform Administrator</p>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => {
                              navigate(item.path);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-150 w-full text-left overflow-hidden ${
                              active
                                ? 'bg-accent-green text-card-bg shadow-primary'
                                : 'text-text-muted hover:bg-border-line hover:text-text-main'
                            }`}
                          >
                            <div className={`relative z-10 ${active ? 'text-card-bg' : 'text-text-muted group-hover:text-accent-green'}`}>
                              <Icon size={20} />
                            </div>
                            <span className={`relative z-10 font-semibold ${active ? 'text-card-bg' : 'text-text-main'}`}>
                              {item.label}
                            </span>
                            {active && (
                              <div className="absolute right-2 w-2 h-2 bg-card-bg rounded-full" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden top-[73px]"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main content */}
        <main
          className={`flex-1 transition-all duration-300 mt-[73px] ${
            sidebarOpen && !isMobile ? 'lg:ml-72' : ''
          }`}
        >
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default PlatformLayout;
