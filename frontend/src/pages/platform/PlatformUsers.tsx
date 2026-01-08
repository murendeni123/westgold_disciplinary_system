import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Power, Shield, Users } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PlatformUsers: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getPlatformUsers();
      setUsers(response.data);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      is_active: user.is_active !== undefined ? user.is_active : true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user: any) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updatePlatformUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          is_active: formData.is_active,
        });
        success('User updated successfully');
      } else {
        if (!formData.password) {
          error('Password is required for new users');
          return;
        }
        await api.createPlatformUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving user');
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await api.deletePlatformUser(deletingUser.id);
      success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting user');
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await api.updatePlatformUser(user.id, { is_active: !user.is_active });
      success(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating user status');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'is_active', label: 'Status' },
    { key: 'created_at', label: 'Created' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'actions', label: 'Actions' },
  ];

  const tableData = users.map((user) => ({
    ...user,
    is_active: user.is_active ? (
      <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-semibold">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
        Inactive
      </span>
    ),
    created_at: new Date(user.created_at).toLocaleDateString(),
    last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
    actions: (
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleEdit(user)}
          className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
          title="Edit"
        >
          <Edit size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleToggleStatus(user)}
          className={`p-2 rounded-lg text-white hover:shadow-lg transition-all ${
            user.is_active
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-gray-500 to-slate-500'
          }`}
          title={user.is_active ? 'Deactivate' : 'Activate'}
        >
          <Power size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleDelete(user)}
          className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    ),
  }));

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Platform Users
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage platform administrator accounts</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Create User
          </Button>
        </motion.div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
        >
          <Table columns={columns} data={tableData} />
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingUser ? 'Edit User' : 'Create User'}
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="rounded-xl"
              />
              {!editingUser && (
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="rounded-xl"
                />
              )}
              {editingUser && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDeletingUser(null);
            }}
            title="Delete User"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p>
                Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingUser(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformUsers;
