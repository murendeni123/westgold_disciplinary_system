# Parent Portal - Phased Build Guide

## ✅ Phase 1: Core Infrastructure (COMPLETED)

Created files:
- ✅ `core/api/client.ts` - Axios API client with interceptors
- ✅ `core/api/endpoints.ts` - API endpoint constants
- ✅ `core/socket/client.ts` - Socket.io client
- ✅ `core/socket/events.ts` - Socket event types
- ✅ `core/auth/AuthProvider.tsx` - Authentication context
- ✅ `core/providers/QueryProvider.tsx` - React Query provider
- ✅ `core/config/constants.ts` - App constants

## ✅ Phase 2: Shared Utilities (COMPLETED)

Created files:
- ✅ `shared/utils/cn.ts` - Class name merger
- ✅ `shared/utils/format.ts` - Date/number formatting
- ✅ `shared/components/ui/Button.tsx` - Button component
- ✅ `shared/components/ui/Card.tsx` - Card component
- ✅ `shared/components/ui/Badge.tsx` - Badge component

## 🔄 Phase 3: Remaining UI Components (IN PROGRESS)

Create these files next:

### StatCard Component
**File**: `shared/components/ui/StatCard.tsx`
```typescript
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/shared/utils/cn';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)} hover={false}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-muted uppercase tracking-wide">{label}</p>
          <motion.p
            className="text-3xl font-bold text-text mt-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {value}
          </motion.p>
          {trend && (
            <p className={cn(
              'text-sm mt-2 flex items-center gap-1',
              trend.isPositive ? 'text-success' : 'text-error'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </Card>
  );
}
```

### Loading Component
**File**: `shared/components/feedback/Loading.tsx`
```typescript
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
      {text && <p className="mt-4 text-text-muted">{text}</p>}
    </div>
  );
}
```

### Empty State Component
**File**: `shared/components/feedback/Empty.tsx`
```typescript
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface EmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Empty({ icon: Icon, title, description, action, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-background-border flex items-center justify-center mb-4">
          <Icon className="text-text-muted" size={32} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && <p className="text-text-muted mb-4 max-w-md">{description}</p>}
      {action}
    </div>
  );
}
```

## 📋 Phase 4: Layout Components

### Sidebar Component
**File**: `shared/components/layout/Sidebar.tsx`
```typescript
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
          'fixed top-0 left-0 h-screen w-72 bg-background-surface border-r border-background-border z-50',
          'lg:translate-x-0 lg:static'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-background-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-text-muted hover:bg-background-border hover:text-text'
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-background-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
```

## 📦 Phase 5: Complete Behaviour Module

### Types
**File**: `modules/behaviour/types/behaviour.types.ts`
```typescript
export interface Incident {
  id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  incident_type_id: number;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'escalated';
  date: string;
  consequences_applied?: string;
  demerit_points: number;
  created_at: string;
}

export interface IncidentFilters {
  student_id?: number;
  start_date?: string;
  end_date?: string;
  severity?: string;
  status?: string;
  incident_type_id?: number;
}

export interface BehaviourStats {
  total_incidents: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
}
```

### API Layer
**File**: `modules/behaviour/api/behaviour.api.ts`
```typescript
import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import { Incident, IncidentFilters, BehaviourStats } from '../types/behaviour.types';

export const behaviourApi = {
  getIncidents: (filters?: IncidentFilters) => {
    return apiClient.get<Incident[]>(API_ENDPOINTS.BEHAVIOUR.LIST, filters);
  },

  getIncident: (id: number) => {
    return apiClient.get<Incident>(API_ENDPOINTS.BEHAVIOUR.DETAIL(id));
  },

  getStats: (studentId?: number) => {
    return apiClient.get<BehaviourStats>(API_ENDPOINTS.BEHAVIOUR.STATS, { student_id: studentId });
  },
};
```

### Service Layer
**File**: `modules/behaviour/services/behaviour.service.ts`
```typescript
import { behaviourApi } from '../api/behaviour.api';
import { IncidentFilters } from '../types/behaviour.types';
import { formatDate } from '@/shared/utils/format';
import { SEVERITY_COLORS } from '@/core/config/constants';

export const behaviourService = {
  async getIncidents(filters?: IncidentFilters) {
    const response = await behaviourApi.getIncidents(filters);
    return response.data;
  },

  async getIncident(id: number) {
    const response = await behaviourApi.getIncident(id);
    return response.data;
  },

  async getStats(studentId?: number) {
    const response = await behaviourApi.getStats(studentId);
    return response.data;
  },

  getSeverityColor(severity: string) {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || 'info';
  },

  formatIncidentDate(date: string) {
    return formatDate(date);
  },
};
```

