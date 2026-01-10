import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Select from '../../components/Select';
import { motion } from 'framer-motion';
import { Download, Award, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';

const MeritsDemerits: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [merits, setMerits] = useState<any[]>([]);
  const [demerits, setDemerits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'merits' | 'demerits'>('demerits');
  const [filters, setFilters] = useState({
    student_id: '',
    class_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchData();
    fetchStudents();
    fetchClasses();
  }, [viewType, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (viewType === 'merits') {
        const params: any = {};
        if (filters.student_id) params.student_id = filters.student_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        const response = await api.getMerits(params);
        setMerits(response.data);
      } else {
        const params: any = {};
        if (filters.student_id) params.student_id = filters.student_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        const response = await api.getIncidents(params);
        setDemerits(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleExport = async (studentId?: number, classId?: number) => {
    try {
      if (studentId) {
        const response = await api.exportStudentRecord(studentId, 'excel');
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `student_record_${studentId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (classId) {
        const response = await api.exportClassRecords(classId, 'excel');
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `class_records_${classId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Error exporting:', err);
      error('Error exporting records');
    }
  };

  const meritColumns = [
    { key: 'merit_date', label: 'Date' },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class' },
    { key: 'merit_type', label: 'Type' },
    { key: 'points', label: 'Points' },
    { key: 'description', label: 'Description' },
    { key: 'teacher_name', label: 'Teacher' },
  ];

  const demeritColumns = [
    { key: 'incident_date', label: 'Date' },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class' },
    { key: 'incident_type', label: 'Type' },
    {
      key: 'severity',
      label: 'Severity',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'high'
              ? 'bg-red-100 text-red-800'
              : value === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    { key: 'points', label: 'Points' },
    { key: 'description', label: 'Description' },
    { key: 'teacher_name', label: 'Teacher' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : value === 'approved'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
  ];

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

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Merits & Demerits
          </h1>
          <p className="text-gray-600 mt-2 text-lg">View and analyze student behavior records</p>
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewType('merits')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              viewType === 'merits'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award size={18} />
            <span>Merits</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewType('demerits')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              viewType === 'demerits'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle size={18} />
            <span>Demerits</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
          <Sparkles className="text-amber-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Student"
            value={filters.student_id}
            onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
            options={[{ value: '', label: 'All Students' }, ...students.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))]}
            className="rounded-xl"
          />
          <Select
            label="Class"
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
            options={[{ value: '', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.class_name }))]}
            className="rounded-xl"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-6 flex space-x-3">
          {filters.student_id && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="secondary"
                onClick={() => handleExport(Number(filters.student_id))}
                className="rounded-xl"
              >
                <Download size={20} className="mr-2" />
                Export Student Record
              </Button>
            </motion.div>
          )}
          {filters.class_id && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="secondary"
                onClick={() => handleExport(undefined, Number(filters.class_id))}
                className="rounded-xl"
              >
                <Download size={20} className="mr-2" />
                Export Class Records
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Charts */}
      {viewType === 'demerits' && demerits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Demerits by Severity</h2>
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'High', value: demerits.filter((d: any) => d.severity === 'high').length },
                    { name: 'Medium', value: demerits.filter((d: any) => d.severity === 'medium').length },
                    { name: 'Low', value: demerits.filter((d: any) => d.severity === 'low').length },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#EF4444" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#10B981" />
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

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Demerits Over Time</h2>
              <TrendingUp className="text-red-600" size={24} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Object.entries(
                demerits.reduce((acc: any, d: any) => {
                  const date = d.incident_date;
                  acc[date] = (acc[date] || 0) + 1;
                  return acc;
                }, {})
              ).map(([date, count]) => ({ date, count })).slice(-7)}>
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
                <Line type="monotone" dataKey="count" stroke="url(#demeritGradient)" name="Demerits" strokeWidth={3} />
                <defs>
                  <linearGradient id="demeritGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#F87171" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {viewType === 'merits' && merits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Merits Over Time</h2>
            <Award className="text-green-600" size={24} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(
              merits.reduce((acc: any, m: any) => {
                const date = m.merit_date;
                acc[date] = (acc[date] || 0) + 1;
                return acc;
              }, {})
            ).map(([date, count]) => ({ date, count })).slice(-7)}>
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
              <Bar dataKey="count" fill="url(#meritGradient)" name="Merits" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="meritGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {viewType === 'merits' ? 'Merits' : 'Demerits'} ({viewType === 'merits' ? merits.length : demerits.length})
          </h2>
          {viewType === 'merits' ? (
            <Award className="text-green-600" size={24} />
          ) : (
            <AlertTriangle className="text-red-600" size={24} />
          )}
        </div>
        <Table
          columns={viewType === 'merits' ? meritColumns : demeritColumns}
          data={viewType === 'merits' ? merits : demerits}
        />
      </motion.div>
    </div>
  );
};

export default MeritsDemerits;

