import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { exportToExcel, exportMultiSheetExcel } from '../../utils/excelExport';
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
  Activity,
  Clock,
  CheckCircle,
  FileText,
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

const ReportsAnalytics: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    incidentCount: 0,
    meritCount: 0,
    detentionCount: 0,
  });
  const [behaviourData, setBehaviourData] = useState<any[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [allMerits, setAllMerits] = useState<any[]>([]);
  const [allDetentions, setAllDetentions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [studentFilter, setStudentFilter] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, parentsRes, classesRes, incidentsRes, meritsRes, detentionsRes] = await Promise.all([
        api.getStudents(),
        api.getTeachers(),
        api.getParents(),
        api.getClasses(),
        api.getIncidents(),
        api.getMerits(),
        api.getDetentions(),
      ]);

      const students = studentsRes.data || [];
      const incidents = incidentsRes.data || [];
      const merits = meritsRes.data || [];
      const detentions = detentionsRes.data || [];

      setAllStudents(students);
      setFilteredStudents(students);
      setAllIncidents(incidents);
      setAllMerits(merits);
      setAllDetentions(detentions);
      setAllClasses(classesRes.data || []);

      setStats({
        totalStudents: students.length,
        totalTeachers: teachersRes.data?.length || 0,
        totalParents: parentsRes.data?.length || 0,
        totalClasses: classesRes.data?.length || 0,
        incidentCount: incidents.length,
        meritCount: merits.length,
        detentionCount: detentions.length,
      });

      // Process behaviour data
      const behaviourByType: { [key: string]: number } = {};
      incidents.forEach((incident: any) => {
        const type = incident.incident_type || 'Other';
        behaviourByType[type] = (behaviourByType[type] || 0) + 1;
      });
      setBehaviourData(Object.entries(behaviourByType).map(([type, count]) => ({ type, count })));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Export Incidents
    if (allIncidents.length > 0) {
      const incidentHeaders = ['Date', 'Student', 'Type', 'Severity', 'Points', 'Status', 'Description'];
      const incidentData = allIncidents.map(inc => [
        inc.date || inc.incident_date,
        inc.student_name,
        inc.incident_type,
        inc.severity,
        inc.points || 0,
        inc.status,
        inc.description || ''
      ]);
      downloadExcel('incidents_report', incidentHeaders, incidentData);
    }

    // Export Merits
    if (allMerits.length > 0) {
      const meritHeaders = ['Date', 'Student', 'Type', 'Points', 'Description'];
      const meritData = allMerits.map(merit => [
        merit.date || merit.merit_date,
        merit.student_name,
        merit.merit_type,
        merit.points || 0,
        merit.description || ''
      ]);
      downloadExcel('merits_report', meritHeaders, meritData);
    }

    // Export Detentions
    if (allDetentions.length > 0) {
      const detentionHeaders = ['Date', 'Time', 'Duration', 'Status', 'Students', 'Location'];
      const detentionData = allDetentions.map(det => [
        det.detention_date,
        det.detention_time || 'N/A',
        `${det.duration || 60} min`,
        det.status,
        det.student_count || 0,
        det.location || 'N/A'
      ]);
      downloadExcel('detentions_report', detentionHeaders, detentionData);
    }

    // Export Student Summary
    if (allStudents.length > 0) {
      const studentHeaders = ['Student ID', 'Name', 'Class', 'Incidents', 'Merits', 'Net Points'];
      const studentData = allStudents.map(student => {
        const studentIncidents = allIncidents.filter(i => i.student_id === student.id);
        const studentMerits = allMerits.filter(m => m.student_id === student.id);
        const incidentPoints = studentIncidents.reduce((sum, i) => sum + (i.points || 0), 0);
        const meritPoints = studentMerits.reduce((sum, m) => sum + (m.points || 0), 0);
        return [
          student.student_id,
          `${student.first_name} ${student.last_name}`,
          student.class_name || 'N/A',
          studentIncidents.length,
          studentMerits.length,
          meritPoints - incidentPoints
        ];
      });
      downloadExcel('student_summary_report', studentHeaders, studentData);
    }

    showSuccess('Reports exported successfully! Check your downloads folder.');
  };

  const exportAllClassesReport = () => {
    if (allClasses.length === 0 || allStudents.length === 0) {
      showWarning('No class data available to export');
      return;
    }

    const sheets = allClasses.map(cls => {
      const classStudents = allStudents.filter(s => s.class_id === cls.id);
      const headers = ['Student ID', 'Name', 'Incidents', 'Incident Points', 'Merits', 'Merit Points', 'Net Points'];
      const data = classStudents.map(student => {
        const studentIncidents = allIncidents.filter(i => i.student_id === student.id);
        const studentMerits = allMerits.filter(m => m.student_id === student.id);
        const incidentPoints = studentIncidents.reduce((sum, i) => sum + (i.points_deducted || 0), 0);
        const meritPoints = studentMerits.reduce((sum, m) => sum + (m.points || 0), 0);
        return [
          student.student_id || student.id,
          `${student.first_name} ${student.last_name}`,
          studentIncidents.length,
          incidentPoints,
          studentMerits.length,
          meritPoints,
          meritPoints - incidentPoints
        ];
      });
      return {
        name: cls.class_name || `Class ${cls.id}`,
        headers,
        data
      };
    });

    exportMultiSheetExcel('all_classes_report', sheets);
    showSuccess('All classes report exported successfully!');
  };

  const handleStudentFilter = (value: string) => {
    setStudentFilter(value);
    if (!value.trim()) {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter(student => 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(value.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const exportSingleReport = (reportType: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch(reportType) {
      case 'incidents':
        if (allIncidents.length > 0) {
          const headers = ['Date', 'Student', 'Type', 'Severity', 'Points', 'Status', 'Description'];
          const data = allIncidents.map(inc => [
            inc.date || inc.incident_date,
            inc.student_name,
            inc.incident_type,
            inc.severity,
            inc.points || 0,
            inc.status,
            inc.description || ''
          ]);
          downloadExcel('behaviour_report', headers, data);
        } else {
          showWarning('No incident data available to export');
        }
        break;
        
      case 'merits':
        if (allMerits.length > 0) {
          const headers = ['Date', 'Student', 'Type', 'Points', 'Description'];
          const data = allMerits.map(merit => [
            merit.date || merit.merit_date,
            merit.student_name,
            merit.merit_type,
            merit.points || 0,
            merit.description || ''
          ]);
          downloadExcel('merit_report', headers, data);
        } else {
          showWarning('No merit data available to export');
        }
        break;
        
      case 'student_summary':
        if (allStudents.length > 0) {
          const headers = ['Student ID', 'Name', 'Class', 'Incidents', 'Merits', 'Net Points'];
          const data = allStudents.map(student => {
            const studentIncidents = allIncidents.filter(i => i.student_id === student.id);
            const studentMerits = allMerits.filter(m => m.student_id === student.id);
            const incidentPoints = studentIncidents.reduce((sum, i) => sum + (i.points || 0), 0);
            const meritPoints = studentMerits.reduce((sum, m) => sum + (m.points || 0), 0);
            return [
              student.student_id,
              `${student.first_name} ${student.last_name}`,
              student.class_name || 'N/A',
              studentIncidents.length,
              studentMerits.length,
              meritPoints - incidentPoints
            ];
          });
          downloadExcel('student_progress_report', headers, data);
        } else {
          showWarning('No student data available to export');
        }
        break;
        
      case 'class_analytics':
        if (allStudents.length > 0) {
          const classSummary: { [key: string]: any } = {};
          allStudents.forEach(student => {
            const className = student.class_name || 'Unassigned';
            if (!classSummary[className]) {
              classSummary[className] = { students: 0, incidents: 0, merits: 0 };
            }
            classSummary[className].students++;
            classSummary[className].incidents += allIncidents.filter(i => i.student_id === student.id).length;
            classSummary[className].merits += allMerits.filter(m => m.student_id === student.id).length;
          });
          
          const headers = ['Class', 'Students', 'Incidents', 'Merits', 'Incident Rate'];
          const data = Object.entries(classSummary).map(([className, stats]: [string, any]) => [
            className,
            stats.students,
            stats.incidents,
            stats.merits,
            stats.students > 0 ? (stats.incidents / stats.students).toFixed(2) : '0'
          ]);
          downloadExcel('class_analytics_report', headers, data);
        } else {
          showWarning('No class data available to export');
        }
        break;
        
      case 'teacher_activity':
        const headers = ['Report Type', 'Count'];
        const data = [
          ['Total Incidents Logged', allIncidents.length],
          ['Total Merits Awarded', allMerits.length],
          ['Total Detentions', allDetentions.length]
        ];
        downloadExcel('teacher_activity_report', headers, data);
        break;
        
      default:
        showError('Report type not supported');
    }
  };

  const downloadExcel = (reportName: string, headers: string[], data: any[][]) => {
    exportToExcel(reportName, headers, data);
  };

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-cyan-500', change: '+12%', trend: 'up' },
    { label: 'Behaviour Incidents', value: stats.incidentCount, icon: AlertTriangle, color: 'from-red-500 to-orange-500', change: '-8%', trend: 'down' },
    { label: 'Merits Awarded', value: stats.meritCount, icon: Award, color: 'from-amber-500 to-yellow-500', change: '+15%', trend: 'up' },
    { label: 'Active Detentions', value: stats.detentionCount, icon: Clock, color: 'from-purple-500 to-pink-500', change: '-5%', trend: 'down' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'from-indigo-500 to-purple-500', change: '+2%', trend: 'up' },
  ];

  const reportTypes = [
    { name: 'Behaviour Report', description: 'Incident trends and severity analysis', icon: AlertTriangle, color: 'from-red-500 to-orange-500', exportType: 'incidents' },
    { name: 'Merit Report', description: 'Recognition and achievement tracking', icon: Award, color: 'from-amber-500 to-yellow-500', exportType: 'merits' },
    { name: 'Student Progress', description: 'Individual student performance overview', icon: TrendingUp, color: 'from-blue-500 to-cyan-500', exportType: 'student_summary' },
    { name: 'Class Analytics', description: 'Class-wise performance comparison', icon: PieChart, color: 'from-purple-500 to-pink-500', exportType: 'class_analytics' },
    { name: 'Teacher Activity', description: 'Teacher engagement and logging activity', icon: Activity, color: 'from-indigo-500 to-violet-500', exportType: 'teacher_activity' },
  ];

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
        
        <div className="flex items-center space-x-3">
          {/* Date Range Filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToCSV}
            disabled={loading || (allIncidents.length === 0 && allMerits.length === 0 && allDetentions.length === 0)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>Export All Reports</span>
          </motion.button>
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
              <div className={`flex items-center space-x-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.trend === 'up' && <TrendingUp size={14} />}
                {stat.trend === 'down' && <TrendingDown size={14} />}
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
              {behaviourData.length > 0 ? behaviourData.slice(0, 5).map((item, index) => {
                const maxCount = Math.max(...behaviourData.map(d => d.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const colors = [
                  'from-red-500 to-orange-500',
                  'from-amber-500 to-yellow-500',
                  'from-blue-500 to-cyan-500',
                  'from-purple-500 to-pink-500',
                  'from-green-500 to-emerald-500',
                ];
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{item.type}</span>
                      <span className="text-gray-500">{item.count}</span>
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
                <div className="h-48 flex items-center justify-center text-gray-400">
                  No behaviour data available
                </div>
              )}
            </div>
          )}
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
                    className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md"
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

      {/* Quick Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">School Performance Summary</h3>
            <p className="text-white/70 mt-1">Overall metrics for the selected period</p>
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
