import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  ToggleLeft, 
  ToggleRight, 
  Award, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import Button from '../../components/Button';

interface FeatureFlag {
  id: number;
  school_id: number;
  school_name: string;
  feature_name: string;
  is_enabled: boolean;
  enabled_at: string | null;
  disabled_at: string | null;
  enabled_by_name: string | null;
  created_at: string;
  updated_at: string;
}

const FeatureFlagsManagement: React.FC = () => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  useEffect(() => {
    filterFeatureFlags();
  }, [featureFlags, searchQuery, filterStatus]);

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      const response = await api.getAllFeatureFlags();
      setFeatureFlags(response.data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFeatureFlags = () => {
    let filtered = [...featureFlags];

    if (searchQuery) {
      filtered = filtered.filter(flag =>
        flag.school_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(flag =>
        filterStatus === 'enabled' ? flag.is_enabled : !flag.is_enabled
      );
    }

    setFilteredFlags(filtered);
  };

  const handleToggle = async (schoolId: number, featureName: string, currentStatus: boolean) => {
    try {
      setToggling(schoolId);
      await api.toggleFeatureFlag(schoolId, featureName, !currentStatus);
      
      setFeatureFlags(prev =>
        prev.map(flag =>
          flag.school_id === schoolId && flag.feature_name === featureName
            ? { ...flag, is_enabled: !currentStatus }
            : flag
        )
      );
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    } finally {
      setToggling(null);
    }
  };

  const handleBulkToggle = async (enabled: boolean) => {
    if (!window.confirm(`Are you sure you want to ${enabled ? 'enable' : 'disable'} Goldie Badge for all schools?`)) {
      return;
    }

    try {
      setLoading(true);
      const schoolIds = featureFlags.map(flag => flag.school_id);
      await api.bulkToggleFeatureFlag('goldie_badge', schoolIds, enabled);
      await fetchFeatureFlags();
    } catch (error) {
      console.error('Error bulk toggling:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: featureFlags.length,
    enabled: featureFlags.filter(f => f.is_enabled).length,
    disabled: featureFlags.filter(f => !f.is_enabled).length,
  };

  if (loading && featureFlags.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Feature Flags Management
          </h1>
          <p className="text-gray-600 mt-2">Control feature availability across all schools</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => handleBulkToggle(true)}
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <CheckCircle size={18} className="mr-2" />
            Enable All
          </Button>
          <Button
            onClick={() => handleBulkToggle(false)}
            className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
          >
            <XCircle size={18} className="mr-2" />
            Disable All
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Schools', value: stats.total, icon: Award, color: 'from-blue-500 to-cyan-500' },
          { label: 'Enabled', value: stats.enabled, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          { label: 'Disabled', value: stats.disabled, icon: XCircle, color: 'from-red-500 to-pink-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Filter className="text-white" size={18} />
            </div>
            <h2 className="text-base font-semibold text-white">Filter Schools</h2>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Search Schools</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by school name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Flags List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Goldie Badge Feature ({filteredFlags.length} schools)
          </h2>

          {filteredFlags.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No schools found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFlags.map((flag, index) => (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    flag.is_enabled
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{flag.school_name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          flag.is_enabled
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {flag.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {flag.is_enabled && flag.enabled_at && (
                          <span>
                            Enabled: {new Date(flag.enabled_at).toLocaleDateString()}
                          </span>
                        )}
                        {flag.enabled_by_name && (
                          <span>By: {flag.enabled_by_name}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(flag.school_id, flag.feature_name, flag.is_enabled)}
                      disabled={toggling === flag.school_id}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                        flag.is_enabled
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {toggling === flag.school_id ? (
                        <>
                          <Loader size={20} className="animate-spin" />
                          <span>Toggling...</span>
                        </>
                      ) : (
                        <>
                          {flag.is_enabled ? (
                            <>
                              <ToggleRight size={20} />
                              <span>Disable</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={20} />
                              <span>Enable</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureFlagsManagement;
