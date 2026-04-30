import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { api } from '../services/api';
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
  const { user, logout } = useAuth();
  const { customizations, getImageUrl } = useSchoolTheme();

  // Track parent setup status
  const [hasLinkedSchool, setHasLinkedSchool] = useState(false);
  const [hasLinkedChild, setHasLinkedChild] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  // Check if parent has completed setup (linked school and child)
  useEffect(() => {
    const checkParentSetup = async () => {
      if (user?.role !== 'parent') {
        setSetupChecked(true);
        return;
      }

      try {
        // Check for linked school - simply trust user.school_id
        setHasLinkedSchool(!!user.school_id);

        // Check for children - we can infer from the children page data
        // For now, check if user has children property or fetch from API
        if (user.children && user.children.length > 0) {
          setHasLinkedChild(true);
        } else {
          // Try to fetch children count from students endpoint
          try {
            const childrenRes = await api.getStudents();
            // Filter for students linked to this parent
            const myChildren = childrenRes.data?.filter?.((s: any) => s.parent_id === user.id) || [];
            setHasLinkedChild(myChildren.length > 0);
          } catch {
            // If we can't fetch, assume no children yet
            setHasLinkedChild(false);
          }
        }
      } catch (error) {
        console.error('Error checking parent setup:', error);
      } finally {
        setSetupChecked(true);
      }
    };

    checkParentSetup();
  }, [user]);

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
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] sm:w-80 bg-card-bg shadow-card border-r border-border-line transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Premium Header with Gradient */}
          <div className="relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green to-accent-cyan" />
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23121821%22 fill-opacity=%221%22 fill-rule=%22evenodd%22%3E%3Cpath d=%22M0 40L40 0H20L0 20M40 40V20L20 40%22/%3E%3C/g%3E%3C/svg%3E')]" />

            {/* Static orb */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-card-bg/10 rounded-full blur-xl opacity-40" />

            {/* Header Content */}
            <div className="relative z-10 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {customizations?.logo_path ? (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-card-bg/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                      <img 
                        src={getImageUrl(customizations.logo_path) || ''} 
                        alt="Logo" 
                        className="h-5 sm:h-6 w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <motion.div 
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-card-bg/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <GraduationCap className="text-card-bg" size={20} />
                    </motion.div>
                  )}
                  <div>
                    <span className="font-bold text-lg sm:text-xl text-card-bg tracking-tight">
                      DMS
                    </span>
                    <div className="flex items-center space-x-1">
                      <Sparkles size={10} className="text-card-bg/80" />
                      <span className="text-[10px] text-card-bg/70 uppercase tracking-wider hidden sm:block">
                        Parent Portal
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="lg:hidden min-w-[44px] min-h-[44px] bg-card-bg/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-card-bg hover:bg-card-bg/30 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="px-3 sm:px-4 -mt-3 relative z-20">
            <motion.div 
              className="bg-border-line/50 rounded-xl sm:rounded-2xl shadow-card border border-border-line p-3 sm:p-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-accent-green to-accent-cyan rounded-lg sm:rounded-xl flex items-center justify-center text-card-bg font-bold text-base sm:text-lg shadow-primary">
                    {user?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-green rounded-full border-2 border-card-bg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-text-main truncate">
                    {user?.name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="h-4" />

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
            <ul className="space-y-1 sm:space-y-2">
              {parentMenu.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-3 rounded-xl transition-colors min-h-[48px] ${
                        active 
                          ? 'bg-accent-green text-card-bg shadow-primary' 
                          : 'text-text-muted hover:bg-border-line hover:text-text-main'
                      }`}
                    >
                      <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-3 sm:p-4 border-t border-border-line">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-3 rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors min-h-[48px]"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-xs sm:text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ModernSidebar;

