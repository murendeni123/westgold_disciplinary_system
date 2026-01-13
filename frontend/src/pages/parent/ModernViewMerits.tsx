import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import { motion } from 'framer-motion';
import { Award, Download, TrendingUp, Sparkles } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Input from '../../components/Input';
// Button available for future use

const ModernViewMerits: React.FC = () => {
  const [searchParams] = useSearchParams();
  const _navigate = useNavigate();
  const { profile } = useAuth();
  const { students } = useParentStudents();
  const [merits, setMerits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild || students?.[0]) {
      fetchMerits();
    }
  }, [selectedChild, startDate, endDate, students]);

  const fetchMerits = async () => {
    try {
      const studentId = selectedChild || students?.[0]?.id;
      if (!studentId) return;

      const response = await api.getMerits({
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
      });
      setMerits(response.data);

      const totalPoints = response.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
      const totalMerits = response.data.length;
      const byType = response.data.reduce((acc: any, m: any) => {
        acc[m.merit_type] = (acc[m.merit_type] || 0) + 1;
        return acc;
      }, {});

      setSummary({
        totalPoints,
        totalMerits,
        byType,
        avgPoints: totalMerits > 0 ? (totalPoints / totalMerits).toFixed(1) : 0,
      });

      const monthlyData: Record<string, { merits: number; points: number }> = {};
      response.data.forEach((merit: any) => {
        const month = new Date(merit.merit_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { merits: 0, points: 0 };
        }
        monthlyData[month].merits++;
        monthlyData[month].points += merit.points || 0;
      });

      const chartDataArray = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setChartData(chartDataArray);

      const typeDataArray = Object.entries(byType).map(([type, count]) => ({
        name: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
      }));
      setTypeData(typeDataArray);
    } catch (error) {
      console.error('Error fetching merits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const studentId = selectedChild || students?.[0]?.id;
      if (!studentId) return;
      await api.exportStudentRecord(Number(studentId), 'pdf');
      alert('Export started! Check your downloads.');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting merits');
    }
  };

  const columns = [
    {
      key: 'merit_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'merit_type',
      label: 'Type',
      render: (value: string) => (
        <span className="capitalize font-medium">{value.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (value: number) => (
        <span className="font-bold text-green-600">{value || 0}</span>
      ),
    },
    {
      key: 'teacher_name',
      label: 'Awarded By',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => value || 'No description',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full"
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
            <Sparkles className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Merits & Achievements</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            Celebrate your child's positive achievements and rewards
          </p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedStatCard
            title="Total Merits"
            value={summary.totalMerits}
            icon={Award}
            iconColor="text-green-600"
            bgGradient="from-green-500/10 to-emerald-500/10"
            subtitle={`${summary.totalPoints} total points`}
            delay={0.1}
          />
          <AnimatedStatCard
            title="Total Points"
            value={summary.totalPoints}
            icon={TrendingUp}
            iconColor="text-blue-600"
            bgGradient="from-blue-500/10 to-cyan-500/10"
            delay={0.2}
          />
          <AnimatedStatCard
            title="Average Points"
            value={summary.avgPoints}
            icon={Award}
            iconColor="text-purple-600"
            bgGradient="from-purple-500/10 to-pink-500/10"
            subtitle="per merit"
            delay={0.3}
          />
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <ModernCard title="Filters" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {students && students.length > 1 && (
              <Select
                label="Child"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                options={students.map((c: any) => ({
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
          <ModernCard title="Merit Trends Over Time" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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
                <Line
                  type="monotone"
                  dataKey="merits"
                  stroke="#10b981"
                  name="Number of Merits"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#3b82f6"
                  name="Total Points"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ModernCard>

          {typeData.length > 0 && (
            <ModernCard title="Merit Type Breakdown" variant="glass">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]}
                      />
                    ))}
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
          )}
        </motion.div>
      )}

      {/* Records Table */}
      {merits.length === 0 ? (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6"
              >
                <Award className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Merits Found</h3>
              <p className="text-gray-600">No merits found for the selected period</p>
            </div>
          </ModernCard>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <ModernCard title="Merit Records" variant="glass">
            <Table columns={columns} data={merits} />
          </ModernCard>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModernViewMerits;

