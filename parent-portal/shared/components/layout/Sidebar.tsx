'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Home, Users, AlertTriangle, Calendar, Award, 
  Clock, Target, Mail, Bell, Settings, LogOut 
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { cn } from '@/shared/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'My Children', href: '/children', icon: Users },
  { name: 'Behaviour', href: '/behaviour', icon: AlertTriangle },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Merits', href: '/merits', icon: Award },
  { name: 'Detentions', href: '/detentions', icon: Clock },
  { name: 'Interventions', href: '/interventions', icon: Target },
  { name: 'Messages', href: '/messages', icon: Mail },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20 }}
        className={cn(
          'fixed top-0 left-0 h-screen w-72 bg-[#121821] border-r border-[#1E293B] z-50',
          'lg:translate-x-0 lg:static'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#1E293B]">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#00E676] to-[#38BDF8] bg-clip-text text-transparent">
            Parent Portal
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-[#00E676]/10 text-[#00E676] border-l-4 border-[#00E676]'
                    : 'text-[#9CA3AF] hover:bg-[#1E293B] hover:text-[#E5E7EB]'
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#1E293B]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00E676] to-[#38BDF8] flex items-center justify-center text-[#121821] font-bold">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#E5E7EB] truncate">{user?.name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
