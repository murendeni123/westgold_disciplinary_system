import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from './Button';
import Modal from './Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Star,
  StarOff,
  Mail,
  User,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Admin {
  id: number;
  name: string;
  email: string;
  is_primary: boolean;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

interface SchoolAdminManagementProps {
  schoolId: number;
  schoolName: string;
}

const SchoolAdminManagement: React.FC<SchoolAdminManagementProps> = ({ schoolId, schoolName }) => {
  const { success, error, ToastContainer } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchAdmins();
  }, [schoolId]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.getSchoolAdmins(schoolId);
      setAdmins(response.data.admins || []);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', email: '', password: '' });
    setIsAddModalOpen(true);
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({ name: admin.name, email: admin.email, password: '' });
    setIsEditModalOpen(true);
  };

  const handleDelete = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleResetPassword = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsResetPasswordModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createSchoolAdmin(schoolId, formData);
      success('Admin added successfully. Welcome email sent.');
      setIsAddModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error adding admin');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await api.updateSchoolAdmin(schoolId, selectedAdmin.id, updateData);
      success('Admin updated successfully');
      setIsEditModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating admin');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedAdmin) return;

    try {
      await api.deleteSchoolAdmin(schoolId, selectedAdmin.id);
      success('Admin deleted successfully');
      setIsDeleteModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting admin');
      setIsDeleteModalOpen(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!selectedAdmin) return;

    try {
      await api.resetAdminPassword(schoolId, selectedAdmin.id);
      success('Password reset email sent successfully');
      setIsResetPasswordModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error resetting password');
      setIsResetPasswordModalOpen(false);
    }
  };

  const handleSetPrimary = async (adminId: number) => {
    try {
      await api.setPrimaryAdmin(schoolId, adminId);
      success('Primary admin updated');
      fetchAdmins();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error setting primary admin');
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">School Administrators</h3>
            <p className="text-sm text-gray-600">Manage admin access for {schoolName}</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={18} className="mr-2" />
            Add Admin
          </Button>
        </motion.div>
      </div>

      {/* Admins List */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
        </div>
      ) : admins.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-xl border border-gray-100 p-8 text-center">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No administrators yet</h3>
          <p className="text-gray-500 mb-4">Add the first administrator for this school</p>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0"
          >
            <Plus size={18} className="mr-2" />
            Add Admin
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.map((admin, index) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"
            >
              {/* Header */}
              <div className={`p-4 ${admin.is_primary ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${admin.is_primary ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-indigo-100'}`}>
                      <User className={admin.is_primary ? 'text-white' : 'text-indigo-600'} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{admin.name}</h4>
                        {admin.is_primary && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    admin.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {admin.is_active ? (
                      <>
                        <CheckCircle size={10} />
                        Active
                      </>
                    ) : (
                      'Inactive'
                    )}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Last Login</p>
                    <p className="font-medium text-gray-900">
                      {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {!admin.is_primary && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSetPrimary(admin.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium"
                      title="Set as Primary"
                    >
                      <Star size={14} />
                      Set Primary
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEdit(admin)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-sm font-medium"
                  >
                    <Edit size={14} />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleResetPassword(admin)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Key size={14} />
                    Reset
                  </motion.button>
                  {!admin.is_primary && admins.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDelete(admin)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Add Administrator"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddSubmit}
              className="space-y-6"
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Welcome Email</p>
                    <p className="text-xs text-blue-700 mt-1">
                      A welcome email with login instructions will be sent to the admin's email address.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="admin@school.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Admin will be prompted to change password on first login</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {saving ? 'Adding...' : 'Add Administrator'}
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedAdmin && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Administrator"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleEditSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedAdmin && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete Administrator"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-red-800 font-medium">
                      Are you sure you want to delete this administrator?
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      This action cannot be undone. The admin will lose access immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>Name:</strong> {selectedAdmin.name}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Email:</strong> {selectedAdmin.email}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Delete Administrator
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Reset Password Confirmation Modal */}
      <AnimatePresence>
        {isResetPasswordModalOpen && selectedAdmin && (
          <Modal
            isOpen={isResetPasswordModalOpen}
            onClose={() => setIsResetPasswordModalOpen(false)}
            title="Reset Password"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Send password reset email?
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      An email with password reset instructions will be sent to {selectedAdmin.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>Admin:</strong> {selectedAdmin.name}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmResetPassword}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Send Reset Email
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchoolAdminManagement;
