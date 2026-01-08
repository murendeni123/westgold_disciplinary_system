import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Settings, Users, Eye, Download, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';

const Detentions: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedDetention, setSelectedDetention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingDetention, setEditingDetention] = useState<any>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    detention_date: '',
    detention_time: '',
    duration: '60',
    location: '',
    teacher_on_duty_id: '',
    notes: '',
  });
  const [ruleData, setRuleData] = useState({
    action_type: 'detention',
    min_points: '0',
    max_points: '',
    severity: '',
    detention_duration: '60',
    is_active: true,
  });

  useEffect(() => {
    fetchDetentions();
    fetchRules();
    fetchTeachers();
  }, []);

  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const fetchDetentions = async () => {
    try {
      const response = await api.getDetentions();
      setDetentions(response.data);

      // Prepare trend data (by date)
      const dateCounts = response.data.reduce((acc: any, det: any) => {
        const date = new Date(det.detention_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      const trendArray = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setChartData(trendArray);

      // Prepare status data
      const statusCounts = response.data.reduce((acc: any, det: any) => {
        acc[det.status] = (acc[det.status] || 0) + 1;
        return acc;
      }, {});
      setStatusData([
        { name: 'Scheduled', value: statusCounts.scheduled || 0 },
        { name: 'In Progress', value: statusCounts.in_progress || 0 },
        { name: 'Completed', value: statusCounts.completed || 0 },
      ]);

      // Prepare attendance data (fetch for each detention)
      let presentCount = 0;
      let absentCount = 0;
      let pendingCount = 0;
      
      for (const detention of response.data.slice(0, 20)) { // Limit to first 20 for performance
        try {
          const detResponse = await api.getDetention(detention.id);
          const assignments = detResponse.data.assignments || [];
          assignments.forEach((a: any) => {
            if (a.status === 'present' || a.status === 'attended') presentCount++;
            else if (a.status === 'absent') absentCount++;
            else pendingCount++;
          });
        } catch (error) {
          // Skip if error fetching detention details
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

  const fetchRules = async () => {
    try {
      const response = await api.getDetentionRules();
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleCreate = () => {
    setEditingDetention(null);
    setFormData({
      detention_date: new Date().toISOString().split('T')[0],
      detention_time: '15:00',
      duration: '60',
      location: '',
      teacher_on_duty_id: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (detention: any) => {
    setEditingDetention(detention);
    setFormData({
      detention_date: detention.detention_date,
      detention_time: detention.detention_time,
      duration: String(detention.duration),
      location: detention.location || '',
      teacher_on_duty_id: detention.teacher_on_duty_id || '',
      notes: detention.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this detention?')) {
      try {
        await api.deleteDetention(id);
        fetchDetentions();
      } catch (err) {
        console.error('Error deleting detention:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDetention) {
        await api.updateDetention(editingDetention.id, formData);
        success('Detention updated successfully');
      } else {
        await api.createDetention(formData);
        success('Detention created successfully');
      }
      setIsModalOpen(false);
      fetchDetentions();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving detention');
    }
  };

  const handleAutoAssign = async (detentionId: number) => {
    if (window.confirm('Auto-assign students based on detention rules?')) {
      try {
        await api.autoAssignDetention({ detention_id: detentionId });
        success('Auto-assignment completed!');
        fetchDetentions();
      } catch (err) {
        console.error('Error auto-assigning:', err);
        error('Error auto-assigning students');
      }
    }
  };

  const handleViewAttendance = async (detentionId: number) => {
    try {
      const response = await api.getDetention(detentionId);
      setSelectedDetention(response.data);
      setIsAttendanceModalOpen(true);
    } catch (err) {
      console.error('Error fetching detention:', err);
    }
  };

  const handleExportDetention = async (detentionId: number) => {
    try {
      const response = await api.getDetention(detentionId);
      const detention = response.data;
      
      // Create CSV
      const headers = ['Student ID', 'Student Name', 'Status', 'Attendance Time', 'Notes'];
      const rows = detention.assignments.map((a: any) => [
        a.student_id,
        a.student_name,
        a.status,
        a.attendance_time || '',
        a.notes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detention_${detention.detention_date}_${detention.detention_time.replace(':', '')}.csv`;
      a.click();
    } catch (err) {
      console.error('Error exporting detention:', err);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveDetentionRule({ ...ruleData, id: editingRule?.id });
      success('Detention rule saved successfully');
      setIsRulesModalOpen(false);
      setEditingRule(null);
      fetchRules();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving rule');
    }
  };

  const columns = [
    { key: 'detention_date', label: 'Date' },
    { key: 'detention_time', label: 'Time' },
    { key: 'duration', label: 'Duration (min)' },
    { key: 'location', label: 'Location' },
    { key: 'teacher_name', label: 'Teacher on Duty' },
    { key: 'student_count', label: 'Students' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : value === 'in_progress'
              ? 'bg-yellow-100 text-yellow-800'
              : value === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAttendance(row.id);
            }}
            className="text-purple-600 hover:text-purple-800"
            title="View attendance"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExportDetention(row.id);
            }}
            className="text-indigo-600 hover:text-indigo-800"
            title="Download records"
          >
            <Download size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAutoAssign(row.id);
            }}
            className="text-green-600 hover:text-green-800"
            title="Auto-assign students"
          >
            <Users size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
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
            Detention Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage detention sessions and rules</p>
        </div>
        <div className="flex space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={() => setIsRulesModalOpen(true)}
              className="rounded-xl"
            >
              <Settings size={20} className="mr-2" />
              Detention Rules
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="mr-2" />
              Create Detention
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Detention Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Detention Rules</h2>
          <Settings className="text-amber-600" size={24} />
        </div>
        <Table
          columns={[
            { key: 'action_type', label: 'Action Type' },
            { key: 'min_points', label: 'Min Points' },
            { key: 'max_points', label: 'Max Points' },
            { key: 'severity', label: 'Severity' },
            { key: 'detention_duration', label: 'Duration (min)' },
            {
              key: 'is_active',
              label: 'Active',
              render: (value: number) => (value === 1 ? 'Yes' : 'No'),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_: any, row: any) => (
                <button
                  onClick={() => {
                    setEditingRule(row);
                    setRuleData({
                      action_type: row.action_type,
                      min_points: String(row.min_points),
                      max_points: row.max_points ? String(row.max_points) : '',
                      severity: row.severity || '',
                      detention_duration: String(row.detention_duration),
                      is_active: row.is_active === 1,
                    });
                    setIsRulesModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={18} />
                </button>
              ),
            },
          ]}
          data={rules}
        />
      </motion.div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detention Frequency (Last 14 Days)</h2>
            <TrendingUp className="text-amber-600" size={24} />
          </div>
          {chartData.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No detention data available</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detention Status Distribution</h2>
            <Calendar className="text-amber-600" size={24} />
          </div>
          {statusData.length > 0 && statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No status data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {attendanceData.length > 0 && attendanceData.some(d => d.value > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance at Detentions</h2>
            <Users className="text-amber-600" size={24} />
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

      {/* Detention Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Detention Sessions ({detentions.length})</h2>
          <AlertTriangle className="text-amber-600" size={24} />
        </div>
        <Table columns={columns} data={detentions} />
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDetention ? 'Edit Detention' : 'Create Detention'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.detention_date}
              onChange={(e) => setFormData({ ...formData, detention_date: e.target.value })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={formData.detention_time}
              onChange={(e) => setFormData({ ...formData, detention_time: e.target.value })}
              required
            />
          </div>
          <Input
            label="Duration (minutes)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            required
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Room 101"
          />
          <Select
            label="Teacher on Duty"
            value={formData.teacher_on_duty_id}
            onChange={(e) => setFormData({ ...formData, teacher_on_duty_id: e.target.value })}
            options={teachers.map((t) => ({ value: t.id, label: t.name }))}
          />
          <textarea
            className="input w-full p-2 border rounded"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes..."
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setSelectedDetention(null);
        }}
        title={`Detention Attendance - ${selectedDetention?.detention_date} ${selectedDetention?.detention_time}`}
        size="lg"
      >
        {selectedDetention && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold">{selectedDetention.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teacher on Duty</p>
                <p className="font-semibold">{selectedDetention.teacher_name || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Student Attendance</h4>
              {selectedDetention.assignments && selectedDetention.assignments.length > 0 ? (
                <Table
                  columns={[
                    { key: 'student_name', label: 'Student' },
                    { key: 'student_id', label: 'Student ID' },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (value: string) => (
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            value === 'attended'
                              ? 'bg-green-100 text-green-800'
                              : value === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : value === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {value.toUpperCase()}
                        </span>
                      ),
                    },
                    { key: 'attendance_time', label: 'Time' },
                    { key: 'notes', label: 'Notes' },
                  ]}
                  data={selectedDetention.assignments}
                />
              ) : (
                <p className="text-gray-500 text-center py-4">No students assigned</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAttendanceModalOpen(false);
                  setSelectedDetention(null);
                }}
              >
                Close
              </Button>
              {selectedDetention && (
                <Button onClick={() => handleExportDetention(selectedDetention.id)}>
                  <Download size={16} className="mr-2" />
                  Download Records
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isRulesModalOpen}
        onClose={() => {
          setIsRulesModalOpen(false);
          setEditingRule(null);
        }}
        title={editingRule ? 'Edit Detention Rule' : 'Add Detention Rule'}
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <Select
            label="Action Type"
            value={ruleData.action_type}
            onChange={(e) => setRuleData({ ...ruleData, action_type: e.target.value })}
            options={[
              { value: 'verbal_warning', label: 'Verbal Warning' },
              { value: 'written_warning', label: 'Written Warning' },
              { value: 'detention', label: 'Detention' },
              { value: 'suspension', label: 'Suspension' },
              { value: 'expulsion', label: 'Expulsion' },
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Points"
              type="number"
              value={ruleData.min_points}
              onChange={(e) => setRuleData({ ...ruleData, min_points: e.target.value })}
              required
            />
            <Input
              label="Max Points (optional)"
              type="number"
              value={ruleData.max_points}
              onChange={(e) => setRuleData({ ...ruleData, max_points: e.target.value })}
            />
          </div>
          <Select
            label="Severity (optional)"
            value={ruleData.severity}
            onChange={(e) => setRuleData({ ...ruleData, severity: e.target.value })}
            options={[
              { value: '', label: 'Any' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Input
            label="Detention Duration (minutes)"
            type="number"
            value={ruleData.detention_duration}
            onChange={(e) => setRuleData({ ...ruleData, detention_duration: e.target.value })}
            required
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active_rule"
              checked={ruleData.is_active}
              onChange={(e) => setRuleData({ ...ruleData, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_active_rule" className="text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => {
              setIsRulesModalOpen(false);
              setEditingRule(null);
            }}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Detentions;

