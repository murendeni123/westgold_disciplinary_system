import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  Download, 
  Building2, 
  Sparkles,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Filter,
  School,
  MapPin,
  Mail,
  Phone,
  MoreHorizontal,
  ChevronDown,
  Zap,
  Crown,
  Star
} from 'lucide-react';
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
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [deletingSchool, setDeletingSchool] = useState<any>(null);
  const [suspendingSchool, setSuspendingSchool] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    plan: '',
  });

  useEffect(() => {
    fetchSchools();
  }, [filters]);

  const fetchSchools = async () => {
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      console.log('Fetching schools with params:', params);
      const response = await api.getPlatformSchools(params);
      console.log('Schools response:', response.data);
      setSchools(response.data || []);
    } catch (err: any) {
      console.error('Error fetching schools:', err);
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

  const handleSuspend = (school: any) => {
    setSuspendingSchool(school);
    setIsSuspendModalOpen(true);
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

  const confirmSuspend = async () => {
    if (!suspendingSchool) return;
    try {
      const newStatus = suspendingSchool.status === 'active' ? 'suspended' : 'active';
      await api.updatePlatformSchool(suspendingSchool.id, { status: newStatus });
      success(`School ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      setIsSuspendModalOpen(false);
      setSuspendingSchool(null);
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
    const dataToExport = selectedSchools.length > 0 
      ? schools.filter(s => selectedSchools.includes(s.id))
      : schools;
    
    const csv = [
      ['School Name', 'Email', 'Status', 'Plan', 'Users', 'Students', 'Created'],
      ...dataToExport.map((s) => [
        s.name,
        s.email,
        s.status,
        s.plan || 'Trial',
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
    success(`Exported ${dataToExport.length} schools successfully`);
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

  // Get school initials for avatar
  const getSchoolInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background color based on school name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-green-500',
      'from-pink-500 to-rose-500',
      'from-amber-500 to-orange-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get status badge config
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          iconColor: 'text-green-500',
          label: 'Active'
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          iconColor: 'text-amber-500',
          label: 'Suspended'
        };
      case 'inactive':
        return {
          icon: XCircle,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          iconColor: 'text-gray-500',
          label: 'Inactive'
        };
      case 'trial':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          iconColor: 'text-blue-500',
          label: 'Trial'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          iconColor: 'text-gray-500',
          label: status
        };
    }
  };

  // Get plan badge config
  const getPlanBadge = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'pro':
        return {
          icon: Crown,
          color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
          label: 'Pro'
        };
      case 'starter':
        return {
          icon: Zap,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
          label: 'Starter'
        };
      case 'enterprise':
        return {
          icon: Building2,
          color: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
          label: 'Enterprise'
        };
      default:
        return {
          icon: Star,
          color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
          label: 'Trial'
        };
    }
  };

  // Filter schools based on search
  const filteredSchools = schools.filter(school => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        school.name?.toLowerCase().includes(searchLower) ||
        school.email?.toLowerCase().includes(searchLower) ||
        school.school_code?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Schools Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage all {schools.length} schools on the platform
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => navigate('/platform/schools/onboard')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl px-6"
            >
              <Sparkles size={20} className="mr-2" />
              Onboard School
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleCreate}
              variant="secondary"
              className="shadow-md hover:shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              Quick Add
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Search and Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search schools by name, email, or code..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-700 placeholder-gray-400"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-700 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedSchools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CheckCircle size={16} className="text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-700">
                    {selectedSchools.length} school{selectedSchools.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleBulkStatusUpdate('active')}
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Activate
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleBulkStatusUpdate('suspended')}
                    className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    Suspend
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleExport}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <Download size={16} className="mr-2" />
                    Export Selected
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedSchools([])}
                    className="text-gray-600"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Schools Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
          />
        </div>
      ) : filteredSchools.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <School size={40} className="text-purple-500" />
          </div>
          {filters.search || filters.status ? (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No schools match your filter</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <Button
                variant="secondary"
                onClick={() => setFilters({ status: '', search: '', plan: '' })}
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Onboard your first school</h3>
              <p className="text-gray-500 mb-6">Get started by adding a school to the platform</p>
              <Button
                onClick={() => navigate('/platform/schools/onboard')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
              >
                <Sparkles size={20} className="mr-2" />
                Onboard School
              </Button>
            </>
          )}
        </motion.div>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-3 px-2">
            <input
              type="checkbox"
              checked={selectedSchools.length === filteredSchools.length && filteredSchools.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-600">
              {selectedSchools.length === filteredSchools.length ? 'Deselect all' : 'Select all'}
            </span>
          </div>

          {/* Schools List */}
          <div className="space-y-4">
            {filteredSchools.map((school, index) => {
              const statusBadge = getStatusBadge(school.status);
              const planBadge = getPlanBadge(school.plan);
              const StatusIcon = statusBadge.icon;
              const PlanIcon = planBadge.icon;
              const isSelected = selectedSchools.includes(school.id);

              return (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl bg-white shadow-lg border-2 transition-all hover:shadow-xl ${
                    isSelected ? 'border-purple-400 bg-purple-50/30' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Checkbox + Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSchoolSelection(school.id)}
                          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        
                        {/* School Avatar */}
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getAvatarColor(school.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                          {getSchoolInitials(school.name)}
                        </div>
                        
                        {/* School Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {school.name}
                            </h3>
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                              <StatusIcon size={12} className={statusBadge.iconColor} />
                              {statusBadge.label}
                            </span>
                            {/* Plan Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${planBadge.color}`}>
                              <PlanIcon size={12} />
                              {planBadge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <Mail size={14} />
                              {school.email}
                            </span>
                            {school.school_code && (
                              <span className="flex items-center gap-1.5 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {school.school_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                            <Users size={14} />
                            <span className="text-xs uppercase tracking-wide">Users</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800">{school.user_count || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                            <GraduationCap size={14} />
                            <span className="text-xs uppercase tracking-wide">Students</span>
                          </div>
                          <p className="text-xl font-bold text-gray-800">{school.student_count || 0}</p>
                        </div>
                        <div className="text-center hidden md:block">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                            <Calendar size={14} />
                            <span className="text-xs uppercase tracking-wide">Created</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600">
                            {new Date(school.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 lg:ml-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/platform/schools/${school.id}`)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                        >
                          <Eye size={16} />
                          View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(school)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium"
                        >
                          <Settings size={16} />
                          Manage
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSuspend(school)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium ${
                            school.status === 'active' 
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          <Power size={16} />
                          {school.status === 'active' ? 'Suspend' : 'Activate'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(school)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                        >
                          <Trash2 size={16} />
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title=""
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Modal Header with School Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${editingSchool ? getAvatarColor(editingSchool.name) : 'from-purple-500 to-pink-500'} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {editingSchool ? getSchoolInitials(editingSchool.name) : <Plus size={28} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingSchool ? 'Manage School' : 'Add New School'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {editingSchool ? `Update ${editingSchool.name}'s information` : 'Create a new school on the platform'}
                  </p>
                </div>
              </div>

              {/* School Stats (only for editing) */}
              {editingSchool && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <Users size={20} className="mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{editingSchool.user_count || 0}</p>
                    <p className="text-xs text-blue-600">Users</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl text-center">
                    <GraduationCap size={20} className="mx-auto text-purple-500 mb-1" />
                    <p className="text-2xl font-bold text-purple-700">{editingSchool.student_count || 0}</p>
                    <p className="text-xs text-purple-600">Students</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <Calendar size={20} className="mx-auto text-green-500 mb-1" />
                    <p className="text-sm font-bold text-green-700">
                      {editingSchool.created_at ? new Date(editingSchool.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-green-600">Created</p>
                  </div>
                </div>
              )}

              {/* School Code (only for editing) */}
              {editingSchool?.school_code && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">School Code</p>
                      <p className="text-xl font-mono font-bold text-purple-700">{editingSchool.school_code}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editingSchool.school_code);
                        success('School code copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* School Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 size={14} className="inline mr-2" />
                    School Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter school name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={14} className="inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="contact@school.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'active', label: 'Active', icon: CheckCircle, color: 'green' },
                      { value: 'suspended', label: 'Suspended', icon: AlertTriangle, color: 'amber' },
                      { value: 'inactive', label: 'Inactive', icon: XCircle, color: 'gray' },
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.status === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: option.value })}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            isSelected
                              ? option.color === 'green'
                                ? 'border-green-500 bg-green-50'
                                : option.color === 'amber'
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-gray-500 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon
                            size={20}
                            className={
                              isSelected
                                ? option.color === 'green'
                                  ? 'text-green-500'
                                  : option.color === 'amber'
                                  ? 'text-amber-500'
                                  : 'text-gray-500'
                                : 'text-gray-400'
                            }
                          />
                          <span
                            className={`text-sm font-medium ${
                              isSelected
                                ? option.color === 'green'
                                  ? 'text-green-700'
                                  : option.color === 'amber'
                                  ? 'text-amber-700'
                                  : 'text-gray-700'
                                : 'text-gray-500'
                            }`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                  {editingSchool && (
                    <button
                      type="button"
                      onClick={() => navigate(`/platform/schools/${editingSchool.id}`)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <Eye size={16} />
                      View Full Details
                    </button>
                  )}
                  <div className={`flex gap-3 ${!editingSchool ? 'ml-auto' : ''}`}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-xl px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl px-6"
                    >
                      {editingSchool ? 'Save Changes' : 'Create School'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Suspend Confirmation Modal */}
      <AnimatePresence>
        {isSuspendModalOpen && (
          <Modal
            isOpen={isSuspendModalOpen}
            onClose={() => {
              setIsSuspendModalOpen(false);
              setSuspendingSchool(null);
            }}
            title={suspendingSchool?.status === 'active' ? 'Suspend School' : 'Activate School'}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-4 rounded-xl ${suspendingSchool?.status === 'active' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-start gap-3">
                  {suspendingSchool?.status === 'active' ? (
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                  ) : (
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  )}
                  <div>
                    <p className={`font-medium ${suspendingSchool?.status === 'active' ? 'text-amber-800' : 'text-green-800'}`}>
                      {suspendingSchool?.status === 'active' 
                        ? 'Are you sure you want to suspend this school?'
                        : 'Are you sure you want to activate this school?'}
                    </p>
                    <p className={`text-sm mt-1 ${suspendingSchool?.status === 'active' ? 'text-amber-700' : 'text-green-700'}`}>
                      {suspendingSchool?.status === 'active'
                        ? 'Users from this school will not be able to access the platform.'
                        : 'Users from this school will regain access to the platform.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColor(suspendingSchool?.name || '')} flex items-center justify-center text-white font-bold text-sm`}>
                    {getSchoolInitials(suspendingSchool?.name || '')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{suspendingSchool?.name}</p>
                    <p className="text-sm text-gray-500">{suspendingSchool?.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsSuspendModalOpen(false);
                    setSuspendingSchool(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmSuspend}
                  className={`border-0 rounded-xl shadow-lg hover:shadow-xl ${
                    suspendingSchool?.status === 'active'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}
                >
                  {suspendingSchool?.status === 'active' ? 'Suspend School' : 'Activate School'}
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-red-800">
                      This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      All data associated with this school will be permanently deleted, including users, students, and records.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColor(deletingSchool?.name || '')} flex items-center justify-center text-white font-bold text-sm`}>
                    {getSchoolInitials(deletingSchool?.name || '')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{deletingSchool?.name}</p>
                    <p className="text-sm text-gray-500">{deletingSchool?.email}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Schools with existing users or students cannot be deleted. Please deactivate them instead.
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
                  <Trash2 size={16} className="mr-2" />
                  Delete School
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
