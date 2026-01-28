import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import ParentProfileModal from '../../components/ParentProfileModal';
import GoldieBadge from '../../components/GoldieBadge';
import GoldenDotIndicator from '../../components/GoldenDotIndicator';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Camera, Upload, User, Award, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl, handlePhotoError } from '../../utils/photoUrl';

const StudentProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [assigningClass, setAssigningClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [behaviorTrend, setBehaviorTrend] = useState<any[]>([]);
  const [parentData, setParentData] = useState<any>(null);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchClasses();
      fetchStats();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await api.getStudent(Number(id));
      setStudent(response.data);
      setSelectedClassId(response.data.class_id ? String(response.data.class_id) : '');
      
      // Use parent_details from student response if available
      if (response.data.parent_details) {
        setParentData(response.data.parent_details);
      } else if (response.data.parent_id) {
        // Fallback to separate API call if parent_details not available
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

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAssignClass = async () => {
    if (!id) return;
    setAssigningClass(true);
    try {
      const classId = selectedClassId === '' ? null : Number(selectedClassId);
      const selectedClass = classes.find(c => c.id === classId);
      await api.assignStudentToClass(Number(id), {
        class_id: classId,
        grade_level: selectedClass?.grade_level || null,
      });
      await fetchStudent();
      setIsClassModalOpen(false);
      success('Class assigned successfully!');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error assigning class');
    } finally {
      setAssigningClass(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await api.generateLinkCode(Number(id));
      setStudent({ ...student, parent_link_code: response.data.parent_link_code });
      success('New link code generated!');
    } catch (err) {
      console.error('Error generating link:', err);
      error('Error generating link code');
    }
  };

  const handleCopyLink = () => {
    if (student?.parent_link_code) {
      navigator.clipboard.writeText(student.parent_link_code);
      success('Link code copied to clipboard!');
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

  const fetchStats = async () => {
    if (!id) return;
    try {
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

      setStats({
        totalMerits,
        totalMeritPoints,
        totalIncidents,
        totalDemeritPoints,
        attendanceRate: parseFloat(attendanceRate),
      });

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
      setAttendanceTrend(attendanceTrendArray);

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
      setBehaviorTrend(behaviorTrendArray);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"
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
            onClick={() => navigate('/admin/students')}
            className="rounded-xl"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </motion.div>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {student.first_name} {student.last_name}
            </h1>
            {stats && stats.totalMerits >= 10 && (stats.totalMerits - stats.totalIncidents) >= 10 && (
              <GoldenDotIndicator size="lg" showTooltip={true} animated={true} />
            )}
          </div>
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
            <User className="text-amber-600" size={24} />
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
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Student ID</p>
                <p className="text-base sm:text-lg font-semibold text-amber-700">{student.student_id}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Full Name</p>
                <p className="text-base sm:text-lg font-semibold text-amber-700 break-words">
                  {student.first_name} {student.last_name}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Date of Birth</p>
                <p className="text-base sm:text-lg font-semibold text-amber-700">{student.date_of_birth || 'N/A'}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Grade Level</p>
                <p className="text-base sm:text-lg font-semibold text-amber-700">{student.grade_level || 'Not assigned'}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Class</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <p className="text-base sm:text-lg font-semibold text-amber-700">{student.class_name || 'Not assigned'}</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsClassModalOpen(true)}
                      className="rounded-lg sm:rounded-xl min-h-[44px] w-full sm:w-auto"
                    >
                      {student.class_id ? 'Change' : 'Assign'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Parent Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Parent Information</h2>
            <User className="text-amber-600" size={24} />
          </div>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <p className="text-sm text-gray-600 mb-1">Parent Name</p>
              <p className="text-lg font-semibold text-amber-700">{student.parent_name || 'Not linked'}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <p className="text-sm text-gray-600 mb-1">Parent Email</p>
              <p className="text-lg font-semibold text-amber-700">{student.parent_email || 'N/A'}</p>
            </div>
            {student.parent_id && parentData && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  onClick={() => setIsParentModalOpen(true)}
                  className="mt-2 rounded-xl w-full"
                >
                  <User size={16} className="mr-2" />
                  View Parent Profile
                </Button>
              </motion.div>
            )}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <p className="text-sm text-gray-600 mb-2">Parent Link Code</p>
              <div className="flex items-center space-x-2">
                <code className="px-3 py-2 bg-white rounded-xl font-mono text-sm border border-amber-200">
                  {student.parent_link_code}
                </code>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyLink}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                >
                  <Copy size={18} />
                </motion.button>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2">
                <Button
                  variant="secondary"
                  onClick={handleGenerateLink}
                  className="rounded-xl w-full"
                >
                  Generate New Link Code
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                  <Award className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Merits</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMerits}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalMeritPoints} points</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                  <AlertTriangle className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Incidents</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalDemeritPoints} points</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                  <Calendar className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Attendance Rate</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${(stats.totalMeritPoints - stats.totalDemeritPoints) >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'} shadow-lg`}>
                  <TrendingUp className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Net Points</h3>
              <p className={`text-3xl font-bold ${(stats.totalMeritPoints - stats.totalDemeritPoints) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalMeritPoints - stats.totalDemeritPoints}
              </p>
              <p className="text-xs text-gray-500 mt-1">Merits - Demerits</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Goldie Badge */}
      {stats && stats.totalMerits >= 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-6"
        >
          <GoldieBadge
            totalMerits={stats.totalMerits}
            totalDemerits={stats.totalIncidents}
            studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
            showDetails={true}
            size="lg"
          />
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {attendanceTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Attendance Trend (Last 14 Days)</h2>
              <Calendar className="text-amber-600" size={24} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
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
                <Legend />
                <Line type="monotone" dataKey="rate" stroke="url(#attendanceGradient)" name="Attendance %" strokeWidth={3} />
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {behaviorTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Behavior Trend (Last 6 Months)</h2>
              <TrendingUp className="text-amber-600" size={24} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={behaviorTrend}>
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
                <Legend />
                <Bar dataKey="merits" fill="#10B981" name="Merits" radius={[8, 8, 0, 0]} />
                <Bar dataKey="incidents" fill="#EF4444" name="Incidents" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Assign to Class"
      >
        <div className="space-y-4">
          <Select
            label="Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-xl"
          >
            <option value="">No class assigned</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name} {cls.teacher_name ? `(${cls.teacher_name})` : ''}
              </option>
            ))}
          </Select>
          <div className="flex justify-end space-x-3 pt-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="secondary"
                onClick={() => setIsClassModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleAssignClass}
                disabled={assigningClass}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                {assigningClass ? 'Assigning...' : 'Assign'}
              </Button>
            </motion.div>
          </div>
        </div>
      </Modal>

      <ParentProfileModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        parent={parentData}
      />
    </div>
  );
};

export default StudentProfile;

