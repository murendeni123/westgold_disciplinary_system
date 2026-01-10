import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import ParentProfileModal from '../../components/ParentProfileModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Mail, 
  Users, 
  Search, 
  RefreshCw, 
  LayoutGrid, 
  List, 
  X, 
  Phone,
  GraduationCap,
  Calendar,
  ChevronRight,
  UserPlus,
  Heart
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const Parents: React.FC = () => {
  const { success, ToastContainer } = useToast();
  const [parents, setParents] = useState<any[]>([]);
  const [filteredParents, setFilteredParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    let filtered = parents;
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredParents(filtered);
  }, [searchTerm, parents]);

  const fetchParents = async () => {
    try {
      const response = await api.getParents();
      setParents(response.data);
      setFilteredParents(response.data);
    } catch (err) {
      console.error('Error fetching parents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.getParents();
      setParents(response.data);
      setFilteredParents(response.data);
      success('Parents refreshed');
    } catch (err) {
      console.error('Error refreshing parents:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRowClick = (parent: any) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  // Calculate stats
  const totalChildren = parents.reduce((sum, p) => sum + (p.children?.length || 0), 0);
  const parentsWithChildren = parents.filter(p => p.children && p.children.length > 0).length;
  const parentsWithoutChildren = parents.filter(p => !p.children || p.children.length === 0).length;

  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            {value?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'phone', 
      label: 'Phone',
      render: (value: string) => value || <span className="text-gray-400">-</span>
    },
    { 
      key: 'children_count', 
      label: 'Children',
      render: (_: any, row: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          row.children?.length > 0 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-gray-100 text-gray-500'
        }`}>
          <GraduationCap size={12} className="mr-1" />
          {row.children?.length || 0} student{row.children?.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    { 
      key: 'created_at', 
      label: 'Joined',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Loading parents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <ToastContainer />
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Parent Management
              </h1>
            </div>
            <p className="text-gray-500">
              View and manage all parents linked to students
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium hidden sm:inline">Refresh</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Total Parents', 
            value: parents.length, 
            icon: Users, 
            bgLight: 'bg-rose-50',
            textColor: 'text-rose-600'
          },
          { 
            label: 'Total Children', 
            value: totalChildren, 
            icon: GraduationCap, 
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            label: 'With Children', 
            value: parentsWithChildren, 
            icon: Heart, 
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600'
          },
          { 
            label: 'Without Children', 
            value: parentsWithoutChildren, 
            icon: UserPlus, 
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600',
            warning: parentsWithoutChildren > 0
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${
                stat.warning ? 'ring-2 ring-amber-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgLight}`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search and View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search parents by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={16} />
              Table
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-rose-600">{filteredParents.length}</span> of <span className="font-semibold">{parents.length}</span> parents
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <X size={14} />
              Clear search
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {filteredParents.length > 0 ? (
            viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredParents.map((parent, index) => (
                  <motion.div
                    key={parent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleRowClick(parent)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    {/* Parent Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                          {parent.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                            {parent.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{parent.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {parent.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          <span>{parent.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Joined {new Date(parent.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Children Count */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={16} className="text-gray-400" />
                        <span className={`text-sm font-medium ${
                          parent.children?.length > 0 ? 'text-emerald-600' : 'text-gray-500'
                        }`}>
                          {parent.children?.length || 0} child{parent.children?.length !== 1 ? 'ren' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${parent.email}`;
                          }}
                          className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                        >
                          <Mail size={16} />
                        </button>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <Table
                  columns={[
                    ...columns,
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (_value: any, row: any) => (
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParent(row);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
                          >
                            <Eye size={14} />
                            View
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${row.email}`;
                            }}
                            className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Mail size={14} />
                          </motion.button>
                        </div>
                      ),
                    },
                  ]}
                  data={filteredParents.map((parent) => ({
                    ...parent,
                    children_count: parent.children?.length || 0,
                  }))}
                  onRowClick={handleRowClick}
                />
              </motion.div>
            )
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No parents found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Parents will appear here once they link their accounts'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ParentProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedParent(null);
        }}
        parent={selectedParent}
      />
    </div>
  );
};

export default Parents;

