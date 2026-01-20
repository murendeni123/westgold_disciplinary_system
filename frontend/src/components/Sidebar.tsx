import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  Settings,
  GraduationCap,
  LogOut,
  X,
  Award,
  Upload,
  Shield,
  Scale,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Building2,
  Clock,
  Bell,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { customizations, getImageUrl } = useSchoolTheme();

  const adminMenu = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Students', icon: Users },
    { path: '/admin/classes', label: 'Classes', icon: BookOpen },
    { path: '/admin/teachers', label: 'Teachers', icon: UserCheck },
    { path: '/admin/parents', label: 'Parents', icon: Users },
    { path: '/admin/discipline', label: 'Discipline Center', icon: Scale },
    { path: '/admin/discipline-rules', label: 'Discipline Rules', icon: Shield },
    { path: '/admin/detention-sessions', label: 'Detention Sessions', icon: Clock },
    { path: '/admin/merits', label: 'Merits & Recognition', icon: Award },
    { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { path: '/admin/smart-import', label: 'Smart Import', icon: Upload },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const teacherMenu = [
    { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/teacher/classes', label: 'My Classes', icon: BookOpen },
    { path: '/teacher/behaviour', label: 'Behaviour', icon: AlertTriangle },
    { path: '/teacher/merits', label: 'Merits', icon: Award },
    { path: '/teacher/detentions', label: 'Detentions', icon: Clock },
    { path: '/teacher/interventions', label: 'Interventions', icon: Shield },
    { path: '/teacher/consequences', label: 'Consequences', icon: Scale },
    { path: '/teacher/notifications', label: 'Notifications', icon: Bell },
    { path: '/teacher/settings', label: 'Settings', icon: Settings },
  ];

  const parentMenu = [
    { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/parent/link-school', label: 'Link School', icon: Building2 },
    { path: '/parent/link-child', label: 'Link Child', icon: GraduationCap },
    { path: '/parent/children', label: 'My Children', icon: Users },
    { path: '/parent/behaviour', label: 'Behaviour', icon: AlertTriangle },
    { path: '/parent/merits', label: 'Merits', icon: Award },
    { path: '/parent/detentions', label: 'Detentions', icon: AlertTriangle },
    { path: '/parent/interventions', label: 'Interventions', icon: AlertTriangle },
    { path: '/parent/consequences', label: 'Consequences', icon: AlertTriangle },
    { path: '/parent/messages', label: 'Messages', icon: MessageSquare },
    { path: '/parent/notifications', label: 'Notifications', icon: Bell },
    { path: '/parent/profile', label: 'Profile', icon: UserCheck },
    { path: '/parent/settings', label: 'Settings', icon: Settings },
  ];

  const menuItems = user?.role === 'admin' ? adminMenu : user?.role === 'teacher' ? teacherMenu : parentMenu;

  const isActive = (path: string) => {
    if (path === `/${user?.role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Define color gradients based on role
  const roleColors = {
    admin: 'from-amber-500 to-orange-500',
    teacher: 'from-emerald-500 to-teal-500',
    parent: 'from-blue-500 to-purple-500',
  };

  const currentColor = roleColors[user?.role as keyof typeof roleColors] || 'from-blue-500 to-purple-500';

  return (
    <>
      {/* Mobile overlay with backdrop blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Modern Sidebar with glassmorphism */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ 
          x: isOpen ? 0 : -300, 
          opacity: isOpen ? 1 : 0 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl border-r border-gray-100 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Modern Header with gradient */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`relative p-8 bg-gradient-to-br ${currentColor} overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {customizations?.logo_path ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src={getImageUrl(customizations.logo_path) || ''}
                      alt="Logo"
                      className="h-12 w-auto object-contain rounded-xl bg-white/20 p-2 backdrop-blur-sm"
                    />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg border border-white/30"
                    >
                      <GraduationCap className="text-white" size={28} />
                    </motion.div>
                  )}
                  <div>
                    <h1 className="font-bold text-2xl text-white drop-shadow-lg">
                      PDS
                    </h1>
                    <p className="text-xs text-white/80 capitalize font-medium">{user?.role} Portal</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggle}
                  className="lg:hidden p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <X size={20} className="text-white" />
                </motion.button>
              </div>
              
              {/* User Profile Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center"
                    >
                      <span className={`text-2xl font-bold bg-gradient-to-r ${currentColor} bg-clip-text text-transparent`}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </motion.div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-white/70 capitalize font-medium">{user?.role}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>


          {/* Menu with animations */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <motion.li
                    key={item.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={`group relative flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${
                        active
                          ? `bg-gradient-to-r ${currentColor} text-white shadow-lg`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-0 bg-gradient-to-r ${currentColor} rounded-xl`}
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                        active 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <span className={`relative z-10 font-semibold text-sm flex-1 ${
                        active ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {item.label}
                      </span>
                      {active && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="relative z-10 w-2 h-2 bg-white rounded-full shadow-lg"
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* Logout button with hover effect */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 border-t border-gray-100"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="flex items-center space-x-3 w-full px-4 py-3.5 rounded-xl text-gray-700 bg-gray-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white transition-all duration-300 border border-gray-200 hover:border-transparent shadow-sm hover:shadow-lg group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white group-hover:bg-white/20 transition-all">
                <LogOut size={20} className="group-hover:text-white" />
              </div>
              <span className="font-semibold text-sm flex-1 text-left">Logout</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;

