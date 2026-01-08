import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Clock, Calendar, Award, Gavel, TrendingDown, Bell, Plus, UserCheck, BookOpen, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"
        />
      </div>
    );
  }

  const attendanceData = stats?.todayAttendance ? [
    { name: 'Present', value: stats.todayAttendance.present || 0 },
    { name: 'Absent', value: stats.todayAttendance.absent || 0 },
    { name: 'Late', value: stats.todayAttendance.late || 0 },
  ] : [];

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'Total Demerits',
      value: stats?.totalIncidents || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
    },
    {
      title: 'Total Merits',
      value: stats?.totalMerits || 0,
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      title: 'Scheduled Detentions',
      value: stats?.scheduledDetentions || 0,
      icon: Gavel,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'from-yellow-50 to-amber-50',
      badge: stats?.pendingApprovals > 0 ? 'Action needed' : undefined,
    },
    {
      title: "Today's Attendance",
      value: `${stats?.todayAttendance?.present || 0}/${stats?.todayAttendance?.total || 0}`,
      icon: Calendar,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Overview of the Positive Discipline System</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg cursor-pointer"
          >
            <Sparkles size={20} />
            <span className="font-semibold">Quick Actions</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
                    <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Clock size={12} />
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
          <Sparkles className="text-amber-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Manage Students', desc: 'Add, edit, or view students', icon: Users, color: 'from-blue-500 to-cyan-500', path: '/admin/students' },
            { label: 'Review Incidents', desc: 'Approve pending incidents', icon: AlertTriangle, color: 'from-red-500 to-pink-500', path: '/admin/behaviour' },
            { label: 'Incident Types', desc: 'Manage incident types', icon: Plus, color: 'from-purple-500 to-indigo-500', path: '/admin/incident-types' },
            { label: 'Merit Types', desc: 'Manage merit types', icon: Award, color: 'from-green-500 to-emerald-500', path: '/admin/merit-types' },
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

      {/* Worst Behaving Students */}
      {stats?.worstStudents && stats.worstStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Worst Behaving Students</h2>
            <TrendingDown className="text-red-600" size={24} />
          </div>
          <div className="overflow-x-auto">
            <Table
              columns={[
                { key: 'name', label: 'Student Name' },
                { key: 'student_id', label: 'Student ID' },
                { key: 'demerit_points', label: 'Demerit Points' },
                { key: 'incident_count', label: 'Incidents' },
              ]}
              data={stats.worstStudents}
            />
          </div>
        </motion.div>
      )}

      {/* Worst Behaving Classes */}
      {stats?.worstClasses && stats.worstClasses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Worst Behaving Classes</h2>
            <BookOpen className="text-orange-600" size={24} />
          </div>
          <div className="overflow-x-auto">
            <Table
              columns={[
                { key: 'class_name', label: 'Class' },
                { key: 'total_demerit_points', label: 'Total Demerit Points' },
                { key: 'students_with_incidents', label: 'Students with Incidents' },
              ]}
              data={stats.worstClasses}
            />
          </div>
        </motion.div>
      )}

      {/* Top Teachers */}
      {stats?.topTeachers && stats.topTeachers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Teacher Activity</h2>
            <UserCheck className="text-blue-600" size={24} />
          </div>
          <div className="overflow-x-auto">
            <Table
              columns={[
                { key: 'name', label: 'Teacher Name' },
                { key: 'incident_count', label: 'Demerits Logged' },
                { key: 'merit_count', label: 'Merits Logged' },
              ]}
              data={stats.topTeachers}
            />
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Today's Attendance Breakdown</h2>
            <Calendar className="text-amber-600" size={24} />
          </div>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Calendar className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No attendance data available</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Trend</h2>
            <TrendingUp className="text-amber-600" size={24} />
          </div>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
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
                <Bar dataKey="value" fill="url(#attendanceGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Calendar className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No attendance trend data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            System Notifications {unreadCount > 0 && <span className="text-amber-600">({unreadCount} unread)</span>}
          </h2>
          <Bell className="text-amber-600" size={24} />
        </div>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No new notifications</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif: any, index: number) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
                  notif.is_read === 0
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500'
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
                      className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                    >
                      Mark as read
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

