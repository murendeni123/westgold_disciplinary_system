import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  Lock,
  AlertCircle,
  Users,
  BookOpen,
  Home
} from 'lucide-react';
import Button from '../../components/Button';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';

interface Period {
  id: number;
  class_timetable_id: number;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  classroom_name: string;
  session_id: number | null;
  session_status: string | null;
  completed_at: string | null;
  present_count: number;
  total_marked: number;
}

const TeacherPeriodTimetable: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error, ToastContainer } = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'today' | 'week'>('today');

  useEffect(() => {
    fetchPeriods();
  }, [view]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = view === 'today' 
        ? await api.getTeacherPeriodsToday()
        : await api.getTeacherPeriodsWeek();
      
      setPeriods(response.data || []);
    } catch (err: any) {
      console.error('Error fetching periods:', err);
      error(err.response?.data?.error || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = (period: Period) => {
    navigate(`/teacher/period-register/${period.class_timetable_id}`);
  };

  const getStatusBadge = (period: Period) => {
    if (!period.session_status || period.session_status === 'not_marked') {
      return {
        icon: <XCircle size={18} />,
        text: 'Not Marked',
        color: 'bg-red-100 text-red-800 border-red-300'
      };
    }

    if (period.session_status === 'in_progress') {
      return {
        icon: <Clock size={18} />,
        text: 'In Progress',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    }

    if (period.session_status === 'completed') {
      return {
        icon: <CheckCircle size={18} />,
        text: `Marked (${period.present_count}/${period.total_marked})`,
        color: 'bg-green-100 text-green-800 border-green-300'
      };
    }

    if (period.session_status === 'locked') {
      return {
        icon: <Lock size={18} />,
        text: 'Locked',
        color: 'bg-gray-100 text-gray-800 border-gray-300'
      };
    }

    return {
      icon: <AlertCircle size={18} />,
      text: 'Unknown',
      color: 'bg-gray-100 text-gray-500 border-gray-300'
    };
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    return periods.find(period => {
      return currentTime >= period.start_time && currentTime <= period.end_time;
    });
  };

  const getUpcomingPeriods = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    return periods.filter(period => period.start_time > currentTime);
  };

  const getPastPeriods = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    return periods.filter(period => period.end_time < currentTime);
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

  const currentPeriod = getCurrentPeriod();
  const upcomingPeriods = getUpcomingPeriods();
  const pastPeriods = getPastPeriods();

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-500 mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
        </div>
      </motion.div>

      {/* Current Period */}
      {view === 'today' && currentPeriod && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={20} />
                <span className="text-sm font-medium opacity-90">Current Period</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">{currentPeriod.period_name}</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                <span className="flex items-center">
                  <Users size={16} className="mr-1" />
                  {currentPeriod.class_name}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <BookOpen size={16} className="mr-1" />
                  {currentPeriod.subject_name}
                </span>
                {currentPeriod.classroom_name && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <Home size={16} className="mr-1" />
                      {currentPeriod.classroom_name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold mb-2">
                {currentPeriod.start_time} - {currentPeriod.end_time}
              </div>
              <Button
                onClick={() => handleOpenRegister(currentPeriod)}
                className="bg-white text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {currentPeriod.session_status === 'completed' ? 'View Register' : 'Mark Register'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upcoming Periods */}
      {view === 'today' && upcomingPeriods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Periods</h2>
          <div className="space-y-3">
            {upcomingPeriods.map((period, index) => (
              <PeriodCard
                key={period.id}
                period={period}
                onOpen={handleOpenRegister}
                delay={0.3 + index * 0.05}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Past Periods */}
      {view === 'today' && pastPeriods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Periods</h2>
          <div className="space-y-3">
            {pastPeriods.map((period, index) => (
              <PeriodCard
                key={period.id}
                period={period}
                onOpen={handleOpenRegister}
                delay={0.5 + index * 0.05}
                isPast
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Timetable</h2>
          <div className="space-y-3">
            {periods.map((period, index) => (
              <PeriodCard
                key={period.id}
                period={period}
                onOpen={handleOpenRegister}
                delay={0.3 + index * 0.02}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {periods.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Periods Scheduled</h3>
          <p className="text-gray-500">
            {view === 'today' 
              ? "You don't have any periods scheduled for today"
              : "You don't have any periods scheduled this week"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Period Card Component
interface PeriodCardProps {
  period: Period;
  onOpen: (period: Period) => void;
  delay?: number;
  isPast?: boolean;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ period, onOpen, delay = 0, isPast = false }) => {
  const status = {
    icon: <XCircle size={18} />,
    text: 'Not Marked',
    color: 'bg-red-100 text-red-800 border-red-300'
  };

  if (period.session_status === 'in_progress') {
    status.icon = <Clock size={18} />;
    status.text = 'In Progress';
    status.color = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else if (period.session_status === 'completed') {
    status.icon = <CheckCircle size={18} />;
    status.text = `Marked (${period.present_count || 0}/${period.total_marked || 0})`;
    status.color = 'bg-green-100 text-green-800 border-green-300';
  } else if (period.session_status === 'locked') {
    status.icon = <Lock size={18} />;
    status.text = 'Locked';
    status.color = 'bg-gray-100 text-gray-800 border-gray-300';
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
        isPast ? 'bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={() => onOpen(period)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-center min-w-[60px]">
              <div className="text-xs text-gray-500 font-medium">Period {period.period_number}</div>
              <div className="text-sm font-semibold text-gray-900">
                {period.start_time}
              </div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{period.period_name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <Users size={14} className="mr-1" />
                  {period.class_name}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <BookOpen size={14} className="mr-1" />
                  {period.subject_name}
                </span>
                {period.classroom_name && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <Home size={14} className="mr-1" />
                      {period.classroom_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border-2 flex items-center space-x-2 ${status.color}`}>
          {status.icon}
          <span className="text-sm font-medium">{status.text}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TeacherPeriodTimetable;
