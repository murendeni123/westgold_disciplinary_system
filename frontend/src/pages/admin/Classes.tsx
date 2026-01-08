import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const Classes: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
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
            Classes
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage all classes in the system</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Add Class
          </Button>
        </motion.div>
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
              <BookOpen className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">All Classes ({classes.length})</h2>
          </div>
        </div>
        <Table columns={columns} data={classes} />
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
    </div>
  );
};

export default Classes;



