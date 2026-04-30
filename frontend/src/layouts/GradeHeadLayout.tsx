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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['Discipline', 'Behaviour']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Personal section — only shown when teacher has an assigned class
  const personalNavItems: NavItem[] = [
    {
      name: 'My Dashboard',
      path: '/grade-head/my-dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'My Class',
      path: '/grade-head/my-class',
      icon: BookOpen
    }
  ];

  // Grade management section — always visible
  const gradeNavItems: NavItem[] = [
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

  // Track mobile/desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar and search on navigation (mobile only)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setSearchOpen(false);
      setShowSearchResults(false);
    }
  }, [location.pathname]);

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

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#F2EBE2] overflow-hidden relative">
      {/* Premium Gradient Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-800/20 to-[#121821]/60 pointer-events-none" />
      
      {/* Radial Glow Effect — subtle cyan glow in top-left corner */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full filter blur-3xl" />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar
          Mobile:  fixed overlay, slides in/out with CSS transform
          Desktop: flex item with width transition */}
      <aside
        style={!isMobile ? { width: sidebarOpen ? 260 : 64, transition: 'width 0.2s ease' } : {}}
        className={`
          bg-card-bg text-text-main shadow-card flex flex-col overflow-hidden flex-shrink-0 border-r border-border-line
          fixed top-0 left-0 h-full z-50 w-72
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:z-20 lg:h-auto lg:translate-x-0
        `}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-border-line flex items-center justify-between min-h-[60px] flex-shrink-0">
          {(sidebarOpen || isMobile) && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-green to-accent-cyan rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-card-bg" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-text-main">Grade Head</p>
                <p className="text-xs text-accent-green truncate">Grade {user?.gradeHeadFor}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => isMobile ? setSidebarOpen(false) : setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-border-line rounded-lg transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center text-text-main"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* User Info */}
        {(sidebarOpen || isMobile) && (
          <div className="px-3 py-2.5 border-b border-border-line flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-green to-accent-cyan rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-card-bg">
                {user?.name?.charAt(0)?.toUpperCase() || 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-text-main">{user?.name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {/* Personal section */}
          {user?.hasClass && (
            <div className="mb-1">
              {(sidebarOpen || isMobile) && (
                <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-accent-green select-none">
                  My Teaching
                </p>
              )}
              <div className="space-y-0.5">
                {personalNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path!}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-2 rounded-lg transition-colors min-h-[44px] ${
                        isActive ? 'bg-accent-green/20 text-accent-green' : 'text-text-muted hover:bg-border-line hover:text-text-main'
                      } ${(!sidebarOpen && !isMobile) ? 'justify-center' : ''}`
                    }
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {(sidebarOpen || isMobile) && <span className="ml-2.5 text-sm font-medium">{item.name}</span>}
                  </NavLink>
                ))}
              </div>
              {(sidebarOpen || isMobile) && <div className="mt-2 border-t border-border-line" />}
            </div>
          )}

          {/* Grade Management section */}
          <div className="space-y-0.5 mt-1">
            {(sidebarOpen || isMobile) && (
              <p className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-accent-cyan select-none">
                Grade Management
              </p>
            )}
            {gradeNavItems.map((item) => {
              if (item.subItems) {
                const isSubOpen = openSubMenus.includes(item.name);
                const hasActiveChild = item.subItems.some(sub => location.pathname === sub.path);
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => (sidebarOpen || isMobile) && toggleSubMenu(item.name)}
                      className={`w-full flex items-center px-2 py-2 rounded-lg transition-colors text-left min-h-[44px] ${
                        hasActiveChild ? 'bg-accent-green/15 text-accent-green' : 'text-text-muted hover:bg-border-line hover:text-text-main'
                      } ${(!sidebarOpen && !isMobile) ? 'justify-center' : ''}`}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      {(sidebarOpen || isMobile) && (
                        <>
                          <span className="ml-2.5 text-sm font-medium flex-1">{item.name}</span>
                          <ChevronDown size={14} className={`transition-transform ${isSubOpen ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                    {(sidebarOpen || isMobile) && isSubOpen && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                              `flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors text-sm min-h-[40px] ${
                                isActive ? 'bg-accent-green/20 text-accent-green font-medium' : 'text-text-muted hover:bg-border-line hover:text-text-main'
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
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-2 rounded-lg transition-colors min-h-[44px] ${
                      isActive ? 'bg-accent-green/20 text-accent-green' : 'text-text-muted hover:bg-border-line hover:text-text-main'
                    } ${(!sidebarOpen && !isMobile) ? 'justify-center' : ''}`
                  }
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {(sidebarOpen || isMobile) && <span className="ml-2.5 text-sm font-medium">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border-line flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`flex items-center px-2 py-2 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full min-h-[44px] ${(!sidebarOpen && !isMobile) ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {(sidebarOpen || isMobile) && <span className="ml-2.5 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main area — full width on mobile, adjusted on desktop */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="bg-card-bg border-b border-border-line px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-card">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-border-line transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-text-main" />
          </button>

          {/* Grade badge */}
          <div className="bg-accent-green/10 text-accent-green border border-accent-green/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 flex-shrink-0">
            <Shield size={12} />
            <span>Grade {user?.gradeHeadFor} Head</span>
          </div>

          {/* Search bar — desktop only inline, mobile as toggle */}
          <div className="hidden md:flex relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search any student across all grades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border-line rounded-xl bg-border-line/50 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green focus:bg-card-bg transition-all"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {/* Desktop search results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-card-bg rounded-xl shadow-card border border-border-line z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border-line text-xs text-text-muted font-medium">
                  {searchResults.length} student{searchResults.length !== 1 ? 's' : ''} found
                </div>
                {searchResults.map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => { navigate(`/grade-head/students/${student.id}`); setSearchQuery(''); setShowSearchResults(false); }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-border-line transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-accent-green">
                        {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-text-muted">{student.class_name || 'No class'} {student.grade_level ? `• Grade ${student.grade_level}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearchResults && searchQuery && searchResults.length === 0 && !searchLoading && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-card-bg rounded-xl shadow-card border border-border-line z-50 p-4 text-center text-sm text-text-muted">
                No students found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-border-line transition-colors"
            aria-label="Search"
          >
            {searchOpen ? <X size={20} className="text-text-main" /> : <Search size={20} className="text-text-main" />}
          </button>

          <span className="hidden lg:block text-sm text-text-muted ml-auto">{user?.name}</span>
        </header>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden px-4 py-2 bg-card-bg border-b border-border-line" ref={searchRef}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border-line rounded-xl bg-border-line/50 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green focus:bg-card-bg"
                autoFocus
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-1 bg-card-bg rounded-xl shadow-card border border-border-line overflow-hidden">
                {searchResults.map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => { navigate(`/grade-head/students/${student.id}`); setSearchQuery(''); setShowSearchResults(false); setSearchOpen(false); }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-border-line transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-accent-green">
                        {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-text-muted">{student.class_name || 'No class'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearchResults && searchQuery && searchResults.length === 0 && !searchLoading && (
              <p className="mt-2 text-center text-sm text-text-muted">No students found for "{searchQuery}"</p>
            )}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default GradeHeadLayout;
