import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ModernCard from '../../components/ModernCard';
import { Heart, Activity, Target, TrendingUp, CheckCircle, XCircle, Clock, Filter, Search, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ModernInterventions: React.FC = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
    type: '',
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInterventions();
  }, [filters, user]);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (user?.children && user.children.length > 0) {
        if (filters.student_id) {
          params.student_id = filters.student_id;
        }
      } else {
        setInterventions([]);
        setLoading(false);
        return;
      }

      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await api.getInterventions(params);
      
      // Convert childIds to numbers for proper comparison
      const childIds = user?.children?.map((child: any) => Number(child.id)) || [];
      const filtered = response.data.filter((intervention: any) => {
        return childIds.includes(Number(intervention.student_id));
      });
      
      setInterventions(filtered);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return <TrendingUp className="text-green-600" size={18} />;
      case 'completed':
        return <CheckCircle className="text-blue-600" size={18} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={18} />;
      default:
        return <Clock className="text-gray-600" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInterventions = interventions.filter((intervention) => {
    const searchLower = filters.searchQuery.toLowerCase();
    return (
      intervention.student_name?.toLowerCase().includes(searchLower) ||
      intervention.type?.toLowerCase().includes(searchLower) ||
      intervention.assigned_by_name?.toLowerCase().includes(searchLower) ||
      intervention.description?.toLowerCase().includes(searchLower)
    );
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 p-8 text-white shadow-2xl"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 mb-4"
          >
            <Target className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Interventions</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            Track support interventions and strategies for your children
          </p>
        </div>
      </motion.div>

      {user?.children && user.children.length > 0 ? (
        <>
          {/* Search and Filter Bar */}
          <motion.div variants={itemVariants}>
            <ModernCard variant="glass">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search interventions by child, type, or assigned by..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Filter Toggle Button */}
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all"
                  >
                    <Filter size={18} />
                    <span className="font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                  </motion.button>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-purple-600">{filteredInterventions.length}</span> intervention{filteredInterventions.length !== 1 ? 's' : ''} found
                  </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <User size={16} className="inline mr-1" />
                              Child
                            </label>
                            <select
                              value={filters.student_id}
                              onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="">All Children</option>
                              {user.children.map((child: any) => (
                                <option key={child.id} value={child.id}>
                                  {child.first_name} {child.last_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Activity size={16} className="inline mr-1" />
                              Status
                            </label>
                            <select
                              value={filters.status}
                              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="">All Statuses</option>
                              <option value="active">Active</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Target size={16} className="inline mr-1" />
                              Type
                            </label>
                            <select
                              value={filters.type}
                              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="">All Types</option>
                              {Array.from(new Set(interventions.map(i => i.type))).filter(Boolean).map((type: string) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ModernCard>
          </motion.div>

          {/* Interventions Grid */}
          {loading ? (
            <motion.div variants={itemVariants}>
              <ModernCard variant="glass">
                <div className="flex justify-center items-center h-64">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
                  />
                </div>
              </ModernCard>
            </motion.div>
          ) : filteredInterventions.length === 0 ? (
            <motion.div variants={itemVariants}>
              <ModernCard variant="glass">
                <div className="text-center py-16">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6"
                  >
                    <Heart className="text-white" size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Interventions Found</h3>
                  <p className="text-gray-600">
                    {filters.searchQuery || filters.student_id || filters.status || filters.type
                      ? 'Try adjusting your filters to see more results'
                      : 'No interventions found for your children'}
                  </p>
                </div>
              </ModernCard>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredInterventions.map((intervention: any, index: number) => (
                <motion.div
                  key={intervention.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -5 }}
                >
                  <ModernCard variant="glass" hover={true}>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                            <Target size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{intervention.student_name}</h3>
                            <p className="text-sm text-gray-600">{intervention.type || 'Intervention'}</p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getStatusColor(intervention.status)}`}>
                          {getStatusIcon(intervention.status)}
                          <span className="text-sm font-semibold capitalize">{intervention.status}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {intervention.description && (
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{intervention.description}</p>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="text-blue-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Start Date</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {intervention.start_date ? new Date(intervention.start_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="text-green-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">End Date</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {intervention.end_date ? new Date(intervention.end_date).toLocaleDateString() : 'Ongoing'}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="text-purple-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Assigned By</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{intervention.assigned_by_name || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Activity className="text-indigo-600" size={16} />
                            <span className="text-xs font-medium text-gray-600">Progress</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900 capitalize">{intervention.status}</p>
                        </div>
                      </div>
                    </div>
                  </ModernCard>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6"
              >
                <Activity className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Children Linked</h3>
              <p className="text-gray-600 mb-4">You don't have any children linked to your account.</p>
              <p className="text-sm text-gray-500">Use the "Link Child" option to connect your child's account.</p>
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModernInterventions;

