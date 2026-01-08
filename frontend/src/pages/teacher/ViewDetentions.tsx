import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import { AlertTriangle, Gavel, TrendingUp, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ViewDetentions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDetention, setSelectedDetention] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(searchParams.get('student') || '');
  const [chartData, setChartData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchDetentions();
    }
  }, [selectedStudent]);

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

  const fetchDetentions = async () => {
    try {
      if (!selectedStudent) return;

      // Get all detentions and filter by student
      const response = await api.getDetentions({});
      const allDetentions = response.data;

      // Get detention assignments for this student
      const studentDetentions: any[] = [];
      for (const detention of allDetentions) {
        try {
          const detResponse = await api.getDetention(detention.id);
          const assignments = detResponse.data.assignments || [];
          const studentAssignment = assignments.find(
            (a: any) => a.student_id === Number(selectedStudent)
          );
          if (studentAssignment) {
            studentDetentions.push({
              ...detention,
              assignment: studentAssignment,
              attendance_status: studentAssignment.status || 'pending',
            });
          }
        } catch (error) {
          console.error(`Error fetching detention ${detention.id}:`, error);
        }
      }

      setDetentions(studentDetentions);

      // Calculate summary
      const total = studentDetentions.length;
      const completed = studentDetentions.filter((d: any) => d.status === 'completed').length;
      const scheduled = studentDetentions.filter((d: any) => d.status === 'scheduled').length;
      const present = studentDetentions.filter((d: any) => d.attendance_status === 'present' || d.attendance_status === 'attended').length;
      const absent = studentDetentions.filter((d: any) => d.attendance_status === 'absent').length;
      const pending = studentDetentions.filter((d: any) => !d.attendance_status || d.attendance_status === 'pending').length;

      setSummary({ total, completed, scheduled, present, absent, pending });

      // Prepare trend data (by month)
      const monthlyData: Record<string, number> = {};
      studentDetentions.forEach((det: any) => {
        const month = new Date(det.detention_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });
      const chartDataArray = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setChartData(chartDataArray);

      // Prepare attendance data
      setAttendanceData([
        { name: 'Present', value: present },
        { name: 'Absent', value: absent },
        { name: 'Pending', value: pending },
      ]);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    }
  };

  const handleViewDetails = async (detention: any) => {
    try {
      const response = await api.getDetention(detention.id);
      setSelectedDetention({ ...detention, ...response.data });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching detention details:', error);
    }
  };

  const columns = [
    {
      key: 'detention_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'detention_time',
      label: 'Time',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value: number) => `${value || 60} minutes`,
    },
    {
      key: 'attendance_status',
      label: 'Attendance',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'present'
              ? 'bg-green-100 text-green-800'
              : value === 'absent'
              ? 'bg-red-100 text-red-800'
              : value === 'late'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? value.toUpperCase() : 'PENDING'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'assignment',
      label: 'Reason',
      render: (value: any) => value?.reason || 'N/A',
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
    { title: 'Total Detentions', value: summary.total, color: 'from-orange-500 to-red-500', icon: Gavel },
    { title: 'Completed', value: summary.completed, color: 'from-green-500 to-emerald-500', icon: Gavel },
    { title: 'Present', value: summary.present, color: 'from-blue-500 to-cyan-500', icon: Gavel },
    { title: 'Absent', value: summary.absent, color: 'from-red-500 to-pink-500', icon: Gavel },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Student Detentions
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View detention assignments for your students</p>
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
          <Sparkles className="text-orange-600" size={24} />
        </div>
        <Select
          label="Student"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          options={[
            { value: '', label: 'Select a student' },
            ...students.map((s: any) => ({
              value: s.id,
              label: `${s.first_name} ${s.last_name} (${s.student_id})`,
            })),
          ]}
          className="rounded-xl"
        />
      </motion.div>

      {/* Summary Stats */}
      {summary && selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
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

      {/* Charts */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detention Frequency Over Time</h2>
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
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
                  <Bar dataKey="count" fill="url(#detentionGradient)" name="Detentions" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="detentionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {attendanceData.length > 0 && attendanceData.some(d => d.value > 0) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Attendance at Detentions</h2>
                <Gavel className="text-orange-600" size={24} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                    <Cell fill="#9CA3AF" />
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

      {!selectedStudent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12"
        >
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg">Please select a student to view their detentions</p>
          </div>
        </motion.div>
      ) : detentions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12"
        >
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg">No detention assignments found for this student</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Detention Records ({detentions.length})</h2>
            <Gavel className="text-orange-600" size={24} />
          </div>
          <Table
            columns={columns}
            data={detentions}
            onRowClick={handleViewDetails}
          />
        </motion.div>
      )}

      {/* Detention Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDetention(null);
        }}
        title={`Detention Details - ${selectedDetention ? new Date(selectedDetention.detention_date).toLocaleDateString() : ''}`}
      >
        {selectedDetention && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {new Date(selectedDetention.detention_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">{selectedDetention.detention_time || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{selectedDetention.duration || 60} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{selectedDetention.status}</p>
              </div>
              {selectedDetention.location && (
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{selectedDetention.location}</p>
                </div>
              )}
              {selectedDetention.assignment && (
                <div>
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="font-semibold capitalize">
                    {selectedDetention.assignment.status || 'Pending'}
                  </p>
                </div>
              )}
            </div>

            {selectedDetention.assignment?.reason && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Reason</p>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedDetention.assignment.reason}</p>
              </div>
            )}

            {selectedDetention.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedDetention.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewDetentions;


