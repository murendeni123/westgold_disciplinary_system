import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  User, 
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Bell,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';

interface Incident {
  id: number;
  student_id: number;
  student_name: string;
  student_id_code?: string;
  class_name: string;
  teacher_name: string;
  incident_date: string;
  incident_time: string;
  incident_type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  points: number;
  status: string;
  admin_notes?: string;
  created_at: string;
}

const IncidentApproval: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');

  useEffect(() => {
    fetchPendingIncidents();
  }, []);

  const fetchPendingIncidents = async () => {
    setLoading(true);
    try {
      // Fetch only pending incidents
      const response = await api.getIncidents({ status: 'pending' });
      // Filter to only high and medium severity
      const pendingHighMedium = response.data.filter(
        (inc: Incident) => inc.severity === 'high' || inc.severity === 'medium'
      );
      setIncidents(pendingHighMedium);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      error('Failed to load pending incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (incident: Incident) => {
    setProcessingId(incident.id);
    try {
      await api.updateIncident(incident.id, { 
        status: 'approved',
        admin_notes: adminNotes[incident.id] || ''
      });
      success(`Incident approved - Parent notification sent for ${incident.student_name}`);
      setIncidents(prev => prev.filter(i => i.id !== incident.id));
      setExpandedId(null);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error approving incident');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (incident: Incident) => {
    setProcessingId(incident.id);
    try {
      await api.updateIncident(incident.id, { 
        status: 'rejected',
        admin_notes: adminNotes[incident.id] || ''
      });
      success(`Incident rejected - No notification sent to parent`);
      setIncidents(prev => prev.filter(i => i.id !== incident.id));
      setExpandedId(null);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error rejecting incident');
    } finally {
      setProcessingId(null);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          label: 'HIGH SEVERITY'
        };
      case 'medium':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          label: 'MEDIUM SEVERITY'
        };
      default:
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: <Shield className="w-5 h-5 text-green-600" />,
          label: 'LOW SEVERITY'
        };
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'all') return true;
    return inc.severity === filter;
  });

  const highCount = incidents.filter(i => i.severity === 'high').length;
  const mediumCount = incidents.filter(i => i.severity === 'medium').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Incident Approval Queue
            </h1>
            <p className="text-gray-600 mt-1">
              Review and approve high/medium severity incidents before parent notifications are sent
            </p>
          </div>
          <Button
            onClick={fetchPendingIncidents}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-3xl font-bold text-gray-900">{incidents.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-red-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">High Severity</p>
                <p className="text-3xl font-bold text-red-700">{highCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-amber-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Medium Severity</p>
                <p className="text-3xl font-bold text-amber-700">{mediumCount}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: incidents.length },
            { key: 'high', label: 'High', count: highCount },
            { key: 'medium', label: 'Medium', count: mediumCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
        >
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No pending high/medium severity incidents require approval.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredIncidents.map((incident, index) => {
              const config = getSeverityConfig(incident.severity);
              const isExpanded = expandedId === incident.id;
              const isProcessing = processingId === incident.id;

              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl shadow-sm border-2 ${config.border} overflow-hidden`}
                >
                  {/* Incident Header */}
                  <div
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${config.bg}`}
                    onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {config.icon}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${config.text} px-2 py-0.5 rounded`}>
                              {config.label}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(incident.incident_date).toLocaleDateString('en-ZA')}
                              {incident.incident_time && ` at ${incident.incident_time}`}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mt-1">
                            {incident.student_name} - {incident.incident_type}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {incident.class_name} • Reported by {incident.teacher_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          {incident.points} points
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200"
                      >
                        <div className="p-6">
                          {/* Incident Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Incident Description
                              </h4>
                              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {incident.description || 'No description provided'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Student Information
                              </h4>
                              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <p className="text-gray-600">
                                  <span className="font-medium">Name:</span> {incident.student_name}
                                </p>
                                <p className="text-gray-600">
                                  <span className="font-medium">Class:</span> {incident.class_name}
                                </p>
                                <p className="text-gray-600">
                                  <span className="font-medium">Points Assigned:</span> {incident.points}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Admin Notes */}
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Admin Notes (Optional)
                            </h4>
                            <Textarea
                              value={adminNotes[incident.id] || ''}
                              onChange={(e) => setAdminNotes(prev => ({
                                ...prev,
                                [incident.id]: e.target.value
                              }))}
                              placeholder="Add any notes about this incident..."
                              rows={3}
                            />
                          </div>

                          {/* Notification Info */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                              <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-800">
                                  Parent Notification
                                </p>
                                <p className="text-sm text-blue-600">
                                  Approving this incident will send an in-app notification and WhatsApp message 
                                  (if opted in) to the parent about this incident.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-3">
                            <Button
                              onClick={() => handleReject(incident)}
                              variant="secondary"
                              disabled={isProcessing}
                              className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(incident)}
                              disabled={isProcessing}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Approve & Notify Parent
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default IncidentApproval;
