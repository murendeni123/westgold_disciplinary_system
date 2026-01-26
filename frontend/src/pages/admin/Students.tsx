import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import ModernFilter from '../../components/ModernFilter';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Copy, Users, Search, Filter, UserCircle2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const Students: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    class_id: '',
    grade_level: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and class filter
  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_link_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Class filter
    if (selectedClass) {
      filtered = filtered.filter(student => student.class_id?.toString() === selectedClass);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, selectedClass, students]);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleCreate = () => {
    setEditingStudent(null);
    setFormData({
      student_id: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      class_id: '',
      grade_level: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: student.date_of_birth || '',
      class_id: student.class_id || '',
      grade_level: student.grade_level || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.deleteStudent(id);
        success('Student deleted successfully');
        fetchStudents();
      } catch (err) {
        console.error('Error deleting student:', err);
        error('Error deleting student');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.student_id || !formData.first_name || !formData.last_name) {
      error('Student ID, First Name, and Last Name are required');
      return;
    }
    
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formData);
        success('Student updated successfully');
      } else {
        await api.createStudent(formData);
        success('Student created successfully');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      console.error('Error saving student:', err);
      error(err.response?.data?.error || 'Error saving student. Please check all fields and try again.');
    }
  };

  const handleCopyLinkCode = (code: string) => {
    navigator.clipboard.writeText(code);
    success('Link code copied to clipboard!');
  };

  const columns = [
    {
      key: 'photo_path',
      label: 'PHOTO',
      render: (value: string) => (
        value ? (
          <img
            src={(() => {
              const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                ? 'http://192.168.18.160:5000'
                : 'http://localhost:5000';
              return value.startsWith('http') ? value : `${baseUrl}${value}`;
            })()}
            alt="Student"
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-200 shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-amber-200 shadow-sm">
            <UserCircle2 size={24} className="text-amber-600" />
          </div>
        )
      ),
    },
    { 
      key: 'student_id', 
      label: 'STUDENT ID',
      render: (value: string) => (
        <span className="font-semibold text-gray-900">{value}</span>
      )
    },
    { 
      key: 'first_name', 
      label: 'FIRST NAME',
      render: (value: string) => (
        <span className="text-gray-800">{value}</span>
      )
    },
    { 
      key: 'last_name', 
      label: 'LAST NAME',
      render: (value: string) => (
        <span className="text-gray-800">{value}</span>
      )
    },
    { 
      key: 'class_name', 
      label: 'CLASS',
      render: (value: string) => (
        value ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <GraduationCap size={14} className="mr-1" />
            {value}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">No class</span>
        )
      )
    },
    { 
      key: 'parent_name', 
      label: 'PARENT',
      render: (value: string) => (
        value ? (
          <span className="text-gray-700">{value}</span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      )
    },
    {
      key: 'parent_link_code',
      label: 'LINK CODE',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">{value}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLinkCode(value);
            }}
            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 hover:text-amber-800 transition-colors"
            title="Copy link code"
          >
            <Copy size={16} />
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit student"
          >
            <Edit size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
            title="Delete student"
          >
            <Trash2 size={18} />
          </motion.button>
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
          className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"
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
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Students
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage all students in the system</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Add Student
          </Button>
        </motion.div>
      </motion.div>

      {/* Modern Filters */}
      <ModernFilter
        fields={[
          {
            type: 'search',
            name: 'search',
            label: 'Search',
            placeholder: 'Search by name, student ID, or link code...',
          },
          {
            type: 'select',
            name: 'class',
            label: 'Class',
            placeholder: 'All Classes',
            options: classes.map((c) => ({
              value: c.id.toString(),
              label: c.class_name,
            })),
          },
        ]}
        values={{
          search: searchTerm,
          class: selectedClass,
        }}
        onChange={(name, value) => {
          if (name === 'search') setSearchTerm(value);
          if (name === 'class') setSelectedClass(value);
        }}
        onClear={() => {
          setSearchTerm('');
          setSelectedClass('');
        }}
      />
      
      {/* Results Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-gray-600"
      >
        Showing <span className="font-semibold text-amber-600">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> students
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">All Students ({filteredStudents.length})</h2>
          </div>
        </div>
        <div className="p-6">
          <AnimatePresence mode="wait">
            {filteredStudents.length > 0 ? (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Table
                  columns={columns}
                  data={filteredStudents}
                  onRowClick={(row) => navigate(`/admin/students/${row.id}`)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Users size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedClass
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first student'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student ID"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
              disabled={!!editingStudent}
              className="rounded-xl"
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="rounded-xl"
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="rounded-xl"
            />
          </div>
          <Select
            label="Class"
            value={formData.class_id}
            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            className="rounded-xl"
          >
            <option value="">No class assigned</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name} {c.teacher_name ? `(${c.teacher_name})` : ''}
              </option>
            ))}
          </Select>
          <Input
            label="Grade Level"
            value={formData.grade_level}
            onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
            placeholder="e.g., Grade 1, Grade 2, etc."
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
    </div>
  );
};

export default Students;

