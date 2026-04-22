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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Static Background Elements — visible on desktop only to avoid GPU overhead on mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      </div>

      {/* Header */}
      <header className="backdrop-blur-xl bg-white/80 shadow-lg sticky top-0 z-30 border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/50 transition-all duration-200"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                  <Shield className="text-white" size={24} />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Platform Admin
                </h1>
                <p className="text-xs text-gray-500">Super Admin Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/50 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
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
              className={`fixed top-0 left-0 z-50 h-full w-72 backdrop-blur-xl bg-white/70 shadow-2xl border-r border-white/20 lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              style={{ top: '73px' }}
            >
              <div className="flex flex-col h-full">
                {/* User info */}
                <div className="p-6 border-b border-white/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user?.name || 'Super Admin'}</p>
                      <p className="text-xs text-gray-500">Platform Administrator</p>
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
                                ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                                : 'text-gray-700 hover:bg-white/50'
                            }`}
                          >
                            <div className={`relative z-10 ${active ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}`}>
                              <Icon size={20} />
                            </div>
                            <span className={`relative z-10 font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                              {item.label}
                            </span>
                            {active && (
                              <div className="absolute right-2 w-2 h-2 bg-white rounded-full" />
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              style={{ top: '73px' }}
            />
          )}
        </AnimatePresence>

        {/* Main content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen && !isMobile ? 'lg:ml-72' : ''
          }`}
          style={{ marginTop: '73px' }}
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
