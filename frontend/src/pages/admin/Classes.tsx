import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, GraduationCap, ChevronRight, Search } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    class_name: '',
    grade_level: '',
    teacher_id: '',
    academic_year: '2024-2025',
  });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleCreate = () => {
    setEditingClass(null);
    setFormData({
      class_name: '',
      grade_level: '',
      teacher_id: '',
      academic_year: '2024-2025',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      grade_level: classItem.grade_level || '',
      teacher_id: classItem.teacher_id || '',
      academic_year: classItem.academic_year || '2024-2025',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.deleteClass(id);
        success('Class deleted successfully');
        fetchClasses();
      } catch (err) {
        console.error('Error deleting class:', err);
        error('Error deleting class');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, formData);
        success('Class updated successfully');
      } else {
        await api.createClass(formData);
        success('Class created successfully');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving class');
    }
  };

  const handleRowClick = (classItem: any) => {
    navigate(`/admin/classes/${classItem.id}`);
  };

  const handleOpenAssignModal = async (classItem: any) => {
    setSelectedClass(classItem);
    setSelectedStudents([]);
    setStudentSearchQuery('');
    
    try {
      const response = await api.getStudents();
      // Filter out students already in this class
      const availableStudents = response.data.filter((s: any) => s.class_id !== classItem.id);
      setStudents(availableStudents);
      setIsAssignModalOpen(true);
    } catch (err) {
      console.error('Error fetching students:', err);
      error('Failed to load students');
    }
  };

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filtered = filteredStudents;
    if (selectedStudents.length === filtered.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filtered.map(s => s.id));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      error('Please select at least one student');
      return;
    }

    setAssigning(true);
    try {
      // Update each student's class_id
      await Promise.all(
        selectedStudents.map(studentId =>
          api.updateStudent(studentId, { class_id: selectedClass.id })
        )
      );
      
      success(`${selectedStudents.length} student(s) assigned successfully`);
      setIsAssignModalOpen(false);
      fetchClasses();
    } catch (err) {
      console.error('Error assigning students:', err);
      error('Failed to assign students');
    } finally {
      setAssigning(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const search = studentSearchQuery.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(search) ||
      s.last_name?.toLowerCase().includes(search) ||
      s.student_id?.toLowerCase().includes(search)
    );
  });

  // Filter classes based on search query
  const filteredClasses = classes.filter((classItem) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      classItem.class_name?.toLowerCase().includes(searchLower) ||
      classItem.grade_level?.toLowerCase().includes(searchLower) ||
      classItem.teacher_name?.toLowerCase().includes(searchLower)
    );
  });

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
          <h1 className="text-4xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-2">Manage all classes and view detailed information</p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={20} className="mr-2" />
          Add Class
        </Button>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search classes by name, grade level, or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Classes</p>
              <p className="text-4xl font-bold mt-2">{classes.length}</p>
              <p className="text-blue-100 text-sm mt-2">Active this year</p>
            </div>
            <GraduationCap size={48} className="text-blue-200 opacity-50" />
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
              <p className="text-green-100 text-sm font-medium">Total Students</p>
              <p className="text-4xl font-bold mt-2">
                {classes.reduce((sum, c) => sum + (Number(c.student_count) || 0), 0)}
              </p>
              <p className="text-green-100 text-sm mt-2">Across all classes</p>
            </div>
            <Users size={48} className="text-green-200 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Average Class Size</p>
              <p className="text-4xl font-bold mt-2">
                {classes.length > 0
                  ? Math.round(classes.reduce((sum, c) => sum + (Number(c.student_count) || 0), 0) / classes.length)
                  : 0}
              </p>
              <p className="text-purple-100 text-sm mt-2">Students per class</p>
            </div>
            <Users size={48} className="text-purple-200 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Classes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Classes</h2>
        
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
            <p>{searchQuery ? 'No classes match your search' : 'No classes found'}</p>
            {!searchQuery && (
              <Button onClick={handleCreate} className="mt-4">
                Create Your First Class
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleRowClick(classItem)}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{classItem.class_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Grade {classItem.grade_level} • {classItem.academic_year}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Teacher</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {classItem.teacher_name || 'Not assigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Students</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {Number(classItem.student_count) || 0}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssignModal(classItem);
                    }}
                    className="w-full px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Users size={16} className="inline mr-1" />
                    Assign Students
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(classItem);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={16} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(classItem.id);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Add Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Class Name"
            value={formData.class_name}
            onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
            required
            className="rounded-xl"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Grade Level"
              value={formData.grade_level}
              onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
              className="rounded-xl"
            />
            <Input
              label="Academic Year"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <Select
            label="Teacher"
            value={formData.teacher_id}
            onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
            options={teachers.map((t) => ({ value: t.id, label: t.name }))}
            className="rounded-xl"
          />
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                Save
              </Button>
            </motion.div>
          </div>
        </form>
      </Modal>

      {/* Assign Students Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Students to ${selectedClass?.class_name || 'Class'}`}
      >
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search students by name or ID..."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              {selectedStudents.length} of {filteredStudents.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Students List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No available students found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleToggleStudent(student.id)}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignStudents}
              disabled={assigning || selectedStudents.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {assigning ? 'Assigning...' : `Assign ${selectedStudents.length} Student(s)`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Classes;



