import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Select from '../../components/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Award, AlertTriangle, TrendingUp, Sparkles, Medal, Flag, CheckCircle, Star, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';

interface GoldieBadgeStudent {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  photo_path?: string;
  class_name?: string;
  total_merits: number;
  total_demerits: number;
  net_score: number;
  is_flagged: boolean;
  is_awarded: boolean;
  flag_id?: number;
  flag_status?: string;
  flagged_at?: string;
  awarded_at?: string;
  flag_notes?: string;
}

const MeritsDemerits: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [merits, setMerits] = useState<any[]>([]);
  const [demerits, setDemerits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'merits' | 'demerits' | 'goldie'>('demerits');
  const [filters, setFilters] = useState({
    student_id: '',
    class_id: '',
    start_date: '',
    end_date: '',
  });

  // Goldie Badge state
  const [goldieBadgeEnabled, setGoldieBadgeEnabled] = useState(false);
  const [goldieBadgeThreshold, setGoldieBadgeThreshold] = useState(10);
  const [qualifiedStudents, setQualifiedStudents] = useState<GoldieBadgeStudent[]>([]);
  const [loadingGoldie, setLoadingGoldie] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStudents();
    fetchClasses();
    fetchGoldieBadgeStatus();
  }, []);

  useEffect(() => {
    if (viewType === 'goldie' && goldieBadgeEnabled) {
      fetchQualifiedStudents();
    } else if (viewType !== 'goldie') {
      fetchData();
    }
  }, [viewType, filters]);

  const fetchGoldieBadgeStatus = async () => {
    try {
      const response = await api.getGoldieBadgeStatus();
      setGoldieBadgeEnabled(response.data.enabled);
      setGoldieBadgeThreshold(response.data.threshold || 10);
    } catch (err) {
      console.error('Error fetching Goldie Badge status:', err);
    }
  };

  const fetchQualifiedStudents = async () => {
    try {
      setLoadingGoldie(true);
      const response = await api.getGoldieBadgeQualified();
      if (response.data.enabled) {
        setQualifiedStudents(response.data.students || []);
        setGoldieBadgeThreshold(response.data.threshold || 10);
      }
    } catch (err) {
      console.error('Error fetching qualified students:', err);
    } finally {
      setLoadingGoldie(false);
    }
  };

  const handleFlagStudent = async (studentId: number) => {
    try {
      await api.flagStudentForGoldieBadge(studentId);
      success('Student flagged for Goldie Badge!');
      fetchQualifiedStudents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error flagging student');
    }
  };

  const handleUnflagStudent = async (studentId: number) => {
    try {
      await api.unflagStudentForGoldieBadge(studentId);
      success('Student unflagged');
      fetchQualifiedStudents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error unflagging student');
    }
  };

  const handleAwardBadge = async (studentId: number) => {
    try {
      await api.awardGoldieBadge(studentId);
      success('Goldie Badge awarded!');
      fetchQualifiedStudents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error awarding badge');
    }
  };

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
        <div className="flex space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={viewType === 'merits' ? 'primary' : 'secondary'}
              onClick={() => setViewType('merits')}
              className={`rounded-xl ${viewType === 'merits' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : ''}`}
            >
              <Award size={20} className="mr-2" />
              Merits
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={viewType === 'demerits' ? 'primary' : 'secondary'}
              onClick={() => setViewType('demerits')}
              className={`rounded-xl ${viewType === 'demerits' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : ''}`}
            >
              <AlertTriangle size={20} className="mr-2" />
              Demerits
            </Button>
          </motion.div>
          {goldieBadgeEnabled && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={viewType === 'goldie' ? 'primary' : 'secondary'}
                onClick={() => setViewType('goldie')}
                className={`rounded-xl ${viewType === 'goldie' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' : ''}`}
              >
                <Medal size={20} className="mr-2" />
                Goldie Badge
              </Button>
            </motion.div>
          )}
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

      {/* Table Card - Only show for merits/demerits views */}
      {viewType !== 'goldie' && (
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
      )}

      {/* Goldie Badge Section */}
      {viewType === 'goldie' && goldieBadgeEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Goldie Badge Info Card */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg">
                <Medal className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-800">Goldie Badge Recognition</h2>
                <p className="text-amber-600 mt-1">
                  Students with a net score of <span className="font-bold">{goldieBadgeThreshold}+</span> points (merits minus demerits) qualify for the Goldie Badge.
                </p>
              </div>
            </div>
          </div>

          {/* Qualified Students Grid */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Star className="text-amber-500" size={28} />
                <h2 className="text-2xl font-bold text-gray-900">
                  Qualified Students ({qualifiedStudents.length})
                </h2>
              </div>
              <Button
                variant="secondary"
                onClick={fetchQualifiedStudents}
                className="rounded-xl"
              >
                Refresh
              </Button>
            </div>

            {loadingGoldie ? (
              <div className="flex justify-center items-center h-48">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full"
                />
              </div>
            ) : qualifiedStudents.length === 0 ? (
              <div className="text-center py-12">
                <Medal className="mx-auto text-gray-300" size={64} />
                <p className="text-gray-500 mt-4 text-lg">No students currently qualify for the Goldie Badge.</p>
                <p className="text-gray-400 mt-2">Students need a net score of {goldieBadgeThreshold}+ points to qualify.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {qualifiedStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative rounded-xl border-2 p-4 transition-all ${
                        student.is_awarded
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-400 shadow-lg'
                          : student.is_flagged
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      {/* Badge indicator */}
                      {student.is_awarded && (
                        <div className="absolute -top-2 -right-2">
                          <div className="p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg">
                            <CheckCircle className="text-white" size={20} />
                          </div>
                        </div>
                      )}
                      {student.is_flagged && !student.is_awarded && (
                        <div className="absolute -top-2 -right-2">
                          <div className="p-1.5 rounded-full bg-blue-500 shadow-lg">
                            <Flag className="text-white" size={20} />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        {/* Student Avatar */}
                        <div className="flex-shrink-0">
                          {student.photo_path ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${student.photo_path}`}
                              alt={`${student.first_name} ${student.last_name}`}
                              className="w-14 h-14 rounded-full object-cover border-2 border-amber-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                              <User className="text-white" size={24} />
                            </div>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{student.student_id}</p>
                          {student.class_name && (
                            <p className="text-xs text-gray-400">{student.class_name}</p>
                          )}
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-xs text-green-600">Merits</p>
                          <p className="font-bold text-green-700">{student.total_merits}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                          <p className="text-xs text-red-600">Demerits</p>
                          <p className="font-bold text-red-700">{student.total_demerits}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2">
                          <p className="text-xs text-amber-600">Net</p>
                          <p className="font-bold text-amber-700">{student.net_score}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex space-x-2">
                        {student.is_awarded ? (
                          <div className="flex-1 text-center py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-medium">
                            <CheckCircle size={16} className="inline mr-1" />
                            Awarded
                          </div>
                        ) : student.is_flagged ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAwardBadge(student.id)}
                              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-medium hover:shadow-lg transition-shadow"
                            >
                              <Medal size={16} className="inline mr-1" />
                              Award Badge
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleUnflagStudent(student.id)}
                              className="py-2 px-3 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                              Unflag
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleFlagStudent(student.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            <Flag size={16} className="inline mr-1" />
                            Flag for Recognition
                          </motion.button>
                        )}
                      </div>

                      {/* Flagged/Awarded timestamp */}
                      {(student.flagged_at || student.awarded_at) && (
                        <p className="mt-2 text-xs text-gray-400 text-center">
                          {student.is_awarded
                            ? `Awarded: ${new Date(student.awarded_at!).toLocaleDateString()}`
                            : `Flagged: ${new Date(student.flagged_at!).toLocaleDateString()}`}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MeritsDemerits;

