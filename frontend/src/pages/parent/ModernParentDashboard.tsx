import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import ModernCard from '../../components/ModernCard';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  Bell, 
  Award,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ModernParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [behaviorData, setBehaviorData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLinkedSchool, setHasLinkedSchool] = useState(false);
  const [hasLinkedChild, setHasLinkedChild] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  useEffect(() => {
    checkSetupStatus();
    fetchStats();
    fetchNotifications();
    fetchBehaviorData();
    fetchAttendanceData();
  }, [user]);

  const checkSetupStatus = async () => {
    try {
      // Check if parent has linked a school
      const schoolsResponse = await api.getLinkedSchools();
      const hasSchool = schoolsResponse.data && schoolsResponse.data.length > 0;
      setHasLinkedSchool(hasSchool);

      // Check if parent has linked children
      const hasChildren = !!(user?.children && user.children.length > 0);
      setHasLinkedChild(hasChildren);

      setSetupChecked(true);
      
      // Note: Redirect logic is now handled in ModernParentLayout
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupChecked(true);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications({ is_read: 'false' });
      setNotifications(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBehaviorData = async () => {
    try {
      if (!user?.children || user.children.length === 0) return;

      const allIncidents: any[] = [];
      const allMerits: any[] = [];

      for (const child of user.children) {
        try {
          const [incidentsRes, meritsRes] = await Promise.all([
            api.getIncidents({ student_id: child.id }),
            api.getMerits({ student_id: child.id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
          ]);
          allIncidents.push(...incidentsRes.data);
          allMerits.push(...meritsRes.data);
        } catch (error) {
          console.error(`Error fetching data for child ${child.id}:`, error);
        }
      }

      const monthlyData: Record<string, { incidents: number; merits: number }> = {};

      allIncidents.forEach((incident: any) => {
        const month = new Date(incident.incident_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, merits: 0 };
        }
        monthlyData[month].incidents++;
      });

      allMerits.forEach((merit: any) => {
        const month = new Date(merit.merit_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, merits: 0 };
        }
        monthlyData[month].merits++;
      });

      const chartData = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6);

      setBehaviorData(chartData);
    } catch (error) {
      console.error('Error fetching behavior data:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      if (!user?.children || user.children.length === 0) return;

      const allAttendance: any[] = [];
      for (const child of user.children) {
        try {
          const response = await api.getAttendance({
            student_id: child.id,
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          allAttendance.push(...response.data);
        } catch (error) {
          console.error(`Error fetching attendance for child ${child.id}:`, error);
        }
      }

      const dailyData: Record<string, { present: number; total: number }> = {};
      allAttendance.slice(-14).forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) {
          dailyData[date] = { present: 0, total: 0 };
        }
        dailyData[date].total++;
        if (record.status === 'present') dailyData[date].present++;
      });

      const chartData = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(0) : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAttendanceData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl"
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
            <Sparkles className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">
              {hasLinkedSchool && hasLinkedChild 
                ? `Welcome back, ${user?.name}!` 
                : `Welcome, ${user?.name}!`}
            </h1>
          </motion.div>
          <p className="text-xl text-white/90 mb-6">
            {hasLinkedSchool && hasLinkedChild
              ? "Here's an overview of your children's progress and activities"
              : !hasLinkedSchool
              ? "Let's get you started by linking your school"
              : "Let's complete your setup by linking your children"}
          </p>
          {user?.children && user.children.length > 0 && (
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {user.children.slice(0, 3).map((child: any, index: number) => (
                  <motion.div
                    key={child.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center text-sm font-bold"
                  >
                    {child.first_name?.charAt(0)}
                  </motion.div>
                ))}
              </div>
              <span className="text-white/80">
                {user.children.length} {user.children.length === 1 ? 'child' : 'children'} linked
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <AnimatedStatCard
          title="My Children"
          value={stats?.myChildren || 0}
          icon={Users}
          iconColor="text-blue-600"
          bgGradient="from-blue-500/10 to-cyan-500/10"
          delay={0.1}
        />
        <AnimatedStatCard
          title="Total Incidents"
          value={stats?.childrenIncidents || 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgGradient="from-red-500/10 to-pink-500/10"
          delay={0.2}
        />
        <AnimatedStatCard
          title="Total Merits"
          value={stats?.childrenMerits || 0}
          icon={Award}
          iconColor="text-green-600"
          bgGradient="from-green-500/10 to-emerald-500/10"
          delay={0.3}
        />
        <AnimatedStatCard
          title="Notifications"
          value={unreadCount}
          icon={Bell}
          iconColor="text-yellow-600"
          bgGradient="from-yellow-500/10 to-amber-500/10"
          delay={0.4}
        />
      </motion.div>

      {/* Quick Actions */}
      {user?.children && user.children.length > 0 && (
        <motion.div variants={itemVariants}>
          <ModernCard title="Quick Actions" variant="glass">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Users, label: 'View Children', path: '/parent/children', color: 'blue' },
                { icon: Calendar, label: 'View Attendance', path: '/parent/attendance', color: 'green' },
                { icon: Award, label: 'View Merits', path: '/parent/merits', color: 'purple' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(action.path)}
                    className={`p-6 bg-gradient-to-br from-${action.color}-50 to-${action.color}-100/50 rounded-xl border border-${action.color}-200/50 hover:border-${action.color}-300 transition-all duration-300 text-left group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                          action.color === 'blue'
                            ? 'bg-blue-100'
                            : action.color === 'green'
                            ? 'bg-green-100'
                            : 'bg-purple-100'
                        }`}>
                          <Icon className={
                            action.color === 'blue'
                              ? 'text-blue-600'
                              : action.color === 'green'
                              ? 'text-green-600'
                              : 'text-purple-600'
                          } size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{action.label}</p>
                          <p className="text-sm text-gray-600">Quick access</p>
                        </div>
                      </div>
                      <ArrowRight className={`opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${
                        action.color === 'blue'
                          ? 'text-blue-400'
                          : action.color === 'green'
                          ? 'text-green-400'
                          : 'text-purple-400'
                      }`} size={20} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Charts Section */}
      {user?.children && user.children.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard title="Behavior Trends" variant="glass">
            {behaviorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="incidents" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="merits" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
                  <p>No behavior data available</p>
                </div>
              </div>
            )}
          </ModernCard>

          <ModernCard title="Attendance Rate" variant="glass">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Calendar className="mx-auto mb-2 text-gray-400" size={48} />
                  <p>No attendance data available</p>
                </div>
              </div>
            )}
          </ModernCard>
        </motion.div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <motion.div variants={itemVariants}>
          <ModernCard title="Recent Notifications" variant="glass">
            <div className="space-y-3">
              {notifications.map((notif: any, index: number) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bell className="text-blue-600" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Empty State */}
      {(!user?.children || user.children.length === 0) && (
        <motion.div
          variants={itemVariants}
          className="text-center py-16"
        >
          <ModernCard variant="glass">
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
          </ModernCard>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModernParentDashboard;

