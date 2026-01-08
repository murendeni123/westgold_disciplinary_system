import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock, Download, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';

const ModernAttendanceOverview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild || user?.children?.[0]) {
      fetchAttendance();
    }
  }, [selectedChild, startDate, endDate, user]);

  const fetchAttendance = async () => {
    try {
      const studentId = selectedChild || user?.children?.[0]?.id;
      if (!studentId) return;

      const response = await api.getAttendance({
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
      });
      setAttendance(response.data);

      const total = response.data.length;
      const present = response.data.filter((a: any) => a.status === 'present').length;
      const absent = response.data.filter((a: any) => a.status === 'absent').length;
      const late = response.data.filter((a: any) => a.status === 'late').length;
      const excused = response.data.filter((a: any) => a.status === 'excused').length;
      const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

      setSummary({
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate: parseFloat(attendanceRate),
      });

      const dailyData: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
      response.data.forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) {
          dailyData[date] = { present: 0, absent: 0, late: 0, excused: 0 };
        }
        if (record.status === 'present') dailyData[date].present++;
        else if (record.status === 'absent') dailyData[date].absent++;
        else if (record.status === 'late') dailyData[date].late++;
        else if (record.status === 'excused') dailyData[date].excused++;
      });

      const chartDataArray = Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setChartData(chartDataArray);

      const monthlyDataMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
      response.data.forEach((record: any) => {
        const month = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyDataMap[month]) {
          monthlyDataMap[month] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        monthlyDataMap[month].total++;
        if (record.status === 'present') monthlyDataMap[month].present++;
        else if (record.status === 'absent') monthlyDataMap[month].absent++;
        else if (record.status === 'late') monthlyDataMap[month].late++;
      });

      const monthlyArray = Object.entries(monthlyDataMap)
        .map(([month, data]) => ({
          month,
          ...data,
          rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setMonthlyData(monthlyArray);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const studentId = selectedChild || user?.children?.[0]?.id;
      if (!studentId) return;
      await api.exportStudentRecord(Number(studentId), 'pdf');
      alert('Export started! Check your downloads.');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting attendance records');
    }
  };

  const columns = [
    { key: 'attendance_date', label: 'Date' },
    { key: 'class_name', label: 'Class' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value === 'present'
              ? 'bg-green-100 text-green-800'
              : value === 'absent'
              ? 'bg-red-100 text-red-800'
              : value === 'late'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    { key: 'period', label: 'Period' },
    { key: 'notes', label: 'Notes' },
  ];

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
      transition: { staggerChildren: 0.1 },
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-500 p-8 text-white shadow-2xl"
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
            <Calendar className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Attendance Overview</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            Track your child's attendance records and patterns
          </p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <AnimatedStatCard
            title="Attendance Rate"
            value={`${summary.attendanceRate}%`}
            icon={TrendingUp}
            iconColor="text-green-600"
            bgGradient="from-green-500/10 to-emerald-500/10"
            delay={0.1}
          />
          <AnimatedStatCard
            title="Present"
            value={summary.present}
            icon={CheckCircle}
            iconColor="text-green-600"
            bgGradient="from-green-500/10 to-emerald-500/10"
            delay={0.2}
          />
          <AnimatedStatCard
            title="Absent"
            value={summary.absent}
            icon={XCircle}
            iconColor="text-red-600"
            bgGradient="from-red-500/10 to-pink-500/10"
            delay={0.3}
          />
          <AnimatedStatCard
            title="Late"
            value={summary.late}
            icon={Clock}
            iconColor="text-yellow-600"
            bgGradient="from-yellow-500/10 to-amber-500/10"
            delay={0.4}
          />
          <AnimatedStatCard
            title="Total Days"
            value={summary.total}
            icon={Calendar}
            iconColor="text-blue-600"
            bgGradient="from-blue-500/10 to-cyan-500/10"
            delay={0.5}
          />
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <ModernCard title="Filters" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {user?.children && user.children.length > 1 && (
              <Select
                label="Child"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                options={user.children.map((c: any) => ({
                  value: c.id,
                  label: `${c.first_name} ${c.last_name}`,
                }))}
              />
            )}
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <Download size={18} />
                <span>Export PDF</span>
              </motion.button>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      {/* Charts */}
      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard title="Daily Attendance Trends (Last 14 Days)" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#10b981" name="Present" radius={[8, 8, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" radius={[8, 8, 0, 0]} />
                <Bar dataKey="excused" stackId="a" fill="#3b82f6" name="Excused" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ModernCard>

          <ModernCard title="Attendance Breakdown" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: summary?.present || 0 },
                    { name: 'Absent', value: summary?.absent || 0 },
                    { name: 'Late', value: summary?.late || 0 },
                    { name: 'Excused', value: summary?.excused || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ModernCard>
        </motion.div>
      )}

      {/* Monthly Trend */}
      {monthlyData.length > 0 && (
        <motion.div variants={itemVariants}>
          <ModernCard title="Monthly Attendance Rate" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis domain={[0, 100]} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  name="Attendance Rate %"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ModernCard>
        </motion.div>
      )}

      {/* Records Table */}
      <motion.div variants={itemVariants}>
        <ModernCard title="Attendance Records" variant="glass">
          <Table
            columns={columns}
            data={attendance}
            onRowClick={(row) => navigate(`/parent/attendance/${row.attendance_date}`)}
          />
        </ModernCard>
      </motion.div>
    </motion.div>
  );
};

export default ModernAttendanceOverview;

