import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import ModernFilter from '../../components/ModernFilter';
import { motion } from 'framer-motion';
import { Download, Award, AlertTriangle, TrendingUp } from 'lucide-react';
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
        setMerits(Array.isArray(response.data) ? response.data : []);
      } else {
        const params: any = {};
        if (filters.student_id) params.student_id = filters.student_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        const response = await api.getIncidents(params);
        setDemerits(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent crashes
      if (viewType === 'merits') {
        setMerits([]);
      } else {
        setDemerits([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
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
          {value ? value.toUpperCase() : 'N/A'}
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
          {value ? value.toUpperCase() : 'N/A'}
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
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Merits</p>
              <p className="text-4xl font-bold mt-2">{merits.length}</p>
            </div>
            <Award size={48} className="text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Demerits</p>
              <p className="text-4xl font-bold mt-2">{demerits.length}</p>
            </div>
            <AlertTriangle size={48} className="text-red-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">High Severity</p>
              <p className="text-4xl font-bold mt-2">
                {demerits.filter((d: any) => d.severity === 'high').length}
              </p>
            </div>
            <AlertTriangle size={48} className="text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">This Week</p>
              <p className="text-4xl font-bold mt-2">
                {viewType === 'merits' 
                  ? merits.filter((m: any) => {
                      const date = new Date(m.merit_date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return date >= weekAgo;
                    }).length
                  : demerits.filter((d: any) => {
                      const date = new Date(d.incident_date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return date >= weekAgo;
                    }).length
                }
              </p>
            </div>
            <TrendingUp size={48} className="text-amber-200 opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Modern Filters */}
      <ModernFilter
        fields={[
          {
            type: 'select',
            name: 'student_id',
            label: 'Student',
            placeholder: 'All Students',
            options: students.map((s) => ({ value: s.id.toString(), label: `${s.first_name} ${s.last_name}` }))
          },
          {
            type: 'select',
            name: 'class_id',
            label: 'Class',
            placeholder: 'All Classes',
            options: classes.map((c) => ({ value: c.id.toString(), label: `${c.grade_level} ${c.class_name}` }))
          },
          {
            type: 'date',
            name: 'start_date',
            label: 'Start Date',
            placeholder: 'Select start date'
          },
          {
            type: 'date',
            name: 'end_date',
            label: 'End Date',
            placeholder: 'Select end date'
          }
        ]}
        values={filters}
        onChange={(name, value) => setFilters({ ...filters, [name]: value })}
        onClear={() => setFilters({ student_id: '', class_id: '', start_date: '', end_date: '' })}
      />

      {/* Export Buttons */}
      {(filters.student_id || filters.class_id) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3"
        >
          {filters.student_id && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="secondary"
                onClick={() => handleExport(Number(filters.student_id))}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg hover:shadow-xl"
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
                className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl"
              >
                <Download size={20} className="mr-2" />
                Export Class Records
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

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
                <defs>
                  <linearGradient id="demeritGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#F87171" />
                  </linearGradient>
                </defs>
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
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {viewType === 'merits' && Array.isArray(merits) && merits.length > 0 && (
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
              (merits || []).reduce((acc: any, m: any) => {
                const date = m?.merit_date;
                if (date) {
                  acc[date] = (acc[date] || 0) + 1;
                }
                return acc;
              }, {})
            ).map(([date, count]) => ({ date, count })).slice(-7)}>
              <defs>
                <linearGradient id="meritGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
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

