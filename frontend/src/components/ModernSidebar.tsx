import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useParentStudents } from '../hooks/useParentStudents';
import {
  LayoutDashboard,
  Users,
  Link as LinkIcon,
  Building2,
  Calendar,
  AlertTriangle,
  Award,
  Settings,
  GraduationCap,
  LogOut,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';

interface ModernSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { customizations, getImageUrl } = useSchoolTheme();
  const { hasStudents, loading: studentsLoading } = useParentStudents();

  // Track parent setup status
  const hasLinkedSchool = !!profile?.school_id;
  const hasLinkedChild = hasStudents;
  const setupChecked = !studentsLoading;

  // Build parent menu dynamically based on setup status
  const getParentMenu = () => {
    const baseMenu = [
      { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    ];

    // Only show Link School if parent hasn't linked a school yet
    if (!hasLinkedSchool && setupChecked) {
      baseMenu.push({ path: '/parent/link-school', label: 'Link School', icon: Building2 });
    }

    // Only show Link Child if parent has a school but no children yet
    if (hasLinkedSchool && !hasLinkedChild && setupChecked) {
      baseMenu.push({ path: '/parent/link-child', label: 'Link Child', icon: LinkIcon });
    }

    // Always show these menu items (they were always visible before)
    baseMenu.push(
      { path: '/parent/children', label: 'My Children', icon: Users },
      { path: '/parent/attendance', label: 'Attendance', icon: Calendar },
      { path: '/parent/behaviour', label: 'Behaviour', icon: AlertTriangle },
      { path: '/parent/merits', label: 'Merits', icon: Award },
      { path: '/parent/detentions', label: 'Detentions', icon: AlertTriangle },
      { path: '/parent/interventions', label: 'Interventions', icon: AlertTriangle },
      { path: '/parent/consequences', label: 'Consequences', icon: AlertTriangle },
      { path: '/parent/notifications', label: 'Notifications', icon: Bell },
    );

    // Always show Settings (where they can link more schools/children)
    baseMenu.push({ path: '/parent/settings', label: 'Settings', icon: Settings });

    return baseMenu;
  };

  const parentMenu = getParentMenu();

  const isActive = (path: string) => {
    if (path === '/parent') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-80 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: customizations?.sidebar_background || '#ffffff',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Premium Header with Gradient */}
          <div className="relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
            
            {/* Animated Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Floating Orb */}
            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Header Content */}
            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {customizations?.logo_path ? (
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <img 
                        src={getImageUrl(customizations.logo_path) || ''} 
                        alt="Logo" 
                        className="h-6 w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <motion.div 
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <GraduationCap className="text-white" size={22} />
                    </motion.div>
                  )}
                  <div>
                    <span className="font-bold text-xl text-white tracking-tight">
                      PDS
                    </span>
                    <div className="flex items-center space-x-1">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] text-white/70 uppercase tracking-wider">
                        Parent Portal
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="lg:hidden w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="px-4 -mt-3 relative z-20">
            <motion.div 
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {profile?.full_name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 capitalize">
                      {profile?.role}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="h-4" />

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {parentMenu.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                              active ? 'text-white' : 'hover:bg-gray-100'
                            }`}
                            style={{
                              backgroundColor: active 
                                ? (customizations?.primary_color || '#2563eb')
                                : 'transparent',
                              color: active
                                ? '#ffffff'
                                : (customizations?.text_primary_color || '#374151'),
                              borderRadius: customizations?.button_border_radius || '0.5rem',
                            }}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ModernSidebar;

