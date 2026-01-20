import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  Edit,
  Archive,
  ChevronRight
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { useToast } from '../../hooks/useToast';

interface ClassData {
  id: number;
  class_name: string;
  grade_level: string;
  academic_year: string;
  teacher_id: number;
  teacher_name: string;
  student_count: number;
  is_archived: boolean;
}

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  age?: number;
}

interface ClassStats {
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number;
  attendanceRate: number;
  incidentCount: number;
  meritCount: number;
}

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<ClassStats>({
    totalStudents: 0,
    maleCount: 0,
    femaleCount: 0,
    averageAge: 0,
    attendanceRate: 0,
    incidentCount: 0,
    meritCount: 0,
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('');

  useEffect(() => {
    if (id) {
      fetchClassDetails();
      fetchTeachers();
    }
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const [classResponse, studentsResponse] = await Promise.all([
        api.getClass(Number(id)),
        api.getStudents({ class_id: id })
      ]);

      const classInfo = classResponse.data;
      const studentList = studentsResponse.data || [];

      setClassData(classInfo);
      setStudents(studentList);
      setSelectedTeacherId(classInfo.teacher_id?.toString() || '');

      calculateStats(studentList, classInfo);
    } catch (err) {
      console.error('Error fetching class details:', err);
      error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (studentList: Student[], classInfo: ClassData) => {
    const maleCount = studentList.filter(s => s.gender?.toLowerCase() === 'male').length;
    const femaleCount = studentList.filter(s => s.gender?.toLowerCase() === 'female').length;
    
    const ages = studentList.map(s => {
      if (s.date_of_birth) {
        const birthDate = new Date(s.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
      return 0;
    }).filter(age => age > 0);

    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    let attendanceRate = 0;
    let incidentCount = 0;
    let meritCount = 0;

    try {
      const [attendanceRes, incidentsRes, meritsRes] = await Promise.all([
        api.getAttendance({ class_id: id }).catch(() => ({ data: [] })),
        api.getIncidents({ class_id: id }).catch(() => ({ data: [] })),
        api.getMerits({ class_id: id }).catch(() => ({ data: [] }))
      ]);

      const attendanceRecords = attendanceRes.data || [];
      if (attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter((a: any) => a.status === 'present').length;
        attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);
      }

      incidentCount = (incidentsRes.data || []).length;
      meritCount = (meritsRes.data || []).length;
    } catch (err) {
      console.error('Error fetching stats:', err);
    }

    setStats({
      totalStudents: studentList.length,
      maleCount,
      femaleCount,
      averageAge,
      attendanceRate,
      incidentCount,
      meritCount,
    });
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) {
      error('Please select a teacher');
      return;
    }

    try {
      await api.updateClass(Number(id), { teacher_id: selectedTeacherId });
      success('Teacher assigned successfully');
      setIsTeacherModalOpen(false);
      fetchClassDetails();
    } catch (err) {
      console.error('Error assigning teacher:', err);
      error('Failed to assign teacher');
    }
  };

  const handlePromoteClass = async () => {
    if (!newGradeLevel) {
      error('Please enter the new grade level');
      return;
    }

    try {
      await api.updateClass(Number(id), { grade_level: newGradeLevel });
      success(`Class promoted to ${newGradeLevel} successfully`);
      setIsPromoteModalOpen(false);
      fetchClassDetails();
    } catch (err) {
      console.error('Error promoting class:', err);
      error('Failed to promote class');
    }
  };

  const handleArchiveClass = async () => {
    if (!window.confirm('Are you sure you want to archive this class? It will no longer appear in active class lists.')) {
      return;
    }

    try {
      await api.updateClass(Number(id), { is_archived: true });
      success('Class archived successfully');
      navigate('/admin/classes');
    } catch (err) {
      console.error('Error archiving class:', err);
      error('Failed to archive class');
    }
  };

  const handleUnarchiveClass = async () => {
    try {
      await api.updateClass(Number(id), { is_archived: false });
      success('Class restored successfully');
      fetchClassDetails();
    } catch (err) {
      console.error('Error restoring class:', err);
      error('Failed to restore class');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Class not found</p>
        <Button onClick={() => navigate('/admin/classes')} className="mt-4">
          Back to Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/classes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{classData.class_name}</h1>
            <p className="text-gray-500 mt-1">
              Grade {classData.grade_level} • {classData.academic_year}
              {classData.is_archived && (
                <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                  Archived
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {classData.is_archived ? (
            <Button
              onClick={handleUnarchiveClass}
              variant="secondary"
              className="rounded-lg"
            >
              Restore Class
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsTeacherModalOpen(true)}
                variant="secondary"
                className="rounded-lg"
              >
                <Edit size={18} className="mr-2" />
                Change Teacher
              </Button>
              <Button
                onClick={() => setIsPromoteModalOpen(true)}
                variant="secondary"
                className="rounded-lg"
              >
                <TrendingUp size={18} className="mr-2" />
                Promote Class
              </Button>
              <Button
                onClick={handleArchiveClass}
                variant="secondary"
                className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
              >
                <Archive size={18} className="mr-2" />
                Archive
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Students</p>
              <p className="text-4xl font-bold mt-2">{stats.totalStudents}</p>
              <p className="text-blue-100 text-sm mt-2">
                {stats.maleCount} Male • {stats.femaleCount} Female
              </p>
            </div>
            <Users size={48} className="text-blue-200 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Attendance Rate</p>
              <p className="text-4xl font-bold mt-2">{stats.attendanceRate}%</p>
              <p className="text-green-100 text-sm mt-2">Class average</p>
            </div>
            <UserCheck size={48} className="text-green-200 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Average Age</p>
              <p className="text-4xl font-bold mt-2">{stats.averageAge}</p>
              <p className="text-amber-100 text-sm mt-2">Years old</p>
            </div>
            <Calendar size={48} className="text-amber-200 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Discipline Incidents</p>
              <p className="text-4xl font-bold mt-2">{stats.incidentCount}</p>
              <p className="text-red-100 text-sm mt-2">{stats.meritCount} merits awarded</p>
            </div>
            <AlertCircle size={48} className="text-red-200 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Teacher Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Assigned Teacher</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {classData.teacher_name || 'No teacher assigned'}
            </p>
            <p className="text-sm text-gray-500">Class Teacher</p>
          </div>
          <Button
            onClick={() => setIsTeacherModalOpen(true)}
            variant="secondary"
            className="rounded-lg"
          >
            <Edit size={18} className="mr-2" />
            Change
          </Button>
        </div>
      </motion.div>

      {/* Student List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Students ({students.length})</h2>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No students enrolled in this class</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => {
              const age = student.date_of_birth
                ? new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()
                : null;

              return (
                <motion.div
                  key={student.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/admin/students/${student.id}`)}
                  className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{student.student_id}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {student.gender || 'N/A'}
                        </span>
                        {age && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            {age} years
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Assign Teacher Modal */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title="Assign / Change Teacher"
      >
        <div className="space-y-4">
          <Select
            label="Select Teacher"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            options={teachers.map((t) => ({ value: t.id, label: t.name }))}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsTeacherModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignTeacher}>
              Assign Teacher
            </Button>
          </div>
        </div>
      </Modal>

      {/* Promote Class Modal */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Promote Class to Next Grade"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Grade: {classData.grade_level}
            </label>
            <input
              type="text"
              value={newGradeLevel}
              onChange={(e) => setNewGradeLevel(e.target.value)}
              placeholder="Enter new grade level (e.g., 8)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This will update the grade level for this class. All students will remain in the class.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsPromoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePromoteClass}>
              Promote Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassDetail;
