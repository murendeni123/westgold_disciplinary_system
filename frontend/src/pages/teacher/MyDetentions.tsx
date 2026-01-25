import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Users, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';

const MyDetentions: React.FC = () => {
  const { user } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [selectedDetention, setSelectedDetention] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDetentions();
    }
  }, [user]);

  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const fetchDetentions = async () => {
    try {
      // Get detentions - backend already filters for teachers to show only their assigned sessions
      const response = await api.getDetentions({});
      const myDetentions = response.data;
      setDetentions(myDetentions);

      // Calculate summary
      const total = myDetentions.length;
      const completed = myDetentions.filter((d: any) => d.status === 'completed').length;
      const scheduled = myDetentions.filter((d: any) => d.status === 'scheduled').length;
      setSummary({ total, completed, scheduled });

      // Prepare trend data (by date)
      const dateCounts = myDetentions.reduce((acc: any, det: any) => {
        const date = new Date(det.detention_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      const trendArray = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setChartData(trendArray);

      // Prepare attendance data
      let presentCount = 0;
      let absentCount = 0;
      let pendingCount = 0;

      for (const detention of myDetentions.slice(0, 20)) {
        try {
          const detResponse = await api.getDetention(detention.id);
          const assignments = detResponse.data.assignments || [];
          assignments.forEach((a: any) => {
            if (a.status === 'present' || a.status === 'attended') presentCount++;
            else if (a.status === 'absent') absentCount++;
            else pendingCount++;
          });
        } catch (error) {
          // Skip if error
        }
      }

      setAttendanceData([
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount },
        { name: 'Pending', value: pendingCount },
      ]);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetention = async (detention: any) => {
    setIsModalOpen(true);
    
    // Fetch attendance for this detention
    try {
      const response = await api.getDetention(detention.id);
      const assignments = response.data.assignments || [];
      const att: Record<number, string> = {};
      // Map database status to frontend status
      const statusMapping: Record<string, string> = {
        'attended': 'present',
        'assigned': 'pending',
        'absent': 'absent',
        'late': 'late',
        'excused': 'excused',
        'rescheduled': 'pending'
      };
      assignments.forEach((a: any) => {
        const dbStatus = a.attendance_status || a.status || 'assigned';
        att[a.student_id] = statusMapping[dbStatus] || dbStatus;
      });
      setAttendance(att);
      // Store assignments in selectedDetention for later use
      setSelectedDetention({ ...detention, assignments });
    } catch (error) {
      console.error('Error fetching detention details:', error);
      setSelectedDetention(detention);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: number, newStatus: string) => {
    try {
      await api.updateDetentionSessionStatus(sessionId, newStatus);
      success(`Session status updated to ${newStatus}`);
      fetchDetentions();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating session status');
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedDetention) return;
    
    setSaving(true);
    try {
      // Update attendance for each student using the new attendance endpoint
      for (const [studentId, status] of Object.entries(attendance)) {
        try {
          // Find the assignment ID first
          const assignment = selectedDetention.assignments.find((a: any) => a.student_id === Number(studentId));
          if (assignment) {
            await api.markDetentionAttendance(assignment.id, status as string);
          }
        } catch (error) {
          console.error(`Error updating attendance for student ${studentId}:`, error);
        }
      }
      
      success('Attendance saved successfully!');
      fetchDetentions();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving attendance:', err);
      error('Error saving attendance');
    } finally {
      setSaving(false);
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
      key: 'student_count',
      label: 'Students',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Users size={16} />
          <span>{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value: number) => `${value || 60} minutes`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          {row.status === 'scheduled' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateSessionStatus(row.id, 'in_progress')}
            >
              Start
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateSessionStatus(row.id, 'completed')}
            >
              Complete
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetention(row)}
          >
            View
          </Button>
        </div>
      ),
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
    { title: 'Total Detentions', value: summary.total, color: 'from-blue-500 to-cyan-500', icon: Calendar },
    { title: 'Completed', value: summary.completed, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
    { title: 'Scheduled', value: summary.scheduled, color: 'from-yellow-500 to-amber-500', icon: Calendar },
  ] : [];

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          My Detentions
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View and manage detention sessions you're assigned to</p>
      </motion.div>

      {/* Summary Stats */}
      {summary && detentions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
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
      {detentions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detention Frequency (Last 14 Days)</h2>
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ef4444" name="Detentions" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {attendanceData.length > 0 && attendanceData.some(d => d.value > 0) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Attendance at Detentions</h2>
                <Users className="text-emerald-600" size={24} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData.filter(d => d.value > 0)}
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
                    <Cell fill="#9ca3af" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}

      {detentions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500 text-lg">You are not assigned to any detention sessions</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detention Sessions ({detentions.length})</h2>
            <AlertTriangle className="text-emerald-600" size={24} />
          </div>
          <Table
            columns={columns}
            data={detentions}
            onRowClick={handleViewDetention}
          />
        </motion.div>
      )}

      {/* Detention Details Modal - Modernized */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDetention(null);
          setAttendance({});
        }}
        title="Detention Session Details"
      >
        {selectedDetention && (
          <div className="space-y-6">
            {/* Header Card with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">
                  {new Date(selectedDetention.detention_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedDetention.status === 'completed' 
                    ? 'bg-green-400 text-green-900' 
                    : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {selectedDetention.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-emerald-100 text-xs mb-1">Time</p>
                  <p className="font-bold text-lg">{selectedDetention.detention_time || 'N/A'}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-emerald-100 text-xs mb-1">Duration</p>
                  <p className="font-bold text-lg">{selectedDetention.duration || 60} min</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-emerald-100 text-xs mb-1">Students</p>
                  <p className="font-bold text-lg">{selectedDetention.assignments?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Student Attendance Section */}
            {selectedDetention.assignments && selectedDetention.assignments.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Users size={20} className="mr-2 text-emerald-600" />
                    Student Attendance
                  </h3>
                  <span className="text-sm text-gray-500">
                    {Object.values(attendance).filter(s => s === 'present').length} / {selectedDetention.assignments.length} Present
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedDetention.assignments.map((assignment: any, index: number) => (
                        <tr key={assignment.student_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{assignment.student_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600">{assignment.student_id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <select
                                value={attendance[assignment.student_id] || assignment.attendance_status || 'pending'}
                                onChange={(e) =>
                                  setAttendance({
                                    ...attendance,
                                    [assignment.student_id]: e.target.value,
                                  })
                                }
                                className={`px-3 py-2 border-2 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                  (attendance[assignment.student_id] || assignment.attendance_status) === 'present'
                                    ? 'border-green-300 bg-green-50 text-green-700'
                                    : (attendance[assignment.student_id] || assignment.attendance_status) === 'absent'
                                    ? 'border-red-300 bg-red-50 text-red-700'
                                    : (attendance[assignment.student_id] || assignment.attendance_status) === 'late'
                                    ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                    : (attendance[assignment.student_id] || assignment.attendance_status) === 'excused'
                                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700'
                                }`}
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="present">✓ Present</option>
                                <option value="absent">✗ Absent</option>
                                <option value="late">⚠ Late</option>
                                <option value="excused">ℹ Excused</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Users size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No students assigned to this detention</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                variant="secondary" 
                onClick={() => setIsModalOpen(false)}
                className="px-6"
              >
                Close
              </Button>
              {selectedDetention.status === 'scheduled' && selectedDetention.assignments?.length > 0 && (
                <Button 
                  onClick={handleMarkAttendance} 
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6"
                >
                  <CheckCircle size={20} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyDetentions;

