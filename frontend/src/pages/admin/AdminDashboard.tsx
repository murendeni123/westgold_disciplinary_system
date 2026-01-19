import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Award, 
  Gavel, 
  TrendingDown, 
  UserCheck, 
  CheckCircle2,
  Activity,
  BarChart3,
  Shield,
  ChevronRight,
  RefreshCw,
  Zap,
  Target,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [pendingIncidents, setPendingIncidents] = useState<any[]>([]);
  const [, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, incidentsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getIncidents({ status: 'pending' }),
      ]);
      setStats(statsRes.data);
      // Filter for high/medium severity pending incidents
      const pending = incidentsRes.data.filter(
        (inc: any) => inc.severity === 'high' || inc.severity === 'medium'
      ).slice(0, 5);
      setPendingIncidents(pending);
      
      // Create recent activity from incidents
      const activity = incidentsRes.data.slice(0, 8).map((inc: any) => ({
        id: inc.id,
        type: 'incident',
        title: `${inc.incident_type} - ${inc.student_name}`,
        time: inc.incident_date,
        severity: inc.severity,
        status: inc.status,
      }));
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const attendanceData = stats?.todayAttendance ? [
    { name: 'Present', value: stats.todayAttendance.present || 0, color: '#10B981' },
    { name: 'Absent', value: stats.todayAttendance.absent || 0, color: '#EF4444' },
    { name: 'Late', value: stats.todayAttendance.late || 0, color: '#F59E0B' },
  ] : [];

  const totalAttendance = attendanceData.reduce((sum, item) => sum + item.value, 0);
  const attendanceRate = totalAttendance > 0 
    ? Math.round((attendanceData[0]?.value / totalAttendance) * 100) 
    : 0;

  // Weekly trend mock data (would come from API in production)
  const weeklyTrend = [
    { day: 'Mon', incidents: 12, merits: 25 },
    { day: 'Tue', incidents: 8, merits: 30 },
    { day: 'Wed', incidents: 15, merits: 22 },
    { day: 'Thu', incidents: 10, merits: 28 },
    { day: 'Fri', incidents: 6, merits: 35 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-gray-500">
              Welcome back! Here's what's happening with your school today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/incident-approval')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium">Review Incidents</span>
              {pendingIncidents.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {pendingIncidents.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { 
            label: 'Total Students', 
            value: stats?.totalStudents || 0, 
            icon: GraduationCap, 
            color: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            label: 'Teachers', 
            value: stats?.totalTeachers || 0, 
            icon: UserCheck, 
            color: 'from-emerald-500 to-emerald-600',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600'
          },
          { 
            label: 'Total Incidents', 
            value: stats?.totalIncidents || 0, 
            icon: AlertTriangle, 
            color: 'from-red-500 to-red-600',
            bgLight: 'bg-red-50',
            textColor: 'text-red-600'
          },
          { 
            label: 'Total Merits', 
            value: stats?.totalMerits || 0, 
            icon: Award, 
            color: 'from-amber-500 to-amber-600',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600'
          },
          { 
            label: 'Detentions', 
            value: stats?.scheduledDetentions || 0, 
            icon: Gavel, 
            color: 'from-purple-500 to-purple-600',
            bgLight: 'bg-purple-50',
            textColor: 'text-purple-600'
          },
          { 
            label: 'Pending Approval', 
            value: pendingIncidents.length, 
            icon: Clock, 
            color: 'from-orange-500 to-orange-600',
            bgLight: 'bg-orange-50',
            textColor: 'text-orange-600',
            urgent: pendingIncidents.length > 0
          },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group ${
                metric.urgent ? 'ring-2 ring-orange-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${metric.bgLight}`}>
                  <Icon className={`w-5 h-5 ${metric.textColor}`} />
                </div>
                {metric.urgent && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
              <p className="text-xs text-gray-500 font-medium">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Attendance Overview - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Attendance</h2>
              <p className="text-sm text-gray-500">Real-time attendance overview</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${attendanceRate >= 90 ? 'text-emerald-600' : attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                {attendanceRate}%
              </span>
              <span className="text-sm text-gray-500">attendance rate</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              {totalAttendance > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Students']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2" />
                    <p>No data yet</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stats Breakdown */}
            <div className="flex flex-col justify-center space-y-4">
              {attendanceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{item.value}</span>
                    <span className="text-sm text-gray-500">
                      ({totalAttendance > 0 ? Math.round((item.value / totalAttendance) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600">Total Students</span>
                  <span className="text-lg font-bold text-gray-900">{totalAttendance}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Approvals Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
              <p className="text-sm text-gray-500">Incidents awaiting review</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          {pendingIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 bg-emerald-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-medium text-gray-900">All caught up!</p>
              <p className="text-sm text-gray-500">No pending incidents to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncidents.slice(0, 4).map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className={`p-3 rounded-xl border-l-4 ${
                    incident.severity === 'high' 
                      ? 'bg-red-50 border-red-500' 
                      : 'bg-amber-50 border-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{incident.student_name}</p>
                      <p className="text-xs text-gray-600 truncate">{incident.incident_type}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      incident.severity === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/admin/incident-approval')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Review All
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Weekly Trend & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Weekly Trend</h2>
              <p className="text-sm text-gray-500">Incidents vs Merits this week</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-600">Incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">Merits</span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="meritGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#incidentGradient)" />
                <Area type="monotone" dataKey="merits" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#meritGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-500">Common administrative tasks</p>
            </div>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Students', icon: Users, path: '/admin/students', color: 'bg-blue-500' },
              { label: 'Manage Teachers', icon: UserCheck, path: '/admin/teachers', color: 'bg-emerald-500' },
              { label: 'Discipline Center', icon: Gavel, path: '/admin/discipline', color: 'bg-purple-500' },
              { label: 'Detention Sessions', icon: Clock, path: '/admin/detention-sessions', color: 'bg-orange-500' },
              { label: 'Reports & Analytics', icon: BarChart3, path: '/admin/reports', color: 'bg-indigo-500' },
              { label: 'WhatsApp Settings', icon: MessageSquare, path: '/admin/whatsapp', color: 'bg-green-500' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
                >
                  <div className={`p-2 ${action.color} rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Needing Attention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Students Needing Attention</h2>
              <p className="text-sm text-gray-500">Highest demerit points</p>
            </div>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          
          {stats?.worstStudents && stats.worstStudents.length > 0 ? (
            <div className="space-y-3">
              {stats.worstStudents.slice(0, 5).map((student: any, index: number) => (
                <div 
                  key={student.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/students/${student.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{student.demerit_points} pts</p>
                    <p className="text-xs text-gray-500">{student.incident_count} incidents</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mb-2" />
              <p>No students with demerits</p>
            </div>
          )}
        </motion.div>

        {/* Teacher Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Teacher Activity</h2>
              <p className="text-sm text-gray-500">Most active this month</p>
            </div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          
          {stats?.topTeachers && stats.topTeachers.length > 0 ? (
            <div className="space-y-3">
              {stats.topTeachers.slice(0, 5).map((teacher: any, index: number) => (
                <div 
                  key={teacher.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {teacher.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-bold text-red-600">{teacher.incident_count || 0}</p>
                      <p className="text-xs text-gray-500">Incidents</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-emerald-600">{teacher.merit_count || 0}</p>
                      <p className="text-xs text-gray-500">Merits</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <UserCheck className="w-12 h-12 mb-2" />
              <p>No teacher activity yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;

