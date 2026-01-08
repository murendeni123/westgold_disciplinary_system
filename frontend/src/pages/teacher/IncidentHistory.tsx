import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Edit2, Trash2, Eye, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useToast } from '../../hooks/useToast';

const IncidentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const [severityData, setSeverityData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const fetchIncidents = async () => {
    try {
      const response = await api.getIncidents();
      setIncidents(response.data);

      // Calculate summary
      const total = response.data.length;
      const pending = response.data.filter((i: any) => i.status === 'pending').length;
      const approved = response.data.filter((i: any) => i.status === 'approved').length;
      const resolved = response.data.filter((i: any) => i.status === 'resolved').length;
      setSummary({ total, pending, approved, resolved });

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

  const handleDelete = async (incident: any) => {
    if (!confirm(`Delete incident for ${incident.student_name}? This action cannot be undone.`)) return;
    
    try {
      await api.deleteIncident(incident.id);
      success('Incident deleted successfully');
      fetchIncidents();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting incident');
    }
  };

  const handleViewDetails = (incident: any) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleEdit = (incident: any) => {
    // Navigate to log incident page with pre-filled data
    navigate('/teacher/behaviour/log', { 
      state: { 
        editMode: true, 
        incident: incident 
      } 
    });
  };

  const columns = [
    { key: 'incident_date', label: 'Date' },
    { key: 'student_name', label: 'Student' },
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
      key: 'points',
      label: 'Points',
      render: (value: number) => (
        <span className="font-semibold text-red-600">{value || 0}</span>
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
      render: (_value: any, row: any) => (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
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

  const statCards = [
    { title: 'Total Incidents', value: summary?.total || 0, color: 'from-red-500 to-pink-500', icon: AlertTriangle },
    { title: 'Pending', value: summary?.pending || 0, color: 'from-yellow-500 to-amber-500', icon: AlertTriangle },
    { title: 'Approved', value: summary?.approved || 0, color: 'from-blue-500 to-cyan-500', icon: AlertTriangle },
    { title: 'Resolved', value: summary?.resolved || 0, color: 'from-green-500 to-emerald-500', icon: AlertTriangle },
  ];

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Incident History
          </h1>
          <p className="text-gray-600 mt-2 text-lg">View all incidents you've logged</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => navigate('/teacher/behaviour/log')}
            className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Log New Incident
          </Button>
        </motion.div>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trendData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Incident Trends (Last 14 Days)</h2>
              <TrendingUp className="text-red-600" size={24} />
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
                <Line type="monotone" dataKey="count" stroke="url(#trendGradient)" name="Incidents" strokeWidth={3} dot={{ fill: '#EF4444', r: 6 }} />
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

        {severityData.length > 0 && severityData.some(d => d.value > 0) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Incidents by Severity</h2>
              <AlertTriangle className="text-red-600" size={24} />
            </div>
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
          </motion.div>
        )}
      </div>

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedIncident(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Incident Details</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedIncident(null);
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <AlertTriangle size={24} className="text-gray-500" />
                </motion.button>
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
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-gray-900">{selectedIncident.incident_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points</label>
                    <p className="mt-1 text-gray-900 font-semibold text-red-600">{selectedIncident.points || 0}</p>
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

                {selectedIncident.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {selectedIncident.admin_notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  {selectedIncident.status === 'pending' && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsModalOpen(false);
                          handleEdit(selectedIncident);
                        }}
                        className="rounded-xl"
                      >
                        <Edit2 size={16} className="mr-2" />
                        Edit
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedIncident(null);
                      }}
                      className="rounded-xl"
                    >
                      Close
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default IncidentHistory;

