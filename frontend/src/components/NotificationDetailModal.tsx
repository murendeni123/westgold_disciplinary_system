import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, AlertTriangle, Award, Clock, MapPin, FileText } from 'lucide-react';
import { api } from '../services/api';
import Button from './Button';

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    related_type?: string;
    created_at: string;
  } | null;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  onClose,
  notification,
}) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && notification?.related_id && notification?.related_type) {
      fetchDetails();
    }
  }, [isOpen, notification]);

  const fetchDetails = async () => {
    if (!notification?.related_id || !notification?.related_type) return;

    setLoading(true);
    setError('');
    
    try {
      let response;
      
      switch (notification.related_type) {
        case 'incident':
          response = await api.getIncident(notification.related_id);
          break;
        case 'merit':
          response = await api.getMerit(notification.related_id);
          break;
        case 'detention':
          response = await api.getDetention(notification.related_id);
          break;
        case 'intervention':
          response = await api.getIntervention(notification.related_id);
          break;
        case 'consequence':
          response = await api.getConsequence(notification.related_id);
          break;
        case 'student':
          response = await api.getStudent(notification.related_id);
          break;
        default:
          setError('Unknown notification type');
          return;
      }
      
      setDetails(response.data);
    } catch (err: any) {
      console.error('Error fetching notification details:', err);
      setError(err.response?.data?.error || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const renderIncidentDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Student</p>
          <p className="font-semibold text-gray-900">{details.student_name}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Date</p>
          <p className="font-semibold text-gray-900">
            {new Date(details.date || details.incident_date).toLocaleDateString()}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Type</p>
          <p className="font-semibold text-gray-900">{details.incident_type || details.type}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Severity</p>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            details.severity === 'high' || details.severity === 'critical'
              ? 'bg-red-100 text-red-800'
              : details.severity === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {details.severity?.toUpperCase()}
          </span>
        </div>
      </div>
      {details.points_deducted && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 mb-1">Demerit Points</p>
          <p className="text-2xl font-bold text-red-700">{details.points_deducted}</p>
        </div>
      )}
      {details.description && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Description</p>
          <p className="text-sm text-gray-900">{details.description}</p>
        </div>
      )}
      {details.action_taken && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 mb-2">Action Taken</p>
          <p className="text-sm text-gray-900">{details.action_taken}</p>
        </div>
      )}
    </div>
  );

  const renderMeritDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Student</p>
          <p className="font-semibold text-gray-900">{details.student_name}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Date</p>
          <p className="font-semibold text-gray-900">
            {new Date(details.date || details.awarded_date).toLocaleDateString()}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Type</p>
          <p className="font-semibold text-gray-900">{details.merit_type || details.type}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 mb-1">Points Awarded</p>
          <p className="text-2xl font-bold text-green-700">{details.points}</p>
        </div>
      </div>
      {details.reason && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Reason</p>
          <p className="text-sm text-gray-900">{details.reason}</p>
        </div>
      )}
      {details.awarded_by_name && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Awarded By</p>
          <p className="font-semibold text-gray-900">{details.awarded_by_name}</p>
        </div>
      )}
    </div>
  );

  const renderDetentionDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Date</p>
          <p className="font-semibold text-gray-900">
            {new Date(details.detention_date).toLocaleDateString()}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Time</p>
          <p className="font-semibold text-gray-900">{details.detention_time}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Duration</p>
          <p className="font-semibold text-gray-900">{details.duration} minutes</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Status</p>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            details.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : details.status === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {details.status?.toUpperCase()}
          </span>
        </div>
      </div>
      {details.location && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Location</p>
          <p className="font-semibold text-gray-900">{details.location}</p>
        </div>
      )}
      {details.teacher_name && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Supervisor</p>
          <p className="font-semibold text-gray-900">{details.teacher_name}</p>
        </div>
      )}
      {details.assignments && details.assignments.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Assigned Students</p>
          <div className="space-y-1">
            {details.assignments.map((assignment: any) => (
              <p key={assignment.id} className="text-sm text-gray-900">
                • {assignment.student_name}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConsequenceDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Student</p>
          <p className="font-semibold text-gray-900">{details.student_name || 'N/A'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Consequence</p>
          <p className="font-semibold text-gray-900">{details.consequence_name || 'N/A'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Assigned Date</p>
          <p className="font-semibold text-gray-900">
            {details.assigned_date ? new Date(details.assigned_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Due Date</p>
          <p className="font-semibold text-gray-900">
            {details.due_date ? new Date(details.due_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Severity</p>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            details.severity === 'high'
              ? 'bg-red-100 text-red-800'
              : details.severity === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : details.severity === 'low'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {details.severity ? details.severity.toUpperCase() : 'N/A'}
          </span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Status</p>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            details.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : details.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {details.status ? details.status.toUpperCase() : 'N/A'}
          </span>
        </div>
      </div>
      {details.notes && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Notes</p>
          <p className="text-sm text-gray-900">{details.notes}</p>
        </div>
      )}
      {details.assigned_by_name && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Assigned By</p>
          <p className="font-semibold text-gray-900">{details.assigned_by_name}</p>
        </div>
      )}
    </div>
  );

  const renderDetails = () => {
    if (!details) return null;

    switch (notification?.related_type) {
      case 'incident':
        return renderIncidentDetails();
      case 'merit':
        return renderMeritDetails();
      case 'detention':
        return renderDetentionDetails();
      case 'consequence':
        return renderConsequenceDetails();
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Details not available for this notification type.</p>
          </div>
        );
    }
  };

  if (!isOpen || !notification) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{notification.title}</h2>
                <p className="text-white/90">{notification.message}</p>
                <p className="text-xs text-white/70 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
                />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <AlertTriangle className="mx-auto mb-2 text-red-600" size={32} />
                <p className="text-red-800">{error}</p>
              </div>
            ) : (
              renderDetails()
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotificationDetailModal;
