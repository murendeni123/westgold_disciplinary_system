import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { exportToExcel } from '../../utils/excelExport';
import {
  Download,
  Users,
  AlertTriangle,
  Award,
  FileText,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react';

interface ClassData {
  id: number;
  class_name: string;
  grade_level: string;
  student_count: number;
}

const TeacherReports: React.FC = () => {
  const [myClass, setMyClass] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [merits, setMerits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher's assigned class
      const classesRes = await api.getClasses();
      const teacherClass = classesRes.data?.find((c: any) => c.is_teacher_class);
      
      if (teacherClass) {
        setMyClass(teacherClass);
        
        // Fetch students in the class
        const studentsRes = await api.getStudents({ class_id: teacherClass.id });
        const studentsList = studentsRes.data || [];
        setStudents(studentsList);
        setFilteredStudents(studentsList);
        
        // Fetch incidents for the class
        const incidentsRes = await api.getIncidents();
        const classIncidents = incidentsRes.data?.filter((inc: any) => 
          studentsRes.data?.some((s: any) => s.id === inc.student_id)
        ) || [];
        setIncidents(classIncidents);
        
        // Fetch merits for the class
        const meritsRes = await api.getMerits();
        const classMerits = meritsRes.data?.filter((merit: any) => 
          studentsRes.data?.some((s: any) => s.id === merit.student_id)
        ) || [];
        setMerits(classMerits);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentFilter = (value: string) => {
    setStudentFilter(value);
    if (!value.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(value.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const exportClassReport = () => {
    if (!myClass || students.length === 0) {
      alert('No class data available to export');
      return;
    }

    setExporting(true);
    
    try {
      const headers = ['Student ID', 'Name', 'Incidents', 'Incident Points', 'Merits', 'Merit Points', 'Net Points'];
      const data = students.map(student => {
        const studentIncidents = incidents.filter(i => i.student_id === student.id);
        const studentMerits = merits.filter(m => m.student_id === student.id);
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

      exportToExcel(`${myClass.class_name}_class_report`, headers, data);
      alert('Class report exported successfully!');
    } catch (error) {
      console.error('Error exporting class report:', error);
      alert('Error exporting class report');
    } finally {
      setExporting(false);
    }
  };

  const exportStudentReport = (student: any) => {
    setExporting(true);
    
    try {
      const studentIncidents = incidents.filter(i => i.student_id === student.id);
      const studentMerits = merits.filter(m => m.student_id === student.id);

      // Incidents sheet
      const incidentHeaders = ['Date', 'Type', 'Severity', 'Points', 'Description'];
      const incidentData = studentIncidents.map(inc => [
        inc.date || inc.incident_date,
        inc.incident_type_name || inc.incident_type,
        inc.severity,
        inc.points_deducted || 0,
        inc.description || ''
      ]);

      // Merits sheet
      const meritHeaders = ['Date', 'Type', 'Points', 'Description'];
      const meritData = studentMerits.map(merit => [
        merit.date || merit.merit_date,
        merit.merit_type,
        merit.points || 0,
        merit.description || ''
      ]);

      // Summary sheet
      const summaryHeaders = ['Metric', 'Value'];
      const summaryData = [
        ['Student Name', `${student.first_name} ${student.last_name}`],
        ['Student ID', student.student_id || student.id],
        ['Class', myClass?.class_name || 'N/A'],
        ['Total Incidents', studentIncidents.length],
        ['Total Incident Points', studentIncidents.reduce((sum, i) => sum + (i.points_deducted || 0), 0)],
        ['Total Merits', studentMerits.length],
        ['Total Merit Points', studentMerits.reduce((sum, m) => sum + (m.points || 0), 0)],
        ['Net Points', studentMerits.reduce((sum, m) => sum + (m.points || 0), 0) - studentIncidents.reduce((sum, i) => sum + (i.points_deducted || 0), 0)]
      ];

      // Export with multiple sheets
      const sheets = [
        { name: 'Summary', headers: summaryHeaders, data: summaryData },
        { name: 'Incidents', headers: incidentHeaders, data: incidentData },
        { name: 'Merits', headers: meritHeaders, data: meritData }
      ];

      // For now, export summary only (multi-sheet requires additional implementation)
      exportToExcel(`${student.first_name}_${student.last_name}_report`, summaryHeaders, summaryData);
      alert('Student report exported successfully!');
    } catch (error) {
      console.error('Error exporting student report:', error);
      alert('Error exporting student report');
    } finally {
      setExporting(false);
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

  if (!myClass) {
    return (
      <div className="text-center py-12">
        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Class Assigned</h3>
        <p className="text-gray-500">You don't have a class assigned yet. Please contact your administrator.</p>
      </div>
    );
  }

  const stats = {
    totalStudents: students.length,
    totalIncidents: incidents.length,
    totalMerits: merits.length,
    avgIncidentsPerStudent: students.length > 0 ? (incidents.length / students.length).toFixed(1) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Class Reports</h1>
            <p className="text-emerald-100 mt-2">{myClass.class_name} - Grade {myClass.grade_level}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportClassReport}
            disabled={exporting}
            className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Export Class Report</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Total Incidents', value: stats.totalIncidents, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
          { label: 'Total Merits', value: stats.totalMerits, icon: Award, color: 'from-amber-500 to-yellow-500' },
          { label: 'Avg Incidents/Student', value: stats.avgIncidentsPerStudent, icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Student Reports</h2>
              <p className="text-gray-500 text-sm mt-1">Export individual student reports</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={studentFilter}
            onChange={(e) => handleStudentFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Incidents</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Merits</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Net Points</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student, index) => {
                const studentIncidents = incidents.filter(i => i.student_id === student.id);
                const studentMerits = merits.filter(m => m.student_id === student.id);
                const incidentPoints = studentIncidents.reduce((sum, i) => sum + (i.points_deducted || 0), 0);
                const meritPoints = studentMerits.reduce((sum, m) => sum + (m.points || 0), 0);
                const netPoints = meritPoints - incidentPoints;

                return (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{student.first_name} {student.last_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.student_id || student.id}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {studentIncidents.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {studentMerits.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        netPoints >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {netPoints >= 0 ? '+' : ''}{netPoints}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => exportStudentReport(student)}
                        disabled={exporting}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Download size={16} />
                        <span>Export</span>
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherReports;
