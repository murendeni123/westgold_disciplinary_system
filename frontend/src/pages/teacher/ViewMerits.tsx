import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
import ModernFilter from '../../components/ModernFilter';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Sparkles } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const ViewMerits: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [merits, setMerits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(searchParams.get('student') || '');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchMerits();
    }
  }, [selectedStudent, startDate, endDate]);

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const fetchMerits = async () => {
    try {
      if (!selectedStudent) return;

      const response = await api.getMerits({
        student_id: selectedStudent,
        start_date: startDate,
        end_date: endDate,
      });
      setMerits(response.data);

      // Calculate summary
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
      });

      // Prepare monthly chart data
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

      // Prepare type breakdown data
      const typeDataArray = Object.entries(byType).map(([type, count]) => ({
        name: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
      }));
      setTypeData(typeDataArray);
    } catch (error) {
      console.error('Error fetching merits:', error);
    }
  };

  const columns = [
    {
      key: 'merit_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'student_name',
      label: 'Student',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'merit_type',
      label: 'Type',
      render: (value: string) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (value: number) => (
        <span className="font-semibold text-green-600">{value || 0}</span>
      ),
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
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  const statCards = summary ? [
    { title: 'Total Merits', value: summary.totalMerits, color: 'from-green-500 to-emerald-500', icon: Award },
    { title: 'Total Points', value: summary.totalPoints, color: 'from-blue-500 to-cyan-500', icon: Award },
    { title: 'Average Points', value: summary.totalMerits > 0 ? (summary.totalPoints / summary.totalMerits).toFixed(1) : 0, color: 'from-purple-500 to-indigo-500', icon: Award },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Student Merits
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View merits awarded to your students</p>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modern Filters */}
      <ModernFilter
        fields={[
          {
            type: 'searchable-select',
            name: 'student',
            label: 'Student',
            placeholder: 'Search and select a student...',
            options: students.map((s: any) => ({
              value: s.id.toString(),
              label: `${s.first_name} ${s.last_name} (${s.student_id})`,
            })),
          },
          {
            type: 'date',
            name: 'start_date',
            label: 'Start Date',
          },
          {
            type: 'date',
            name: 'end_date',
            label: 'End Date',
          },
        ]}
        values={{
          student: selectedStudent,
          start_date: startDate,
          end_date: endDate,
        }}
        onChange={(name, value) => {
          if (name === 'student') setSelectedStudent(value);
          if (name === 'start_date') setStartDate(value);
          if (name === 'end_date') setEndDate(value);
        }}
        onClear={() => {
          setSelectedStudent('');
          setStartDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          setEndDate(new Date().toISOString().split('T')[0]);
        }}
      />

      {!selectedStudent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12"
        >
          <div className="text-center py-12 text-gray-500">
            <Award className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg">Please select a student to view their merits</p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Merit Trends Over Time</h2>
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
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
                    <Line type="monotone" dataKey="merits" stroke="url(#meritLineGradient)" name="Number of Merits" strokeWidth={3} />
                    <Line type="monotone" dataKey="points" stroke="url(#pointsLineGradient)" name="Total Points" strokeWidth={3} />
                    <defs>
                      <linearGradient id="meritLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                      <linearGradient id="pointsLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#60A5FA" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {typeData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Merit Type Breakdown</h2>
                    <Award className="text-green-600" size={24} />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]} />
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
                </motion.div>
              )}
            </div>
          )}

          {merits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12"
            >
              <div className="text-center py-12 text-gray-500">
                <Award className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg">No merits found for the selected period</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Merit Records ({merits.length})</h2>
                <Award className="text-green-600" size={24} />
              </div>
              <Table columns={columns} data={merits} />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewMerits;


