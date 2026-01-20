import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, UserCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const Teachers: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    employee_id: '',
    phone: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTeacher(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      employee_id: '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      email: teacher.email,
      password: '',
      name: teacher.name,
      employee_id: teacher.employee_id,
      phone: teacher.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await api.deleteTeacher(id);
        success('Teacher deleted successfully');
        fetchTeachers();
      } catch (err) {
        console.error('Error deleting teacher:', err);
        error('Error deleting teacher');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, formData);
        success('Teacher updated successfully');
      } else {
        await api.createTeacher(formData);
        success('Teacher created successfully');
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving teacher');
    }
  };

  const columns = [
    {
      key: 'photo_path',
      label: 'Photo',
      render: (value: string) => (
        value ? (
          <img
            src={value.startsWith('http') ? value : `http://localhost:5000${value}`}
            alt="Teacher"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        )
      ),
    },
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'class_count', label: 'Classes' },
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
            Teachers
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage all teachers in the system</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Add Teacher
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Teachers</p>
              <p className="text-4xl font-bold mt-2">{teachers.length}</p>
            </div>
            <UserCheck size={48} className="text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Classes</p>
              <p className="text-4xl font-bold mt-2">
                {teachers.reduce((sum, t) => sum + (t.class_count || 0), 0)}
              </p>
            </div>
            <UserCheck size={48} className="text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Avg Classes</p>
              <p className="text-4xl font-bold mt-2">
                {teachers.length > 0 
                  ? (teachers.reduce((sum, t) => sum + (t.class_count || 0), 0) / teachers.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <UserCheck size={48} className="text-amber-200 opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Teachers Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500">
              <UserCheck className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">All Teachers</h2>
          </div>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No teachers found</p>
            <Button onClick={handleCreate} className="mt-4">
              Add Your First Teacher
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white"
              >
                <div className="flex items-start space-x-4 mb-4">
                  {teacher.photo_path ? (
                    <img
                      src={teacher.photo_path.startsWith('http') ? teacher.photo_path : `http://localhost:5000${teacher.photo_path}`}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                      {teacher.name?.charAt(0) || 'T'}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {teacher.employee_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-semibold text-gray-900 truncate ml-2">
                      {teacher.email}
                    </span>
                  </div>

                  {teacher.phone && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Phone</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {teacher.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Classes</span>
                    <span className="text-lg font-bold text-blue-600">
                      {teacher.class_count || 0}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(teacher);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(teacher.id);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="rounded-xl"
            />
            <Input
              label="Employee ID"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              required
              disabled={!!editingTeacher}
              className="rounded-xl"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingTeacher}
            className="rounded-xl"
          />
          <Input
            label={editingTeacher ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingTeacher}
            className="rounded-xl"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

export default Teachers;

