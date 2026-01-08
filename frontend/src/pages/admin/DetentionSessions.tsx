import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Plus,
  Calendar,
  UserCheck,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  Bell,
  Eye,
} from 'lucide-react';

interface DetentionSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  max_students: number;
  assigned_students: number;
  teacher_id: number | null;
  teacher_name: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
}

const DetentionSessions: React.FC = () => {
  const [sessions, setSessions] = useState<DetentionSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<DetentionSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from API
      setSessions([
        {
          id: 1,
          date: '2026-01-10',
          start_time: '15:00',
          end_time: '16:00',
          location: 'Room 101',
          max_students: 20,
          assigned_students: 15,
          teacher_id: 1,
          teacher_name: 'Mr. Johnson',
          status: 'scheduled',
          notes: 'Regular Friday detention',
        },
        {
          id: 2,
          date: '2026-01-17',
          start_time: '15:00',
          end_time: '16:00',
          location: 'Room 101',
          max_students: 20,
          assigned_students: 0,
          teacher_id: null,
          teacher_name: null,
          status: 'scheduled',
          notes: '',
        },
      ]);

      setTeachers([
        { id: 1, name: 'Mr. Johnson', email: 'johnson@school.com' },
        { id: 2, name: 'Mrs. Smith', email: 'smith@school.com' },
        { id: 3, name: 'Mr. Brown', email: 'brown@school.com' },
        { id: 4, name: 'Ms. Davis', email: 'davis@school.com' },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load detention sessions' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (sessionData: Partial<DetentionSession>) => {
    try {
      const newSession: DetentionSession = {
        id: Date.now(),
        date: sessionData.date || '',
        start_time: sessionData.start_time || '',
        end_time: sessionData.end_time || '',
        location: sessionData.location || '',
        max_students: sessionData.max_students || 20,
        assigned_students: 0,
        teacher_id: null,
        teacher_name: null,
        status: 'scheduled',
        notes: sessionData.notes || '',
      };
      setSessions([...sessions, newSession]);
      setMessage({ type: 'success', text: 'Detention session created successfully' });
      setShowCreateModal(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create detention session' });
    }
  };

  const handleAssignTeacher = async (sessionId: number, teacherId: number) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return;

      setSessions(sessions.map(s => 
        s.id === sessionId 
          ? { ...s, teacher_id: teacherId, teacher_name: teacher.name }
          : s
      ));

      // In real app, send notification to teacher via API
      setMessage({ 
        type: 'success', 
        text: `${teacher.name} has been assigned and will be notified` 
      });
      setShowAssignModal(false);
      setSelectedSession(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign teacher' });
    }
  };

  const handleDeleteSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
    setMessage({ type: 'success', text: 'Session deleted successfully' });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="text-white" size={24} />
            </div>
            <span>Detention Sessions</span>
          </h1>
          <p className="text-gray-500 mt-1">Create and manage detention sessions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={20} />
          <span>Create Session</span>
        </motion.button>
      </motion.div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center justify-between ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by location or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>
      </motion.div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
          >
            {/* Session Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Calendar className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {session.start_time} - {session.end_time}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                {session.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>

            {/* Session Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-gray-900">{session.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium text-gray-900">
                  {session.assigned_students} / {session.max_students} students
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                  style={{ width: `${(session.assigned_students / session.max_students) * 100}%` }}
                />
              </div>
            </div>

            {/* Teacher Assignment */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="text-purple-600" size={18} />
                  <span className="text-sm font-medium text-gray-700">Teacher on Duty:</span>
                </div>
                {session.teacher_name ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-purple-700">{session.teacher_name}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedSession(session);
                        setShowAssignModal(true);
                      }}
                      className="p-1 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                    >
                      <Edit2 size={14} />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedSession(session);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Assign Teacher
                  </motion.button>
                )}
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="text-sm text-gray-600 mb-4 italic">
                "{session.notes}"
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-medium hover:bg-blue-200 transition-colors"
              >
                <Eye size={16} />
                <span>View Details</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDeleteSession(session.id)}
                className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                <Trash2 size={18} />
              </motion.button>
            </div>
          </motion.div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Clock className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No detention sessions found</p>
            <p className="text-gray-400 text-sm">Create a new session to get started</p>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSessionModal
            onSave={handleCreateSession}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Assign Teacher Modal */}
      <AnimatePresence>
        {showAssignModal && selectedSession && (
          <AssignTeacherModal
            session={selectedSession}
            teachers={teachers}
            onAssign={handleAssignTeacher}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedSession(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Create Session Modal
const CreateSessionModal: React.FC<{
  onSave: (data: Partial<DetentionSession>) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '15:00',
    end_time: '16:00',
    location: '',
    max_students: 20,
    notes: '',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Detention Session</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Room 101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
            <input
              type="number"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Add any notes about this session..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={!formData.date || !formData.location}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="inline mr-2" size={18} />
            Create Session
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Assign Teacher Modal
const AssignTeacherModal: React.FC<{
  session: DetentionSession;
  teachers: Teacher[];
  onAssign: (sessionId: number, teacherId: number) => void;
  onClose: () => void;
}> = ({ session, teachers, onAssign, onClose }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(session.teacher_id);
  const [sendNotification, setSendNotification] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Assign Teacher on Duty</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(session.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })} • {session.start_time} - {session.end_time}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Teacher</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {teachers.map((teacher) => (
                <motion.button
                  key={teacher.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTeacherId === teacher.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>
                    {selectedTeacherId === teacher.id && (
                      <CheckCircle className="text-purple-600" size={24} />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <Bell className="text-blue-600" size={18} />
                <span className="text-sm font-medium text-gray-700">
                  Send notification to teacher
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-600 mt-2 ml-8">
              Teacher will receive an in-app notification and email about this assignment
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectedTeacherId && onAssign(session.id, selectedTeacherId)}
            disabled={!selectedTeacherId}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg disabled:opacity-50 flex items-center space-x-2"
          >
            <UserCheck size={18} />
            <span>Assign Teacher</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DetentionSessions;
