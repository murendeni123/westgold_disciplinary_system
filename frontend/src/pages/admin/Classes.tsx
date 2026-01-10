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
  BookOpen, 
  Users,
  UserCheck,
  GraduationCap,
  Calendar,
  Search,
  RefreshCw,
  ChevronRight,
  LayoutGrid,
  List,
  X
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const Classes: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [formData, setFormData] = useState({
    class_name: '',
    grade_level: '',
    teacher_id: '',
    academic_year: '2024-2025',
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    let filtered = classes;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.grade_level?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredClasses(filtered);
  }, [searchTerm, classes]);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
      setFilteredClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.getClasses();
      setClasses(response.data);
      setFilteredClasses(response.data);
      success('Classes refreshed');
    } catch (err) {
      console.error('Error refreshing classes:', err);
    } finally {
      setRefreshing(false);
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

  const columns = [
    { key: 'class_name', label: 'Class Name' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'teacher_name', label: 'Teacher' },
    { key: 'student_count', label: 'Students' },
    { key: 'academic_year', label: 'Academic Year' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const classesWithTeachers = classes.filter(c => c.teacher_id).length;
  const classesWithoutTeachers = classes.filter(c => !c.teacher_id).length;
  const avgStudentsPerClass = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Loading classes...</p>
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
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Class Management
              </h1>
            </div>
            <p className="text-gray-500">
              Organize and manage all classes in your school
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
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add Class</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Total Classes', 
            value: classes.length, 
            icon: BookOpen, 
            bgLight: 'bg-purple-50',
            textColor: 'text-purple-600'
          },
          { 
            label: 'Total Students', 
            value: totalStudents, 
            icon: Users, 
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            label: 'With Teachers', 
            value: classesWithTeachers, 
            icon: UserCheck, 
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600'
          },
          { 
            label: 'Avg Students/Class', 
            value: avgStudentsPerClass, 
            icon: GraduationCap, 
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600'
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
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

      {/* Search and View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search classes by name, teacher, or grade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all"
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

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={16} />
              Table
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-purple-600">{filteredClasses.length}</span> of <span className="font-semibold">{classes.length}</span> classes
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <X size={14} />
              Clear search
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {filteredClasses.length > 0 ? (
            viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredClasses.map((classItem, index) => (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    {/* Class Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {classItem.class_name}
                        </h3>
                        {classItem.grade_level && (
                          <span className="text-sm text-gray-500">{classItem.grade_level}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(classItem);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(classItem.id);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center gap-2 mb-4">
                      {classItem.teacher_name ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                            {classItem.teacher_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm text-gray-700">{classItem.teacher_name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserCheck size={14} className="text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-400">No teacher assigned</span>
                        </>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {classItem.student_count || 0} students
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {classItem.academic_year || '2024-2025'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <Table columns={columns} data={filteredClasses} />
              </motion.div>
            )
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <BookOpen size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by adding your first class'}
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white font-medium shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Class
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Stats - Classes without teachers */}
      {classesWithoutTeachers > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {classesWithoutTeachers} class{classesWithoutTeachers > 1 ? 'es' : ''} without assigned teachers
              </p>
              <p className="text-sm text-amber-600">Consider assigning teachers to improve class management</p>
            </div>
            <button
              onClick={() => navigate('/admin/teachers')}
              className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              Manage Teachers
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

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
    </div>
  );
};

export default Classes;



