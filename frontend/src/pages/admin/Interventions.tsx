import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import AssignInterventionModal from '../../components/AssignInterventionModal';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const Interventions: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_duration: '',
  });

  useEffect(() => {
    fetchInterventions();
    fetchTypes();
  }, []);

  const fetchInterventions = async () => {
    try {
      const response = await api.getInterventions();
      setInterventions(response.data);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.getInterventionTypes();
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const handleCreate = () => {
    setEditingIntervention(null);
    setFormData({
      name: '',
      description: '',
      default_duration: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (intervention: any) => {
    setEditingIntervention(intervention);
    setFormData({
      name: intervention.name || '',
      description: intervention.description || '',
      default_duration: intervention.default_duration || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIntervention) {
        await api.updateIntervention(editingIntervention.id, formData);
      } else {
        await api.createInterventionType(formData);
      }
      success(editingIntervention ? 'Intervention type updated successfully' : 'Intervention type created successfully');
      fetchInterventions();
      fetchTypes();
      setIsModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving intervention type');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this intervention?')) return;
    try {
      await api.deleteIntervention(id);
      success('Intervention deleted successfully');
      fetchInterventions();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting intervention');
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'type', label: 'Type' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_by_name', label: 'Assigned By' },
  ];

  const tableData = interventions.map((intervention) => ({
    ...intervention,
    actions: (
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/admin/interventions/${intervention.id}`)}
        >
          <Eye size={16} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleEdit(intervention)}
        >
          <Edit size={16} />
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDelete(intervention.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    ),
  }));

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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Interventions
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage intervention types and assignments</p>
        </div>
        <div className="flex space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={() => setIsAssignModalOpen(true)}
              className="rounded-xl"
            >
              <Plus size={20} className="mr-2" />
              Assign Intervention
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="mr-2" />
              Create Type
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Intervention Records ({interventions.length})</h2>
          <Sparkles className="text-amber-600" size={24} />
        </div>
        <Table columns={columns} data={tableData} />
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIntervention ? 'Edit Intervention Type' : 'Create Intervention Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
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
            label="Default Duration (minutes)"
            type="number"
            value={formData.default_duration}
            onChange={(e) => setFormData({ ...formData, default_duration: e.target.value })}
            className="rounded-xl"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                {editingIntervention ? 'Update' : 'Create'}
              </Button>
            </motion.div>
          </div>
        </form>
      </Modal>

      <AssignInterventionModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          fetchInterventions();
          setIsAssignModalOpen(false);
        }}
      />
    </div>
  );
};

export default Interventions;

