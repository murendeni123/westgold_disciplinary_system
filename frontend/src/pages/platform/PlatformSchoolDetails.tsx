import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { ArrowLeft, Save, Palette, Edit, Trash2, Power, Building2, Users, GraduationCap, CreditCard } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PlatformSchoolDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [school, setSchool] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    status: 'active',
  });

  useEffect(() => {
    if (id) {
      fetchSchool();
      fetchPlans();
    }
  }, [id]);

  const fetchSchool = async () => {
    try {
      const response = await api.getPlatformSchool(Number(id));
      setSchool(response.data);
      setEditFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        status: response.data.status || 'active',
      });
      if (response.data.subscription) {
        setSelectedPlanId(String(response.data.subscription.plan_id));
      }
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching school');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.getPlatformPlans();
      setPlans(response.data);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching plans');
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedPlanId) {
      error('Please select a plan');
      return;
    }
    setSaving(true);
    try {
      await api.updateSchoolSubscription(Number(id), {
        plan_id: Number(selectedPlanId),
        status: 'active',
      });
      success('Subscription updated successfully');
      fetchSchool();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePlatformSchool(Number(id), editFormData);
      success('School updated successfully');
      setIsEditModalOpen(false);
      fetchSchool();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating school');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deletePlatformSchool(Number(id));
      success('School deleted successfully');
      navigate('/platform/schools');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting school');
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    setSaving(true);
    try {
      await api.updatePlatformSchool(Number(id), { status: newStatus });
      success(`School ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchSchool();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating school status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (!school) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-xl text-gray-600">School not found</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/platform/schools')}
              className="rounded-xl"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {school.name}
            </h1>
            <p className="text-gray-600 mt-2 text-lg">School Details & Management</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={handleToggleStatus}
              disabled={saving}
              className={`rounded-xl ${
                school.status === 'active'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                  : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0'
              }`}
            >
              <Power size={20} className="mr-2" />
              {school.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={handleEdit}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
            >
              <Edit size={20} className="mr-2" />
              Edit
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
            >
              <Trash2 size={20} className="mr-2" />
              Delete
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={() => navigate(`/platform/schools/${id}/customizations`)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
            >
              <Palette size={20} className="mr-2" />
              Customize
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <Building2 className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">School Information</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
              <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
              <p className="text-lg font-semibold text-gray-900">{school.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
              <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-gray-900">{school.email}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
              <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
              <span
                className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${
                  school.status === 'active'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {school.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-orange-600" size={20} />
                  <p className="text-sm font-medium text-gray-600">Users</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{school.user_count || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50">
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="text-teal-600" size={20} />
                  <p className="text-sm font-medium text-gray-600">Students</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{school.student_count || 0}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-1">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(school.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <CreditCard className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Subscription</h3>
          </div>
          <div className="space-y-4">
            {school.subscription ? (
              <>
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                  <p className="text-sm font-medium text-gray-600 mb-1">Current Plan</p>
                  <p className="text-lg font-semibold text-gray-900">{school.subscription.plan_name}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                  <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${
                      school.subscription.status === 'active'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {school.subscription.status}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                  <p className="text-sm font-medium text-gray-600 mb-1">Price</p>
                  <p className="text-2xl font-bold text-gray-900">${school.subscription.price}</p>
                </div>
              </>
            ) : (
              <div className="p-8 text-center rounded-xl bg-gray-50">
                <p className="text-gray-500">No active subscription</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <Select
                label="Change Plan"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                options={[
                  { value: '', label: 'Select a plan' },
                  ...plans.map((plan) => ({
                    value: String(plan.id),
                    label: `${plan.name} - $${plan.price}`,
                  })),
                ]}
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
                <Button
                  onClick={handleUpdateSubscription}
                  disabled={saving || !selectedPlanId}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  <Save size={20} className="mr-2" />
                  {saving ? 'Updating...' : 'Update Subscription'}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit School"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleEditSubmit}
              className="space-y-4"
            >
              <Input
                label="School Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
                className="rounded-xl"
              />
              <Select
                label="Status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <div className="flex justify-end space-x-3 pt-4">
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
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  <Save size={20} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
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
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete School"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p>
                Are you sure you want to delete <strong>{school.name}</strong>? This action cannot be
                undone.
              </p>
              <p className="text-sm text-gray-600">
                Note: Schools with existing users or students cannot be deleted. Please deactivate them
                instead.
              </p>
              <div className="flex justify-end space-x-3 pt-4">
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

export default PlatformSchoolDetails;