### Hook Layer
**File**: `modules/behaviour/hooks/useBehaviour.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { behaviourService } from '../services/behaviour.service';
import { IncidentFilters } from '../types/behaviour.types';
import { QUERY_KEYS } from '@/core/config/constants';

export function useBehaviour(filters?: IncidentFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENTS, filters],
    queryFn: () => behaviourService.getIncidents(filters),
  });
}

export function useIncident(id: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENT, id],
    queryFn: () => behaviourService.getIncident(id),
    enabled: !!id,
  });
}

export function useBehaviourStats(studentId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.BEHAVIOUR_STATS, studentId],
    queryFn: () => behaviourService.getStats(studentId),
  });
}
```

### Component - Incident Card
**File**: `modules/behaviour/components/IncidentCard.tsx`
```typescript
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Incident } from '../types/behaviour.types';
import { behaviourService } from '../services/behaviour.service';
import { AlertTriangle, Calendar, User } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
}

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const severityColor = behaviourService.getSeverityColor(incident.severity);

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${severityColor}/10 flex items-center justify-center`}>
            <AlertTriangle className={`text-${severityColor}`} size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text">{incident.incident_type}</h3>
            <p className="text-sm text-text-muted">{incident.student_name}</p>
          </div>
        </div>
        <Badge variant={severityColor as any}>
          {incident.severity}
        </Badge>
      </div>

      <p className="text-sm text-text-muted mb-4 line-clamp-2">
        {incident.description}
      </p>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{behaviourService.formatIncidentDate(incident.date)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>{incident.teacher_name}</span>
        </div>
      </div>
    </Card>
  );
}
```

## 🎯 Phase 6: Dashboard Page

**File**: `app/(dashboard)/page.tsx`
```typescript
'use client';

import { useAuth } from '@/core/auth/AuthProvider';
import { StatCard } from '@/shared/components/ui/StatCard';
import { useBehaviour } from '@/modules/behaviour/hooks/useBehaviour';
import { IncidentCard } from '@/modules/behaviour/components/IncidentCard';
import { Loading } from '@/shared/components/feedback/Loading';
import { Users, AlertTriangle, Calendar, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: incidents, isLoading } = useBehaviour({ 
    student_id: user?.children?.[0]?.id 
  });

  if (isLoading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-text-muted">
          Here's what's happening with your children today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Children"
          value={user?.children?.length || 0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Recent Incidents"
          value={incidents?.length || 0}
          trend={{ value: 12, isPositive: false }}
        />
        <StatCard
          icon={Calendar}
          label="Attendance"
          value="96%"
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          icon={Award}
          label="Merits Earned"
          value={45}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Recent Incidents */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Behaviour Incidents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents?.slice(0, 6).map((incident, index) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <IncidentCard incident={incident} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 🔧 Phase 7: Layout Files

### Dashboard Layout
**File**: `app/(dashboard)/layout.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <header className="h-16 bg-background-surface border-b border-background-border flex items-center px-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-background-border"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
```

### Root Layout
**File**: `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { QueryProvider } from '@/core/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Parent Portal - School Management',
  description: 'Monitor your children\'s academic and behavioral performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

## 🚀 Next Steps

1. Create all files listed above in their respective directories
2. Test the application: `npm run dev`
3. Build remaining modules following the Behaviour module pattern
4. Add authentication pages (login, onboarding)
5. Implement remaining features

## 📝 Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## ✅ Completion Checklist

- [x] Phase 1: Core Infrastructure
- [x] Phase 2: Shared Utilities  
- [ ] Phase 3: UI Components
- [ ] Phase 4: Layout Components
- [ ] Phase 5: Behaviour Module
- [ ] Phase 6: Dashboard Page
- [ ] Phase 7: Remaining Modules
- [ ] Phase 8: Authentication Pages
- [ ] Phase 9: Testing & Polish
