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
          Welcome back, {user?.name?.split(' ')[0] || 'Parent'}! 👋
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
        {incidents && incidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.slice(0, 6).map((incident, index) => (
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
        ) : (
          <div className="text-center py-12">
            <p className="text-text-muted">No recent incidents</p>
          </div>
        )}
      </div>
    </div>
  );
}
