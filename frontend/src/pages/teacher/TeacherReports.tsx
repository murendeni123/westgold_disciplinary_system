import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { exportComprehensiveReport } from '../../utils/excelExport';
import { useToast } from '../../contexts/ToastContext';
import {
  Download,
  Users,
  AlertTriangle,
  Award,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface ClassData {
  id: number;
  class_name: string;
  grade_level: string;
  student_count: number;
}

const TeacherReports: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [merits, setMerits] = useState<any[]>([]);
  const [detentions, setDetentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Filter / export state ──────────────────────────────────────────────────
  const [studentFilter, setStudentFilter] = useState('');
  const [quickStudentSearch, setQuickStudentSearch] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<any | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Fetch with retry helper ────────────────────────────────────────────────
  const fetchWithRetry = useCallback(async (fn: () => Promise<any>, retries = 2, delay = 800) => {
    for (let i = 0; i <= retries; i++) {
      try { return await fn(); } catch (err) {
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchTeacherData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // 1. Fetch teacher's assigned classes
      const classesRes = await fetchWithRetry(() => api.getClasses());
      const teacherClasses: ClassData[] = classesRes.data || [];
      setMyClasses(teacherClasses);

      if (teacherClasses.length === 0) {
        setLoading(false);
        return;
      }

      // Auto-select first class if none selected
      const activeClassId = selectedClassId || String(teacherClasses[0].id);
      if (!selectedClassId) setSelectedClassId(activeClassId);

      // 2. Fetch students for the selected class
      const studentsRes = await fetchWithRetry(() => api.getStudents({ class_id: Number(activeClassId) }));
      const studentsList = studentsRes.data || [];
      setStudents(studentsList);
      const studentIds = new Set(studentsList.map((s: any) => s.id));

      // 3. Fetch incidents, merits, detentions in parallel
      const dateParams: any = {};
      if (dateFrom) dateParams.start_date = dateFrom;
      if (dateTo) dateParams.end_date = dateTo;

      const [incRes, merRes, detRes] = await Promise.allSettled([
        fetchWithRetry(() => api.getIncidents(dateParams)),
        fetchWithRetry(() => api.getMerits(dateParams)),
        fetchWithRetry(() => api.getDetentions(dateParams)),
      ]);

      const failed: string[] = [];

      if (incRes.status === 'fulfilled') {
        setIncidents((incRes.value.data || []).filter((i: any) => studentIds.has(i.student_id)));
      } else { failed.push('Incidents'); setIncidents([]); }

      if (merRes.status === 'fulfilled') {
        setMerits((merRes.value.data || []).filter((m: any) => studentIds.has(m.student_id)));
      } else { failed.push('Merits'); setMerits([]); }

      if (detRes.status === 'fulfilled') {
        setDetentions((detRes.value.data || []).filter((d: any) => studentIds.has(d.student_id)));
      } else { failed.push('Detentions'); setDetentions([]); }

      if (failed.length > 0) setFetchError(`Some data sources failed: ${failed.join(', ')}`);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setFetchError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, dateFrom, dateTo, fetchWithRetry]);

  useEffect(() => { fetchTeacherData(); }, [fetchTeacherData]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const selectedClass = useMemo(
    () => myClasses.find(c => String(c.id) === selectedClassId) || null,
    [myClasses, selectedClassId]
  );

  const filteredStudents = useMemo(() => {
    if (!studentFilter.trim()) return students;
    const q = studentFilter.toLowerCase();
    return students.filter((s: any) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      (s.student_id && s.student_id.toLowerCase().includes(q))
    );
  }, [students, studentFilter]);

  const stats = useMemo(() => ({
    totalStudents: students.length,
    totalIncidents: incidents.length,
    totalMerits: merits.length,
    totalDetentions: detentions.length,
    avgIncidentsPerStudent: students.length > 0 ? (incidents.length / students.length).toFixed(1) : '0',
  }), [students, incidents, merits, detentions]);

  // ── Dynamic file name ──────────────────────────────────────────────────────
  const getClassFileName = () => {
    if (selectedClass) return `${selectedClass.class_name}_Report`.replace(/\s+/g, '_');
    return 'Class_Report';
  };

  // ── Export: full class report with section separation ──────────────────────
  const exportClassReport = () => {
    if (!selectedClass || students.length === 0) {
      showWarning('No class data available to export');
      return;
    }

    const sections: { title: string; headers: string[]; data: any[][] }[] = [];

    // Section 1: Student Summary
    sections.push({
      title: `Student Summary — ${selectedClass.class_name}`,
      headers: ['Student ID', 'Name', 'Grade', 'Incidents', 'Incident Pts', 'Merits', 'Merit Pts', 'Detentions', 'Net Points'],
      data: students.map((s: any) => {
        const sInc = incidents.filter((i: any) => i.student_id === s.id);
        const sMer = merits.filter((m: any) => m.student_id === s.id);
        const sDet = detentions.filter((d: any) => d.student_id === s.id);
        const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
        const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
        return [
          s.student_id || s.id, `${s.first_name} ${s.last_name}`,
          s.grade_level || selectedClass.grade_level || 'N/A',
          sInc.length, incPts, sMer.length, merPts, sDet.length, merPts - incPts,
        ];
      }),
    });

    // Section 2: Behaviour Incidents
    if (incidents.length > 0) {
      sections.push({
        title: `Behaviour Incidents — ${selectedClass.class_name}`,
        headers: ['Date', 'Student', 'Type', 'Severity', 'Points', 'Status', 'Teacher', 'Description'],
        data: incidents.map((inc: any) => [
          inc.date || inc.incident_date || 'N/A',
          inc.student_name || 'N/A',
          inc.incident_type || inc.incident_type_name || 'N/A',
          inc.severity || 'N/A',
          inc.points || inc.points_deducted || 0,
          inc.status || 'N/A',
          inc.teacher_name || 'N/A',
          inc.description || '',
        ]),
      });
    }

    // Section 3: Merits
    if (merits.length > 0) {
      sections.push({
        title: `Merits — ${selectedClass.class_name}`,
        headers: ['Date', 'Student', 'Type', 'Points', 'Teacher', 'Description'],
        data: merits.map((m: any) => [
          m.date || m.merit_date || 'N/A',
          m.student_name || 'N/A',
          m.merit_type || 'N/A',
          m.points || 0,
          m.teacher_name || 'N/A',
          m.description || '',
        ]),
      });
    }

    // Section 4: Detentions
    if (detentions.length > 0) {
      sections.push({
        title: `Detentions — ${selectedClass.class_name}`,
        headers: ['Date', 'Student', 'Reason', 'Status', 'Duration', 'Served'],
        data: detentions.map((d: any) => [
          d.date || d.detention_date || 'N/A',
          d.student_name || 'N/A',
          d.reason || d.description || 'N/A',
          d.status || 'N/A',
          d.duration || 'N/A',
          d.served ? 'Yes' : 'No',
        ]),
      });
    }

    // Section 5: Consequences
    const consequenceIncidents = incidents.filter((inc: any) => inc.consequence || inc.consequence_type);
    if (consequenceIncidents.length > 0) {
      sections.push({
        title: `Consequences — ${selectedClass.class_name}`,
        headers: ['Date', 'Student', 'Incident Type', 'Consequence', 'Status'],
        data: consequenceIncidents.map((inc: any) => [
          inc.date || inc.incident_date || 'N/A',
          inc.student_name || 'N/A',
          inc.incident_type || inc.incident_type_name || 'N/A',
          inc.consequence || inc.consequence_type || 'N/A',
          inc.consequence_status || inc.status || 'N/A',
        ]),
      });
    }

    const fileName = getClassFileName();
    exportComprehensiveReport(fileName, sections, selectedClass.class_name.slice(0, 31));
    showSuccess(`Report exported: ${fileName}`);
  };

  // ── Export: individual student report ──────────────────────────────────────
  const exportStudentReport = (student: any) => {
    const sInc = incidents.filter((i: any) => i.student_id === student.id);
    const sMer = merits.filter((m: any) => m.student_id === student.id);
    const sDet = detentions.filter((d: any) => d.student_id === student.id);
    const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
    const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
    const consInc = sInc.filter((inc: any) => inc.consequence || inc.consequence_type);

    const sections: { title: string; headers: string[]; data: any[][] }[] = [];

    // Section 1: Overview
    sections.push({
      title: `Student Overview — ${student.first_name} ${student.last_name}`,
      headers: ['Field', 'Value'],
      data: [
        ['Student ID', student.student_id || String(student.id)],
        ['Full Name', `${student.first_name} ${student.last_name}`],
        ['Class', selectedClass?.class_name || student.class_name || 'N/A'],
        ['Grade', student.grade_level || selectedClass?.grade_level || 'N/A'],
        ['Total Incidents', sInc.length],
        ['Total Incident Points', incPts],
        ['Total Merits', sMer.length],
        ['Total Merit Points', merPts],
        ['Total Detentions', sDet.length],
        ['Net Points', merPts - incPts],
      ],
    });

    // Section 2: Behaviour Incidents
    if (sInc.length > 0) {
      sections.push({
        title: 'Behaviour Incidents',
        headers: ['Date', 'Type', 'Severity', 'Points', 'Status', 'Teacher', 'Description'],
        data: sInc.map((inc: any) => [
          inc.date || inc.incident_date || 'N/A',
          inc.incident_type || inc.incident_type_name || 'N/A',
          inc.severity || 'N/A',
          inc.points || inc.points_deducted || 0,
          inc.status || 'N/A',
          inc.teacher_name || 'N/A',
          inc.description || '',
        ]),
      });
    }

    // Section 3: Merits
    if (sMer.length > 0) {
      sections.push({
        title: 'Merits',
        headers: ['Date', 'Type', 'Points', 'Teacher', 'Description'],
        data: sMer.map((m: any) => [
          m.date || m.merit_date || 'N/A',
          m.merit_type || 'N/A',
          m.points || 0,
          m.teacher_name || 'N/A',
          m.description || '',
        ]),
      });
    }

    // Section 4: Detentions
    if (sDet.length > 0) {
      sections.push({
        title: 'Detentions',
        headers: ['Date', 'Reason', 'Status', 'Duration', 'Served'],
        data: sDet.map((d: any) => [
          d.date || d.detention_date || 'N/A',
          d.reason || d.description || 'N/A',
          d.status || 'N/A',
          d.duration || 'N/A',
          d.served ? 'Yes' : 'No',
        ]),
      });
    }

    // Section 5: Consequences
    if (consInc.length > 0) {
      sections.push({
        title: 'Consequences',
        headers: ['Date', 'Incident Type', 'Consequence', 'Status'],
        data: consInc.map((inc: any) => [
          inc.date || inc.incident_date || 'N/A',
          inc.incident_type || inc.incident_type_name || 'N/A',
          inc.consequence || inc.consequence_type || 'N/A',
          inc.consequence_status || inc.status || 'N/A',
        ]),
      });
    }

    const safeName = `${student.first_name}_${student.last_name}`.replace(/\s+/g, '_');
    exportComprehensiveReport(safeName, sections, `${student.first_name} ${student.last_name}`.slice(0, 31));
    showSuccess(`Report exported: ${student.first_name} ${student.last_name}`);
  };

  // ── Export via quick search ────────────────────────────────────────────────
  const exportQuickStudentReport = () => {
    if (!quickSelectedStudent) {
      showWarning('Please search and select a student first');
      return;
    }
    exportStudentReport(quickSelectedStudent);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && myClasses.length === 0) {
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

  if (!loading && myClasses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Class Assigned</h3>
        <p className="text-gray-500">You don't have a class assigned yet. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Class Reports</h1>
            <p className="text-emerald-100 mt-2">
              {selectedClass ? `${selectedClass.class_name} — Grade ${selectedClass.grade_level}` : 'Select a class'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchTeacherData}
              disabled={loading}
              className="p-3 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-all"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl"
          >
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertTriangle size={18} />
              <span className="text-sm">{fetchError}</span>
            </div>
            <button onClick={() => setFetchError(null)} className="text-amber-600 hover:text-amber-800">
              <XCircle size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter & Export Panel ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Filter size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filter & Export Reports</h3>
              <p className="text-xs text-gray-400">Select filters then export to Excel</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Row 1: Filters + Export Button ─────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Class Selector */}
              {myClasses.length > 1 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Class</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    {myClasses.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.class_name} — Grade {c.grade_level}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date From */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Date From</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date" value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Date To</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date" value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* ── EXPORT CLASS REPORT (prominent) ──────────────────────── */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportClassReport}
              disabled={loading || students.length === 0}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap min-w-[220px]"
            >
              <Download size={18} />
              <span>Export Class to Excel</span>
            </motion.button>
          </div>

          {/* ── Active filter badge ────────────────────────────────────── */}
          <div className="flex items-center space-x-2 flex-wrap bg-gray-50 rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-400 font-medium">Exporting:</span>
            <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              {selectedClass?.class_name || 'No class'}
            </span>
            <span className="text-xs text-gray-500">
              {students.length} students · {incidents.length} incidents · {merits.length} merits · {detentions.length} detentions
            </span>
            <span className="text-xs text-gray-400 ml-auto">File: <span className="font-mono text-gray-600">{getClassFileName()}.xlsx</span></span>
          </div>

          {/* ── Row 2: Individual Student Export ───────────────────────── */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <Users size={13} className="text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Export Individual Student Report</h4>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={quickStudentSearch}
                  onChange={(e) => { setQuickStudentSearch(e.target.value); setQuickSelectedStudent(null); }}
                  placeholder="Search student by name or ID..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {quickStudentSearch.trim() && !quickSelectedStudent && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                    {students
                      .filter((s: any) =>
                        `${s.first_name} ${s.last_name}`.toLowerCase().includes(quickStudentSearch.toLowerCase()) ||
                        (s.student_id && s.student_id.toLowerCase().includes(quickStudentSearch.toLowerCase()))
                      )
                      .slice(0, 15)
                      .map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setQuickSelectedStudent(s);
                            setQuickStudentSearch(`${s.first_name} ${s.last_name}`);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center space-x-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">{s.student_id || ''}</span>
                          </div>
                        </button>
                      ))}
                    {students.filter((s: any) =>
                      `${s.first_name} ${s.last_name}`.toLowerCase().includes(quickStudentSearch.toLowerCase()) ||
                      (s.student_id && s.student_id.toLowerCase().includes(quickStudentSearch.toLowerCase()))
                    ).length === 0 && (
                      <div className="px-3 py-3 text-sm text-gray-400 text-center">No students found</div>
                    )}
                  </div>
                )}
              </div>
              {quickSelectedStudent && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    <CheckCircle size={12} className="mr-1" />
                    {quickSelectedStudent.first_name} {quickSelectedStudent.last_name}
                  </span>
                  <button onClick={() => { setQuickSelectedStudent(null); setQuickStudentSearch(''); }} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={14} />
                  </button>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportQuickStudentReport}
                disabled={!quickSelectedStudent || loading}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold whitespace-nowrap"
              >
                <Download size={16} />
                <span>Export Student Report</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Incidents', value: stats.totalIncidents, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
          { label: 'Merits', value: stats.totalMerits, icon: Award, color: 'from-amber-500 to-yellow-500' },
          { label: 'Detentions', value: stats.totalDetentions, icon: Clock, color: 'from-purple-500 to-pink-500' },
          { label: 'Avg Inc/Student', value: stats.avgIncidentsPerStudent, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl bg-white shadow-lg border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="text-white" size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student Reports</h2>
              <p className="text-gray-400 text-xs mt-0.5">Click Export on any student row for their full report</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter students..."
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Incidents</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Merits</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Detentions</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Net Pts</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    {studentFilter ? 'No students match your search' : 'No students in this class'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const sInc = incidents.filter((i: any) => i.student_id === student.id);
                  const sMer = merits.filter((m: any) => m.student_id === student.id);
                  const sDet = detentions.filter((d: any) => d.student_id === student.id);
                  const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
                  const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
                  const netPoints = merPts - incPts;

                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{student.first_name} {student.last_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-sm">{student.student_id || student.id}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sInc.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                          {sInc.length}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sMer.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {sMer.length}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sDet.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                          {sDet.length}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          netPoints > 0 ? 'bg-green-100 text-green-700' : netPoints < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {netPoints > 0 ? '+' : ''}{netPoints}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportStudentReport(student)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-medium shadow hover:shadow-md transition-all"
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherReports;
