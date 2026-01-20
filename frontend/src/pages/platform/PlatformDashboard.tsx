import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Sparkles, 
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Bell,
  RefreshCw,
  Server,
  Database,
  Wifi,
  Shield,
  Plus,
  CreditCard,
  FileText,
  Eye,
  ChevronRight,
  Zap,
  Crown,
  Star,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  ExternalLink
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const PlatformDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('7d');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      const response = await api.getPlatformAnalytics();
      setStats(response.data);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStats();
  };

  // System health status (mock - in real app from API)
  const systemHealth = {
    status: 'healthy', // healthy, degraded, down
    uptime: '99.9%',
    lastSync: lastSync,
    errors24h: 0,
    alerts: 2,
    services: [
      { name: 'API Server', status: 'online' },
      { name: 'Database', status: 'online' },
      { name: 'Payment Gateway', status: 'online' },
      { name: 'Email Service', status: 'online' },
    ]
  };

  // Calculate week-over-week changes (mock data)
  const getWeeklyChange = (current: number, type: string) => {
    const changes: Record<string, { value: number; isPositive: boolean }> = {
      schools: { value: 1, isPositive: true },
      users: { value: 12, isPositive: true },
      students: { value: 45, isPositive: true },
      revenue: { value: 8.5, isPositive: true },
    };
    return changes[type] || { value: 0, isPositive: true };
  };

  const statCards = [
    {
      title: 'Total Schools',
      value: stats?.total_schools || 0,
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      change: getWeeklyChange(stats?.total_schools, 'schools'),
      subtext: `${stats?.active_schools || 0} active, ${(stats?.total_schools || 0) - (stats?.active_schools || 0)} inactive`,
      type: 'schools'
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      change: getWeeklyChange(stats?.total_users, 'users'),
      subtext: 'Across all schools',
      type: 'users'
    },
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: GraduationCap,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      change: getWeeklyChange(stats?.total_students, 'students'),
      subtext: 'Enrolled students',
      type: 'students'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      change: getWeeklyChange(stats?.total_revenue, 'revenue'),
      subtext: 'This month',
      type: 'revenue'
    },
  ];

  const quickActions = [
    {
      title: 'Onboard School',
      description: 'Add a new school to the platform',
      icon: Plus,
      color: 'from-purple-500 to-pink-500',
      path: '/platform/schools/onboard'
    },
    {
      title: 'Create Plan',
      description: 'Set up a new subscription tier',
      icon: CreditCard,
      color: 'from-blue-500 to-cyan-500',
      path: '/platform/subscriptions'
    },
    {
      title: 'View Logs',
      description: 'Check system activity logs',
      icon: FileText,
      color: 'from-amber-500 to-orange-500',
      path: '/platform/logs'
    },
    {
      title: 'Review Payments',
      description: 'Manage billing & transactions',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      path: '/platform/billing'
    },
  ];

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue') 
                ? `$${entry.value.toLocaleString()}` 
                : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Platform Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Welcome back! Here's what's happening across your platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-white rounded-xl shadow-md border border-gray-100 p-1">
            {(['today', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tf === 'today' ? 'Today' : tf === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-3 rounded-xl bg-white shadow-md border border-gray-100 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <RefreshCw size={20} />
          </motion.button>
        </div>
      </motion.div>

      {/* System Overview Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* System Status */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">System Status</span>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              systemHealth.status === 'healthy' 
                ? 'bg-green-100 text-green-700' 
                : systemHealth.status === 'degraded'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                systemHealth.status === 'healthy' ? 'bg-green-500' : 
                systemHealth.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
              {systemHealth.status === 'healthy' ? 'Healthy' : 
               systemHealth.status === 'degraded' ? 'Degraded' : 'Issues'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              systemHealth.status === 'healthy' 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}>
              {systemHealth.status === 'healthy' ? (
                <CheckCircle size={24} className="text-white" />
              ) : (
                <AlertTriangle size={24} className="text-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{systemHealth.uptime} Uptime</p>
              <p className="text-xs text-gray-500">All services operational</p>
            </div>
          </div>
        </div>

        {/* Last Data Sync */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Last Data Sync</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {systemHealth.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500">
                {systemHealth.lastSync.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Errors (24h) */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Errors (24h)</span>
            {systemHealth.errors24h > 0 && (
              <span className="text-xs text-red-600 font-medium">Needs attention</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              systemHealth.errors24h === 0 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                : 'bg-gradient-to-br from-red-500 to-pink-500'
            }`}>
              {systemHealth.errors24h === 0 ? (
                <CheckCircle size={24} className="text-white" />
              ) : (
                <AlertCircle size={24} className="text-white" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{systemHealth.errors24h}</p>
              <p className="text-xs text-gray-500">
                {systemHealth.errors24h === 0 ? 'No errors detected' : 'Errors logged'}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Active Alerts</span>
            {systemHealth.alerts > 0 && (
              <button className="text-xs text-purple-600 font-medium hover:underline">
                View all
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              systemHealth.alerts === 0 
                ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}>
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{systemHealth.alerts}</p>
              <p className="text-xs text-gray-500">
                {systemHealth.alerts === 0 ? 'No active alerts' : 'Pending review'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const change = stat.change;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100 p-6 cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    change.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {change.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>
                      {stat.type === 'revenue' ? `${change.value}%` : `+${change.value}`}
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtext}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {change.isPositive ? '↑' : '↓'} {stat.type === 'revenue' ? `${change.value}%` : change.value} this week
                </p>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">Common tasks at your fingertips</p>
          </div>
          <Sparkles size={24} className="text-purple-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.title}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="group p-5 rounded-xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  {action.title}
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-sm text-gray-500">{action.description}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schools by Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Schools by Status</h3>
              <p className="text-sm text-gray-500">Distribution overview</p>
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
              <PieChartIcon className="text-white" size={20} />
            </div>
          </div>
          {stats?.schools_by_status && stats.schools_by_status.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.schools_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                  >
                    {stats.schools_by_status.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {stats.schools_by_status.map((entry: any, index: number) => (
                  <div key={entry.status} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 capitalize">
                      {entry.status}: {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <PieChartIcon size={48} className="mb-3" />
              <p>No data available</p>
            </div>
          )}
        </motion.div>

        {/* Users by Role */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Users by Role</h3>
              <p className="text-sm text-gray-500">Role distribution</p>
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Users className="text-white" size={20} />
            </div>
          </div>
          {stats?.users_by_role && stats.users_by_role.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.users_by_role}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="role" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Users" fill="url(#barGradient)" radius={[8, 8, 0, 0]}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  <span className="text-sm text-gray-600">User Count</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BarChart3 size={48} className="mb-3" />
              <p>No data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
            <p className="text-sm text-gray-500">
              {timeframe === 'today' ? "Today's" : timeframe === '7d' ? 'Last 7 days' : 'Last 30 days'} revenue overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                <span className="text-gray-600">Revenue</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <TrendingUp className="text-white" size={20} />
            </div>
          </div>
        </div>
        {stats?.revenue_by_month && stats.revenue_by_month.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.revenue_by_month.slice(-6)}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <TrendingUp size={48} className="mb-3" />
            <p>No revenue data available</p>
          </div>
        )}
      </motion.div>

      {/* Recent Activity & Top Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest platform events</p>
            </div>
            <button 
              onClick={() => navigate('/platform/logs')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              View all <ExternalLink size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { action: 'New school onboarded', school: 'Lincoln High', time: '2 hours ago', icon: Building2, color: 'bg-blue-100 text-blue-600' },
              { action: 'Payment received', school: 'West Gold Academy', time: '4 hours ago', icon: DollarSign, color: 'bg-green-100 text-green-600' },
              { action: 'Plan upgraded', school: 'Sunrise Elementary', time: '6 hours ago', icon: Crown, color: 'bg-purple-100 text-purple-600' },
              { action: 'New admin added', school: 'Oak Valley School', time: '1 day ago', icon: Users, color: 'bg-amber-100 text-amber-600' },
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${activity.color} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.school}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Schools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Top Schools</h3>
              <p className="text-sm text-gray-500">By student count</p>
            </div>
            <button 
              onClick={() => navigate('/platform/schools')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              View all <ExternalLink size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'West Gold Academy', students: 450, plan: 'Pro', growth: '+12%' },
              { name: 'Lincoln High School', students: 380, plan: 'Starter', growth: '+8%' },
              { name: 'Sunrise Elementary', students: 290, plan: 'Pro', growth: '+15%' },
              { name: 'Oak Valley School', students: 210, plan: 'Trial', growth: '+5%' },
            ].map((school, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {school.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{school.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{school.students} students</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      school.plan === 'Pro' ? 'bg-purple-100 text-purple-700' :
                      school.plan === 'Starter' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {school.plan}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">{school.growth}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Services Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Services Status</h3>
            <p className="text-sm text-gray-500">Real-time infrastructure health</p>
          </div>
          <Activity size={24} className="text-green-500" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'API Server', icon: Server, status: 'online', latency: '45ms' },
            { name: 'Database', icon: Database, status: 'online', latency: '12ms' },
            { name: 'CDN', icon: Wifi, status: 'online', latency: '8ms' },
            { name: 'Auth Service', icon: Shield, status: 'online', latency: '23ms' },
          ].map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} className="text-gray-600" />
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    service.status === 'online' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      service.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {service.status}
                  </span>
                </div>
                <p className="font-medium text-gray-800">{service.name}</p>
                <p className="text-xs text-gray-500">{service.latency} latency</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default PlatformDashboard;
