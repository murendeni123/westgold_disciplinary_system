import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Users, Calendar, TrendingUp, Lock, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';

// DB attendance status → UI display value — defined outside the component
// so it is not recreated on every render or async callback.
const DB_TO_FRONTEND_STATUS: Record<string, string> = {
  attended: 'present',
  assigned: 'pending',
  absent:   'absent',
  late:     'late',
  excused:  'excused',
  rescheduled: 'pending',
};

const MyDetentions: React.FC = () => {
  const { user } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [selectedDetention, setSelectedDetention] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDetentions();
    }
  }, [user]);

  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const fetchDetentions = async () => {
    try {
      // Get detentions - backend already filters for teachers to show only their assigned sessions
      const response = await api.getDetentions({});
      const myDetentions = response.data;
      setDetentions(myDetentions);

      // Calculate summary
      const total = myDetentions.length;
      const completed = myDetentions.filter((d: any) => d.status === 'completed').length;
      const scheduled = myDetentions.filter((d: any) => d.status === 'scheduled').length;
      setSummary({ total, completed, scheduled });

      // Prepare trend data (by date)
      const dateCounts = myDetentions.reduce((acc: any, det: any) => {
        const date = new Date(det.detention_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      const trendArray = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);
      setChartData(trendArray);

      // Prepare attendance data
      let presentCount = 0;
      let absentCount = 0;
      let pendingCount = 0;

      for (const detention of myDetentions.slice(0, 20)) {
        try {
          const detResponse = await api.getDetention(detention.id);
          const assignments = detResponse.data.assignments || [];
          assignments.forEach((a: any) => {
            if (a.status === 'present' || a.status === 'attended') presentCount++;
            else if (a.status === 'absent') absentCount++;
            else pendingCount++;
          });
        } catch (error) {
          // Skip if error
        }
      }

      setAttendanceData([
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount },
        { name: 'Pending', value: pendingCount },
      ]);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetention = async (detention: any) => {
    // Always wipe stale state BEFORE opening so no old attendance flashes.
    // setIsModalOpen(false) in handleMarkAttendance does NOT call onClose, so
    // attendance + selectedDetention can linger — we reset them explicitly here.
    setAttendance({});
    setSelectedDetention(null);
    setLoadingModal(true);
    setIsModalOpen(true);

    try {
      const response = await api.getDetention(detention.id);
      const assignments = response.data.assignments || [];
      // Use String() on the key to avoid type-coercion issues: node-postgres may
      // return da.student_id (integer FK) or s.student_id (varchar student no.)
      // depending on column ordering in the SELECT *.
      const att: Record<string, string> = {};
      assignments.forEach((a: any) => {
        att[String(a.student_id)] = DB_TO_FRONTEND_STATUS[a.status as string] ?? 'pending';
      });
      setAttendance(att);
      setSelectedDetention({ ...detention, ...response.data, assignments });
    } catch (err) {
      console.error('Error fetching detention details:', err);
      setSelectedDetention(detention);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDownloadReport = async (sessionId: number) => {
    try {
      const response = await api.downloadDetentionReport(sessionId);
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `detention_register_${sessionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      error('Could not download report. Please try again.');
    }
  };

  // Re-fetches fresh attendance from the DB and updates the open modal.
  // Called after saving so the teacher sees confirmed DB statuses — not stale UI state.
  const refreshModalData = async (detentionId: number) => {
    setLoadingModal(true);
    try {
      const response = await api.getDetention(detentionId);
      const assignments = response.data.assignments || [];
      const att: Record<string, string> = {};
      assignments.forEach((a: any) => {
        att[String(a.student_id)] = DB_TO_FRONTEND_STATUS[a.status as string] ?? 'pending';
      });
      setAttendance(att);
      setSelectedDetention((prev: any) => ({ ...prev, ...response.data, assignments }));
    } catch (err) {
      console.error('Error refreshing modal data:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: number, newStatus: string) => {
    try {
      await api.updateDetentionSessionStatus(sessionId, newStatus);
      success(`Session status updated to ${newStatus}`);
      fetchDetentions();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating session status');
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedDetention) return;

    setSaving(true);

    // Track which students saved and which failed so we can give the
    // teacher accurate feedback instead of a generic "success" that may be wrong.
    let savedCount  = 0;
    const failedNames: string[] = [];

    try {
      for (const [studentId, status] of Object.entries(attendance)) {
        // String comparison handles the node-postgres column-name conflict:
        // da.student_id (integer FK) is overwritten by s.student_id (varchar)
        // in the SELECT *, making the key always a string in practice.
        const assignment = selectedDetention.assignments?.find(
          (a: any) => String(a.student_id) === String(studentId)
        );
        if (!assignment) continue;

        try {
          await api.markDetentionAttendance(assignment.id, status as string);
          savedCount++;
        } catch (err: any) {
          // Capture the actual backend error message so the teacher can see what
          // went wrong (e.g. "session is locked", "not authorised") instead of
          // seeing a silent reset back to Pending.
          const msg = err?.response?.data?.error || err?.message || 'unknown error';
          console.error(`Failed to save attendance for ${studentId}: ${msg}`);
          failedNames.push(assignment.student_name || String(studentId));
        }
      }

      // Always reload from the DB regardless of success/failure.
      // This ensures the teacher sees the ACTUAL persisted state — if a save
      // failed the DB value is still shown correctly (not the local selection).
      await refreshModalData(selectedDetention.id);

      // Update the session list in the background AFTER the modal is refreshed
      // to remove any race condition where setDetentions() could re-render the
      // component before setAttendance() has applied the fresh DB values.
      fetchDetentions();

      if (failedNames.length === 0) {
        success(`Attendance saved — ${savedCount} student${savedCount !== 1 ? 's' : ''} updated.`);
      } else if (savedCount > 0) {
        error(`Saved ${savedCount} students. Could not save: ${failedNames.join(', ')}. Please retry those.`);
      } else {
        error('Attendance could not be saved. The session may be locked or you may not have permission. Please refresh and try again.');
      }
    } catch (err: any) {
      console.error('Unexpected error saving attendance:', err);
      error('Unexpected error saving attendance. Please try again.');
      // Still reload so the modal shows the actual DB state.
      try { await refreshModalData(selectedDetention.id); } catch { /* ignore */ }
    } finally {
      setSaving(false);
    }
  };

  const filteredDetentions = activeFilter === 'all'
    ? detentions
    : detentions.filter((d: any) =>
        activeFilter === 'completed' ? d.status === 'completed' : d.status !== 'completed'
      );

  const columns = [
    {
      key: 'detention_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'detention_time',
      label: 'Time',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : value === 'in_progress'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value === 'completed' && <Lock size={10} />}
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'student_count',
      label: 'Students',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Users size={16} />
          <span>{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value: number) => `${value || 60} minutes`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          {row.status === 'scheduled' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateSessionStatus(row.id, 'in_progress')}
            >
              Start
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateSessionStatus(row.id, 'completed')}
            >
              Complete
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleViewDetention(row); }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

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

  const statCards = summary ? [
    { title: 'Total Detentions', value: summary.total, color: 'from-blue-500 to-cyan-500', icon: Calendar },
    { title: 'Completed', value: summary.completed, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
    { title: 'Scheduled', value: summary.scheduled, color: 'from-yellow-500 to-amber-500', icon: Calendar },
  ] : [];

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          My Detentions
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View and manage detention sessions you're assigned to</p>
      </motion.div>

      {/* Summary Stats */}
      {summary && detentions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {detentions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detention Frequency (Last 14 Days)</h2>
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ef4444" name="Detentions" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {attendanceData.length > 0 && attendanceData.some(d => d.value > 0) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Attendance at Detentions</h2>
                <Users className="text-emerald-600" size={24} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#9ca3af" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}

      {detentions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500 text-lg">You are not assigned to any detention sessions</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Detention Sessions ({filteredDetentions.length})</h2>
            <AlertTriangle className="text-emerald-600" size={24} />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === tab.key
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.key === 'completed' && <Lock size={12} />}
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeFilter === tab.key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.key === 'all' ? detentions.length
                    : tab.key === 'completed' ? detentions.filter((d: any) => d.status === 'completed').length
                    : detentions.filter((d: any) => d.status !== 'completed').length}
                </span>
              </button>
            ))}
          </div>

          <Table
            columns={columns}
            data={filteredDetentions}
            onRowClick={handleViewDetention}
          />
        </motion.div>
      )}

      {/* Detention Details Modal - Modernized */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDetention(null);
          setAttendance({});
          setLoadingModal(false);
        }}
        title="Detention Session Details"
      >
        {/* Loading spinner shown while fetching fresh session data */}
        {loadingModal && !selectedDetention && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm font-medium">Loading session details…</p>
          </div>
        )}
        {selectedDetention && (
          <div className="space-y-6">
            {/* Locked Banner — shown for completed sessions */}
            {selectedDetention.status === 'completed' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <Lock className="text-amber-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-amber-800">Session Completed &amp; Locked</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    This session is closed. All attendance records are permanently preserved and cannot be modified.
                  </p>
                </div>
              </div>
            )}

            {/* Header Card with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">
                  {new Date(selectedDetention.detention_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1 ${
                  selectedDetention.status === 'completed' 
                    ? 'bg-green-400 text-green-900' 
                    : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {selectedDetention.status === 'completed' && <Lock size={14} />}
                  {selectedDetention.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-emerald-100 text-xs mb-1">Time</p>
                  <p className="font-bold text-lg">{selectedDetention.detention_time || 'N/A'}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-emerald-100 text-xs mb-1">Duration</p>
                  <p className="font-bold text-lg">{selectedDetention.duration || 60} min</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-emerald-100 text-xs mb-1">Students</p>
                  <p className="font-bold text-lg">{selectedDetention.assignments?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Student Attendance Section */}
            {selectedDetention.assignments && selectedDetention.assignments.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Users size={20} className="mr-2 text-emerald-600" />
                    Student Attendance
                    {selectedDetention.status === 'completed' && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <Lock size={10} /> Read-only
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {Object.values(attendance).filter(s => s === 'present').length} / {selectedDetention.assignments.length} Present
                  </span>
                </div>

                {/* Attendance Summary — counts per status */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { label: 'Present', color: 'bg-green-100 text-green-700', key: 'present' },
                    { label: 'Absent',  color: 'bg-red-100 text-red-700',   key: 'absent'  },
                    { label: 'Late',    color: 'bg-yellow-100 text-yellow-700', key: 'late' },
                    { label: 'Excused', color: 'bg-blue-100 text-blue-700', key: 'excused' },
                    { label: 'Pending', color: 'bg-gray-100 text-gray-600', key: 'pending' },
                  ].map(({ label, color, key }) => (
                    <div key={key} className={`rounded-lg p-2 text-center ${color}`}>
                      <p className="text-lg font-bold">
                        {Object.values(attendance).filter(s => s === key).length}
                      </p>
                      <p className="text-xs font-medium">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedDetention.assignments.map((assignment: any, index: number) => (
                        <tr key={assignment.student_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{assignment.student_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600">{assignment.student_id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {[
                                { value: 'pending', label: 'Pending', active: 'bg-gray-500 text-white'   },
                                { value: 'present', label: 'Present', active: 'bg-green-500 text-white'  },
                                { value: 'absent',  label: 'Absent',  active: 'bg-red-500 text-white'    },
                                { value: 'late',    label: 'Late',    active: 'bg-amber-500 text-white'  },
                                { value: 'excused', label: 'Excused', active: 'bg-blue-500 text-white'   },
                              ].map(opt => {
                                const current = attendance[String(assignment.student_id)] || 'pending';
                                const isSelected = current === opt.value;
                                const isLocked  = selectedDetention.status === 'completed';
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => !isLocked && setAttendance({
                                      ...attendance,
                                      [String(assignment.student_id)]: opt.value,
                                    })}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                      isLocked
                                        ? isSelected
                                          ? `${opt.active} opacity-75 cursor-not-allowed`
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : isSelected
                                          ? `${opt.active} shadow-sm ring-2 ring-offset-1 ring-current`
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Users size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No students assigned to this detention</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => handleDownloadReport(selectedDetention.id)}
                className="px-4 border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <FileDown size={16} className="mr-1.5" />
                Export
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => { setIsModalOpen(false); setSelectedDetention(null); setAttendance({}); setLoadingModal(false); }}
                className="px-6"
              >
                Close
              </Button>
              {/* FIX: Show Save Attendance for both 'scheduled' and 'in_progress' sessions.
                 Previously hidden when status was 'in_progress', which meant a teacher
                 could start a session but had no way to save attendance from the modal. */}
              {(selectedDetention.status === 'scheduled' || selectedDetention.status === 'in_progress') && selectedDetention.assignments?.length > 0 && (
                <Button 
                  onClick={handleMarkAttendance} 
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6"
                >
                  <CheckCircle size={20} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyDetentions;

