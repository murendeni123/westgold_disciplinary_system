import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const IncidentTypes: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    default_points: '0',
    default_severity: 'low',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await api.getIncidentTypes();
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching incident types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      name: '',
      default_points: '0',
      default_severity: 'low',
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
      default_severity: type.default_severity,
      description: type.description || '',
      is_active: type.is_active === 1,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this incident type?')) {
      try {
        await api.deleteIncidentType(id);
        success('Incident type deleted successfully');
        fetchTypes();
      } catch (err) {
        console.error('Error deleting incident type:', err);
        error('Error deleting incident type');
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
        await api.updateIncidentType(editingType.id, data);
        success('Incident type updated successfully');
      } else {
        await api.createIncidentType(data);
        success('Incident type created successfully');
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving incident type');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'default_points',
      label: 'Default Points',
      render: (value: number) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'default_severity',
      label: 'Default Severity',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'high'
              ? 'bg-red-100 text-red-800'
              : value === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
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
          className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full"
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Incident Types
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Define and manage incident categories</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Add Incident Type
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
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Types</p>
              <p className="text-4xl font-bold mt-2">{types.length}</p>
            </div>
            <AlertTriangle size={48} className="text-red-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active</p>
              <p className="text-4xl font-bold mt-2">{types.filter(t => t.is_active === 1).length}</p>
            </div>
            <AlertTriangle size={48} className="text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Avg Points</p>
              <p className="text-4xl font-bold mt-2">
                {types.length > 0 ? Math.round(types.reduce((sum, t) => sum + t.default_points, 0) / types.length) : 0}
              </p>
            </div>
            <AlertTriangle size={48} className="text-orange-200 opacity-50" />
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
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">All Incident Types</h2>
          </div>
        </div>

        {types.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No incident types found</p>
            <Button onClick={handleCreate} className="mt-4">
              Create Your First Incident Type
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
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:shadow-lg transition-all bg-white"
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
                    <span className="text-lg font-bold text-red-600">
                      {type.default_points}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Severity</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        type.default_severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : type.default_severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {type.default_severity.toUpperCase()}
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
        title={editingType ? 'Edit Incident Type' : 'Add Incident Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Late to Class, Disruptive Behavior"
            className="rounded-xl"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Points"
              type="number"
              value={formData.default_points}
              onChange={(e) => setFormData({ ...formData, default_points: e.target.value })}
              min="0"
              required
              className="rounded-xl"
            />
            <Select
              label="Default Severity"
              value={formData.default_severity}
              onChange={(e) => setFormData({ ...formData, default_severity: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              required
              className="rounded-xl"
            />
          </div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Optional description of this incident type"
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

export default IncidentTypes;


