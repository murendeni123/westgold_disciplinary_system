import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  School, 
  Check, 
  X, 
  Loader, 
  Search,
  Filter,
  Trophy,
  Bell,
  Mail,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Award,
  Star,
  Shield,
  Zap,
  Settings
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface School {
  id: number;
  name: string;
  code: string;
  status: string;
}

interface FeatureFlag {
  id: number;
  school_id: number;
  feature_name: string;
  is_enabled: boolean;
  school_name?: string;
  school_code?: string;
}

interface FeatureDefinition {
  name: string;
  displayName: string;
  description: string;
  icon: any;
  category: 'recognition' | 'communication' | 'management' | 'analytics' | 'advanced';
  color: string;
  gradient: string;
}

const FeatureFlags: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [flags, setFlags] = useState<{ [key: string]: FeatureFlag }>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');

  // Feature Definitions - Easy to add new features here
  const AVAILABLE_FEATURES: FeatureDefinition[] = [
    {
      name: 'goldy_badge',
      displayName: 'Goldy Badge',
      description: 'Enable special recognition badges for exceptional students with clean points system',
      icon: Trophy,
      category: 'recognition',
      color: 'yellow',
      gradient: 'from-yellow-400 to-amber-500',
    },
    // Future features can be added here easily:
    /*
    {
      name: 'push_notifications',
      displayName: 'Push Notifications',
      description: 'Enable real-time push notifications for parents and teachers',
      icon: Bell,
      category: 'communication',
      color: 'blue',
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      name: 'email_reports',
      displayName: 'Email Reports',
      description: 'Automated weekly/monthly email reports for parents',
      icon: Mail,
      category: 'communication',
      color: 'purple',
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      name: 'parent_portal_v2',
      displayName: 'Parent Portal V2',
      description: 'Enhanced parent portal with advanced features',
      icon: Users,
      category: 'management',
      color: 'green',
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      name: 'advanced_analytics',
      displayName: 'Advanced Analytics',
      description: 'Detailed analytics and reporting dashboards',
      icon: Star,
      category: 'analytics',
      color: 'orange',
      gradient: 'from-orange-400 to-red-500',
    },
    */
  ];

  const CATEGORIES = [
    { value: 'all', label: 'All Features', icon: Flag },
    { value: 'recognition', label: 'Recognition', icon: Trophy },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'management', label: 'Management', icon: Shield },
    { value: 'analytics', label: 'Analytics', icon: Star },
    { value: 'advanced', label: 'Advanced', icon: Zap },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schoolsRes, flagsRes] = await Promise.all([
        api.getPlatformSchools(),
        api.getAllSchoolFeatureFlags(),
      ]);

      setSchools(schoolsRes.data);

      // Convert flags array to a map for easy lookup
      const flagsMap: { [key: string]: FeatureFlag } = {};
      flagsRes.data.forEach((flag: FeatureFlag) => {
        const key = `${flag.school_id}-${flag.feature_name}`;
        flagsMap[key] = flag;
      });
      setFlags(flagsMap);
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Error loading feature flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (schoolId: number, featureName: string, currentValue: boolean) => {
    const key = `${schoolId}-${featureName}`;
    try {
      setUpdating({ ...updating, [key]: true });
      await api.toggleSchoolFeatureFlag(schoolId, featureName, !currentValue);
      
      // Update local state
      setFlags({
        ...flags,
        [key]: {
          ...flags[key],
          school_id: schoolId,
          feature_name: featureName,
          is_enabled: !currentValue,
        },
      });

      success(`Feature ${!currentValue ? 'enabled' : 'disabled'} successfully!`);
    } catch (err) {
      console.error('Error toggling feature:', err);
      error('Error updating feature flag');
    } finally {
      setUpdating({ ...updating, [key]: false });
    }
  };

  const bulkToggle = async (featureName: string, isEnabled: boolean) => {
    try {
      setLoading(true);
      await api.bulkToggleFeatureFlag(featureName, isEnabled);
      await fetchData();
      success(`Feature ${isEnabled ? 'enabled' : 'disabled'} for all schools!`);
    } catch (err) {
      console.error('Error bulk toggling:', err);
      error('Error updating feature flags');
    } finally {
      setLoading(false);
    }
  };

  const getFeatureStatus = (schoolId: number, featureName: string): boolean => {
    const key = `${schoolId}-${featureName}`;
    return flags[key]?.is_enabled || false;
  };

  const getEnabledCount = (featureName: string): number => {
    return Object.values(flags).filter(
      (f) => f.feature_name === featureName && f.is_enabled
    ).length;
  };

  const filteredFeatures = AVAILABLE_FEATURES.filter((feature) => {
    const matchesSearch =
      feature.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSchools = selectedSchool === 'all' 
    ? schools 
    : schools.filter(s => s.id.toString() === selectedSchool);

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

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Flag className="text-white" size={28} />
            </div>
            Feature Flags Management
          </h1>
          <p className="text-gray-600 mt-2">
            Control feature availability across all schools • {AVAILABLE_FEATURES.length} features available
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="bg-white rounded-xl shadow-md px-4 py-3 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{schools.length}</div>
            <div className="text-xs text-gray-600">Total Schools</div>
          </div>
          <div className="bg-white rounded-xl shadow-md px-4 py-3 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{AVAILABLE_FEATURES.length}</div>
            <div className="text-xs text-gray-600">Features</div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div className="relative">
            <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Schools</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id.toString()}>
                  {school.name} ({school.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <AnimatePresence mode="wait">
        {filteredFeatures.length > 0 ? (
          <motion.div
            key="features-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const enabledCount = getEnabledCount(feature.name);
              const enabledPercentage = schools.length > 0 ? (enabledCount / schools.length) * 100 : 0;

              return (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  {/* Feature Header */}
                  <div className={`bg-gradient-to-r ${feature.gradient} p-6 rounded-t-xl`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <Icon className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {feature.displayName}
                          </h3>
                          <p className="text-xs text-white/80 mt-1">
                            {feature.category.charAt(0).toUpperCase() + feature.category.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        enabledCount > 0 ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                      }`}>
                        {enabledCount > 0 ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>

                  {/* Feature Body */}
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {feature.description}
                    </p>

                    {/* Stats */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Enabled Schools</span>
                        <span className="font-bold text-gray-900">
                          {enabledCount} / {schools.length}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${enabledPercentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                          className={`h-full bg-gradient-to-r ${feature.gradient}`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => bulkToggle(feature.name, true)}
                        disabled={enabledCount === schools.length}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Enable for all schools"
                      >
                        <Check size={14} />
                        <span className="whitespace-nowrap">Enable All</span>
                      </button>
                      <button
                        onClick={() => bulkToggle(feature.name, false)}
                        disabled={enabledCount === 0}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Disable for all schools"
                      >
                        <X size={14} />
                        <span className="whitespace-nowrap">Disable All</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200"
          >
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* School Configuration Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <School className="text-blue-600" size={24} />
                School Configuration Matrix
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Toggle features for individual schools • {filteredSchools.length} schools {selectedSchool !== 'all' && '(filtered)'}
              </p>
            </div>
            {selectedSchool === 'all' && (
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  Total Configurations
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {schools.length * AVAILABLE_FEATURES.length}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  School
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                {filteredFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <th
                      key={feature.name}
                      className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[140px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={18} className={`text-${feature.color}-600`} />
                        <span>{feature.displayName}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchools.map((school, schoolIndex) => (
                <motion.tr
                  key={school.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: schoolIndex * 0.05 }}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-200 hover:bg-blue-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {school.name.charAt(0)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {school.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 font-mono">{school.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        school.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : school.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {school.status}
                    </span>
                  </td>
                  {filteredFeatures.map((feature) => {
                    const isEnabled = getFeatureStatus(school.id, feature.name);
                    const key = `${school.id}-${feature.name}`;
                    const isUpdating = updating[key];

                    return (
                      <td
                        key={feature.name}
                        className="px-6 py-4 whitespace-nowrap text-center"
                      >
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() =>
                              toggleFeature(school.id, feature.name, isEnabled)
                            }
                            disabled={isUpdating || school.status !== 'active'}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
                              isEnabled 
                                ? `bg-gradient-to-r ${feature.gradient}` 
                                : 'bg-gray-300'
                            } ${
                              isUpdating || school.status !== 'active'
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-lg'
                            }`}
                            title={
                              school.status !== 'active'
                                ? 'School must be active to toggle features'
                                : isEnabled
                                ? 'Click to disable'
                                : 'Click to enable'
                            }
                          >
                            {isUpdating ? (
                              <Loader
                                className="absolute inset-0 m-auto animate-spin text-white"
                                size={16}
                              />
                            ) : (
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                                  isEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                              >
                                {isEnabled ? (
                                  <Check size={12} className="text-green-600" />
                                ) : (
                                  <X size={12} className="text-gray-400" />
                                )}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing <span className="font-semibold text-gray-900">{filteredSchools.length}</span> schools 
              × <span className="font-semibold text-gray-900">{filteredFeatures.length}</span> features 
              = <span className="font-semibold text-blue-600">{filteredSchools.length * filteredFeatures.length}</span> total configurations
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Disabled</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Help Text for Future Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Settings className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Adding New Features</p>
            <p className="text-blue-700">
              To add a new feature flag, simply add it to the <code className="bg-blue-100 px-2 py-0.5 rounded">AVAILABLE_FEATURES</code> array 
              in this component with a name, display name, description, icon, category, and color. 
              The UI will automatically adapt and display the new feature with all necessary controls.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureFlags;
