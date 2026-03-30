import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel, exportMultiSheetExcel, exportComprehensiveReport } from '../../utils/excelExport';
import { useToast } from '../../contexts/ToastContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  AlertTriangle,
  Download,
  Filter,
  ChevronDown,
  PieChart,
  Clock,
  CheckCircle,
  Search,
  School,
  UserCheck,
  Layers,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  incidentCount: number;
  meritCount: number;
  detentionCount: number;
}

type ReportScope = 'overall' | 'grade' | 'class' | 'student';

// ── Date range helper ─────────────────────────────────────────────────────────
function getDateRange(range: string): { start_date: string; end_date: string } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  };
}

// ── Safe result extractor for Promise.allSettled ──────────────────────────────
function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

const ReportsAnalytics: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('all');

  // ── Filter state ──────────────────────────────────────────────────────────
  const [reportScope, setReportScope] = useState<ReportScope>('overall');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [quickStudentSearch, setQuickStudentSearch] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<any>(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, totalTeachers: 0, totalParents: 0,
    totalClasses: 0, incidentCount: 0, meritCount: 0, detentionCount: 0,
  });
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [allMerits, setAllMerits] = useState<any[]>([]);
  const [allDetentions, setAllDetentions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);

  // ── Derived: class_id → grade_level lookup map ────────────────────────────
  const classGradeMap = useMemo(() => {
    const m = new Map<number, string>();
    allClasses.forEach((c: any) => { if (c.grade_level != null) m.set(c.id, String(c.grade_level)); });
    return m;
  }, [allClasses]);

  // ── Derived: unique grades from classes + students ──────────────────────────
  const grades = useMemo(() => {
    const g = new Set<string>();
    allClasses.forEach((c: any) => { if (c.grade_level != null && c.grade_level !== '') g.add(String(c.grade_level)); });
    allStudents.forEach((s: any) => {
      // Prefer class grade_level over student's own (more reliable)
      const gradeFromClass = s.class_id ? classGradeMap.get(s.class_id) : undefined;
      const grade = gradeFromClass ?? (s.grade_level != null && s.grade_level !== '' ? String(s.grade_level) : null);
      if (grade) g.add(grade);
    });
    return Array.from(g).sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
  }, [allClasses, allStudents, classGradeMap]);

  // ── Derived: classes filtered by selected grade ───────────────────────────
  const filteredClasses = useMemo(() => {
    if (!selectedGrade) return allClasses;
    return allClasses.filter((c: any) => String(c.grade_level) === selectedGrade);
  }, [allClasses, selectedGrade]);

  // ── Derived: students matching current scope + search ─────────────────────
  const scopedStudents = useMemo(() => {
    let list = allStudents;
    if (reportScope === 'grade' && selectedGrade) {
      list = list.filter((s: any) => {
        // 1. Match by the student's class grade_level (most reliable)
        if (s.class_id && classGradeMap.get(s.class_id) === selectedGrade) return true;
        // 2. Fallback: match by student's own grade_level field
        if (s.grade_level != null && String(s.grade_level) === selectedGrade) return true;
        return false;
      });
    } else if (reportScope === 'class' && selectedClassId) {
      list = list.filter((s: any) => String(s.class_id) === selectedClassId);
    } else if (reportScope === 'student' && selectedStudentId) {
      list = list.filter((s: any) => String(s.id) === selectedStudentId);
    }
    return list;
  }, [allStudents, reportScope, selectedGrade, selectedClassId, selectedStudentId, classGradeMap]);

  const studentSearchResults = useMemo(() => {
    if (!studentSearchTerm.trim()) return allStudents.slice(0, 20);
    const term = studentSearchTerm.toLowerCase();
    return allStudents.filter((s: any) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term) ||
      (s.student_id && s.student_id.toLowerCase().includes(term))
    ).slice(0, 20);
  }, [allStudents, studentSearchTerm]);

  // ── Derived: filtered incidents & merits based on scope ───────────────────
  const scopedIncidents = useMemo(() => {
    const studentIds = new Set(scopedStudents.map((s: any) => s.id));
    return allIncidents.filter((i: any) => studentIds.has(i.student_id));
  }, [allIncidents, scopedStudents]);

  const scopedMerits = useMemo(() => {
    const studentIds = new Set(scopedStudents.map((s: any) => s.id));
    return allMerits.filter((m: any) => studentIds.has(m.student_id));
  }, [allMerits, scopedStudents]);

  const scopedDetentions = useMemo(() => {
    if (reportScope === 'overall') return allDetentions;
    return allDetentions;
  }, [allDetentions, reportScope]);

  // ── Derived: behaviour data for chart ─────────────────────────────────────
  const behaviourData = useMemo(() => {
    const byType: Record<string, number> = {};
    scopedIncidents.forEach((inc: any) => {
      const type = inc.incident_type || inc.incident_type_name || 'Other';
      byType[type] = (byType[type] || 0) + 1;
    });
    return Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [scopedIncidents]);

  // ── Fetch with retry helper ──────────────────────────────────────────────
  const fetchWithRetry = async (fn: () => Promise<any>, retries = 2): Promise<any> => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, 300 * (i + 1)));
      }
    }
  };

  // ── Fetch data (staggered to avoid connection pool exhaustion) ──────────
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { start_date, end_date } = getDateRange(dateRange);
    const dateParams = dateRange !== 'all' ? { start_date, end_date } : {};

    try {
      // Batch 1: core data (students, classes)
      const batch1 = await Promise.allSettled([
        fetchWithRetry(() => api.getStudents()),
        fetchWithRetry(() => api.getClasses()),
      ]);

      // Batch 2: behaviour data (incidents, merits, detentions)
      const batch2 = await Promise.allSettled([
        fetchWithRetry(() => api.getIncidents(dateParams)),
        fetchWithRetry(() => api.getMerits(dateParams)),
        fetchWithRetry(() => api.getDetentions(dateParams)),
      ]);

      // Batch 3: supplementary (teachers, parents)
      const batch3 = await Promise.allSettled([
        fetchWithRetry(() => api.getTeachers()),
        fetchWithRetry(() => api.getParents()),
      ]);

      const students = settled(batch1[0], { data: [] }).data || [];
      const classes = settled(batch1[1], { data: [] }).data || [];
      const incidents = settled(batch2[0], { data: [] }).data || [];
      const merits = settled(batch2[1], { data: [] }).data || [];
      const detentions = settled(batch2[2], { data: [] }).data || [];
      const teachers = settled(batch3[0], { data: [] }).data || [];
      const parents = settled(batch3[1], { data: [] }).data || [];

      // Log individual failures for debugging
      const allResults = [...batch1, ...batch2, ...batch3];
      const apiNames = ['Students', 'Classes', 'Incidents', 'Merits', 'Detentions', 'Teachers', 'Parents'];
      const failedAPIs = apiNames.filter((_, i) => allResults[i].status === 'rejected');
      if (failedAPIs.length > 0) {
        console.warn('Some APIs failed after retries:', failedAPIs);
        setFetchError(`Some data sources failed to load: ${failedAPIs.join(', ')}. Showing available data.`);
      }

      setAllStudents(Array.isArray(students) ? students : []);
      setAllIncidents(Array.isArray(incidents) ? incidents : []);
      setAllMerits(Array.isArray(merits) ? merits : []);
      setAllDetentions(Array.isArray(detentions) ? detentions : []);
      setAllClasses(Array.isArray(classes) ? classes : []);

      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
        totalParents: Array.isArray(parents) ? parents.length : 0,
        totalClasses: Array.isArray(classes) ? classes.length : 0,
        incidentCount: Array.isArray(incidents) ? incidents.length : 0,
        meritCount: Array.isArray(merits) ? merits.length : 0,
        detentionCount: Array.isArray(detentions) ? detentions.length : 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setFetchError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ── Scope label for display ───────────────────────────────────────────────
  const scopeLabel = useMemo(() => {
    switch (reportScope) {
      case 'grade': return selectedGrade ? `Grade ${selectedGrade}` : 'Select a grade';
      case 'class': {
        const cls = allClasses.find((c: any) => String(c.id) === selectedClassId);
        return cls ? cls.class_name : 'Select a class';
      }
      case 'student': {
        const stu = allStudents.find((s: any) => String(s.id) === selectedStudentId);
        return stu ? `${stu.first_name} ${stu.last_name}` : 'Select a student';
      }
      default: return 'Entire School';
    }
  }, [reportScope, selectedGrade, selectedClassId, selectedStudentId, allClasses, allStudents]);

  // ── Build dynamic file name based on active filters ──────────────────────
  const getFilteredFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    switch (reportScope) {
      case 'student': {
        const stu = allStudents.find((s: any) => String(s.id) === selectedStudentId);
        if (stu) return `${stu.first_name}_${stu.last_name}_Report`.replace(/\s+/g, '_');
        return `Student_Report_${date}`;
      }
      case 'class': {
        const cls = allClasses.find((c: any) => String(c.id) === selectedClassId);
        if (cls) return `${cls.class_name}_Report`.replace(/\s+/g, '_');
        return `Class_Report_${date}`;
      }
      case 'grade':
        return selectedGrade ? `Grade_${selectedGrade}_Report` : `Grade_Report_${date}`;
      default:
        return `Whole_School_Report_${date}`;
    }
  };

  // ── Export: comprehensive filtered report ─────────────────────────────────
  const exportFilteredReport = () => {
    if (scopedStudents.length === 0 && scopedIncidents.length === 0 && scopedMerits.length === 0) {
      showWarning('No data available for the selected filters');
      return;
    }

    const sections: { title: string; headers: string[]; data: any[][] }[] = [];

    // Section 1: Student Summary
    if (scopedStudents.length > 0) {
      sections.push({
        title: `Student Summary — ${scopeLabel}`,
        headers: ['Student ID', 'Name', 'Class', 'Grade', 'Incidents', 'Incident Pts', 'Merits', 'Merit Pts', 'Net Points'],
        data: scopedStudents.map((s: any) => {
          const sInc = scopedIncidents.filter((i: any) => i.student_id === s.id);
          const sMer = scopedMerits.filter((m: any) => m.student_id === s.id);
          const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
          const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
          return [
            s.student_id || s.id,
            `${s.first_name} ${s.last_name}`,
            s.class_name || 'N/A',
            s.grade_level || 'N/A',
            sInc.length, incPts, sMer.length, merPts, merPts - incPts,
          ];
        }),
      });
    }

    // Section 2: Behaviour Incidents
    if (scopedIncidents.length > 0) {
      sections.push({
        title: `Behaviour Incidents — ${scopeLabel}`,
        headers: ['Date', 'Student', 'Class', 'Type', 'Severity', 'Points', 'Status', 'Teacher', 'Description'],
        data: scopedIncidents.map((inc: any) => [
          inc.date || inc.incident_date || 'N/A',
          inc.student_name || 'N/A',
          inc.class_name || 'N/A',
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
    if (scopedMerits.length > 0) {
      sections.push({
        title: `Merits — ${scopeLabel}`,
        headers: ['Date', 'Student', 'Class', 'Type', 'Points', 'Teacher', 'Description'],
        data: scopedMerits.map((m: any) => [
          m.date || m.merit_date || 'N/A',
          m.student_name || 'N/A',
          m.class_name || 'N/A',
          m.merit_type || 'N/A',
          m.points || 0,
          m.teacher_name || 'N/A',
          m.description || '',
        ]),
      });
    }

    // Section 4: Detentions
    if (scopedDetentions.length > 0) {
      sections.push({
        title: `Detentions — ${scopeLabel}`,
        headers: ['Date', 'Student', 'Reason', 'Status', 'Duration', 'Served'],
        data: scopedDetentions.map((d: any) => [
          d.date || d.detention_date || 'N/A',
          d.student_name || 'N/A',
          d.reason || d.description || 'N/A',
          d.status || 'N/A',
          d.duration || 'N/A',
          d.served ? 'Yes' : 'No',
        ]),
      });
    }

    // Section 5: Consequences (from incidents with consequence info)
    const consequenceIncidents = scopedIncidents.filter((inc: any) => inc.consequence || inc.consequence_type);
    if (consequenceIncidents.length > 0) {
      sections.push({
        title: `Consequences — ${scopeLabel}`,
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

    const fileName = getFilteredFileName();
    exportComprehensiveReport(fileName, sections, scopeLabel.slice(0, 31));
    showSuccess(`Report exported: ${fileName}`);
  };

  // ── Export: per-class multi-sheet ─────────────────────────────────────────
  const exportClassBreakdown = () => {
    const targetClasses = reportScope === 'grade' && selectedGrade
      ? filteredClasses : allClasses;

    if (targetClasses.length === 0) {
      showWarning('No class data available');
      return;
    }

    const sheets = targetClasses.map((cls: any) => {
      const classStudents = allStudents.filter((s: any) => s.class_id === cls.id);
      return {
        name: (cls.class_name || `Class ${cls.id}`).slice(0, 31),
        headers: ['Student ID', 'Name', 'Incidents', 'Incident Pts', 'Merits', 'Merit Pts', 'Net Points'],
        data: classStudents.map((s: any) => {
          const sInc = allIncidents.filter((i: any) => i.student_id === s.id);
          const sMer = allMerits.filter((m: any) => m.student_id === s.id);
          const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
          const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
          return [s.student_id || s.id, `${s.first_name} ${s.last_name}`, sInc.length, incPts, sMer.length, merPts, merPts - incPts];
        }),
      };
    });

    exportMultiSheetExcel('class_breakdown_report', sheets);
    showSuccess('Class breakdown report exported!');
  };

  // ── Export: single report type ────────────────────────────────────────────
  const exportSingleReport = (reportType: string) => {
    switch (reportType) {
      case 'incidents':
        if (scopedIncidents.length === 0) { showWarning('No incident data for selected filters'); return; }
        exportToExcel('behaviour_report', 
          ['Date', 'Student', 'Class', 'Type', 'Severity', 'Points', 'Status', 'Description'],
          scopedIncidents.map((inc: any) => [
            inc.date || inc.incident_date || '', inc.student_name || '', inc.class_name || '',
            inc.incident_type || inc.incident_type_name || '', inc.severity || '',
            inc.points || inc.points_deducted || 0, inc.status || '', inc.description || '',
          ]),
          'Behaviour Incidents'
        );
        showSuccess('Behaviour report exported!');
        break;
      case 'merits':
        if (scopedMerits.length === 0) { showWarning('No merit data for selected filters'); return; }
        exportToExcel('merit_report',
          ['Date', 'Student', 'Class', 'Type', 'Points', 'Description'],
          scopedMerits.map((m: any) => [
            m.date || m.merit_date || '', m.student_name || '', m.class_name || '',
            m.merit_type || '', m.points || 0, m.description || '',
          ]),
          'Merits'
        );
        showSuccess('Merit report exported!');
        break;
      case 'student_summary':
        if (scopedStudents.length === 0) { showWarning('No student data for selected filters'); return; }
        exportToExcel('student_progress_report',
          ['Student ID', 'Name', 'Class', 'Grade', 'Incidents', 'Incident Pts', 'Merits', 'Merit Pts', 'Net Points'],
          scopedStudents.map((s: any) => {
            const sInc = scopedIncidents.filter((i: any) => i.student_id === s.id);
            const sMer = scopedMerits.filter((m: any) => m.student_id === s.id);
            const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
            const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
            return [s.student_id || s.id, `${s.first_name} ${s.last_name}`, s.class_name || 'N/A',
              s.grade_level || 'N/A', sInc.length, incPts, sMer.length, merPts, merPts - incPts];
          }),
          'Student Progress'
        );
        showSuccess('Student progress report exported!');
        break;
      case 'class_analytics':
        exportClassBreakdown();
        break;
      case 'grade_analytics':
        if (grades.length === 0) { showWarning('No grade data available'); return; }
        exportToExcel('grade_analytics_report',
          ['Grade', 'Classes', 'Students', 'Incidents', 'Merits', 'Avg Incidents/Student'],
          grades.map((grade) => {
            const gClasses = allClasses.filter((c: any) => String(c.grade_level) === grade);
            const gClassIds = new Set(gClasses.map((c: any) => c.id));
            const gStudents = allStudents.filter((s: any) => gClassIds.has(s.class_id));
            const gStudentIds = new Set(gStudents.map((s: any) => s.id));
            const gInc = allIncidents.filter((i: any) => gStudentIds.has(i.student_id)).length;
            const gMer = allMerits.filter((m: any) => gStudentIds.has(m.student_id)).length;
            return [grade, gClasses.length, gStudents.length, gInc, gMer,
              gStudents.length > 0 ? Number((gInc / gStudents.length).toFixed(2)) : 0];
          }),
          'Grade Analytics'
        );
        showSuccess('Grade analytics exported!');
        break;
      default:
        showError('Report type not supported');
    }
  };

  // ── Stat cards (use scoped counts) ────────────────────────────────────────
  const statCards = [
    { label: 'Students', value: scopedStudents.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Incidents', value: scopedIncidents.length, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
    { label: 'Merits', value: scopedMerits.length, icon: Award, color: 'from-amber-500 to-yellow-500' },
    { label: 'Detentions', value: scopedDetentions.length, icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Classes', value: reportScope === 'grade' && selectedGrade ? filteredClasses.length : allClasses.length, icon: School, color: 'from-emerald-500 to-teal-500' },
    { label: 'Teachers', value: stats.totalTeachers, icon: UserCheck, color: 'from-indigo-500 to-purple-500' },
  ];

  const reportTypes = [
    { name: 'Behaviour Report', description: 'Incident trends and severity analysis', icon: AlertTriangle, color: 'from-red-500 to-orange-500', exportType: 'incidents' },
    { name: 'Merit Report', description: 'Recognition and achievement tracking', icon: Award, color: 'from-amber-500 to-yellow-500', exportType: 'merits' },
    { name: 'Student Progress', description: 'Individual student performance overview', icon: TrendingUp, color: 'from-blue-500 to-cyan-500', exportType: 'student_summary' },
    { name: 'Class Breakdown', description: 'Per-class multi-sheet report', icon: PieChart, color: 'from-purple-500 to-pink-500', exportType: 'class_analytics' },
    { name: 'Grade Analytics', description: 'Grade-level performance comparison', icon: Layers, color: 'from-emerald-500 to-teal-500', exportType: 'grade_analytics' },
  ];

  // ── Export: individual student report ──────────────────────────────────────
  const exportIndividualStudentReport = () => {
    if (!quickSelectedStudent) {
      showWarning('Please search and select a student first');
      return;
    }
    const s = quickSelectedStudent;
    const sInc = allIncidents.filter((i: any) => i.student_id === s.id);
    const sMer = allMerits.filter((m: any) => m.student_id === s.id);
    const sDet = allDetentions.filter((d: any) => d.student_id === s.id);
    const incPts = sInc.reduce((sum: number, i: any) => sum + (i.points || i.points_deducted || 0), 0);
    const merPts = sMer.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
    const consInc = sInc.filter((inc: any) => inc.consequence || inc.consequence_type);

    const sections: { title: string; headers: string[]; data: any[][] }[] = [];

    // Section 1: Overview
    sections.push({
      title: `Student Overview — ${s.first_name} ${s.last_name}`,
      headers: ['Field', 'Value'],
      data: [
        ['Student ID', s.student_id || String(s.id)],
        ['Full Name', `${s.first_name} ${s.last_name}`],
        ['Class', s.class_name || 'N/A'],
        ['Grade', s.grade_level || 'N/A'],
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

    const safeName = `${s.first_name}_${s.last_name}`.replace(/\s+/g, '_');
    exportComprehensiveReport(safeName, sections, `${s.first_name} ${s.last_name}`.slice(0, 31));
    showSuccess(`Report exported: ${s.first_name} ${s.last_name}`);
  };

  // ── Reset filters ─────────────────────────────────────────────────────────
  const resetFilters = () => {
    setReportScope('overall');
    setSelectedGrade('');
    setSelectedClassId('');
    setSelectedStudentId('');
    setStudentSearchTerm('');
  };

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
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="text-white" size={24} />
            </div>
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-gray-500 mt-1">Comprehensive insights and data analysis</p>
        </div>
        
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {/* Date Range */}
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </motion.button>

          {/* Export All */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportFilteredReport}
            disabled={loading || (scopedIncidents.length === 0 && scopedMerits.length === 0 && scopedStudents.length === 0)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Download size={16} />
            <span>Export Full Report</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle size={18} />
              <span className="text-sm">{fetchError}</span>
            </div>
            <button onClick={() => setFetchError(null)} className="text-amber-600 hover:text-amber-800">
              <XCircle size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter & Export Panel ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Filter size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filter & Export Reports</h3>
              <p className="text-xs text-gray-400">Select filters then export to Excel</p>
            </div>
          </div>
          {reportScope !== 'overall' && (
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-lg">
              <XCircle size={14} /> <span>Clear Filters</span>
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* ── Row 1: Filter Dropdowns + Export Button ────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Scope */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Report Scope</label>
                <select
                  value={reportScope}
                  onChange={(e) => {
                    setReportScope(e.target.value as ReportScope);
                    setSelectedGrade(''); setSelectedClassId(''); setSelectedStudentId(''); setStudentSearchTerm('');
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="overall">Overall (Entire School)</option>
                  <option value="grade">By Grade</option>
                  <option value="class">By Class</option>
                  <option value="student">By Student</option>
                </select>
              </div>

              {/* Grade Selector */}
              {(reportScope === 'grade' || reportScope === 'class') && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Grade</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClassId(''); }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">All Grades</option>
                    {grades.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              )}

              {/* Class Selector */}
              {reportScope === 'class' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Class</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select a class</option>
                    {filteredClasses.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>{c.class_name} ({c.student_count || 0} students)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Search (when scope=student) */}
              {reportScope === 'student' && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Search Student</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => { setStudentSearchTerm(e.target.value); setSelectedStudentId(''); }}
                      placeholder="Type student name or ID..."
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {studentSearchTerm.trim() && !selectedStudentId && (
                      <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                        {studentSearchResults.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedStudentId(String(s.id)); setStudentSearchTerm(`${s.first_name} ${s.last_name}`); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center space-x-2">
                              <Users size={14} className="text-gray-400" />
                              <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s.class_name || 'N/A'}</span>
                          </button>
                        ))}
                        {studentSearchResults.length === 0 && (
                          <div className="px-3 py-3 text-sm text-gray-400 text-center">No students found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── EXPORT BUTTON (prominent) ──────────────────────────── */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportFilteredReport}
              disabled={loading || (scopedStudents.length === 0 && scopedIncidents.length === 0 && scopedMerits.length === 0)}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap min-w-[200px]"
            >
              <Download size={18} />
              <span>Export to Excel</span>
            </motion.button>
          </div>

          {/* ── Active filter badge ────────────────────────────────────── */}
          <div className="flex items-center space-x-2 flex-wrap bg-gray-50 rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-400 font-medium">Active filter:</span>
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {scopeLabel}
            </span>
            <span className="text-xs text-gray-500">
              {scopedStudents.length} students · {scopedIncidents.length} incidents · {scopedMerits.length} merits · {scopedDetentions.length} detentions
            </span>
            <span className="text-xs text-gray-400 ml-auto">File: <span className="font-mono text-gray-600">{getFilteredFileName()}.xlsx</span></span>
          </div>

          {/* ── Row 2: Individual Student Export ───────────────────────── */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                <Users size={13} className="text-emerald-600" />
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
                  placeholder="Search any student by name or ID..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {quickStudentSearch.trim() && !quickSelectedStudent && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                    {allStudents
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
                          className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center space-x-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">{s.student_id || ''}</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s.class_name || 'N/A'}</span>
                          </div>
                        </button>
                      ))}
                    {allStudents.filter((s: any) =>
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
                  <span className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                    <CheckCircle size={12} className="mr-1" />
                    {quickSelectedStudent.first_name} {quickSelectedStudent.last_name} — {quickSelectedStudent.class_name || 'N/A'}
                  </span>
                  <button onClick={() => { setQuickSelectedStudent(null); setQuickStudentSearch(''); }} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={14} />
                  </button>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportIndividualStudentReport}
                disabled={!quickSelectedStudent || loading}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold whitespace-nowrap"
              >
                <Download size={16} />
                <span>Export Student Report</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
                <stat.icon className="text-white" size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behaviour Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Behaviour Incidents by Type</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{scopeLabel}</span>
          </div>
          
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {behaviourData.length > 0 ? behaviourData.slice(0, 8).map((item, index) => {
                const maxCount = Math.max(...behaviourData.map(d => d.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const colors = [
                  'from-red-500 to-orange-500', 'from-amber-500 to-yellow-500',
                  'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500',
                  'from-green-500 to-emerald-500', 'from-indigo-500 to-violet-500',
                  'from-rose-500 to-pink-500', 'from-teal-500 to-cyan-500',
                ];
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium truncate max-w-[200px]">{item.type}</span>
                      <span className="text-gray-500 font-semibold">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full`}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <AlertTriangle size={32} className="text-gray-300" />
                  <p>No behaviour data for selected filters</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Merit / Incident Ratio by Class */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Students — Incidents</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{scopeLabel}</span>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full" />
            </div>
          ) : (() => {
            const studentIncidentCounts = scopedStudents.map((s: any) => ({
              name: `${s.first_name} ${s.last_name}`,
              className: s.class_name || 'N/A',
              count: scopedIncidents.filter((i: any) => i.student_id === s.id).length,
            })).filter(s => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);

            if (studentIncidentCounts.length === 0) {
              return (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <CheckCircle size={32} className="text-green-300" />
                  <p>No incidents recorded</p>
                </div>
              );
            }
            const max = studentIncidentCounts[0]?.count || 1;
            return (
              <div className="space-y-3">
                {studentIncidentCounts.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium truncate max-w-[180px]">{s.name} <span className="text-gray-400 text-xs">({s.className})</span></span>
                      <span className="text-gray-500 font-semibold">{s.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / max) * 100}%` }}
                        transition={{ delay: idx * 0.08, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </motion.div>
      </div>

      {/* Report Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report, index) => (
            <motion.div
              key={report.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${report.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <report.icon className="text-white" size={22} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => exportSingleReport(report.exportType)}
                    disabled={loading}
                    className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>Export Excel</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* School Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">School Performance Summary</h3>
            <p className="text-white/70 mt-1">Overall metrics · {scopeLabel}</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
              <p className="text-white/70 text-sm">Students</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.totalTeachers}</p>
              <p className="text-white/70 text-sm">Teachers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.meritCount}</p>
              <p className="text-white/70 text-sm">Merits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.detentionCount}</p>
              <p className="text-white/70 text-sm">Detentions</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsAnalytics;
