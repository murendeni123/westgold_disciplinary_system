import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import AssignConsequenceModal from '../../components/AssignConsequenceModal';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, X, Save, BarChart3, TrendingUp, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useToast } from '../../hooks/useToast';

const Consequences: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [consequences, setConsequences] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDefinitionModalOpen, setIsDefinitionModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [selectedConsequence, setSelectedConsequence] = useState<any | null>(null);
  const [editAssignmentData, setEditAssignmentData] = useState<any>({});
  const [editingConsequence, setEditingConsequence] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'low',
    default_duration: '',
    is_active: true,
  });

  useEffect(() => {
    fetchConsequences();
    fetchDefinitions();
  }, []);

  const fetchConsequences = async () => {
    try {
      const response = await api.getConsequences();
      setConsequences(response.data);

      // Calculate summary
      const total = response.data.length;
      const pending = response.data.filter((c: any) => c.status === 'pending').length;
      const completed = response.data.filter((c: any) => c.status === 'completed').length;
      const cancelled = response.data.filter((c: any) => c.status === 'cancelled').length;
      setSummary({ total, pending, completed, cancelled });

      // Prepare status data
      setStatusData([
        { name: 'Pending', value: pending },
        { name: 'Completed', value: completed },
        { name: 'Cancelled', value: cancelled },
      ]);

      // Prepare severity data
      const severityCounts = response.data.reduce((acc: any, c: any) => {
        const severity = c.severity || 'low';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});
      setSeverityData([
        { name: 'High', value: severityCounts.high || 0 },
        { name: 'Medium', value: severityCounts.medium || 0 },
        { name: 'Low', value: severityCounts.low || 0 },
      ]);

      // Prepare trend data (by assigned date)
      const dateCounts = response.data.reduce((acc: any, c: any) => {
        if (c.assigned_date) {
          const date = new Date(c.assigned_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {});
      const trendArray = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setTrendData(trendArray);

      // Prepare completion data (completion rate over time)
      const completionByMonth: Record<string, { assigned: number; completed: number }> = {};
      response.data.forEach((c: any) => {
        if (c.assigned_date) {
          const month = new Date(c.assigned_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!completionByMonth[month]) {
            completionByMonth[month] = { assigned: 0, completed: 0 };
          }
          completionByMonth[month].assigned++;
          if (c.status === 'completed') {
            completionByMonth[month].completed++;
          }
        }
      });
      const completionArray = Object.entries(completionByMonth)
        .map(([month, data]) => ({
          month,
          assigned: data.assigned,
          completed: data.completed,
          rate: data.assigned > 0 ? ((data.completed / data.assigned) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6);
      setCompletionData(completionArray);
    } catch (error) {
      console.error('Error fetching consequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefinitions = async () => {
    try {
      const response = await api.getConsequenceDefinitions();
      setDefinitions(response.data);
    } catch (error) {
      console.error('Error fetching definitions:', error);
    }
  };

  const handleCreateDefinition = () => {
    setEditingConsequence(null);
    setFormData({
      name: '',
      description: '',
      severity: 'low',
      default_duration: '',
      is_active: true,
    });
    setIsDefinitionModalOpen(true);
  };

  const handleEditDefinition = (definition: any) => {
    setEditingConsequence(definition);
    setFormData({
      name: definition.name || '',
      description: definition.description || '',
      severity: definition.severity || 'low',
      default_duration: definition.default_duration || '',
      is_active: definition.is_active !== undefined ? definition.is_active : true,
    });
    setIsDefinitionModalOpen(true);
  };

  const handleSubmitDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConsequence) {
        await api.updateConsequenceDefinition(editingConsequence.id, formData);
      } else {
        await api.createConsequenceDefinition(formData);
      }
      fetchDefinitions();
      setIsDefinitionModalOpen(false);
    } catch (err: any) {
      console.error('Error saving consequence definition:', err);
    }
  };

  const handleDeleteDefinition = async (id: number) => {
    if (!confirm('Are you sure you want to delete this consequence definition?')) return;
    try {
      await api.deleteConsequenceDefinition(id);
      success('Consequence definition deleted successfully');
      fetchDefinitions();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting consequence definition');
    }
  };

  const handleUpdateConsequence = async (id: number, status: string) => {
    try {
      await api.updateConsequence(id, { status });
      success('Consequence updated successfully');
      fetchConsequences();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating consequence');
    }
  };

  const handleViewDetails = (consequence: any) => {
    setSelectedConsequence(consequence);
    setEditAssignmentData({
      status: consequence.status,
      notes: consequence.notes || '',
      due_date: consequence.due_date || '',
    });
    setIsEditingAssignment(false);
    setIsDetailsModalOpen(true);
  };

  const handleEditAssignment = () => {
    setIsEditingAssignment(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedConsequence) return;
    
    try {
      await api.updateConsequence(selectedConsequence.id, editAssignmentData);
      success('Consequence updated successfully');
      setIsEditingAssignment(false);
      fetchConsequences();
      // Update selected consequence
      const updated = consequences.find(c => c.id === selectedConsequence.id);
      if (updated) {
        setSelectedConsequence({ ...updated, ...editAssignmentData });
      }
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating consequence');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this consequence assignment?')) return;
    
    try {
      await api.deleteConsequence(id);
      success('Consequence deleted successfully');
      fetchConsequences();
      setIsDetailsModalOpen(false);
      setSelectedConsequence(null);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting consequence');
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'consequence_name', label: 'Consequence' },
    { key: 'severity', label: 'Severity' },
    { key: 'assigned_date', label: 'Assigned Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAssignment(row.id);
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const tableData = consequences.map((consequence) => ({
    ...consequence,
    actions: (
      <div className="flex space-x-2">
        <Select
          value={consequence.status}
          onChange={(e) => handleUpdateConsequence(consequence.id, e.target.value)}
          className="text-sm"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
    ),
  }));

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

  const statCards = summary ? [
    { title: 'Total Consequences', value: summary.total, color: 'from-blue-500 to-cyan-500', icon: BarChart3 },
    { title: 'Pending', value: summary.pending, color: 'from-yellow-500 to-amber-500', icon: TrendingUp },
    { title: 'Completed', value: summary.completed, color: 'from-green-500 to-emerald-500', icon: TrendingUp },
    { title: 'Cancelled', value: summary.cancelled, color: 'from-gray-500 to-slate-500', icon: X },
  ] : [];

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Consequences
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage consequence definitions and assignments</p>
        </div>
        <div className="flex space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={() => setIsAssignModalOpen(true)}
              className="rounded-xl"
            >
              <Plus size={20} className="mr-2" />
              Assign Consequence
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreateDefinition}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="mr-2" />
              Create Definition
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Consequences by Status</h2>
            <Scale className="text-amber-600" size={24} />
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
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#F59E0B" />
                  <Cell fill="#10B981" />
                  <Cell fill="#6B7280" />
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No status data available</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Consequences by Severity</h2>
            <BarChart3 className="text-amber-600" size={24} />
          </div>
          {severityData.length > 0 && severityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData.filter(d => d.value > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
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
                <Bar dataKey="value" fill="url(#severityGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="severityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#F87171" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No severity data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {trendData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Consequence Trends (Last 14 Days)</h2>
            <TrendingUp className="text-amber-600" size={24} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
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
              <Line type="monotone" dataKey="count" stroke="url(#trendGradient)" name="Consequences Assigned" strokeWidth={3} />
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {completionData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Completion Rate (Last 6 Months)</h2>
            <TrendingUp className="text-amber-600" size={24} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
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
              <Bar dataKey="assigned" fill="#3B82F6" name="Assigned" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Consequence Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Consequence Records ({consequences.length})</h2>
          <Scale className="text-amber-600" size={24} />
        </div>
        <Table columns={columns} data={consequences} />
      </motion.div>

      <Modal
        isOpen={isDefinitionModalOpen}
        onClose={() => setIsDefinitionModalOpen(false)}
        title={editingConsequence ? 'Edit Consequence Definition' : 'Create Consequence Definition'}
      >
        <form onSubmit={handleSubmitDefinition} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <Select
            label="Severity"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <Input
            label="Default Duration"
            type="text"
            value={formData.default_duration}
            onChange={(e) => setFormData({ ...formData, default_duration: e.target.value })}
            placeholder="e.g., 1 week, 3 days"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDefinitionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingConsequence ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <AssignConsequenceModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          fetchConsequences();
          setIsAssignModalOpen(false);
        }}
      />

      {/* Consequence Details Modal */}
      {isDetailsModalOpen && selectedConsequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Consequence Details</h2>
                <div className="flex items-center space-x-2">
                  {!isEditingAssignment && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEditAssignment}
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                  )}
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setIsEditingAssignment(false);
                      setSelectedConsequence(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student</label>
                    <p className="mt-1 text-gray-900">{selectedConsequence.student_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consequence</label>
                    <p className="mt-1 text-gray-900">{selectedConsequence.consequence_name || 'Custom'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <span
                      className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
                        selectedConsequence.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : selectedConsequence.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedConsequence.severity?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned By</label>
                    <p className="mt-1 text-gray-900">{selectedConsequence.assigned_by_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
                    <p className="mt-1 text-gray-900">
                      {selectedConsequence.assigned_date ? new Date(selectedConsequence.assigned_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    {isEditingAssignment ? (
                      <Input
                        type="date"
                        value={editAssignmentData.due_date}
                        onChange={(e) => setEditAssignmentData({ ...editAssignmentData, due_date: e.target.value })}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {selectedConsequence.due_date ? new Date(selectedConsequence.due_date).toLocaleDateString() : 'No due date'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {isEditingAssignment ? (
                      <Select
                        value={editAssignmentData.status}
                        onChange={(e) => setEditAssignmentData({ ...editAssignmentData, status: e.target.value })}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'completed', label: 'Completed' },
                          { value: 'cancelled', label: 'Cancelled' },
                        ]}
                      />
                    ) : (
                      <span
                        className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
                          selectedConsequence.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : selectedConsequence.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedConsequence.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  {isEditingAssignment ? (
                    <Textarea
                      value={editAssignmentData.notes}
                      onChange={(e) => setEditAssignmentData({ ...editAssignmentData, notes: e.target.value })}
                      rows={4}
                      placeholder="Add notes..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                      {selectedConsequence.notes || 'No notes'}
                    </p>
                  )}
                </div>

                {selectedConsequence.incident_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Incident</label>
                    <p className="text-gray-600 text-sm">
                      This consequence is linked to a behavior incident (ID: {selectedConsequence.incident_id})
                    </p>
                  </div>
                )}

                {isEditingAssignment && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditingAssignment(false);
                        setEditAssignmentData({
                          status: selectedConsequence.status,
                          notes: selectedConsequence.notes || '',
                          due_date: selectedConsequence.due_date || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAssignment}>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consequences;

