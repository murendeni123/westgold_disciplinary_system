import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { Save, Calendar, Clock, Users } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl } from '../../utils/photoUrl';

const PeriodAttendance: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('');
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchClassStudents = async () => {
    try {
      const response = await api.getClass(Number(selectedClass));
      setStudents(response.data.students || []);
      const initialAttendance: Record<number, string> = {};
      response.data.students?.forEach((s: any) => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
      updateSummary(initialAttendance, response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const updateSummary = (att: Record<number, string>, studs: any[]) => {
    const total = studs.length;
    const present = Object.values(att).filter(s => s === 'present').length;
    const absent = Object.values(att).filter(s => s === 'absent').length;
    const late = Object.values(att).filter(s => s === 'late').length;
    const excused = Object.values(att).filter(s => s === 'excused').length;
    setSummary({ total, present, absent, late, excused });
  };

  const handleSave = async () => {
    if (!period) {
      error('Please select a period');
      return;
    }

    setLoading(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
        period,
        notes: '',
      }));

      await api.createBulkAttendance({
        class_id: selectedClass,
        attendance_date: attendanceDate,
        records,
      });

      success('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      error('Error saving attendance');
    } finally {
      setLoading(false);
    }
  };

  const statCards = summary ? [
    { title: 'Total', value: summary.total, color: 'from-blue-500 to-cyan-500', icon: Users },
    { title: 'Present', value: summary.present, color: 'from-green-500 to-emerald-500', icon: Calendar },
    { title: 'Absent', value: summary.absent, color: 'from-red-500 to-pink-500', icon: Calendar },
    { title: 'Late', value: summary.late, color: 'from-yellow-500 to-amber-500', icon: Clock },
    { title: 'Excused', value: summary.excused, color: 'from-purple-500 to-indigo-500', icon: Calendar },
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
          Period Attendance
        </h1>
        <p className="text-text-muted mt-2 text-lg">Take attendance for a specific period</p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card-bg backdrop-blur-xl shadow-card border border-border-line p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main">Attendance Form</h2>
          <Clock className="text-accent-green" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: c.class_name }))}
            className="rounded-xl"
          />
          <Input
            label="Date"
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="rounded-xl"
          />
          <Input
            label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g., Period 1, Math"
            className="rounded-xl"
          />
        </div>

        {/* Summary Stats */}
        {summary && selectedClass && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon size={20} />
                    <p className="text-sm font-medium opacity-90">{stat.title}</p>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {selectedClass && students.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border border-accent-green/30 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {student.photo_path ? (
                      <img
                        src={getPhotoUrl(student.photo_path) || ''}
                        alt="Student"
                        className="w-12 h-12 rounded-full object-cover border-2 border-accent-green shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-green/20 to-accent-cyan/20 border-2 border-accent-green/50 flex items-center justify-center">
                        <Users className="text-accent-green" size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-text-main">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-text-muted">{student.student_id}</p>
                    </div>
                  </div>
                  <select
                    value={attendance[student.id] || 'present'}
                    onChange={(e) => {
                      const newAttendance = { ...attendance, [student.id]: e.target.value };
                      setAttendance(newAttendance);
                      updateSummary(newAttendance, students);
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-border-line focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green bg-card-bg text-text-main font-medium transition-all"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </motion.div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-accent-green to-accent-cyan hover:from-accent-green/90 hover:to-accent-cyan/90 text-card-bg border-0 shadow-primary hover:shadow-xl"
              >
                <Save size={20} className="mr-2" />
                {loading ? 'Saving...' : 'Save Attendance'}
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PeriodAttendance;

