import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import ModernFilter from '../../components/ModernFilter';
import { motion } from 'framer-motion';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Sparkles,
  UserX,
  UserCheck,
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';

const AttendanceOverviewEnhanced: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'dismissals' | 'reports' | 'flags'>('overview');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: '',
  });

  // Dismissals state
  const [dismissals, setDismissals] = useState<any[]>([]);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [dismissForm, setDismissForm] = useState({
    student_id: '',
    dismissal_reason: ''
  });

  // Reports state
  const [reportFilters, setReportFilters] = useState({
    grade_level: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    report_type: 'daily'
  });
  const [reportData, setReportData] = useState<any>(null);

  // Flags state
  const [flags, setFlags] = useState<any[]>([]);

  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAttendance();
    } else if (activeTab === 'dismissals') {
      fetchDismissals();
      fetchStudents();
    } else if (activeTab === 'flags') {
      fetchFlags();
    }
  }, [filters, activeTab]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params: any = { date: filters.date };
      if (filters.status) params.status = filters.status;

      const response = await api.getAttendance(params);
      setAttendance(response.data);

      const total = response.data.length;
      const present = response.data.filter((a: any) => a.status === 'present').length;
      const absent = response.data.filter((a: any) => a.status === 'absent').length;
      const late = response.data.filter((a: any) => a.status === 'late').length;
      const excused = response.data.filter((a: any) => a.status === 'excused').length;

      setSummary({ total, present, absent, late, excused });
      setChartData([
        { name: 'Present', value: present },
        { name: 'Absent', value: absent },
        { name: 'Late', value: late },
        { name: 'Excused', value: excused },
      ]);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDismissals = async () => {
    try {
      setLoading(true);
      const response = await api.getTodayDismissals();
      setDismissals(response.data || []);
    } catch (err) {
      console.error('Error fetching dismissals:', err);
      setDismissals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await api.getAttendanceFlags({ 
        resolved: false,
        date: filters.date 
      });
      setFlags(response.data || []);
    } catch (err) {
      console.error('Error fetching flags:', err);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.dismissStudent({
        student_id: dismissForm.student_id,
        dismissal_date: filters.date,
        dismissal_reason: dismissForm.dismissal_reason
      });
      success('Student dismissed successfully');
      setIsDismissModalOpen(false);
      setDismissForm({ student_id: '', dismissal_reason: '' });
      fetchDismissals();
    } catch (err: any) {
      console.error('Error dismissing student:', err);
      error(err.response?.data?.error || 'Failed to dismiss student');
    }
  };

  const handleReturnStudent = async (dismissalId: number) => {
    try {
      await api.returnStudent({
        dismissal_id: dismissalId,
        return_notes: 'Returned to school'
      });
      success('Student marked as returned');
      fetchDismissals();
    } catch (err: any) {
      console.error('Error marking return:', err);
      error(err.response?.data?.error || 'Failed to mark student as returned');
    }
  };

  const handleResolveFlag = async (flagId: number) => {
    try {
      await api.resolveAttendanceFlag(flagId, {
        resolution_notes: 'Reviewed and resolved'
      });
      success('Flag resolved');
      fetchFlags();
    } catch (err: any) {
      console.error('Error resolving flag:', err);
      error(err.response?.data?.error || 'Failed to resolve flag');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await api.getAttendanceReport(reportFilters);
      setReportData(response.data);
    } catch (err: any) {
      console.error('Error generating report:', err);
      error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Student', 'Class', 'Status', 'Period', 'Notes'];
    const rows = attendance.map((att) => [
      att.attendance_date,
      att.student_name,
      att.class_name,
      att.status,
      att.period || '',
      att.notes || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${filters.date}.csv`;
    a.click();
  };

  const columns = [
    { key: 'attendance_date', label: 'Date' },
    { key: 'student_name', label: 'Student' },
    { key: 'class_name', label: 'Class' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'present'
              ? 'bg-green-100 text-green-800'
              : value === 'absent'
              ? 'bg-red-100 text-red-800'
              : value === 'late'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value?.toUpperCase() || 'N/A'}
        </span>
      ),
    },
    { key: 'period', label: 'Period' },
    { key: 'notes', label: 'Notes' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'dismissals', label: 'Dismissals', icon: UserX },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'flags', label: 'Alerts', icon: AlertTriangle },
  ];

  const statCards = summary ? [
    { title: 'Total', value: summary.total, color: 'from-blue-500 to-cyan-500', icon: Calendar },
    { title: 'Present', value: summary.present, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
    { title: 'Absent', value: summary.absent, color: 'from-red-500 to-pink-500', icon: XCircle },
    { title: 'Late', value: summary.late, color: 'from-yellow-500 to-amber-500', icon: Calendar },
  ] : [];

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive attendance tracking and management</p>
        </div>
        {activeTab === 'overview' && (
          <Button
            onClick={handleExportCSV}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </Button>
        )}
        {activeTab === 'dismissals' && (
          <Button
            onClick={() => setIsDismissModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
          >
            <UserX size={20} className="mr-2" />
            Dismiss Student
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-2"
      >
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Modern Filters */}
          <ModernFilter
            fields={[
              {
                type: 'date',
                name: 'date',
                label: 'Date',
                placeholder: 'Select date'
              },
              {
                type: 'select',
                name: 'status',
                label: 'Status',
                placeholder: 'All Status',
                options: [
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'excused', label: 'Excused' }
                ]
              }
            ]}
            values={filters}
            onChange={(name, value) => setFilters({ ...filters, [name]: value })}
            onClear={() => setFilters({ date: new Date().toISOString().split('T')[0], status: '' })}
          />

          {/* Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                        <Icon className="text-white" size={24} />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Breakdown</h2>
              {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10B981', '#EF4444', '#F59E0B', '#3B82F6'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>No data available</p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Status Distribution</h2>
              {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.filter(d => d.value > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>No data available</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Records Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Records ({attendance.length})</h2>
            <Table columns={columns} data={attendance} />
          </motion.div>
        </>
      )}

      {/* Dismissals Tab */}
      {activeTab === 'dismissals' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Dismissals - {filters.date}</h2>
          
          {dismissals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserX size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No dismissals for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dismissals.map((dismissal: any) => (
                <div key={dismissal.id} className="p-4 border-2 border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{dismissal.student_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Dismissed at {new Date(dismissal.dismissed_at).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-600">Reason: {dismissal.dismissal_reason}</p>
                      <p className="text-xs text-gray-500 mt-1">By: {dismissal.dismissed_by_name}</p>
                      {dismissal.returned_at && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ Returned at {new Date(dismissal.returned_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    {!dismissal.returned_at && (
                      <Button
                        onClick={() => handleReturnStudent(dismissal.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        <Unlock size={16} className="mr-1" />
                        Mark Returned
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Attendance Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                <select
                  value={reportFilters.grade_level}
                  onChange={(e) => setReportFilters({ ...reportFilters, grade_level: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Grades</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                </select>
              </div>
              <Input
                label="Start Date"
                type="date"
                value={reportFilters.start_date}
                onChange={(e) => setReportFilters({ ...reportFilters, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={reportFilters.end_date}
                onChange={(e) => setReportFilters({ ...reportFilters, end_date: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={reportFilters.report_type}
                  onChange={(e) => setReportFilters({ ...reportFilters, report_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <Button onClick={handleGenerateReport} className="rounded-xl">
              <FileText size={18} className="mr-2" />
              Generate Report
            </Button>
          </motion.div>

          {reportData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Grade {reportFilters.grade_level || 'All'} Attendance Report
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Report data would be rendered here */}
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Report data will be displayed here
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Flags Tab */}
      {activeTab === 'flags' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Alerts & Flags</h2>
          
          {flags.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-300" />
              <p>No attendance alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map((flag: any) => (
                <div key={flag.id} className={`p-4 border-2 rounded-xl ${
                  flag.severity === 'high' ? 'border-red-300 bg-red-50' :
                  flag.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                  'border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle size={20} className={
                          flag.severity === 'high' ? 'text-red-600' :
                          flag.severity === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        } />
                        <h3 className="font-bold text-gray-900">{flag.student_name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          flag.severity === 'high' ? 'bg-red-200 text-red-800' :
                          flag.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {flag.severity?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>{flag.flag_type?.replace('_', ' ').toUpperCase()}:</strong> {flag.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(flag.flag_date).toLocaleDateString()} - {flag.class_name}
                      </p>
                    </div>
                    {!flag.is_resolved && (
                      <Button
                        onClick={() => handleResolveFlag(flag.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Dismiss Student Modal */}
      <Modal
        isOpen={isDismissModalOpen}
        onClose={() => setIsDismissModalOpen(false)}
        title="Dismiss Student"
      >
        <form onSubmit={handleDismissStudent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={dismissForm.student_id}
              onChange={(e) => setDismissForm({ ...dismissForm, student_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a student...</option>
              {students.map((student: any) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.first_name} {student.last_name} - {student.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Dismissal
            </label>
            <textarea
              value={dismissForm.dismissal_reason}
              onChange={(e) => setDismissForm({ ...dismissForm, dismissal_reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Medical appointment, Early pickup, etc."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDismissModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
              Dismiss Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceOverviewEnhanced;
