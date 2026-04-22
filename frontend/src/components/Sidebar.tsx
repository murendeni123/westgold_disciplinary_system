import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
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
    { path: '/admin/behaviour-dashboard', label: 'Behaviour Dashboard', icon: AlertTriangle },
    { path: '/admin/discipline', label: 'Discipline Center', icon: Scale },
    { path: '/admin/discipline-rules', label: 'Discipline Rules', icon: Shield },
    { path: '/admin/detention-sessions', label: 'Detention Sessions', icon: Clock },
    { path: '/admin/consequence-management', label: 'Assign Consequences', icon: Scale },
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
    { path: '/teacher/assign-consequence', label: 'Assign Consequences', icon: Scale },
    { path: '/teacher/reports', label: 'Reports', icon: BarChart3 },
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
    if (path === `/${user?.role}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const roleColors = {
    admin: 'from-amber-500 to-orange-500',
    teacher: 'from-emerald-500 to-teal-500',
    parent: 'from-blue-500 to-purple-500',
  };
  const currentColor = roleColors[user?.role as keyof typeof roleColors] || 'from-blue-500 to-purple-500';

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      {/* Mobile backdrop — simple conditional render, no animation delay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel — CSS transform only.
          When closed: translateX(-100%) moves it fully off-screen.
          An off-screen element CANNOT block pointer events. No framer-motion needed. */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] sm:w-80 bg-white shadow-2xl border-r border-gray-100 transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className={`relative p-4 sm:p-6 bg-gradient-to-br ${currentColor} overflow-hidden flex-shrink-0`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {customizations?.logo_path ? (
                    <img
                      src={getImageUrl(customizations.logo_path) || ''}
                      alt="Logo"
                      className="h-10 sm:h-12 w-auto object-contain rounded-lg bg-white/20 p-1.5 backdrop-blur-sm"
                    />
                  ) : (
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg border border-white/30">
                      <GraduationCap className="text-white" size={24} />
                    </div>
                  )}
                  <div>
                    <h1 className="font-bold text-xl text-white drop-shadow-lg">DMS</h1>
                    <p className="text-xs text-white/80 capitalize font-medium">{user?.role} Portal</p>
                  </div>
                </div>

                {/* Close button — visible on mobile only */}
                <button
                  onClick={onToggle}
                  className="lg:hidden p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* User info */}
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-lg flex items-center justify-center">
                      <span className={`text-xl font-bold bg-gradient-to-r ${currentColor} bg-clip-text text-transparent`}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-white/70 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nav menu */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl min-h-[48px] transition-colors duration-150 ${
                        active
                          ? `bg-gradient-to-r ${currentColor} text-white shadow-md`
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                        active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <span className={`font-semibold text-sm flex-1 truncate ${
                        active ? 'text-white' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                      {active && <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors duration-150 min-h-[48px]"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0">
                <LogOut size={18} />
              </div>
              <span className="font-semibold text-sm">Logout</span>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;

