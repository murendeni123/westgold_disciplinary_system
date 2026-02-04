import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Feature {
  id: number;
  name: string;
  description: string;
  feature_key: string;
  category: string;
  is_premium: boolean;
}

interface FeatureMultiSelectProps {
  selectedFeatureIds: number[];
  onChange: (featureIds: number[]) => void;
}

const FeatureMultiSelect: React.FC<FeatureMultiSelectProps> = ({ selectedFeatureIds, onChange }) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'portals']));

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await api.getSystemFeatures();
      setFeatures(response.data.features || []);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const toggleFeature = (featureId: number) => {
    if (selectedFeatureIds.includes(featureId)) {
      onChange(selectedFeatureIds.filter(id => id !== featureId));
    } else {
      onChange([...selectedFeatureIds, featureId]);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const selectAllInCategory = (category: string) => {
    const categoryFeatures = groupedFeatures[category] || [];
    const categoryFeatureIds = categoryFeatures.map(f => f.id);
    const allSelected = categoryFeatureIds.every(id => selectedFeatureIds.includes(id));
    
    if (allSelected) {
      onChange(selectedFeatureIds.filter(id => !categoryFeatureIds.includes(id)));
    } else {
      const newSelected = [...selectedFeatureIds];
      categoryFeatureIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      onChange(newSelected);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      core: 'Core Features',
      portals: 'Portal Access',
      advanced: 'Advanced Features',
      communication: 'Communication',
      integration: 'Integration & API'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      core: 'from-blue-500 to-cyan-500',
      portals: 'from-purple-500 to-pink-500',
      advanced: 'from-indigo-500 to-purple-500',
      communication: 'from-green-500 to-emerald-500',
      integration: 'from-orange-500 to-red-500'
    };
    return colors[category] || 'from-gray-500 to-slate-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Plan Features</h3>
        <span className="text-xs text-gray-500">
          {selectedFeatureIds.length} of {features.length} selected
        </span>
      </div>

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
        const isExpanded = expandedCategories.has(category);
        const allSelected = categoryFeatures.every(f => selectedFeatureIds.includes(f.id));
        const someSelected = categoryFeatures.some(f => selectedFeatureIds.includes(f.id));

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Category Header */}
            <div className={`bg-gradient-to-r ${getCategoryColor(category)} p-4`}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 text-white font-semibold flex-1 text-left"
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  {getCategoryLabel(category)}
                  <span className="text-xs opacity-90">({categoryFeatures.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectAllInCategory(category)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Category Features */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="bg-white"
              >
                <div className="p-4 space-y-2">
                  {categoryFeatures.map((feature) => {
                    const isSelected = selectedFeatureIds.includes(feature.id);
                    return (
                      <motion.button
                        key={feature.id}
                        type="button"
                        onClick={() => toggleFeature(feature.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-purple-500 border-purple-500'
                              : 'bg-white border-gray-300'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${
                                isSelected ? 'text-purple-900' : 'text-gray-900'
                              }`}>
                                {feature.name}
                              </span>
                              {feature.is_premium && (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                                  PREMIUM
                                </span>
                              )}
                            </div>
                            {feature.description && (
                              <p className={`text-xs mt-1 ${
                                isSelected ? 'text-purple-700' : 'text-gray-500'
                              }`}>
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {features.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No features available</p>
          <p className="text-xs mt-1">Run the seed script to add system features</p>
        </div>
      )}
    </div>
  );
};

export default FeatureMultiSelect;
