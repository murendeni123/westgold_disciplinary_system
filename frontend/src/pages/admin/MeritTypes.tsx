import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Award } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const MeritTypes: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    default_points: '1',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await api.getMeritTypes();
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching merit types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      name: '',
      default_points: '1',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      default_points: String(type.default_points),
      description: type.description || '',
      is_active: type.is_active === 1,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this merit type?')) {
      try {
        await api.deleteMeritType(id);
        success('Merit type deleted successfully');
        fetchTypes();
      } catch (err) {
        console.error('Error deleting merit type:', err);
        error('Error deleting merit type');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        default_points: Number(formData.default_points),
        is_active: formData.is_active ? 1 : 0,
      };

      if (editingType) {
        await api.updateMeritType(editingType.id, data);
        success('Merit type updated successfully');
      } else {
        await api.createMeritType(data);
        success('Merit type created successfully');
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving merit type');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'default_points',
      label: 'Default Points',
      render: (value: number) => <span className="font-semibold text-green-600">{value}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: number) => (
        <span className={value === 1 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
          {value === 1 ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: any, row: any) => (
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => handleEdit(row)} className="rounded-xl">
            <Edit size={16} className="mr-1" />
            Edit
          </Button>
          <Button variant="secondary" onClick={() => handleDelete(row.id)} className="rounded-xl">
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>
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
            Merit Types
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage predefined merit types with default points</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Add Merit Type
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Types</p>
              <p className="text-4xl font-bold mt-2">{types.length}</p>
            </div>
            <Award size={48} className="text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active</p>
              <p className="text-4xl font-bold mt-2">{types.filter(t => t.is_active === 1).length}</p>
            </div>
            <Award size={48} className="text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Avg Points</p>
              <p className="text-4xl font-bold mt-2">
                {types.length > 0 ? Math.round(types.reduce((sum, t) => sum + t.default_points, 0) / types.length) : 0}
              </p>
            </div>
            <Award size={48} className="text-amber-200 opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Types Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <Award className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">All Merit Types</h2>
          </div>
        </div>

        {types.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Award size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No merit types found</p>
            <Button onClick={handleCreate} className="mt-4">
              Create Your First Merit Type
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: 1.02 }}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {type.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Points</span>
                    <span className="text-lg font-bold text-green-600">
                      +{type.default_points}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      type.is_active === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {type.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(type)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
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
        title={editingType ? 'Edit Merit Type' : 'Add Merit Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Academic Excellence, Good Behavior"
            className="rounded-xl"
          />
          <Input
            label="Default Points"
            type="number"
            value={formData.default_points}
            onChange={(e) => setFormData({ ...formData, default_points: e.target.value })}
            min="1"
            max="10"
            required
            className="rounded-xl"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Optional description of this merit type"
            className="rounded-xl"
          />
          <div className="flex items-center p-4 rounded-xl bg-gray-50">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-3 w-4 h-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>
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

export default MeritTypes;


