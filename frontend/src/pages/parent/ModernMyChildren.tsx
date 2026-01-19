import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import { motion } from 'framer-motion';
import { Award, AlertTriangle, Calendar, Users, ArrowRight, TrendingUp } from 'lucide-react';

const ModernMyChildren: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { students, loading: studentsLoading } = useParentStudents();
  const [children, setChildren] = useState<any[]>([]);
  const [childrenStats, setChildrenStats] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (students.length > 0) {
      setChildren(students);
      fetchChildrenStats();
    } else if (!studentsLoading) {
      setLoading(false);
    }
  }, [students, studentsLoading]);

  const fetchChildrenStats = async () => {
    try {
      if (students.length === 0) {
        setLoading(false);
        return;
      }

      const statsPromises = students.map(async (child: any) => {
        try {
          const [meritsRes, incidentsRes, attendanceRes] = await Promise.all([
            api.getMerits({ student_id: child.id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
            api.getIncidents({ student_id: child.id }),
            api.getAttendance({ student_id: child.id, start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
          ]);

          const totalMerits = meritsRes.data.length;
          const totalMeritPoints = meritsRes.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
          const totalIncidents = incidentsRes.data.length;
          const totalDemeritPoints = incidentsRes.data.reduce((sum: number, i: any) => sum + (i.points || 0), 0);
          const totalAttendance = attendanceRes.data.length;
          const presentCount = attendanceRes.data.filter((a: any) => a.status === 'present').length;
          const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';

          return {
            ...child,
            totalMerits,
            totalMeritPoints,
            totalIncidents,
            totalDemeritPoints,
            attendanceRate: parseFloat(attendanceRate),
          };
        } catch (error) {
          console.error(`Error fetching stats for child ${child.id}:`, error);
          return {
            ...child,
            totalMerits: 0,
            totalMeritPoints: 0,
            totalIncidents: 0,
            totalDemeritPoints: 0,
            attendanceRate: 0,
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      setChildrenStats(stats);

      const overall = {
        totalMerits: stats.reduce((sum, s) => sum + s.totalMerits, 0),
        totalMeritPoints: stats.reduce((sum, s) => sum + s.totalMeritPoints, 0),
        totalIncidents: stats.reduce((sum, s) => sum + s.totalIncidents, 0),
        totalDemeritPoints: stats.reduce((sum, s) => sum + s.totalDemeritPoints, 0),
        avgAttendanceRate: stats.length > 0 ? (stats.reduce((sum, s) => sum + s.attendanceRate, 0) / stats.length).toFixed(1) : 0,
      };
      setOverallStats(overall);
    } catch (error) {
      console.error('Error fetching children stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 mb-4"
          >
            <Users className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">My Children</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            View and manage all your children's information in one place
          </p>
        </div>
      </motion.div>

      {/* Overall Stats */}
      {overallStats && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStatCard
            title="Total Merits"
            value={overallStats.totalMerits}
            icon={Award}
            iconColor="text-green-600"
            bgGradient="from-green-500/10 to-emerald-500/10"
            subtitle={`${overallStats.totalMeritPoints} points`}
            delay={0.1}
          />
          <AnimatedStatCard
            title="Total Incidents"
            value={overallStats.totalIncidents}
            icon={AlertTriangle}
            iconColor="text-red-600"
            bgGradient="from-red-500/10 to-pink-500/10"
            subtitle={`${overallStats.totalDemeritPoints} points`}
            delay={0.2}
          />
          <AnimatedStatCard
            title="Avg Attendance"
            value={`${overallStats.avgAttendanceRate}%`}
            icon={Calendar}
            iconColor="text-blue-600"
            bgGradient="from-blue-500/10 to-cyan-500/10"
            delay={0.3}
          />
          <AnimatedStatCard
            title="Children"
            value={children.length}
            icon={Users}
            iconColor="text-purple-600"
            bgGradient="from-purple-500/10 to-pink-500/10"
            delay={0.4}
          />
        </motion.div>
      )}

      {/* Children Grid */}
      {childrenStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {childrenStats.map((child: any, index: number) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <ModernCard variant="glass" hover={true}>
                <div className="space-y-4">
                  {/* Child Header */}
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    >
                      {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{child.class_name || 'No class assigned'}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <Award className="text-green-600" size={16} />
                        <span className="text-xs font-medium text-gray-600">Merits</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{child.totalMerits}</p>
                      <p className="text-xs text-gray-500">{child.totalMeritPoints} pts</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="text-red-600" size={16} />
                        <span className="text-xs font-medium text-gray-600">Incidents</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{child.totalIncidents}</p>
                      <p className="text-xs text-gray-500">{child.totalDemeritPoints} pts</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 col-span-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="text-blue-600" size={16} />
                        <span className="text-xs font-medium text-gray-600">Attendance Rate</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900">{child.attendanceRate}%</p>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <TrendingUp className="text-blue-600" size={20} />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/parent/children/${child.id}`)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <span>View Profile</span>
                    <ArrowRight size={18} />
                  </motion.button>
                </div>
              </ModernCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6"
              >
                <Users className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Children Linked</h3>
              <p className="text-gray-600 mb-6">
                Link your child to start tracking their progress and activities
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/parent/link-child')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Link Your First Child
              </motion.button>
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModernMyChildren;

