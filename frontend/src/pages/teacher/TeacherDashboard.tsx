import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import DetentionDutyNotification from '../../components/DetentionDutyNotification';
import { motion } from 'framer-motion';
import { BookOpen, AlertTriangle, Calendar, Bell, Award, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [behaviorData, setBehaviorData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detentionNotification, setDetentionNotification] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchBehaviorData();
    fetchAttendanceData();
    checkDetentionDuty();
  }, [user]);

  const checkDetentionDuty = async () => {
    try {
      // In real app, fetch from API
      // Mock: Check if teacher has new detention duty assignment
      const mockNotification = {
        id: 1,
        session_date: '2026-01-17',
        start_time: '15:00',
        end_time: '16:00',
        location: 'Room 101',
        student_count: 15,
        message: 'Please arrive 10 minutes early to prepare the room.',
      };
      
      // Simulate showing notification for new assignment
      // In real app, only show if there's a new unacknowledged assignment
      const hasNewAssignment = localStorage.getItem('show_detention_notification');
      if (hasNewAssignment === 'true') {
        setTimeout(() => {
          setDetentionNotification(mockNotification);
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking detention duty:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.getNotifications({ is_read: 'false' }),
        api.getUnreadCount(),
      ]);
      setNotifications(notifsRes.data.slice(0, 5));
      setUnreadCount(countRes.data.count);
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
      // Get incidents and merits for all students in teacher's classes
      const [incidentsRes, meritsRes] = await Promise.all([
        api.getIncidents({}),
        api.getMerits({ start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
      ]);

      const allIncidents = incidentsRes.data;
      const allMerits = meritsRes.data;

      // Group by month
      const monthlyData: Record<string, { incidents: number; merits: number; demeritPoints: number; meritPoints: number }> = {};

      allIncidents.forEach((incident: any) => {
        const month = new Date(incident.incident_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, merits: 0, demeritPoints: 0, meritPoints: 0 };
        }
        monthlyData[month].incidents++;
        monthlyData[month].demeritPoints += incident.points || 0;
      });

      allMerits.forEach((merit: any) => {
        const month = new Date(merit.merit_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, merits: 0, demeritPoints: 0, meritPoints: 0 };
        }
        monthlyData[month].merits++;
        monthlyData[month].meritPoints += merit.points || 0;
      });

      const chartData = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6); // Last 6 months

      setBehaviorData(chartData);
    } catch (error) {
      console.error('Error fetching behavior data:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      // Get attendance for last 30 days
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await api.getAttendance({ start_date: startDate });
      const attendanceRecords = response.data;

      // Group by date
      const dailyData: Record<string, { present: number; absent: number; late: number; total: number }> = {};

      attendanceRecords.forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) {
          dailyData[date] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        dailyData[date].total++;
        if (record.status === 'present') dailyData[date].present++;
        else if (record.status === 'absent') dailyData[date].absent++;
        else if (record.status === 'late') dailyData[date].late++;
      });

      const chartData = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

      setAttendanceData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  const statCards = [
    {
      title: 'My Classes',
      value: stats?.myClasses || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'My Incidents',
      value: stats?.myIncidents || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
    },
    {
      title: "Today's Attendance",
      value: `${stats?.todayAttendance?.present || 0}/${stats?.todayAttendance?.total || 0}`,
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      title: 'Merits Awarded',
      value: stats?.myMerits || 0,
      icon: Award,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
    },
    {
      title: 'Notifications',
      value: unreadCount,
      icon: Bell,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      badge: unreadCount > 0 ? `${unreadCount} unread` : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Teacher Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Welcome back, {user?.name}! Here's your overview</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg cursor-pointer"
          >
            <Sparkles size={20} />
            <span className="font-semibold">Quick Actions</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  {stat.badge && (
                    <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <Bell size={12} />
                      <span className="text-xs font-semibold">{stat.badge}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <Sparkles className="text-emerald-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Log Incident', desc: 'Record a behavior incident', icon: AlertTriangle, color: 'from-red-500 to-pink-500', path: '/teacher/behaviour/log' },
            { label: 'Award Merit', desc: 'Recognize positive behavior', icon: Award, color: 'from-green-500 to-emerald-500', path: '/teacher/merits/award' },
            { label: 'Take Attendance', desc: 'Mark daily attendance', icon: Calendar, color: 'from-blue-500 to-cyan-500', path: '/teacher/attendance/daily' },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className={`p-6 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-xl transition-all duration-200 text-left group`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{action.label}</p>
                    <p className="text-sm text-white/80">{action.desc}</p>
                  </div>
                  <ArrowRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Behavior Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Behavior Trends (Last 6 Months)</h2>
          <TrendingUp className="text-emerald-600" size={24} />
        </div>
        {behaviorData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Incidents vs Merits</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="incidents" fill="url(#incidentGradient)" name="Incidents" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="merits" fill="url(#meritGradient)" name="Merits" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#F87171" />
                    </linearGradient>
                    <linearGradient id="meritGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Points Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="demeritPoints" stroke="url(#demeritLineGradient)" strokeWidth={3} dot={{ fill: '#EF4444', r: 6 }} name="Demerit Points" />
                  <Line type="monotone" dataKey="meritPoints" stroke="url(#meritLineGradient)" strokeWidth={3} dot={{ fill: '#10B981', r: 6 }} name="Merit Points" />
                  <defs>
                    <linearGradient id="demeritLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#F87171" />
                    </linearGradient>
                    <linearGradient id="meritLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
              <p>No behavior data available</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Attendance Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Attendance Trends (Last 14 Days)</h2>
          <Calendar className="text-emerald-600" size={24} />
        </div>
        {attendanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="url(#presentGradient)" name="Present" radius={[8, 8, 0, 0]} />
              <Bar dataKey="late" stackId="a" fill="url(#lateGradient)" name="Late" radius={[8, 8, 0, 0]} />
              <Bar dataKey="absent" stackId="a" fill="url(#absentGradient)" name="Absent" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#F87171" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <Calendar className="mx-auto mb-2 text-gray-400" size={48} />
              <p>No attendance data available</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Today's Attendance Pie Chart */}
      {stats?.todayAttendance && stats.todayAttendance.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Today's Attendance Overview</h2>
            <Calendar className="text-emerald-600" size={24} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Present', value: stats.todayAttendance.present || 0 },
                  { name: 'Absent', value: stats.todayAttendance.absent || 0 },
                  { name: 'Late', value: stats.todayAttendance.late || 0 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
                <Cell fill="#F59E0B" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Notifications {unreadCount > 0 && <span className="text-emerald-600">({unreadCount} unread)</span>}
            </h2>
            <Bell className="text-emerald-600" size={24} />
          </div>
          <div className="space-y-3">
            {notifications.map((notif: any, index: number) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
                  notif.is_read === 0
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{notif.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {notif.is_read === 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        await api.markNotificationRead(notif.id);
                        fetchNotifications();
                      }}
                      className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                    >
                      Mark as read
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detention Duty Notification */}
      <DetentionDutyNotification
        notification={detentionNotification}
        onClose={() => setDetentionNotification(null)}
        onAcknowledge={() => {
          localStorage.removeItem('show_detention_notification');
          setDetentionNotification(null);
        }}
      />
    </div>
  );
};

export default TeacherDashboard;

