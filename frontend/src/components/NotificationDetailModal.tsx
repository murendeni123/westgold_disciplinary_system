import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  AlertTriangle,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationId: number | null;
  notificationType: string;
}

interface RelatedData {
  // Common fields
  student_id?: number;
  student_first_name?: string;
  student_last_name?: string;
  student_number?: string;
  grade_level?: string;
  class_name?: string;
  teacher_name?: string;
  
  // Detention fields
  assignment_id?: number;
  detention_id?: number;
  detention_date?: string;
  detention_time?: string;
  duration?: number;
  location?: string;
  detention_status?: string;
  assignment_status?: string;
  reason?: string;
  detention_notes?: string;
  assignment_notes?: string;
  
  // Incident fields
  incident_date?: string;
  incident_time?: string;
  incident_type?: string;
  description?: string;
  severity?: string;
  points?: number;
  status?: string;
  admin_notes?: string;
  
  // Merit fields
  merit_date?: string;
  merit_type?: string;
  
  // Attendance fields
  attendance_date?: string;
  period?: string;
  notes?: string;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  onClose,
  notificationId,
  notificationType
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);

  useEffect(() => {
    if (isOpen && notificationId) {
      fetchDetails();
    }
  }, [isOpen, notificationId]);

  const fetchDetails = async () => {
    if (!notificationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getNotificationDetails(notificationId);
      setNotification(response.data.notification);
      setRelatedData(response.data.relatedData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    // Handle both full datetime and time-only strings
    const date = timeString.includes('T') ? new Date(timeString) : new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      assigned: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      attended: 'bg-green-100 text-green-700',
      approved: 'bg-green-100 text-green-700',
      resolved: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-orange-100 text-orange-700',
      excused: 'bg-teal-100 text-teal-700',
      rejected: 'bg-red-100 text-red-700',
      present: 'bg-green-100 text-green-700',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return colors[severity?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const renderDetentionDetails = () => {
    if (!relatedData) return null;
    
    return (
      <div className="space-y-6">
        {/* Student Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Information</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {relatedData.student_first_name?.charAt(0)}{relatedData.student_last_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {relatedData.student_first_name} {relatedData.student_last_name}
              </p>
              <p className="text-gray-600 text-sm">
                {relatedData.student_number} • {relatedData.class_name || relatedData.grade_level}
              </p>
            </div>
          </div>
        </div>

        {/* Detention Session Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Detention Session</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{formatDate(relatedData.detention_date || '')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{formatTime(relatedData.detention_time || '')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{relatedData.location || 'TBA'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{relatedData.duration || 60} minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Reason */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(relatedData.assignment_status || relatedData.detention_status || '')}`}>
              {(relatedData.assignment_status || relatedData.detention_status || 'Scheduled').replace('_', ' ')}
            </span>
          </div>
          {relatedData.reason && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Reason</p>
              <p className="text-gray-700">{relatedData.reason}</p>
            </div>
          )}
          {relatedData.teacher_name && (
            <div className="mt-3 flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Supervised by: <span className="font-medium">{relatedData.teacher_name}</span></span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIncidentDetails = () => {
    if (!relatedData) return null;
    
    return (
      <div className="space-y-6">
        {/* Student Info */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Information</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {relatedData.student_first_name?.charAt(0)}{relatedData.student_last_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {relatedData.student_first_name} {relatedData.student_last_name}
              </p>
              <p className="text-gray-600 text-sm">
                {relatedData.student_number} • {relatedData.class_name || relatedData.grade_level}
              </p>
            </div>
          </div>
        </div>

        {/* Incident Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Incident Details</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{formatDate(relatedData.incident_date || '')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{formatTime(relatedData.incident_time || '')}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {relatedData.incident_type}
            </span>
            {relatedData.severity && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(relatedData.severity)}`}>
                {relatedData.severity} severity
              </span>
            )}
            {relatedData.points !== undefined && relatedData.points > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                -{relatedData.points} points
              </span>
            )}
          </div>

          {relatedData.description && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-gray-700">{relatedData.description}</p>
            </div>
          )}
        </div>

        {/* Status & Teacher */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(relatedData.status || '')}`}>
              {(relatedData.status || 'Pending').replace('_', ' ')}
            </span>
          </div>
          {relatedData.teacher_name && (
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Reported by: <span className="font-medium">{relatedData.teacher_name}</span></span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMeritDetails = () => {
    if (!relatedData) return null;
    
    return (
      <div className="space-y-6">
        {/* Student Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Information</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {relatedData.student_first_name?.charAt(0)}{relatedData.student_last_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {relatedData.student_first_name} {relatedData.student_last_name}
              </p>
              <p className="text-gray-600 text-sm">
                {relatedData.student_number} • {relatedData.class_name || relatedData.grade_level}
              </p>
            </div>
          </div>
        </div>

        {/* Merit Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Merit Award</h4>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Star size={32} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900">{relatedData.merit_type}</p>
              {relatedData.points !== undefined && relatedData.points > 0 && (
                <p className="text-green-600 font-semibold">+{relatedData.points} points</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Awarded On</p>
              <p className="font-medium text-gray-900">{formatDate(relatedData.merit_date || '')}</p>
            </div>
          </div>

          {relatedData.description && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Reason</p>
              <p className="text-gray-700">{relatedData.description}</p>
            </div>
          )}
        </div>

        {relatedData.teacher_name && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Awarded by: <span className="font-medium">{relatedData.teacher_name}</span></span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAttendanceDetails = () => {
    if (!relatedData) return null;
    
    const isAbsent = relatedData.status === 'absent';
    const bgColor = isAbsent ? 'from-red-50 to-orange-50' : 'from-blue-50 to-indigo-50';
    const iconBg = isAbsent ? 'bg-red-500' : 'bg-blue-500';
    
    return (
      <div className="space-y-6">
        {/* Student Info */}
        <div className={`bg-gradient-to-r ${bgColor} rounded-xl p-4`}>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Information</h4>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
              {relatedData.student_first_name?.charAt(0)}{relatedData.student_last_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {relatedData.student_first_name} {relatedData.student_last_name}
              </p>
              <p className="text-gray-600 text-sm">
                {relatedData.student_number} • {relatedData.class_name || relatedData.grade_level}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Attendance Record</h4>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isAbsent ? 'bg-red-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                <Calendar size={20} className={isAbsent ? 'text-red-600' : 'text-blue-600'} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{formatDate(relatedData.attendance_date || '')}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(relatedData.status || '')}`}>
              {relatedData.status?.toUpperCase()}
            </span>
          </div>

          {relatedData.period && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Period</p>
                <p className="font-medium text-gray-900">{relatedData.period}</p>
              </div>
            </div>
          )}

          {relatedData.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-gray-700">{relatedData.notes}</p>
            </div>
          )}
        </div>

        {relatedData.teacher_name && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Recorded by: <span className="font-medium">{relatedData.teacher_name}</span></span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNoDataMessage = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Additional Details</h3>
      <p className="text-gray-500">
        This notification doesn't have linked details to display.
      </p>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Details</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      );
    }

    if (!relatedData) {
      return renderNoDataMessage();
    }

    const type = notification?.related_type || notificationType;
    
    switch (type) {
      case 'detention':
      case 'detention_assignment':
        return renderDetentionDetails();
      case 'incident':
      case 'behaviour_incident':
        return renderIncidentDetails();
      case 'merit':
        return renderMeritDetails();
      case 'attendance':
        return renderAttendanceDetails();
      default:
        return renderNoDataMessage();
    }
  };

  const getModalTitle = () => {
    const type = notification?.related_type || notificationType;
    const titles: Record<string, string> = {
      detention: 'Detention Details',
      detention_assignment: 'Detention Details',
      incident: 'Incident Report',
      behaviour_incident: 'Incident Report',
      merit: 'Merit Award',
      demerit: 'Demerit Details',
      attendance: 'Attendance Record',
    };
    return titles[type] || 'Notification Details';
  };

  const getModalIcon = () => {
    const type = notification?.related_type || notificationType;
    const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
      detention: { icon: <FileText size={20} />, bg: 'bg-orange-500' },
      detention_assignment: { icon: <FileText size={20} />, bg: 'bg-orange-500' },
      incident: { icon: <AlertTriangle size={20} />, bg: 'bg-red-500' },
      behaviour_incident: { icon: <AlertTriangle size={20} />, bg: 'bg-red-500' },
      merit: { icon: <Star size={20} />, bg: 'bg-green-500' },
      demerit: { icon: <AlertTriangle size={20} />, bg: 'bg-red-500' },
      attendance: { icon: <Calendar size={20} />, bg: 'bg-blue-500' },
    };
    return icons[type] || { icon: <FileText size={20} />, bg: 'bg-gray-500' };
  };

  const modalIcon = getModalIcon();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${modalIcon.bg} rounded-xl flex items-center justify-center text-white`}>
                  {modalIcon.icon}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{getModalTitle()}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDetailModal;
