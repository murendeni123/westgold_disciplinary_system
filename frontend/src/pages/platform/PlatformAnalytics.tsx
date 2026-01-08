import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
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
  ResponsiveContainer,
} from 'recharts';

const PlatformAnalytics: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    school_id: '',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.school_id) params.school_id = filters.school_id;

      const response = await api.getPlatformAnalytics(params);
      setAnalytics(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Error fetching analytics';
      console.error('Analytics fetch error:', err);
      error(errorMessage);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) {
      error('No data to export');
      return;
    }

    const data: any[] = [];
    data.push(['Metric', 'Value']);
    data.push(['Total Schools', analytics.total_schools || 0]);
    data.push(['Active Schools', analytics.active_schools || 0]);
    data.push(['Total Users', analytics.total_users || 0]);
    data.push(['Total Students', analytics.total_students || 0]);
    data.push(['Total Revenue', `$${analytics.total_revenue || 0}`]);
    data.push([]);
    
    if (analytics.revenue_by_month && analytics.revenue_by_month.length > 0) {
      data.push(['Revenue by Month']);
      data.push(['Month', 'Revenue']);
      analytics.revenue_by_month.forEach((item: any) => {
        data.push([item.month, `$${item.revenue || 0}`]);
      });
      data.push([]);
    }
    
    if (analytics.schools_by_status && analytics.schools_by_status.length > 0) {
      data.push(['Schools by Status']);
      data.push(['Status', 'Count']);
      analytics.schools_by_status.forEach((item: any) => {
        data.push([item.status, item.count || 0]);
      });
      data.push([]);
    }
    
    if (analytics.users_by_role && analytics.users_by_role.length > 0) {
      data.push(['Users by Role']);
      data.push(['Role', 'Count']);
      analytics.users_by_role.forEach((item: any) => {
        data.push([item.role, item.count || 0]);
      });
    }

    const csv = data.map((row) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Analytics data exported successfully');
  };

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full"
        />
      </div>
    );
  }

  // Show empty state if no analytics data
  if (!analytics || (!analytics.revenue_by_month?.length && !analytics.schools_by_status?.length && !analytics.users_by_role?.length)) {
    return (
      <div className="space-y-8">
        <ToastContainer />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Platform Analytics
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Comprehensive analytics and insights</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <p className="text-gray-500 text-lg">No analytics data available yet</p>
          <p className="text-gray-400 text-sm mt-2">Data will appear here once schools and subscriptions are created</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Platform Analytics
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive analytics and insights</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={handleExport}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Download size={20} className="mr-2" />
            Export
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="rounded-xl"
          />
          <Input
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="rounded-xl"
          />
          <div className="flex items-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={fetchAnalytics}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
              >
                Apply Filters
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Revenue Trend */}
      {analytics?.revenue_by_month && Array.isArray(analytics.revenue_by_month) && analytics.revenue_by_month.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Monthly revenue overview</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenue_by_month.slice(-6).map((item: any) => ({
              ...item,
              revenue: typeof item.revenue === 'string' ? parseFloat(item.revenue) : item.revenue
            }))}>
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
                formatter={(value: any) => `$${typeof value === 'number' ? value.toLocaleString() : parseFloat(value || 0).toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ fill: '#F97316', r: 6 }}
                activeDot={{ r: 8 }}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics?.schools_by_status && Array.isArray(analytics.schools_by_status) && analytics.schools_by_status.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Schools by Status</h3>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.schools_by_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.schools_by_status.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {analytics?.users_by_role && Array.isArray(analytics.users_by_role) && analytics.users_by_role.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Users by Role</h3>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.users_by_role}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="role" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlatformAnalytics;
