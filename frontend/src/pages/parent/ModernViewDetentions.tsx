import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Modal from '../../components/Modal';

const ModernViewDetentions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const _navigate = useNavigate();
  const { profile } = useAuth();
  const { students } = useParentStudents();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [selectedDetention, setSelectedDetention] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild || students?.[0]) {
      fetchDetentions();
    }
  }, [selectedChild, students]);

  const fetchDetentions = async () => {
    try {
      const studentId = selectedChild || students?.[0]?.id;
      if (!studentId) return;

      const response = await api.getDetentions({});
      const allDetentions = response.data;

      const studentDetentions: any[] = [];
      for (const detention of allDetentions) {
        try {
          const detResponse = await api.getDetention(detention.id);
          const assignments = detResponse.data.assignments || [];
          const studentAssignment = assignments.find(
            (a: any) => a.student_id === Number(studentId)
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

      const total = studentDetentions.length;
      const present = studentDetentions.filter((d: any) => d.attendance_status === 'present').length;
      const absent = studentDetentions.filter((d: any) => d.attendance_status === 'absent').length;
      const late = studentDetentions.filter((d: any) => d.attendance_status === 'late').length;
      const pending = studentDetentions.filter((d: any) => !d.attendance_status || d.attendance_status === 'pending').length;
      const completed = studentDetentions.filter((d: any) => d.status === 'completed').length;
      const scheduled = studentDetentions.filter((d: any) => d.status === 'scheduled').length;

      setSummary({
        total,
        present,
        absent,
        late,
        pending,
        completed,
        scheduled,
      });

      const monthlyData: Record<string, number> = {};
      studentDetentions.forEach((detention: any) => {
        const month = new Date(detention.detention_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const chartDataArray = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    } finally {
      setLoading(false);
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
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full"
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-500 p-8 text-white shadow-2xl"
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
            <AlertTriangle className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Detentions</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            View your child's detention assignments and attendance
          </p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnimatedStatCard
            title="Total Detentions"
            value={summary.total}
            icon={AlertTriangle}
            iconColor="text-red-600"
            bgGradient="from-red-500/10 to-pink-500/10"
            delay={0.1}
          />
          <AnimatedStatCard
            title="Completed"
            value={summary.completed}
            icon={CheckCircle}
            iconColor="text-green-600"
            bgGradient="from-green-500/10 to-emerald-500/10"
            delay={0.2}
          />
          <AnimatedStatCard
            title="Scheduled"
            value={summary.scheduled}
            icon={Calendar}
            iconColor="text-blue-600"
            bgGradient="from-blue-500/10 to-cyan-500/10"
            delay={0.3}
          />
          <AnimatedStatCard
            title="Present"
            value={summary.present}
            icon={CheckCircle}
            iconColor="text-green-600"
            bgGradient="from-green-500/10 to-emerald-500/10"
            delay={0.4}
          />
        </motion.div>
      )}

      {/* Filters */}
      {students && students.length > 1 && (
        <motion.div variants={itemVariants}>
          <ModernCard title="Filters" variant="glass">
            <Select
              label="Child"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              options={students.map((c: any) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}`,
              }))}
            />
          </ModernCard>
        </motion.div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard title="Detention Frequency Over Time" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                <Bar dataKey="count" fill="#ef4444" name="Number of Detentions" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ModernCard>

          {summary && (
            <ModernCard title="Attendance at Detentions" variant="glass">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: summary.present || 0 },
                      { name: 'Absent', value: summary.absent || 0 },
                      { name: 'Late', value: summary.late || 0 },
                      { name: 'Pending', value: summary.pending || 0 },
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
                    <Cell fill="#9ca3af" />
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
      {detentions.length === 0 ? (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6"
              >
                <AlertTriangle className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Detentions Found</h3>
              <p className="text-gray-600">No detention assignments found</p>
            </div>
          </ModernCard>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <ModernCard title="Detention Records" variant="glass">
            <Table
              columns={columns}
              data={detentions}
              onRowClick={handleViewDetails}
            />
          </ModernCard>
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
    </motion.div>
  );
};

export default ModernViewDetentions;

