import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import AssignConsequenceModal from '../../components/AssignConsequenceModal';
import { motion } from 'framer-motion';
import { Filter, Download, AlertTriangle, Check, X, Eye, Edit2, Save, Scale, TrendingUp, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useToast } from '../../hooks/useToast';

const BehaviourDashboard: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isAssignConsequenceModalOpen, setIsAssignConsequenceModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchIncidents();
  }, [filters]);

  const [severityData, setSeverityData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const fetchIncidents = async () => {
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.getIncidents(params);
      setIncidents(response.data);

      // Prepare severity data
      const severityCounts = response.data.reduce((acc: any, inc: any) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1;
        return acc;
      }, {});
      setSeverityData([
        { name: 'High', value: severityCounts.high || 0 },
        { name: 'Medium', value: severityCounts.medium || 0 },
        { name: 'Low', value: severityCounts.low || 0 },
      ]);

      // Prepare type data
      const typeCounts = response.data.reduce((acc: any, inc: any) => {
        acc[inc.incident_type] = (acc[inc.incident_type] || 0) + 1;
        return acc;
      }, {});
      setTypeData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

      // Prepare trend data (by date)
      const dateCounts = response.data.reduce((acc: any, inc: any) => {
        const date = new Date(inc.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      const trendArray = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setTrendData(trendArray);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Student', 'Type', 'Severity', 'Status', 'Description'];
    const rows = incidents.map((inc) => [
      inc.incident_date,
      inc.student_name,
      inc.incident_type,
      inc.severity,
      inc.status,
      inc.description || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'behaviour_incidents.csv';
    a.click();
  };

  const handleApprove = async (incident: any) => {
    if (!confirm(`Approve incident for ${incident.student_name}?`)) return;
    
    try {
      await api.updateIncident(incident.id, { status: 'approved' });
      success('Incident approved successfully');
      fetchIncidents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error approving incident');
    }
  };

  const handleReject = async (incident: any) => {
    if (!confirm(`Reject incident for ${incident.student_name}?`)) return;
    
    try {
      await api.updateIncident(incident.id, { status: 'rejected' });
      success('Incident rejected');
      fetchIncidents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error rejecting incident');
    }
  };

  const handleResolve = async (incident: any) => {
    if (!confirm(`Mark incident for ${incident.student_name} as resolved?`)) return;
    
    try {
      await api.updateIncident(incident.id, { status: 'resolved' });
      success('Incident marked as resolved');
      fetchIncidents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error resolving incident');
    }
  };

  const handleViewDetails = (incident: any) => {
    setSelectedIncident(incident);
    setEditData({
      severity: incident.severity,
      points: incident.points,
      admin_notes: incident.admin_notes || '',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedIncident) return;
    
    try {
      await api.updateIncident(selectedIncident.id, {
        severity: editData.severity,
        points: editData.points,
        admin_notes: editData.admin_notes,
      });
      success('Incident updated successfully');
      setIsEditing(false);
      fetchIncidents();
      // Update the selected incident in modal
      const updated = incidents.find(i => i.id === selectedIncident.id);
      if (updated) {
        setSelectedIncident({ ...updated, ...editData });
      }
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating incident');
    }
  };

  const columns = [
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
              : value === 'rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
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
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(row);
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Approve"
              >
                <Check size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(row);
                }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Reject"
              >
                <X size={16} />
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(row);
              }}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
              title="Mark as Resolved"
            >
              <Check size={16} />
            </button>
          )}
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
            Behaviour Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Review and manage behaviour incidents</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleExportCSV}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </Button>
        </motion.div>
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
          <Filter className="text-amber-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'resolved', label: 'Resolved' },
            ]}
            className="rounded-xl"
          />
          <Select
            label="Severity"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            options={[
              { value: '', label: 'All' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            className="rounded-xl"
          />
          <Input
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="rounded-xl"
          />
          <Input
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Incidents by Severity</h2>
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          {severityData.length > 0 && severityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No severity data available</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Incidents by Type</h2>
            <Scale className="text-amber-600" size={24} />
          </div>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
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
                <Bar dataKey="value" fill="url(#typeGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="typeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#F87171" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No type data available</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Incident Trends (Last 14 Days)</h2>
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
              <Line type="monotone" dataKey="count" stroke="url(#trendGradient)" name="Incidents" strokeWidth={3} />
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#F87171" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Incident Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Incident Records ({incidents.length})</h2>
          <AlertTriangle className="text-red-600" size={24} />
        </div>
        <Table columns={columns} data={incidents} />
      </motion.div>

      {/* Incident Details Modal */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit
                    </Button>
                  )}
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditing(false);
                      setSelectedIncident(null);
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
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.incident_date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.incident_time || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.student_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.class_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.incident_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teacher</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.teacher_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    {isEditing ? (
                      <Select
                        value={editData.severity}
                        onChange={(e) => setEditData({ ...editData, severity: e.target.value })}
                        options={[
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                        ]}
                      />
                    ) : (
                      <span
                        className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
                          selectedIncident.severity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : selectedIncident.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {selectedIncident.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.points}
                        onChange={(e) => setEditData({ ...editData, points: e.target.value })}
                        min="0"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 font-semibold text-red-600">{selectedIncident.points || 0}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
                        selectedIncident.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedIncident.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedIncident.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedIncident.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedIncident.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  {isEditing ? (
                    <Textarea
                      value={editData.admin_notes}
                      onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                      rows={4}
                      placeholder="Add admin notes..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                      {selectedIncident.admin_notes || 'No admin notes'}
                    </p>
                  )}
                </div>

                {selectedIncident.incident_id && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Incident ID:</strong> {selectedIncident.id}
                    </p>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsAssignConsequenceModalOpen(true);
                      }}
                    >
                      <Scale size={16} className="mr-2" />
                      Assign Consequence
                    </Button>
                  </div>
                )}

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          severity: selectedIncident.severity,
                          points: selectedIncident.points,
                          admin_notes: selectedIncident.admin_notes || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit}>
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

      <AssignConsequenceModal
        isOpen={isAssignConsequenceModalOpen}
        onClose={() => {
          setIsAssignConsequenceModalOpen(false);
          if (selectedIncident) {
            setIsModalOpen(true);
          }
        }}
        incidentId={selectedIncident?.id}
        studentId={selectedIncident?.student_id}
        onSuccess={() => {
          fetchIncidents();
          setIsAssignConsequenceModalOpen(false);
          if (selectedIncident) {
            setIsModalOpen(true);
          }
        }}
      />
    </div>
  );
};

export default BehaviourDashboard;



