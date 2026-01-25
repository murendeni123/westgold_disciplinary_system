import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ModernCard from '../../components/ModernCard';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import { AlertCircle, Scale, Eye, X, CheckCircle, Shield, Clock, User, Calendar, Filter, Search, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';

const ModernConsequences: React.FC = () => {
  const { user } = useAuth();
  const [consequences, setConsequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsequence, setSelectedConsequence] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAcknowledgeModalOpen, setIsAcknowledgeModalOpen] = useState(false);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const { success, error: showError, ToastContainer } = useToast();

  useEffect(() => {
    fetchConsequences();
  }, [filters, user]);

  const fetchConsequences = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (user?.children && user.children.length > 0) {
        if (filters.student_id) {
          params.student_id = filters.student_id;
        }
      } else {
        setConsequences([]);
        setLoading(false);
        return;
      }

      if (filters.status) params.status = filters.status;

      // Use consequence-assignments API which has the actual data
      const response = await api.getConsequenceAssignments(params);
      
      // Convert childIds to numbers for proper comparison
      const childIds = user?.children?.map((child: any) => Number(child.id)) || [];
      const filtered = response.data.filter((consequence: any) => {
        return childIds.includes(Number(consequence.student_id));
      });
      
      setConsequences(filtered);
    } catch (error) {
      console.error('Error fetching consequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (consequence: any) => {
    setSelectedConsequence(consequence);
    setIsDetailsModalOpen(true);
  };

  const handleAcknowledge = () => {
    if (!selectedConsequence) return;
    setAcknowledgeNotes('');
    setIsAcknowledgeModalOpen(true);
  };

  const handleSubmitAcknowledge = async () => {
    if (!selectedConsequence) return;
    
    try {
      await api.acknowledgeConsequence(selectedConsequence.id, { parent_notes: acknowledgeNotes });
      success('Consequence acknowledged successfully');
      setIsAcknowledgeModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchConsequences();
      // Update selected consequence
      const updated = consequences.find(c => c.id === selectedConsequence.id);
      if (updated) {
        setSelectedConsequence({ ...updated, parent_acknowledged: 1, parent_notes: acknowledgeNotes });
      }
    } catch (err: any) {
      showError(err.response?.data?.error || 'Error acknowledging consequence');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'pending':
      case 'active':
        return <Clock className="text-yellow-600" size={18} />;
      case 'cancelled':
        return <X className="text-red-600" size={18} />;
      default:
        return <AlertCircle className="text-gray-600" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'active':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredConsequences = consequences.filter((consequence) => {
    const searchLower = filters.searchQuery.toLowerCase();
    return (
      consequence.student_name?.toLowerCase().includes(searchLower) ||
      consequence.consequence_name?.toLowerCase().includes(searchLower) ||
      consequence.assigned_by_name?.toLowerCase().includes(searchLower) ||
      consequence.notes?.toLowerCase().includes(searchLower)
    );
  });

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
      <ToastContainer />
      
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
            <Shield className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Consequences</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            View and acknowledge consequences assigned to your children
          </p>
        </div>
      </motion.div>

      {user?.children && user.children.length > 0 ? (
        <>
          {/* Search and Filter Bar */}
          <motion.div variants={itemVariants}>
            <ModernCard variant="glass">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search consequences by child, type, or assigned by..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Filter Toggle Button */}
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all"
                  >
                    <Filter size={18} />
                    <span className="font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                  </motion.button>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-orange-600">{filteredConsequences.length}</span> consequence{filteredConsequences.length !== 1 ? 's' : ''} found
                  </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <User size={16} className="inline mr-1" />
                              Child
                            </label>
                            <select
                              value={filters.student_id}
                              onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            >
                              <option value="">All Children</option>
                              {user.children.map((child: any) => (
                                <option key={child.id} value={child.id}>
                                  {child.first_name} {child.last_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Clock size={16} className="inline mr-1" />
                              Status
                            </label>
                            <select
                              value={filters.status}
                              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            >
                              <option value="">All Statuses</option>
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ModernCard>
          </motion.div>

          {/* Consequences Grid */}
          {loading ? (
            <motion.div variants={itemVariants}>
              <ModernCard variant="glass">
                <div className="flex justify-center items-center h-64">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full"
                  />
                </div>
              </ModernCard>
            </motion.div>
          ) : filteredConsequences.length === 0 ? (
            <motion.div variants={itemVariants}>
              <ModernCard variant="glass">
                <div className="text-center py-16">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6"
                  >
                    <Scale className="text-white" size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Consequences Found</h3>
                  <p className="text-gray-600">
                    {filters.searchQuery || filters.student_id || filters.status
                      ? 'Try adjusting your filters to see more results'
                      : 'No consequences found for your children'}
                  </p>
                </div>
              </ModernCard>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredConsequences.map((consequence: any, index: number) => (
                <motion.div
                  key={consequence.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -5 }}
                >
                  <ModernCard variant="glass" hover={true}>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
                            <Shield size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{consequence.student_name}</h3>
                            <p className="text-sm text-gray-600">{consequence.consequence_name || 'Custom Consequence'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getStatusColor(consequence.status)}`}>
                            {getStatusIcon(consequence.status)}
                            <span className="text-sm font-semibold capitalize">{consequence.status}</span>
                          </div>
                          {!consequence.parent_acknowledged && (
                            <div className="px-3 py-1.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full flex items-center space-x-1">
                              <AlertTriangle size={14} />
                              <span className="text-xs font-semibold">Needs Acknowledgment</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {consequence.notes && (
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{consequence.notes}</p>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="text-blue-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Assigned</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {consequence.assigned_date ? new Date(consequence.assigned_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="text-green-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Due Date</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {consequence.due_date ? new Date(consequence.due_date).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="text-purple-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Assigned By</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{consequence.assigned_by_name || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="text-orange-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Severity</span>
                          </div>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${getSeverityColor(consequence.severity)}`}>
                            {consequence.severity?.toUpperCase() || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDetails(consequence)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                        >
                          <Eye size={16} />
                          <span className="font-medium">View Details</span>
                        </motion.button>
                        {!consequence.parent_acknowledged && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedConsequence(consequence);
                              handleAcknowledge();
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all"
                          >
                            <CheckCircle size={16} />
                            <span className="font-medium">Acknowledge</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </ModernCard>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6"
              >
                <AlertCircle className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Children Linked</h3>
              <p className="text-gray-600 mb-4">You don't have any children linked to your account.</p>
              <p className="text-sm text-gray-500">Use the "Link Child" option to connect your child's account.</p>
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Consequence Details Modal */}
      {isDetailsModalOpen && selectedConsequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Consequence Details</h2>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedConsequence(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Child</label>
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
                    <p className="mt-1 text-gray-900">
                      {selectedConsequence.due_date ? new Date(selectedConsequence.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Acknowledged</label>
                    {selectedConsequence.parent_acknowledged ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          Acknowledged
                        </span>
                        {selectedConsequence.parent_acknowledged_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(selectedConsequence.parent_acknowledged_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="mt-1 inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Not Acknowledged
                      </span>
                    )}
                  </div>
                </div>

                {selectedConsequence.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedConsequence.notes}
                    </p>
                  </div>
                )}

                {selectedConsequence.parent_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Notes</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {selectedConsequence.parent_notes}
                    </p>
                  </div>
                )}

                {selectedConsequence.incident_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Incident</label>
                    <p className="text-gray-600 text-sm">
                      This consequence is linked to a behavior incident (ID: {selectedConsequence.incident_id})
                    </p>
                  </div>
                )}

                {!selectedConsequence.parent_acknowledged && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleAcknowledge}>
                      <CheckCircle size={16} className="mr-2" />
                      Acknowledge Consequence
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      {isAcknowledgeModalOpen && selectedConsequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acknowledge Consequence</h2>
              <p className="text-gray-600 mb-4">
                Please acknowledge that you have been notified about this consequence for {selectedConsequence.student_name}.
              </p>
              <Textarea
                label="Your Notes (Optional)"
                value={acknowledgeNotes}
                onChange={(e) => setAcknowledgeNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes or comments..."
              />
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAcknowledgeModalOpen(false);
                    setAcknowledgeNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitAcknowledge}>
                  <CheckCircle size={16} className="mr-2" />
                  Acknowledge
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ModernConsequences;

