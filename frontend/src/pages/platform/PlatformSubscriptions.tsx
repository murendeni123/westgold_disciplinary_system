import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, CreditCard, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PlatformSubscriptions: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    max_students: '',
    max_teachers: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.getPlatformPlans();
      setPlans(response.data);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      max_students: '',
      max_teachers: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      max_students: plan.max_students || '',
      max_teachers: plan.max_teachers || '',
      is_active: plan.is_active !== undefined ? plan.is_active : true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        max_students: formData.max_students ? Number(formData.max_students) : null,
        max_teachers: formData.max_teachers ? Number(formData.max_teachers) : null,
        is_active: formData.is_active ? 1 : 0,
      };

      if (editingPlan) {
        await api.updatePlatformPlan(editingPlan.id, data);
      } else {
        await api.createPlatformPlan(data);
      }
      fetchPlans();
      setIsModalOpen(false);
      success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving plan');
    }
  };

  const columns = [
    { key: 'name', label: 'Plan Name' },
    { key: 'price', label: 'Price' },
    { key: 'max_students', label: 'Max Students' },
    { key: 'max_teachers', label: 'Max Teachers' },
    { key: 'is_active', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  const tableData = plans.map((plan) => ({
    ...plan,
    price: `$${plan.price}`,
    max_students: plan.max_students || 'Unlimited',
    max_teachers: plan.max_teachers || 'Unlimited',
    is_active: plan.is_active ? (
      <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-semibold">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
        Inactive
      </span>
    ),
    actions: (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleEdit(plan)}
        className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
        title="Edit"
      >
        <Edit size={16} />
      </motion.button>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Subscription Plans
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage subscription plans for schools</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Create Plan
          </Button>
        </motion.div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full"
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

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingPlan ? 'Edit Plan' : 'Create Plan'}
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Input
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="rounded-xl"
              />
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="rounded-xl"
              />
              <Input
                label="Price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Max Students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                className="rounded-xl"
              />
              <Input
                label="Max Teachers"
                type="number"
                value={formData.max_teachers}
                onChange={(e) => setFormData({ ...formData, max_teachers: e.target.value })}
                className="rounded-xl"
              />
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
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {editingPlan ? 'Update' : 'Create'}
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformSubscriptions;
