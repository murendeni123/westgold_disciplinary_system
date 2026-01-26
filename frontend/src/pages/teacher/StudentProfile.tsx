import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ParentProfileModal from '../../components/ParentProfileModal';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Upload, User, TrendingUp, Copy, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl, handlePhotoError } from '../../utils/photoUrl';

const StudentProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [parentData, setParentData] = useState<any>(null);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchStats();
      fetchTimeline();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await api.getStudent(Number(id));
      setStudent(response.data);
      
      // Fetch parent data if parent_id exists
      if (response.data.parent_id) {
        try {
          const parentResponse = await api.getParent(response.data.parent_id);
          setParentData(parentResponse.data);
        } catch (error) {
          console.error('Error fetching parent:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch recent stats
      const [meritsRes, incidentsRes, attendanceRes] = await Promise.all([
        api.getMerits({ student_id: id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
        api.getIncidents({ student_id: id }),
        api.getAttendance({ student_id: id, start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
      ]);

      const totalMerits = meritsRes.data.length;
      const totalMeritPoints = meritsRes.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
      const totalIncidents = incidentsRes.data.length;
      const totalDemeritPoints = incidentsRes.data.reduce((sum: number, i: any) => sum + (i.points || 0), 0);
      const totalAttendance = attendanceRes.data.length;
      const presentCount = attendanceRes.data.filter((a: any) => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';

      // Prepare attendance trend (last 14 days)
      const dailyAttendance: Record<string, { present: number; total: number }> = {};
      attendanceRes.data.slice(-14).forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyAttendance[date]) {
          dailyAttendance[date] = { present: 0, total: 0 };
        }
        dailyAttendance[date].total++;
        if (record.status === 'present') dailyAttendance[date].present++;
      });

      const attendanceTrendArray = Object.entries(dailyAttendance)
        .map(([date, data]) => ({
          date,
          rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(0) : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Prepare behavior trend (last 6 months)
      const monthlyBehavior: Record<string, { merits: number; incidents: number }> = {};
      [...meritsRes.data, ...incidentsRes.data].forEach((item: any) => {
        const month = new Date(item.merit_date || item.incident_date).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyBehavior[month]) {
          monthlyBehavior[month] = { merits: 0, incidents: 0 };
        }
        if (item.merit_date) monthlyBehavior[month].merits++;
        else monthlyBehavior[month].incidents++;
      });

      const behaviorTrendArray = Object.entries(monthlyBehavior)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6);

      setStats({
        totalMerits,
        totalMeritPoints,
        totalIncidents,
        totalDemeritPoints,
        attendanceRate: parseFloat(attendanceRate),
        attendanceTrend: attendanceTrendArray,
        behaviorTrend: behaviorTrendArray,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTimeline = async () => {
    if (!id) return;
    setTimelineLoading(true);
    try {
      const res = await api.getBehaviourTimeline(Number(id));
      setTimeline(res.data || []);
    } catch (err) {
      console.error('Error fetching behaviour timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      await api.uploadStudentPhoto(Number(id), file);
      fetchStudent();
      success('Photo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading photo:', err);
      error('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleCopyLinkCode = () => {
    if (student.parent_link_code) {
      navigator.clipboard.writeText(student.parent_link_code);
      success('Link code copied to clipboard!');
    }
  };

  const handleRegenerateLinkCode = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to regenerate the parent link code? The old code will no longer work.')) {
      return;
    }
    
    try {
      const response = await api.generateLinkCode(Number(id));
      setStudent({ ...student, parent_link_code: response.data.parent_link_code });
      success('New link code generated successfully!');
    } catch (err) {
      console.error('Error regenerating link code:', err);
      error('Error regenerating link code');
    }
  };

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

  if (!student) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <p className="text-xl text-gray-500">Student not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-0">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="rounded-xl min-h-[44px]"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </motion.div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">Student Profile</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Basic Information</h2>
            <User className="text-emerald-600" size={24} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Photo in top left corner */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mx-auto sm:mx-0">
                {student.photo_path ? (
                  <img
                    src={getPhotoUrl(student.photo_path) || ''}
                    alt="Student"
                    className="w-full h-full object-cover"
                    onError={handlePhotoError}
                  />
                ) : null}
                {!student.photo_path && (
                  <span className="text-gray-400 text-sm photo-placeholder">No Photo</span>
                )}
                <span className="text-gray-400 text-sm photo-placeholder hidden">Photo not found</span>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 mt-3 justify-center sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs py-2.5 px-3 rounded-lg sm:rounded-xl w-full min-h-[44px]"
                  >
                    <Upload size={14} className="mr-1" />
                    Upload
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                  <Button
                    variant="secondary"
                    onClick={handleCameraCapture}
                    disabled={uploading}
                    className="text-xs py-2.5 px-3 rounded-lg sm:rounded-xl w-full min-h-[44px]"
                  >
                    <Camera size={14} className="mr-1" />
                    Camera
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Information on the right */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Student ID</p>
                <p className="text-base sm:text-lg font-semibold text-emerald-700">{student.student_id}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Full Name</p>
                <p className="text-base sm:text-lg font-semibold text-emerald-700 break-words">
                  {student.first_name} {student.last_name}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Date of Birth</p>
                <p className="text-base sm:text-lg font-semibold text-emerald-700">{student.date_of_birth || 'N/A'}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Grade Level</p>
                <p className="text-base sm:text-lg font-semibold text-emerald-700">{student.grade_level || 'Not assigned'}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Class</p>
                <p className="text-base sm:text-lg font-semibold text-emerald-700">{student.class_name || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Parent Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Parent Information</h2>
            <User className="text-emerald-600" size={24} />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Parent Name</p>
              <p className="text-base sm:text-lg font-semibold text-emerald-700 break-words">{student.parent_name || 'Not linked'}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Parent Email</p>
              <p className="text-base sm:text-lg font-semibold text-emerald-700 break-words">{student.parent_email || 'N/A'}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Parent Link Code</p>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-base sm:text-lg font-mono font-bold text-blue-700 break-all flex-1">
                  {student.parent_link_code || 'Not generated'}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button
                    variant="secondary"
                    onClick={handleCopyLinkCode}
                    disabled={!student.parent_link_code}
                    className="text-xs py-2 px-3 rounded-lg sm:rounded-xl w-full min-h-[44px]"
                  >
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button
                    variant="secondary"
                    onClick={handleRegenerateLinkCode}
                    className="text-xs py-2 px-3 rounded-lg sm:rounded-xl w-full min-h-[44px]"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Regenerate
                  </Button>
                </motion.div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this code with parents to link their account. Each code can only be used once.
              </p>
            </div>
            {student.parent_id && parentData && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  onClick={() => setIsParentModalOpen(true)}
                  className="mt-2 rounded-lg sm:rounded-xl w-full min-h-[44px]"
                >
                  <User size={16} className="mr-2" />
                  View Parent Profile
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Stats</h2>
            <TrendingUp className="text-emerald-600" size={24} />
          </div>
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
              >
                <p className="text-xs opacity-90 mb-1">Total Merits</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalMerits}</p>
                <p className="text-xs opacity-80">{stats.totalMeritPoints} points</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
              >
                <p className="text-xs opacity-90 mb-1">Total Incidents</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalIncidents}</p>
                <p className="text-xs opacity-80">{stats.totalDemeritPoints} points</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg sm:col-span-2"
              >
                <p className="text-xs opacity-90 mb-1">Attendance Rate (Last 30 days)</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.attendanceRate}%</p>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">Loading stats...</div>
          )}
        </motion.div>

        {/* Analytics Charts */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-4 sm:p-6 col-span-1 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Student Analytics</h2>
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats.attendanceTrend && stats.attendanceTrend.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Attendance Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis domain={[0, 100]} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Line type="monotone" dataKey="rate" stroke="url(#attendanceLineGradient)" strokeWidth={3} />
                      <defs>
                        <linearGradient id="attendanceLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {stats.behaviorTrend && stats.behaviorTrend.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Behavior Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.behaviorTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Bar dataKey="merits" fill="#10B981" name="Merits" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="incidents" fill="#EF4444" name="Incidents" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <Card title="Quick Actions">
          <div className="space-y-2 sm:space-y-3">
            <Button
              className="w-full min-h-[44px]"
              onClick={() => navigate(`/teacher/attendance/daily?student=${id}`)}
            >
              Take Attendance
            </Button>
            <Button
              className="w-full min-h-[44px]"
              variant="secondary"
              onClick={() => navigate(`/teacher/behaviour/log?student=${id}`)}
            >
              Log Incident
            </Button>
            <Button
              className="w-full min-h-[44px]"
              variant="secondary"
              onClick={() => navigate(`/teacher/merits/award?student=${id}`)}
            >
              Award Merit
            </Button>
            <Button
              className="w-full min-h-[44px]"
              variant="secondary"
              onClick={() => navigate(`/teacher/merits/view?student=${id}`)}
            >
              View Merits
            </Button>
            <Button
              className="w-full min-h-[44px]"
              variant="secondary"
              onClick={() => navigate(`/teacher/detentions/view?student=${id}`)}
            >
              View Detentions
            </Button>
          </div>
        </Card>
      </div>

      <ParentProfileModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        parent={parentData}
      />
    </div>
  );
};

export default StudentProfile;

