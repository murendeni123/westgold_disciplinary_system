import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Clock, Calendar, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DetentionHistoryProps {
  studentId: number;
}

interface DetentionRecord {
  id: number;
  detention_id: number;
  detention_date: string;
  detention_time: string;
  location: string;
  duration_minutes: number;
  supervisor_name: string;
  status: string;
  attended_at: string;
  reason: string;
  notes: string;
}

const StudentDetentionHistory: React.FC<DetentionHistoryProps> = ({ studentId }) => {
  const [history, setHistory] = useState<DetentionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  const fetchHistory = async () => {
    try {
      const response = await api.getStudentDetentionHistory(studentId);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching detention history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
      case 'attended':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'absent':
        return <XCircle size={16} className="text-red-600" />;
      case 'late':
        return <AlertCircle size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg">No detention history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-purple-600" size={20} />
                <h3 className="text-lg font-bold text-gray-900">
                  {new Date(record.detention_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>{record.detention_time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>{record.location || 'Not specified'}</span>
                </div>
                {record.supervisor_name && (
                  <div className="flex items-center space-x-1">
                    <User size={16} />
                    <span>{record.supervisor_name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(record.status)}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  record.status
                )}`}
              >
                {record.status.toUpperCase()}
              </span>
            </div>
          </div>

          {record.reason && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {record.reason}
              </p>
            </div>
          )}

          {record.notes && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {record.notes}
              </p>
            </div>
          )}

          {record.attended_at && (
            <div className="text-xs text-gray-500 mt-2">
              Attended at: {new Date(record.attended_at).toLocaleString()}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Duration: {record.duration_minutes} minutes
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StudentDetentionHistory;
