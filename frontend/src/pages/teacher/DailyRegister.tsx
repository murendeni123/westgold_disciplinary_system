import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { Save, CheckCircle, Calendar, Users } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const DailyRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
      fetchExistingAttendance();
    }
  }, [selectedClass, attendanceDate]);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    try {
      const response = await api.getClass(Number(selectedClass));
      setStudents(response.data.students || []);
      // Initialize all as present
      const initialAttendance: Record<number, string> = {};
      response.data.students?.forEach((s: any) => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await api.getAttendance({
        class_id: selectedClass,
        date: attendanceDate,
      });
      const existing: Record<number, string> = {};
      response.data.forEach((att: any) => {
        existing[att.student_id] = att.status;
      });
      setAttendance((prev) => ({ ...prev, ...existing }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handlePresentAll = () => {
    const allPresent: Record<number, string> = {};
    students.forEach((s) => {
      allPresent[s.id] = 'present';
    });
    setAttendance(allPresent);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
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

  if (initialLoading) {
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
          Daily Register
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Take attendance for your class</p>
      </motion.div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Attendance Form</h2>
          <Calendar className="text-emerald-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <div className="flex items-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button
                variant="secondary"
                onClick={handlePresentAll}
                className="w-full rounded-xl"
              >
                <CheckCircle size={20} className="mr-2" />
                Mark All Present
              </Button>
            </motion.div>
          </div>
        </div>

        {selectedClass && students.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {student.photo_path ? (
                      <img
                        src={(() => {
                          const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                            ? 'http://192.168.18.160:5000'
                            : 'http://localhost:5000';
                          return student.photo_path.startsWith('http') ? student.photo_path : `${baseUrl}${student.photo_path}`;
                        })()}
                        alt="Student"
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-200 to-teal-200 border-2 border-emerald-300 flex items-center justify-center">
                        <Users className="text-emerald-600" size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{student.student_id}</p>
                    </div>
                  </div>
                  <select
                    value={attendance[student.id] || 'present'}
                    onChange={(e) =>
                      setAttendance({ ...attendance, [student.id]: e.target.value })
                    }
                    className="px-4 py-2 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium transition-all"
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
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl"
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

export default DailyRegister;

