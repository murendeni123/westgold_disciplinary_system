import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import DetentionDutyNotification from '../../components/DetentionDutyNotification';
import { motion } from 'framer-motion';
import { BookOpen, AlertTriangle, Bell, Award, TrendingUp, Sparkles, ArrowRight, Users, ChevronRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [behaviorData, setBehaviorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detentionNotification, setDetentionNotification] = useState<any>(null);

  // Class-wide data
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [allClassIncidents, setAllClassIncidents] = useState<any[]>([]);
  const [allClassMerits, setAllClassMerits] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classDataLoading, setClassDataLoading] = useState(false);
  const [activityTab, setActivityTab] = useState<'incidents' | 'merits'>('incidents');

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchBehaviorData();
    fetchClassData();
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
      const [incidentsRes, meritsRes] = await Promise.all([
        api.getIncidents({}),
        api.getMerits({ start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
      ]);

      const allIncidents = incidentsRes.data;
      const allMerits = meritsRes.data;

      const now = new Date();
      const monthlyData: Record<string, { month: string; incidents: number; merits: number; demeritPoints: number; meritPoints: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[key] = { month: key, incidents: 0, merits: 0, demeritPoints: 0, meritPoints: 0 };
      }

      allIncidents.forEach((incident: any) => {
        const raw = incident.incident_date || incident.date || incident.created_at;
        if (!raw) return;
        const key = new Date(raw).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyData[key]) {
          monthlyData[key].incidents++;
          monthlyData[key].demeritPoints += incident.points_deducted || incident.points || 0;
        }
      });

      allMerits.forEach((merit: any) => {
        const raw = merit.merit_date || merit.date || merit.created_at;
        if (!raw) return;
        const key = new Date(raw).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyData[key]) {
          monthlyData[key].merits++;
          monthlyData[key].meritPoints += merit.points || 0;
        }
      });

      setBehaviorData(Object.values(monthlyData));
    } catch (error) {
      console.error('Error fetching behavior data:', error);
    }
  };

  const fetchClassData = async () => {
    setClassDataLoading(true);
    try {
      const classesRes = await api.getClasses();
      const classes: any[] = classesRes.data || [];
      setMyClasses(classes);

      if (classes.length === 0) return;

      // Fetch all data for all teacher's classes in parallel
      const classIds: number[] = classes.map((c: any) => c.id);
      const primaryClassId = classIds[0];

      const [incRes, merRes, stuRes] = await Promise.allSettled([
        api.getIncidents({ class_id: primaryClassId }),
        api.getMerits({ class_id: primaryClassId }),
        api.getStudents({ class_id: primaryClassId }),
      ]);

      if (incRes.status === 'fulfilled') setAllClassIncidents(incRes.value.data || []);
      if (merRes.status === 'fulfilled') setAllClassMerits(merRes.value.data || []);
      if (stuRes.status === 'fulfilled') setClassStudents(stuRes.value.data || []);
    } catch (error) {
      console.error('Error fetching class data:', error);
    } finally {
      setClassDataLoading(false);
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

  // Derived cross-teacher data
  const otherTeachersIncidents = allClassIncidents.filter(
    (inc: any) => inc.teacher_id !== user?.id
  );
  const otherTeachersMerits = allClassMerits.filter(
    (m: any) => m.teacher_id !== user?.id
  );

  // Severity distribution for class
  const severityCounts: Record<string, number> = {};
  allClassIncidents.forEach((inc: any) => {
    const s = (inc.severity || 'unknown').toLowerCase();
    severityCounts[s] = (severityCounts[s] || 0) + 1;
  });
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({ name, value }));
  const SEVERITY_COLORS: Record<string, string> = { critical: '#7C3AED', high: '#EF4444', medium: '#F59E0B', low: '#10B981' };

  // Top at-risk students (most incidents)
  const studentIncidentMap: Record<string, { name: string; id: number; incidents: number; merits: number }> = {};
  allClassIncidents.forEach((inc: any) => {
    const key = String(inc.student_id);
    if (!studentIncidentMap[key]) studentIncidentMap[key] = { name: inc.student_name, id: inc.student_id, incidents: 0, merits: 0 };
    studentIncidentMap[key].incidents++;
  });
  allClassMerits.forEach((m: any) => {
    const key = String(m.student_id);
    if (!studentIncidentMap[key]) studentIncidentMap[key] = { name: m.student_name, id: m.student_id, incidents: 0, merits: 0 };
    studentIncidentMap[key].merits++;
  });
  const atRiskStudents = Object.values(studentIncidentMap)
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 5);

  const statCards = [
    {
      title: 'My Classes',
      value: stats?.myClasses || myClasses.length || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      sub: myClasses[0]?.class_name || '',
    },
    {
      title: 'Class Students',
      value: classStudents.length,
      icon: Users,
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'from-indigo-50 to-violet-50',
      sub: 'enrolled',
    },
    {
      title: 'My Incidents',
      value: stats?.myIncidents || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
      sub: `${allClassIncidents.length} class total`,
    },
    {
      title: 'Merits Awarded',
      value: stats?.myMerits || 0,
      icon: Award,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
      sub: `${allClassMerits.length} class total`,
    },
    {
      title: 'Notifications',
      value: unreadCount,
      icon: Bell,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      badge: unreadCount > 0 ? `${unreadCount} unread` : undefined,
      sub: '',
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-5 cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                    <Icon className="text-white" size={20} />
                  </div>
                  {stat.badge && (
                    <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <Bell size={10} />
                      <span className="text-xs font-semibold">{stat.badge}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-medium text-gray-500 mb-0.5">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{stat.sub}</p>}
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

      {/* Class Overview: Severity + At-Risk */}
      {allClassIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Severity distribution */}
          {severityData.length > 0 && (
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Class Incident Severity</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {severityData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[entry.name] || '#94A3B8' }} />
                      <span className="capitalize text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top students by incidents */}
          <div className="lg:col-span-2 rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="text-amber-500" size={18} />
              <h3 className="text-lg font-bold text-gray-800">Students Needing Attention</h3>
            </div>
            {atRiskStudents.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No incidents logged for this class</div>
            ) : (
              <div className="space-y-2">
                {atRiskStudents.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/teacher/students/${s.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        idx === 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                        idx === 1 ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
                        'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>{s.name?.charAt(0) || 'S'}</div>
                      <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{s.incidents} incidents</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{s.merits} merits</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Cross-Teacher Class Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <UserCheck className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Class Activity from Other Staff</h2>
                <p className="text-sm text-gray-500">
                  Incidents &amp; merits logged by other teachers for your class students
                </p>
              </div>
            </div>
            {/* Tab switcher */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 self-start sm:self-auto">
              <button
                onClick={() => setActivityTab('incidents')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activityTab === 'incidents'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Incidents ({otherTeachersIncidents.length})
              </button>
              <button
                onClick={() => setActivityTab('merits')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activityTab === 'merits'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Merits ({otherTeachersMerits.length})
              </button>
            </div>
          </div>
        </div>

        {classDataLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : activityTab === 'incidents' ? (
          otherTeachersIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <AlertTriangle size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No incidents logged by other staff for your class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logged By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {otherTeachersIncidents.map((inc: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/teacher/students/${inc.student_id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                            {inc.student_name?.charAt(0) || 'S'}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{inc.student_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inc.incident_type_name || inc.incident_type || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          inc.severity === 'high' || inc.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          inc.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>{inc.severity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">-{inc.points_deducted || inc.points || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{inc.teacher_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {inc.incident_date || inc.date ? new Date(inc.incident_date || inc.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          inc.status === 'approved' || inc.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          inc.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>{inc.status || 'pending'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          otherTeachersMerits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Award size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No merits logged by other staff for your class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Merit Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Awarded By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {otherTeachersMerits.map((m: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/teacher/students/${m.student_id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                            {m.student_name?.charAt(0) || 'S'}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{m.student_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{m.merit_type || m.merit_type_name || 'General'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">+{m.points || 1}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.teacher_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {m.merit_date || m.date ? new Date(m.merit_date || m.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{m.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </motion.div>

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

