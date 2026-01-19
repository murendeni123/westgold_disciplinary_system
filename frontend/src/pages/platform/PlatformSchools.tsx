import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Search, Plus, Edit, Trash2, Power, Download, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const PlatformSchools: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchools, setSelectedSchools] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [deletingSchool, setDeletingSchool] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchSchools();
  }, [filters]);

  const fetchSchools = async () => {
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.getPlatformSchools(params);
      setSchools(response.data);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching schools');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      email: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (school: any) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      email: school.email || '',
      status: school.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (school: any) => {
    setDeletingSchool(school);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchool) {
        await api.updatePlatformSchool(editingSchool.id, formData);
        success('School updated successfully');
      } else {
        await api.createPlatformSchool(formData);
        success('School created successfully');
      }
      setIsModalOpen(false);
      fetchSchools();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving school');
    }
  };

  const confirmDelete = async () => {
    if (!deletingSchool) return;
    try {
      await api.deletePlatformSchool(deletingSchool.id);
      success('School deleted successfully');
      setIsDeleteModalOpen(false);
      setDeletingSchool(null);
      fetchSchools();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting school');
    }
  };

  const handleToggleStatus = async (school: any) => {
    try {
      const newStatus = school.status === 'active' ? 'inactive' : 'active';
      await api.updatePlatformSchool(school.id, { status: newStatus });
      success(`School ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchSchools();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating school status');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedSchools.length === 0) {
      error('Please select at least one school');
      return;
    }
    try {
      await api.bulkUpdateSchoolStatus(selectedSchools, status);
      success(`Updated ${selectedSchools.length} schools to ${status}`);
      setSelectedSchools([]);
      fetchSchools();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating schools');
    }
  };

  const handleExport = () => {
    const csv = [
      ['School Name', 'Email', 'Status', 'Users', 'Students', 'Created'],
      ...schools.map((s) => [
        s.name,
        s.email,
        s.status,
        s.user_count || 0,
        s.student_count || 0,
        new Date(s.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schools_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Schools exported successfully');
  };

  const toggleSchoolSelection = (schoolId: number) => {
    setSelectedSchools((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSchools.length === schools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(schools.map((s) => s.id));
    }
  };

  const columns = [
    { key: 'select', label: '' },
    { key: 'name', label: 'School Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'user_count', label: 'Users' },
    { key: 'student_count', label: 'Students' },
    { key: 'created_at', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ];

  const tableData = schools.map((school) => ({
    ...school,
    select: (
      <input
        type="checkbox"
        checked={selectedSchools.includes(school.id)}
        onChange={() => toggleSchoolSelection(school.id)}
        className="rounded"
      />
    ),
    status: (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          school.status === 'active'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {school.status}
      </span>
    ),
    created_at: new Date(school.created_at).toLocaleDateString(),
    actions: (
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/platform/schools/${school.id}`);
          }}
          className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all"
          title="View Details"
        >
          <Eye size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(school);
          }}
          className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
          title="Edit"
        >
          <Edit size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(school);
          }}
          className={`p-2 rounded-lg text-white hover:shadow-lg transition-all ${
            school.status === 'active'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-gray-500 to-slate-500'
          }`}
          title={school.status === 'active' ? 'Deactivate' : 'Activate'}
        >
          <Power size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(school);
          }}
          className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Schools Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage all schools on the platform</p>
        </div>
        <div className="flex space-x-3">
          {selectedSchools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex space-x-2"
            >
              <Button
                variant="secondary"
                onClick={() => handleBulkStatusUpdate('active')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl"
              >
                <Power size={20} className="mr-2" />
                Activate Selected
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleBulkStatusUpdate('inactive')}
                className="bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg hover:shadow-xl"
              >
                <Power size={20} className="mr-2" />
                Deactivate Selected
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              onClick={handleExport}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-xl"
            >
              <Download size={20} className="mr-2" />
              Export
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="mr-2" />
              Create School
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search schools..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <Input
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="rounded-xl"
          />
        </div>
        {schools.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-4"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleSelectAll}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
            >
              <CheckSquare size={16} className="mr-2" />
              {selectedSchools.length === schools.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedSchools.length > 0 && (
              <span className="text-sm font-semibold text-gray-700 bg-purple-50 px-4 py-2 rounded-lg">
                {selectedSchools.length} school(s) selected
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
            title={editingSchool ? 'Edit School' : 'Create School'}
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Input
                label="School Name"
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
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
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
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {editingSchool ? 'Update' : 'Create'}
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
              setDeletingSchool(null);
            }}
            title="Delete School"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p>
                Are you sure you want to delete <strong>{deletingSchool?.name}</strong>? This action
                cannot be undone.
              </p>
              <p className="text-sm text-gray-600">
                Note: Schools with existing users or students cannot be deleted. Please deactivate
                them instead.
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingSchool(null);
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

export default PlatformSchools;
