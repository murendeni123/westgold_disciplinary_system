import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Users,
  School,
  AlertTriangle,
  Award,
  Clock,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  ChevronRight,
  Target,
  BookOpen,
  Upload,
  Gavel,
  BarChart3,
  Search,
  Star
} from 'lucide-react';

interface NavItem {
  name: string;
  path?: string;
  icon: React.ElementType;
  subItems?: { name: string; path: string }[];
}

const GradeHeadLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['Discipline', 'Behaviour']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // All admin nav items except teachers, parents, smart import
  const navigationItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/grade-head',
      icon: LayoutDashboard
    },
    {
      name: 'Behaviour',
      icon: AlertTriangle,
      subItems: [
        { name: 'Behaviour Dashboard', path: '/grade-head/behaviour' },
        { name: 'Log Incident', path: '/grade-head/behaviour/log' },
        { name: 'Award Merit', path: '/grade-head/merits/award' }
      ]
    },
    ...(user?.hasClass ? [{
      name: 'My Class',
      path: '/grade-head/my-class',
      icon: BookOpen
    }] : []),
    {
      name: 'Students',
      path: '/grade-head/students',
      icon: Users
    },
    {
      name: 'Classes',
      path: '/grade-head/classes',
      icon: School
    },
    {
      name: 'Discipline',
      icon: Target,
      subItems: [
        { name: 'Discipline Center', path: '/grade-head/discipline' },
        { name: 'Discipline Rules', path: '/grade-head/discipline-rules' },
        { name: 'Detention Sessions', path: '/grade-head/detention-sessions' },
        { name: 'Consequences', path: '/grade-head/consequences' },
        { name: 'Consequence Management', path: '/grade-head/consequence-management' },
        { name: 'Merits & Demerits', path: '/grade-head/merits' }
      ]
    },
    {
      name: 'Reports',
      path: '/grade-head/reports',
      icon: BarChart3
    },
    {
      name: 'Bulk Import',
      path: '/grade-head/bulk-import',
      icon: Upload
    },
    {
      name: 'Notifications',
      path: '/grade-head/notifications',
      icon: Bell
    },
    {
      name: 'Settings',
      path: '/grade-head/settings',
      icon: Settings
    }
  ];

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Global search across ALL students (no grade filter)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.getStudents({ search: searchQuery, bypass_grade_filter: true });
        setSearchResults((res.data || []).slice(0, 8));
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 64 }}
        transition={{ duration: 0.2 }}
        className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-2xl flex flex-col flex-shrink-0 z-20 overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between min-h-[60px]">
          {sidebarOpen && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">Grade Head</p>
                <p className="text-xs text-amber-300 truncate">Grade {user?.gradeHeadFor}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="px-3 py-2.5 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navigationItems.map((item) => {
            if (item.subItems) {
              const isOpen = openSubMenus.includes(item.name);
              const hasActiveChild = item.subItems.some(sub => location.pathname === sub.path);
              return (
                <div key={item.name}>
                  <button
                    onClick={() => sidebarOpen && toggleSubMenu(item.name)}
                    className={`w-full flex items-center px-2 py-2 rounded-lg transition-all text-left ${
                      hasActiveChild ? 'bg-white/15 text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="ml-2.5 text-sm font-medium flex-1">{item.name}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>
                  {sidebarOpen && isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) =>
                            `flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-all text-sm ${
                              isActive
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-indigo-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <ChevronRight size={12} className="flex-shrink-0" />
                          <span>{sub.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                end={item.path === '/grade-head'}
                className={({ isActive }) =>
                  `flex items-center px-2 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                  } ${!sidebarOpen ? 'justify-center' : ''}`
                }
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="ml-2.5 text-sm font-medium">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center px-2 py-2 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-100 transition-all w-full ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="ml-2.5 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with global search */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5">
              <Shield size={12} />
              <span>Grade {user?.gradeHeadFor} Head</span>
            </div>
          </div>

          {/* Global Search (searches all grades) */}
          <div className="relative flex-1 max-w-md mx-6" ref={searchRef}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search any student across all grades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
                    {searchResults.length} student{searchResults.length !== 1 ? 's' : ''} found across all grades
                  </div>
                  {searchResults.map((student: any) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        navigate(`/grade-head/students/${student.id}`);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-600">
                          {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.class_name || 'No class'} {student.grade_level ? `• Grade ${student.grade_level}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {showSearchResults && searchQuery && searchResults.length === 0 && !searchLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-center text-sm text-gray-500"
                >
                  No students found for "{searchQuery}"
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="hidden sm:block">{user?.name}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default GradeHeadLayout;
