import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Save,
  ArrowLeft,
  Users,
  Lock,
  UserX,
  UserCheck
} from 'lucide-react';
import Button from '../../components/Button';
import { useToast } from '../../hooks/useToast';

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
}

interface AttendanceRecord {
  id: number;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'dismissed' | 'late_arrival';
  notes: string;
  marked_at: string;
}

interface Dismissal {
  student_id: string;
  dismissed_at: string;
  dismissal_reason: string;
  returned_at: string | null;
}

interface LateArrival {
  student_id: string;
  arrived_at: string;
  reason: string;
}

interface Session {
  id: number;
  class_name: string;
  subject_name: string;
  period_name: string;
  start_time: string;
  end_time: string;
  classroom_name: string;
  status: string;
  session_date: string;
}

const PeriodRegister: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dismissals, setDismissals] = useState<Dismissal[]>([]);
  const [lateArrivals, setLateArrivals] = useState<LateArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await api.startPeriodSession({
        class_timetable_id: parseInt(sessionId!),
        session_date: new Date().toISOString().split('T')[0]
      });

      setSession(response.data.session);
      setStudents(response.data.students || []);
      setAttendanceRecords(response.data.attendanceRecords || []);
      setDismissals(response.data.dismissals || []);
      setLateArrivals(response.data.lateArrivals || []);
    } catch (err: any) {
      console.error('Error fetching session data:', err);
      error(err.response?.data?.error || 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentStatus = (studentId: string): string => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    if (record) return record.status;

    const dismissal = dismissals.find(d => d.student_id === studentId && !d.returned_at);
    if (dismissal) return 'dismissed';

    const lateArrival = lateArrivals.find(l => l.student_id === studentId);
    if (lateArrival) return 'late_arrival';

    return 'unmarked';
  };

  const getStudentNotes = (studentId: string): string => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.notes || '';
  };

  const isDismissed = (studentId: string): boolean => {
    return dismissals.some(d => d.student_id === studentId && !d.returned_at);
  };

  const handleMarkAttendance = async (studentId: string, status: string, notes: string = '') => {
    if (!session) return;

    try {
      await api.markAttendance({
        session_id: session.id,
        student_id: studentId,
        status,
        notes
      });

      // Update local state
      const existingIndex = attendanceRecords.findIndex(r => r.student_id === studentId);
      if (existingIndex >= 0) {
        const updated = [...attendanceRecords];
        updated[existingIndex] = { ...updated[existingIndex], status: status as any, notes };
        setAttendanceRecords(updated);
      } else {
        setAttendanceRecords([...attendanceRecords, {
          id: Date.now(),
          student_id: studentId,
          status: status as any,
          notes,
          marked_at: new Date().toISOString()
        }]);
      }
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      error(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleMarkAllPresent = async () => {
    if (!session || !window.confirm('Mark all students as present?')) return;

    try {
      setSaving(true);
      const unmarkedStudents = students
        .filter(s => !isDismissed(s.student_id))
        .map(s => s.student_id);

      await api.bulkMarkAttendance({
        session_id: session.id,
        student_ids: unmarkedStudents,
        status: 'present'
      });

      success('All students marked as present');
      fetchSessionData();
    } catch (err: any) {
      console.error('Error bulk marking:', err);
      error(err.response?.data?.error || 'Failed to mark all present');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteRegister = async () => {
    if (!session) return;

    const unmarkedCount = students.filter(s => {
      const status = getStudentStatus(s.student_id);
      return status === 'unmarked' && !isDismissed(s.student_id);
    }).length;

    if (unmarkedCount > 0) {
      if (!window.confirm(`${unmarkedCount} student(s) are not marked. Complete anyway?`)) {
        return;
      }
    }

    try {
      setSaving(true);
      await api.completePeriodSession(session.id);
      success('Register completed successfully');
      navigate('/teacher/period-attendance');
    } catch (err: any) {
      console.error('Error completing register:', err);
      error(err.response?.data?.error || 'Failed to complete register');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || student.student_id.includes(searchTerm);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'dismissed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'late_arrival': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle size={18} />;
      case 'absent': return <XCircle size={18} />;
      case 'late': return <Clock size={18} />;
      case 'excused': return <AlertCircle size={18} />;
      case 'dismissed': return <Lock size={18} />;
      case 'late_arrival': return <UserCheck size={18} />;
      default: return <UserX size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Session not found</p>
        <Button onClick={() => navigate('/teacher/period-attendance')} className="mt-4">
          Back to Timetable
        </Button>
      </div>
    );
  }

  const markedCount = students.filter(s => getStudentStatus(s.student_id) !== 'unmarked').length;
  const presentCount = students.filter(s => getStudentStatus(s.student_id) === 'present').length;

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => navigate('/teacher/period-attendance')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{session.period_name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <span className="flex items-center">
                  <Users size={16} className="mr-1" />
                  {session.class_name}
                </span>
                <span>•</span>
                <span>{session.subject_name}</span>
                <span>•</span>
                <span>{session.start_time} - {session.end_time}</span>
                {session.classroom_name && (
                  <>
                    <span>•</span>
                    <span>{session.classroom_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {session.status === 'locked' && (
            <div className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <Lock size={18} className="mr-2" />
              Register Locked
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {markedCount} / {students.length} marked</span>
            <span>{presentCount} present</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${students.length > 0 ? (markedCount / students.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleMarkAllPresent}
              variant="secondary"
              disabled={session.status === 'locked' || saving}
              className="rounded-lg"
            >
              <CheckCircle size={18} className="mr-2" />
              Mark All Present
            </Button>
            <Button
              onClick={handleCompleteRegister}
              disabled={session.status === 'locked' || saving}
              className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
            >
              <Save size={18} className="mr-2" />
              Complete Register
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Student List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Students ({filteredStudents.length})</h2>

        <div className="space-y-3">
          {filteredStudents.map((student, index) => {
            const status = getStudentStatus(student.student_id);
            const notes = getStudentNotes(student.student_id);
            const dismissed = isDismissed(student.student_id);
            const dismissal = dismissals.find(d => d.student_id === student.student_id);

            return (
              <motion.div
                key={student.student_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`p-4 border-2 rounded-xl ${
                  dismissed ? 'bg-gray-50 border-gray-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {student.student_id}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border-2 flex items-center space-x-2 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {dismissed && dismissal && (
                      <div className="mt-2 p-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                        <Lock size={14} className="inline mr-1" />
                        Dismissed at {new Date(dismissal.dismissed_at).toLocaleTimeString()} - {dismissal.dismissal_reason}
                      </div>
                    )}

                    {notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Note: {notes}
                      </div>
                    )}
                  </div>

                  {!dismissed && session.status !== 'locked' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleMarkAttendance(student.student_id, 'present')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(student.student_id, 'absent')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(student.student_id, 'late')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          status === 'late'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(student.student_id, 'excused')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          status === 'excused'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No students found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PeriodRegister;
