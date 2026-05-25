import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisibilityAwareInterval } from '../../hooks/useVisibilityAwareInterval';
import { 
  Users, AlertTriangle, Clock, Calendar, Award, Gavel, TrendingDown, Bell,
  UserCheck, BookOpen, ArrowRight, AlertCircle, XCircle, MessageSquare,
  ClipboardList, ChevronRight, Zap, Shield, FileText, X, RefreshCw, Target,
  Copy, Check, Key, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalPrefix } from '../../hooks/usePortalPrefix';
import { useLanguage } from '../../contexts/LanguageContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface CriticalAlerts {
  thresholdStudents: any[];
  classesWithoutAttendance: any[];
  pendingIncidents: any[];
  todayDetentions: any[];
  alertCounts: {
    thresholdViolations: number;
    missingAttendance: number;
    pendingApprovals: number;
    todayDetentions: number;
  };
}

interface AtRiskStudents {
  repeatedAbsences: any[];
  repeatDemerits: any[];
  decliningBehavior: any[];
  riskCounts: {
    absenceRisk: number;
    behaviorRisk: number;
    declining: number;
  };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const portal = usePortalPrefix();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlerts | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudents | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teacherActivity, setTeacherActivity] = useState<any>(null);
  const [classProfile, setClassProfile] = useState<any>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [behaviorTrendData, setBehaviorTrendData] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [recentMerits, setRecentMerits] = useState<any[]>([]);
  const [goldieBadgeHolders, setGoldieBadgeHolders] = useState<any[]>([]);
  const [goldieBadgeThreshold, setGoldieBadgeThreshold] = useState<number>(10);

  const copySchoolCode = () => {
    if (schoolInfo?.school_code) {
      navigator.clipboard.writeText(schoolInfo.school_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  useEffect(() => {
    // Verify token exists before making API calls
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('=== Dashboard Initialization ===');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('User data:', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          schoolId: userData.schoolId,
          schemaName: userData.schemaName
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    if (!token) {
      console.error('❌ No token found in localStorage - user needs to log in');
      return;
    }
    
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Fetch school info and dashboard data in parallel
      // The x-school-id header from token is sufficient for API calls
      const [statsRes, schoolInfoRes, alertsRes, riskRes, notifsRes, countRes, incRes, merRes, goldieBadgeRes] = await Promise.all([
        api.getDashboardStats().catch((err) => {
          console.error('Error fetching dashboard stats:', err);
          return { data: null };
        }),
        api.getCurrentSchoolInfo().catch((err) => {
          console.error('Error fetching school info:', err);
          return { data: null };
        }),
        api.getCriticalAlerts().catch((err) => {
          console.error('Error fetching critical alerts:', err);
          return { data: null };
        }),
        api.getAtRiskStudents().catch((err) => {
          console.error('Error fetching at-risk students:', err);
          return { data: null };
        }),
        api.getNotifications({ is_read: 'false' }).catch((err) => {
          console.error('Error fetching notifications:', err);
          return { data: [] };
        }),
        api.getUnreadCount().catch((err) => {
          console.error('Error fetching unread count:', err);
          return { data: { count: 0 } };
        }),
        api.getIncidents().catch(() => ({ data: [] })),
        api.getMerits().catch(() => ({ data: [] })),
        api.getGoldieBadgeLeaderboard().catch(() => ({ data: { holders: [], threshold: 10 } })),
      ]);

      console.log('Dashboard stats response:', statsRes?.data);
      console.log('School info response:', schoolInfoRes?.data);

      setStats(statsRes.data);
      setSchoolInfo(schoolInfoRes.data);
      setCriticalAlerts(alertsRes.data);
      setAtRiskStudents(riskRes.data);
      setNotifications(notifsRes.data?.slice(0, 5) || []);
      setUnreadCount(countRes.data?.count || 0);
      setGoldieBadgeHolders(goldieBadgeRes.data?.holders || []);
      setGoldieBadgeThreshold(goldieBadgeRes.data?.threshold || 10);

      // Build 6-month trend from incidents + merits
      const allInc: any[] = incRes.data || [];
      const allMer: any[] = merRes.data || [];
      const now = new Date();
      const monthMap: Record<string, { month: string; incidents: number; merits: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthMap[key] = { month: key, incidents: 0, merits: 0 };
      }
      allInc.forEach((inc: any) => {
        const raw = inc.incident_date || inc.date || inc.created_at;
        if (!raw) return;
        const key = new Date(raw).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthMap[key]) monthMap[key].incidents++;
      });
      allMer.forEach((m: any) => {
        const raw = m.merit_date || m.date || m.created_at;
        if (!raw) return;
        const key = new Date(raw).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthMap[key]) monthMap[key].merits++;
      });
      setBehaviorTrendData(Object.values(monthMap));
      setRecentIncidents(allInc.slice(0, 6));
      setRecentMerits(allMer.slice(0, 6));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Use visibility-aware interval to prevent mobile reload issues
  // staleAfterMs ensures we only re-fetch on foreground if data is actually stale
  useVisibilityAwareInterval(fetchAllData, 5 * 60 * 1000, { pauseWhenHidden: true, staleAfterMs: 5 * 60 * 1000 });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleTeacherClick = async (teacher: any) => {
    setShowTeacherModal(true);
    try {
      const response = await api.getTeacherActivity(teacher.id);
      setTeacherActivity(response.data);
    } catch (error) {
      console.error('Error fetching teacher activity:', error);
    }
  };

  const handleClassClick = async (classItem: any) => {
    setShowClassModal(true);
    try {
      const response = await api.getClassProfile(classItem.id);
      setClassProfile(response.data);
    } catch (error) {
      console.error('Error fetching class profile:', error);
    }
  };

  const totalCriticalAlerts = criticalAlerts?.alertCounts 
    ? Object.values(criticalAlerts.alertCounts).reduce((a, b) => a + b, 0) 
    : 0;

  const totalAtRisk = atRiskStudents?.riskCounts
    ? Object.values(atRiskStudents.riskCounts).reduce((a, b) => a + b, 0)
    : 0;

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

  const quickActions = [
    { label: t('behaviour.logIncident'), desc: t('behaviour.logIncident'), icon: AlertTriangle, color: 'from-red-500 to-pink-500', path: '/admin/behaviour/log' },
    { label: t('merits.awardMerit'), desc: t('merits.awardMerit'), icon: Award, color: 'from-green-500 to-emerald-500', path: '/admin/merits/award' },
    { label: t('consequences.assignConsequence'), desc: t('consequences.assignConsequence'), icon: Shield, color: 'from-purple-500 to-indigo-500', path: '/admin/consequence-management' },
    { label: t('detentions.addDetention'), desc: t('detentions.addDetention'), icon: Gavel, color: 'from-orange-500 to-amber-500', path: '/admin/detention-sessions' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {t('portals.admin')}
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 transition-all"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span className="font-medium">{t('dashboard.refresh')}</span>
        </motion.button>
      </motion.div>

      {/* School Code Banner */}
      {schoolInfo?.school_code && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-4 md:p-5 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Key size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{t('dashboard.schoolCode')}</p>
                <p className="text-2xl md:text-3xl font-bold text-white tracking-wider font-mono">
                  {schoolInfo.school_code}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <p className="text-white/70 text-sm hidden md:block">{t('settings.shareCode')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copySchoolCode}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all"
              >
                {copiedCode ? (
                  <>
                    <Check size={18} className="text-green-300" />
                    <span className="text-white font-medium">{t('copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} className="text-white" />
                    <span className="text-white font-medium">{t('dashboard.copySchoolCode')}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Critical Alerts Banner */}
      {totalCriticalAlerts > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 md:p-6 text-white shadow-xl"
        >
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertCircle size={28} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold">🔴 Critical Alerts</h2>
                <p className="text-white/80">{totalCriticalAlerts} items require immediate attention</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(criticalAlerts?.alertCounts?.thresholdViolations ?? 0) > 0 && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {criticalAlerts?.alertCounts?.thresholdViolations} threshold violations
                </span>
              )}
              {(criticalAlerts?.alertCounts?.missingAttendance ?? 0) > 0 && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {criticalAlerts?.alertCounts?.missingAttendance} missing attendance
                </span>
              )}
              {(criticalAlerts?.alertCounts?.pendingApprovals ?? 0) > 0 && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {criticalAlerts?.alertCounts?.pendingApprovals} pending approvals
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
              <Zap size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">🟢 Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className={`p-4 md:p-5 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-xl transition-all text-left group`}
              >
                <div className="flex flex-col space-y-3">
                  <div className="p-2 bg-white/20 rounded-lg w-fit backdrop-blur-sm">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base">{action.label}</p>
                    <p className="text-xs text-white/70 hidden md:block">{action.desc}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: t('nav.students'), value: stats?.totalStudents || 0, icon: Users, color: 'blue' },
          { title: t('behaviour.title'), value: stats?.totalIncidents || 0, icon: AlertTriangle, color: 'red' },
          { title: t('merits.title'), value: stats?.totalMerits || 0, icon: Award, color: 'green' },
          { title: t('detentions.title'), value: stats?.scheduledDetentions || 0, icon: Gavel, color: 'orange' },
          { title: t('pending'), value: stats?.pendingApprovals || 0, icon: Clock, color: 'yellow', badge: stats?.pendingApprovals > 0 },
          { title: t('attendance.title'), value: `${Math.round(((stats?.todayAttendance?.present || 0) / (stats?.todayAttendance?.total || 1)) * 100)}%`, icon: Calendar, color: 'emerald' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, string> = {
            blue: 'from-blue-500 to-cyan-500',
            red: 'from-red-500 to-pink-500',
            green: 'from-green-500 to-emerald-500',
            orange: 'from-orange-500 to-amber-500',
            yellow: 'from-yellow-500 to-amber-500',
            emerald: 'from-emerald-500 to-teal-500',
          };
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[stat.color]} shadow-md`}>
                  <Icon className="text-white" size={18} />
                </div>
                {stat.badge && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Critical Alerts Details */}
          {criticalAlerts && (criticalAlerts.thresholdStudents.length > 0 || criticalAlerts.classesWithoutAttendance.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="text-red-500" size={24} />
                  <h2 className="text-lg font-bold text-gray-900">🔴 Critical Issues</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {criticalAlerts.thresholdStudents.slice(0, 3).map((student, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => navigate(`${portal}/students/${student.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="text-red-500" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.class_name || 'No class'} • {student.total_demerits} demerits</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                      Threshold Exceeded
                    </span>
                  </div>
                ))}
                {criticalAlerts.classesWithoutAttendance.slice(0, 3).map((cls, idx) => (
                  <div 
                    key={`att-${idx}`} 
                    className="p-4 hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => handleClassClick(cls)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Calendar className="text-orange-500" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cls.class_name}</p>
                        <p className="text-sm text-gray-500">{cls.teacher_name || 'No teacher'} • {cls.student_count} students</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      No Attendance
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* At-Risk Students */}
          {atRiskStudents && totalAtRisk > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="flex items-center space-x-3">
                  <Shield className="text-amber-500" size={24} />
                  <h2 className="text-lg font-bold text-gray-900">🟠 At-Risk Students</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {atRiskStudents.repeatedAbsences.slice(0, 2).map((student, idx) => (
                  <div 
                    key={`abs-${idx}`} 
                    className="p-4 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => navigate(`${portal}/students/${student.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <XCircle className="text-amber-600" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.class_name || 'No class'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                      {student.absence_count} absences
                    </span>
                  </div>
                ))}
                {atRiskStudents.repeatDemerits.slice(0, 2).map((student, idx) => (
                  <div 
                    key={`dem-${idx}`} 
                    className="p-4 hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => navigate(`${portal}/students/${student.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <TrendingDown className="text-orange-600" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.class_name || 'No class'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {student.incident_count} incidents
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Worst Classes - Clickable */}
          {stats?.worstClasses && stats.worstClasses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="text-purple-500" size={24} />
                    <h2 className="text-lg font-bold text-gray-900">Classes Overview</h2>
                  </div>
                  <span className="text-sm text-gray-500">Click to view details</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.worstClasses.slice(0, 5).map((cls: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between group"
                    onClick={() => handleClassClick(cls)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cls.class_name}</p>
                        <p className="text-sm text-gray-500">{cls.students_with_incidents} students with incidents</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        {cls.total_demerit_points} pts
                      </span>
                      <ChevronRight className="text-gray-400 group-hover:text-purple-500 transition-colors" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Teacher Activity - Clickable */}
          {stats?.topTeachers && stats.topTeachers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="text-blue-500" size={24} />
                    <h2 className="text-lg font-bold text-gray-900">Teacher Activity</h2>
                  </div>
                  <span className="text-sm text-gray-500">Click to view log</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.topTeachers.slice(0, 5).map((teacher: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-between group"
                    onClick={() => handleTeacherClick(teacher)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {teacher.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                        <p className="text-sm text-gray-500">
                          {teacher.incident_count} demerits • {teacher.merit_count} merits
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Students Doing Great */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="text-emerald-500" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Students Doing Great</h2>
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                  Top Performers
                </span>
              </div>
            </div>
            {(stats?.topStudents || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Award size={32} className="mb-2" />
                <p className="text-sm">No merit data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {(stats?.topStudents || []).map((student: any, idx: number) => (
                  <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.class_name || 'No class'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600">+{student.net_points} pts</span>
                      <p className="text-xs text-gray-400">{student.merit_count} merits</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Classes Doing Well */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="text-blue-500" size={20} />
                  <h2 className="text-lg font-bold text-gray-900">Classes Doing Well</h2>
                </div>
                <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                  Top Classes
                </span>
              </div>
            </div>
            {(stats?.topClasses || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <BookOpen size={32} className="mb-2" />
                <p className="text-sm">No class data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(stats?.topClasses || []).map((cls: any, idx: number) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{cls.class_name}</p>
                        <p className="text-xs text-gray-500">{cls.student_count} students · {cls.students_earning_merits} earning merits</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-600">+{cls.net_class_points} pts</span>
                      <p className="text-xs text-gray-400">{cls.total_merit_points} merit pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pending Approvals */}
          {criticalAlerts?.pendingIncidents && criticalAlerts.pendingIncidents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-amber-500" size={20} />
                    <h3 className="font-bold text-gray-900">Pending Approvals</h3>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    {criticalAlerts.pendingIncidents.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {criticalAlerts.pendingIncidents.map((incident, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`${portal}/behaviour`)}
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{incident.student_name}</p>
                    <p className="text-xs text-gray-500 truncate">{incident.description}</p>
                    <p className="text-xs text-gray-400 mt-1">by {incident.teacher_name}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <button 
                  onClick={() => navigate(`${portal}/behaviour`)}
                  className="w-full py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  View All Pending →
                </button>
              </div>
            </motion.div>
          )}

          {/* Goldie Badge Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
          >
            <div className="p-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
                    <Star className="text-white" size={16} fill="white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Goldie Badge Holders</h3>
                    <p className="text-xs text-amber-600">≥ {goldieBadgeThreshold} clean points</p>
                  </div>
                </div>
                {goldieBadgeHolders.length > 0 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                    {goldieBadgeHolders.length}
                  </span>
                )}
              </div>
            </div>
            {goldieBadgeHolders.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Star size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No badge holders yet</p>
                <p className="text-xs mt-1">Students need {goldieBadgeThreshold}+ clean points</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-50 max-h-64 overflow-y-auto">
                {goldieBadgeHolders.map((holder: any, idx: number) => (
                  <div key={holder.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-300 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <Star size={13} className="text-amber-400 shrink-0" fill="#fbbf24" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{holder.student_name}</p>
                      <p className="text-xs text-gray-400 truncate">{holder.class_name}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0">{holder.clean_points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* More Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-5 text-white"
          >
            <h3 className="font-bold text-lg mb-4">More Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Students', path: '/admin/students', icon: Users },
                { label: 'View Reports', path: '/admin/reports', icon: FileText },
                { label: 'Discipline Rules', path: '/admin/discipline-rules', icon: Target },
                { label: 'Behaviour Dashboard', path: '/admin/behaviour', icon: AlertCircle },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Behavior Trend Chart */}
      {behaviorTrendData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                <TrendingDown size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">School-Wide Behaviour Trend (Last 6 Months)</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={behaviorTrendData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <defs>
                <linearGradient id="adIncGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#FCA5A5" />
                </linearGradient>
                <linearGradient id="adMerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#6EE7B7" />
                </linearGradient>
              </defs>
              <Bar dataKey="incidents" fill="url(#adIncGrad)" name="Demerits" radius={[5, 5, 0, 0]} />
              <Bar dataKey="merits" fill="url(#adMerGrad)" name="Merits" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent Activity Feed */}
      {(recentIncidents.length > 0 || recentMerits.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Recent Incidents */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="font-bold text-gray-900">Recent Demerits</h3>
              </div>
              <button onClick={() => navigate(`${portal}/discipline`)} className="text-xs text-red-500 hover:text-red-700 font-medium">View all →</button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentIncidents.map((inc: any, idx: number) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                  onClick={() => navigate(`${portal}/students/${inc.student_id}`)}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {inc.student_name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{inc.student_name}</p>
                      <p className="text-xs text-gray-500 truncate">{inc.incident_type_name || inc.incident_type}</p>
                      {(inc.incident_date || inc.created_at) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(inc.incident_date || inc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    inc.severity === 'high' || inc.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : inc.severity === 'medium' ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>{inc.severity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Merits */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="text-green-500" size={20} />
                <h3 className="font-bold text-gray-900">Recent Merits</h3>
              </div>
              <button onClick={() => navigate(`${portal}/discipline`)} className="text-xs text-green-500 hover:text-green-700 font-medium">View all →</button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentMerits.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                  onClick={() => navigate(`${portal}/students/${m.student_id}`)}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.student_name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{m.student_name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.merit_type || m.merit_type_name || 'Merit'}</p>
                      {(m.merit_date || m.created_at) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(m.merit_date || m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex-shrink-0">
                    +{m.points || 1} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Teacher Activity Modal */}
      <AnimatePresence>
        {showTeacherModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTeacherModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <div>
                  <h2 className="text-xl font-bold">{teacherActivity?.teacher?.name || 'Teacher Activity'}</h2>
                  <p className="text-blue-100 text-sm">{teacherActivity?.teacher?.email}</p>
                </div>
                <button onClick={() => setShowTeacherModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {teacherActivity ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">{teacherActivity.stats?.total_incidents || 0}</p>
                        <p className="text-sm text-gray-500">Demerits</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <p className="text-2xl font-bold text-green-600">{teacherActivity.stats?.total_merits || 0}</p>
                        <p className="text-sm text-gray-500">Merits</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600">{teacherActivity.stats?.class_count || 0}</p>
                        <p className="text-sm text-gray-500">Classes</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Recent Incidents</h3>
                      <div className="space-y-2">
                        {teacherActivity.recentIncidents?.slice(0, 5).map((inc: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{inc.student_name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${inc.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {inc.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{inc.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="animate-spin text-gray-400" size={32} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Profile Modal */}
      <AnimatePresence>
        {showClassModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClassModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <div>
                  <h2 className="text-xl font-bold">{classProfile?.classInfo?.class_name || 'Class Profile'}</h2>
                  <p className="text-purple-100 text-sm">Teacher: {classProfile?.classInfo?.teacher_name || 'Not assigned'}</p>
                </div>
                <button onClick={() => setShowClassModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {classProfile ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xl font-bold text-blue-600">{classProfile.stats?.studentCount || 0}</p>
                        <p className="text-xs text-gray-500">Students</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <p className="text-xl font-bold text-red-600">{classProfile.stats?.totalDemerits || 0}</p>
                        <p className="text-xs text-gray-500">Demerits</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-xl font-bold text-green-600">{classProfile.stats?.totalMerits || 0}</p>
                        <p className="text-xs text-gray-500">Merits</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-xl">
                        <p className="text-xl font-bold text-emerald-600">{classProfile.stats?.attendanceRate || 0}%</p>
                        <p className="text-xs text-gray-500">Attendance</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Students</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {classProfile.students?.map((student: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{student.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({student.student_id})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">{student.demerit_points} dem</span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{student.merit_points} mer</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="animate-spin text-gray-400" size={32} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
