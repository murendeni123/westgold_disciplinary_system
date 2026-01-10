import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Users, 
  Search, 
  Filter, 
  UserCircle2, 
  GraduationCap,
  Upload,
  RefreshCw,
  ChevronRight,
  UserPlus,
  BookOpen,
  Link2,
  X,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const Students: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.getStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
      success('Students refreshed');
    } catch (err) {
      console.error('Error refreshing students:', err);
    } finally {
      setRefreshing(false);
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
      error(err.response?.data?.error || 'Error saving student');
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

  // Calculate stats
  const studentsWithParents = students.filter(s => s.parent_name).length;
  const studentsWithoutClass = students.filter(s => !s.class_id).length;
  const classDistribution = classes.map(c => ({
    ...c,
    count: students.filter(s => s.class_id === c.id).length
  })).sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <ToastContainer />
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Student Management
              </h1>
            </div>
            <p className="text-gray-500">
              Manage and organize all students in your school
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium hidden sm:inline">Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/bulk-import')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Import</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span className="font-medium">Add Student</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Total Students', 
            value: students.length, 
            icon: Users, 
            color: 'bg-blue-500',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            label: 'With Parents Linked', 
            value: studentsWithParents, 
            icon: Link2, 
            color: 'bg-emerald-500',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600'
          },
          { 
            label: 'Without Class', 
            value: studentsWithoutClass, 
            icon: BookOpen, 
            color: 'bg-amber-500',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600',
            warning: studentsWithoutClass > 0
          },
          { 
            label: 'Total Classes', 
            value: classes.length, 
            icon: GraduationCap, 
            color: 'bg-purple-500',
            bgLight: 'bg-purple-50',
            textColor: 'text-purple-600'
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${
                stat.warning ? 'ring-2 ring-amber-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgLight}`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, student ID, or link code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          {/* Class Filter */}
          <div className="w-full lg:w-64">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-blue-600">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> students
          </p>
          {(searchTerm || selectedClass) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {filteredStudents.length > 0 ? (
            viewMode === 'table' ? (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto"
              >
                <Table
                  columns={columns}
                  data={filteredStudents}
                  onRowClick={(row) => navigate(`/admin/students/${row.id}`)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(`/admin/students/${student.id}`)}
                      className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        {student.photo_path ? (
                          <img
                            src={(() => {
                              const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                                ? 'http://192.168.18.160:5000'
                                : 'http://localhost:5000';
                              return student.photo_path.startsWith('http') ? student.photo_path : `${baseUrl}${student.photo_path}`;
                            })()}
                            alt={student.first_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{student.student_id}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                          student.class_name 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {student.class_name || 'No class'}
                        </span>
                        {student.parent_name && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedClass
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first student'}
              </p>
              {!searchTerm && !selectedClass && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-medium shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Your First Student
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Class Distribution - Quick View */}
      {classDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Students by Class</h3>
            <button
              onClick={() => navigate('/admin/classes')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Manage Classes
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {classDistribution.slice(0, 8).map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedClass === cls.id.toString()
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cls.class_name}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  selectedClass === cls.id.toString()
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {cls.count}
                </span>
              </button>
            ))}
            {classDistribution.length > 8 && (
              <span className="px-4 py-2 text-sm text-gray-500">
                +{classDistribution.length - 8} more
              </span>
            )}
          </div>
        </motion.div>
      )}

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

