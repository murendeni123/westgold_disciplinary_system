import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import SearchableSelect from '../../components/SearchableSelect';
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
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  Bell,
  Eye,
  Users,
  Zap,
  Loader2,
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<DetentionSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoAssignLoading, setAutoAssignLoading] = useState<number | null>(null);
  const [queuedStudents, setQueuedStudents] = useState<any[]>([]);
  const [qualifyingStudents, setQualifyingStudents] = useState<any[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);

  useEffect(() => {
    fetchData();
    fetchQueueAndQualifying();
  }, []);

  const fetchQueueAndQualifying = async () => {
    try {
      const [queueResponse, qualifyingResponse] = await Promise.all([
        api.getDetentionQueue(),
        api.getQualifyingStudents()
      ]);
      setQueuedStudents(queueResponse.data || []);
      setQualifyingStudents(qualifyingResponse.data || []);
    } catch (error) {
      console.error('Error fetching queue/qualifying students:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real teachers from API
      const teachersResponse = await api.getTeachers();
      const teachersData = teachersResponse.data.map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email
      }));
      setTeachers(teachersData);

      // Fetch real detention sessions from API
      const detentionsResponse = await api.getDetentions();
      const sessionsData = detentionsResponse.data.map((d: any) => ({
        id: d.id,
        date: d.detention_date,
        start_time: d.detention_time,
        end_time: d.end_time || calculateEndTime(d.detention_time, d.duration),
        location: d.location || 'TBD',
        max_students: d.max_capacity || 20,
        assigned_students: d.student_count || 0,
        teacher_id: d.teacher_on_duty_id,
        teacher_name: d.teacher_name,
        status: d.status || 'scheduled',
        notes: d.notes || '',
      }));
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load detention sessions' });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate end time from start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number = 60) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleCreateSession = async (sessionData: Partial<DetentionSession>) => {
    try {
      // Call API to create detention session
      const response = await api.createDetention({
        detention_date: sessionData.date || '',
        detention_time: sessionData.start_time || '',
        duration: sessionData.end_time ? calculateDuration(sessionData.start_time || '', sessionData.end_time) : 60,
        location: sessionData.location || '',
        teacher_on_duty_id: sessionData.teacher_id || null,
        max_capacity: sessionData.max_students || 20,
        notes: sessionData.notes || '',
      });

      // Refresh sessions from database
      await fetchData();
      
      setMessage({ type: 'success', text: 'Detention session created successfully' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating detention:', error);
      setMessage({ type: 'error', text: 'Failed to create detention session' });
    }
  };

  // Helper to calculate duration in minutes
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes - startTotalMinutes;
  };

  const handleAssignTeacher = async (sessionId: number, teacherId: number) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return;

      // Get the session to update
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      // Call API to update detention session with teacher
      await api.updateDetention(sessionId, {
        detention_date: session.date,
        detention_time: session.start_time,
        duration: calculateDuration(session.start_time, session.end_time),
        location: session.location,
        teacher_on_duty_id: teacherId,
        max_capacity: session.max_students,
        status: session.status,
        notes: session.notes,
      });

      // Refresh sessions from database
      await fetchData();

      setMessage({ 
        type: 'success', 
        text: `${teacher.name} has been assigned and will be notified` 
      });
      setShowAssignModal(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error assigning teacher:', error);
      setMessage({ type: 'error', text: 'Failed to assign teacher' });
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      // Call API to delete detention session
      await api.deleteDetention(id);
      
      // Refresh sessions from database
      await fetchData();
      
      setMessage({ type: 'success', text: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting detention:', error);
      setMessage({ type: 'error', text: 'Failed to delete session' });
    }
  };

  const handleAutoAssign = async (sessionId: number) => {
    try {
      setAutoAssignLoading(sessionId);
      
      // Call API to auto-assign students based on detention rules
      const response = await api.autoAssignDetention({ detention_id: sessionId });
      const result = response.data;
      
      // Refresh sessions and queue/qualifying data from database
      await Promise.all([fetchData(), fetchQueueAndQualifying()]);
      
      // Build detailed message
      let messageText = '';
      if (result.assigned_count > 0) {
        messageText = `✅ ${result.assigned_count} student(s) auto-assigned! `;
        messageText += `Total: ${result.total_count}/${result.capacity}`;
        
        if (result.queued_count > 0) {
          messageText += ` | ${result.queued_count} student(s) queued for next session`;
        }
        
        if (result.qualifying_students > result.assigned_count + result.queued_count) {
          const remaining = result.qualifying_students - result.assigned_count - result.queued_count;
          messageText += ` | ${remaining} already have upcoming detentions`;
        }
      } else if (result.total_count >= result.capacity) {
        messageText = '⚠️ Session at full capacity. ';
        if (result.queued_count > 0) {
          messageText += `${result.queued_count} student(s) added to queue for next session.`;
        }
      } else {
        messageText = 'No eligible students found. Students need 10+ demerit points since their last completed detention.';
      }
      
      setMessage({ 
        type: result.assigned_count > 0 || result.queued_count > 0 ? 'success' : 'success', 
        text: messageText
      });
    } catch (error: any) {
      console.error('Error auto-assigning students:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to auto-assign students' 
      });
    } finally {
      setAutoAssignLoading(null);
    }
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

      {/* Detention System Status Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Qualifying Students */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white cursor-pointer"
          onClick={() => {
            if (qualifyingStudents.length > 0) {
              setMessage({
                type: 'success',
                text: `${qualifyingStudents.length} students currently qualify for detention (10+ demerit points since last detention)`
              });
            }
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle size={24} />
            </div>
            <span className="text-3xl font-bold">{qualifyingStudents.length}</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Qualifying Students</h3>
          <p className="text-white/80 text-sm">Students eligible for detention assignment</p>
        </motion.div>

        {/* Queued Students */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white cursor-pointer"
          onClick={() => setShowQueueModal(true)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={24} />
            </div>
            <span className="text-3xl font-bold">{queuedStudents.length}</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Queued Students</h3>
          <p className="text-white/80 text-sm">Waiting for next available session</p>
        </motion.div>

        {/* Total Sessions */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calendar size={24} />
            </div>
            <span className="text-3xl font-bold">{sessions.length}</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Total Sessions</h3>
          <p className="text-white/80 text-sm">
            {sessions.filter(s => s.status === 'scheduled').length} scheduled
          </p>
        </motion.div>
      </motion.div>

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
                onClick={() => handleAutoAssign(session.id)}
                disabled={autoAssignLoading === session.id || session.status !== 'scheduled'}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoAssignLoading === session.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Auto-Assign</span>
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedSession(session);
                  setShowDetailsModal(true);
                }}
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

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedSession && (
          <SessionDetailsModal
            session={selectedSession}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedSession(null);
            }}
            onAutoAssign={async (sessionId) => {
              await handleAutoAssign(sessionId);
              // Refresh the modal by closing and reopening
              setShowDetailsModal(false);
              setTimeout(() => {
                setShowDetailsModal(true);
              }, 100);
            }}
            autoAssignLoading={autoAssignLoading === selectedSession.id}
          />
        )}
      </AnimatePresence>

      {/* Queue Modal */}
      <AnimatePresence>
        {showQueueModal && (
          <QueueModal
            isOpen={showQueueModal}
            onClose={() => setShowQueueModal(false)}
            queuedStudents={queuedStudents}
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
            <SearchableSelect
              label="Select Teacher"
              value={selectedTeacherId?.toString() || ''}
              onChange={(value) => setSelectedTeacherId(Number(value))}
              options={teachers.map(t => ({
                value: t.id.toString(),
                label: `${t.name} (${t.email})`
              }))}
              placeholder="Search and select a teacher..."
              showClear={!!selectedTeacherId}
              onClear={() => setSelectedTeacherId(null)}
            />
            {selectedTeacherId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-purple-600" size={20} />
                  <div>
                    <p className="font-medium text-purple-900">
                      {teachers.find(t => t.id === selectedTeacherId)?.name}
                    </p>
                    <p className="text-sm text-purple-600">
                      {teachers.find(t => t.id === selectedTeacherId)?.email}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
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

// Session Details Modal
const SessionDetailsModal: React.FC<{
  session: DetentionSession;
  onClose: () => void;
  onAutoAssign?: (sessionId: number) => Promise<void>;
  autoAssignLoading?: boolean;
}> = ({ session, onClose, onAutoAssign, autoAssignLoading }) => {
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      setLoading(true);
      // Fetch real detention data with assignments from API
      const response = await api.getDetention(session.id);
      const detention = response.data;
      
      // Map assignments to student list format
      const students = (detention.assignments || []).map((assignment: any) => ({
        id: assignment.student_id,
        name: assignment.student_name,
        grade: `Grade ${assignment.grade_level || 'N/A'}`,
        reason: assignment.reason || 'Not specified',
        points: assignment.demerit_points || 0,
        status: assignment.status || 'assigned',
        attendance_time: assignment.attendance_time
      }));
      
      setAssignedStudents(students);
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      setAssignedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

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
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detention Session Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(session.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="text-blue-600" size={20} />
                <span className="text-sm font-medium text-blue-900">Time</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {session.start_time || 'N/A'} - {session.end_time || 'N/A'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-purple-600" size={20} />
                <span className="text-sm font-medium text-purple-900">Location</span>
              </div>
              <p className="text-lg font-bold text-purple-900">{session.location || 'Not specified'}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <UserCheck className="text-green-600" size={20} />
                <span className="text-sm font-medium text-green-900">Teacher on Duty</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {session.teacher_name || 'Not assigned'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="text-amber-600" size={20} />
                <span className="text-sm font-medium text-amber-900">Status</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${statusColors[session.status]}`}>
                {session.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Capacity</span>
              <span className="text-sm font-bold text-gray-900">
                {assignedStudents.length} / {session.max_students} students
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all"
                style={{ width: `${(assignedStudents.length / session.max_students) * 100}%` }}
              />
            </div>
          </div>

          {session.notes && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Notes</p>
              <p className="text-sm text-blue-800">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Assigned Students */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Assigned Students</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
              {assignedStudents.length} Students
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
              />
            </div>
          ) : assignedStudents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 mb-2">No students assigned yet</p>
              <p className="text-gray-400 text-sm mb-4">Click below to auto-assign students based on detention rules</p>
              {onAutoAssign && session.status === 'scheduled' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAutoAssign(session.id)}
                  disabled={autoAssignLoading}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {autoAssignLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Assigning Students...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>Auto-Assign Students</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignedStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">{student.reason}</p>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                      {student.points} points
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            {onAutoAssign && session.status === 'scheduled' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAutoAssign(session.id)}
                disabled={autoAssignLoading}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {autoAssignLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Auto-Assign More Students</span>
                  </>
                )}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg"
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Queue Modal Component
const QueueModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  queuedStudents: any[];
}> = ({ isOpen, onClose, queuedStudents }) => {
  if (!isOpen) return null;

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
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Detention Queue</h2>
              <p className="text-white/80 text-sm mt-1">
                Students waiting for next available detention session
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

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {queuedStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg font-medium">No students in queue</p>
              <p className="text-gray-400 text-sm mt-2">
                Students will be queued when detention sessions reach capacity
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queuedStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.student_name}</h3>
                          <p className="text-sm text-gray-600">
                            {student.student_number} • {student.class_name || 'No class'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                          {student.points_at_queue} points
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Queued: {new Date(student.queued_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong>{queuedStudents.length}</strong> student{queuedStudents.length !== 1 ? 's' : ''} in queue
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DetentionSessions;
