import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle,
  Settings,
  Info,
  Award,
  FileWarning,
  Heart,
} from 'lucide-react';
import { api } from '../../services/api';

interface DetentionRule {
  id: number;
  name: string;
  description: string;
  trigger_type: 'incident_count' | 'incident_type' | 'points_threshold';
  trigger_value: number;
  trigger_incident_type?: string;
  time_period_days: number;
  is_active: boolean;
}

interface Consequence {
  id: number;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  default_duration: string;
  is_active: number;
}

interface DetentionSettings {
  max_students_per_session: number;
  default_duration_minutes: number;
  detention_days: string[];
  notification_days_before: number;
  auto_assign_enabled: boolean;
}

interface IncidentType {
  id: number;
  name: string;
  default_points: number;
  default_severity: 'low' | 'medium' | 'high';
  description: string;
  is_active: number;
}

interface MeritType {
  id: number;
  name: string;
  default_points: number;
  description: string;
  is_active: number;
}

interface InterventionType {
  id: number;
  name: string;
  description: string;
  default_duration: number | null;
  is_active: number;
}

const DisciplineRules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'merits' | 'interventions' | 'consequences' | 'detention' | 'settings'>('incidents');
  const [detentionRules, setDetentionRules] = useState<DetentionRule[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [detentionSettings, setDetentionSettings] = useState<DetentionSettings>({
    max_students_per_session: 20,
    default_duration_minutes: 60,
    detention_days: ['Friday'],
    notification_days_before: 2,
    auto_assign_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDetentionRuleModal, setShowDetentionRuleModal] = useState(false);
  const [showConsequenceModal, setShowConsequenceModal] = useState(false);
  const [editingDetentionRule, setEditingDetentionRule] = useState<DetentionRule | null>(null);
  const [editingConsequence, setEditingConsequence] = useState<Consequence | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New state for types management
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [meritTypes, setMeritTypes] = useState<MeritType[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
  const [showIncidentTypeModal, setShowIncidentTypeModal] = useState(false);
  const [showMeritTypeModal, setShowMeritTypeModal] = useState(false);
  const [showInterventionTypeModal, setShowInterventionTypeModal] = useState(false);
  const [editingIncidentType, setEditingIncidentType] = useState<IncidentType | null>(null);
  const [editingMeritType, setEditingMeritType] = useState<MeritType | null>(null);
  const [editingInterventionType, setEditingInterventionType] = useState<InterventionType | null>(null);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      // Fetch types and detention rules from API
      const [incidentTypesRes, meritTypesRes, interventionTypesRes, consequencesRes, detentionRulesRes] = await Promise.all([
        api.getIncidentTypes(),
        api.getMeritTypes(),
        api.getInterventionTypes(),
        api.getConsequenceDefinitions(),
        api.getDetentionRules().catch(() => ({ data: [] })),
      ]);
      
      setIncidentTypes(incidentTypesRes.data || []);
      setMeritTypes(meritTypesRes.data || []);
      setInterventionTypes(interventionTypesRes.data || []);
      setConsequences(consequencesRes.data || []);

      // Map database rules to frontend format
      const mappedRules = (detentionRulesRes.data || []).map((rule: any) => ({
        id: rule.id,
        name: rule.severity ? `${rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)} Severity Detention` : 
              rule.min_points >= 10 ? `${rule.min_points}+ Points Detention` :
              `${rule.min_points}+ Incidents Detention`,
        description: rule.severity ? `Automatic detention for ${rule.severity} severity incidents` :
                     rule.min_points >= 10 ? `Detention after accumulating ${rule.min_points}+ demerit points` :
                     `Detention after ${rule.min_points}+ incidents`,
        trigger_type: rule.severity ? 'incident_type' : rule.min_points >= 10 ? 'points_threshold' : 'incident_count',
        trigger_value: rule.min_points,
        trigger_incident_type: rule.severity,
        time_period_days: 30,
        is_active: rule.is_active === 1 || rule.is_active === true,
      }));
      
      setDetentionRules(mappedRules);
    } catch (error) {
      console.error('Error fetching rules:', error);
      setMessage({ type: 'error', text: 'Failed to load discipline rules' });
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Incident Types
  const handleSaveIncidentType = async (data: Partial<IncidentType>) => {
    setSaving(true);
    try {
      if (editingIncidentType) {
        await api.updateIncidentType(editingIncidentType.id, data);
        setMessage({ type: 'success', text: 'Incident type updated successfully' });
      } else {
        await api.createIncidentType(data);
        setMessage({ type: 'success', text: 'Incident type created successfully' });
      }
      setShowIncidentTypeModal(false);
      setEditingIncidentType(null);
      fetchRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save incident type' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIncidentType = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this incident type?')) return;
    try {
      await api.deleteIncidentType(id);
      setMessage({ type: 'success', text: 'Incident type deleted' });
      fetchRules();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete incident type' });
    }
  };

  // Handlers for Merit Types
  const handleSaveMeritType = async (data: Partial<MeritType>) => {
    setSaving(true);
    try {
      if (editingMeritType) {
        await api.updateMeritType(editingMeritType.id, data);
        setMessage({ type: 'success', text: 'Merit type updated successfully' });
      } else {
        await api.createMeritType(data);
        setMessage({ type: 'success', text: 'Merit type created successfully' });
      }
      setShowMeritTypeModal(false);
      setEditingMeritType(null);
      fetchRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save merit type' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeritType = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this merit type?')) return;
    try {
      await api.deleteMeritType(id);
      setMessage({ type: 'success', text: 'Merit type deleted' });
      fetchRules();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete merit type' });
    }
  };

  // Handlers for Intervention Types
  const handleSaveInterventionType = async (data: Partial<InterventionType>) => {
    setSaving(true);
    try {
      if (editingInterventionType) {
        await api.updateInterventionType(editingInterventionType.id, data);
        setMessage({ type: 'success', text: 'Intervention type updated successfully' });
      } else {
        await api.createInterventionType(data);
        setMessage({ type: 'success', text: 'Intervention type created successfully' });
      }
      setShowInterventionTypeModal(false);
      setEditingInterventionType(null);
      fetchRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save intervention type' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInterventionType = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this intervention type?')) return;
    try {
      await api.deleteInterventionType(id);
      setMessage({ type: 'success', text: 'Intervention type deleted' });
      fetchRules();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete intervention type' });
    }
  };

  // Handlers for Consequences
  const handleSaveConsequence = async (data: Partial<Consequence>) => {
    setSaving(true);
    try {
      if (editingConsequence) {
        await api.updateConsequenceDefinition(editingConsequence.id, data);
        setMessage({ type: 'success', text: 'Consequence updated successfully' });
      } else {
        await api.createConsequenceDefinition(data);
        setMessage({ type: 'success', text: 'Consequence created successfully' });
      }
      setShowConsequenceModal(false);
      setEditingConsequence(null);
      fetchRules();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save consequence' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsequence = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this consequence?')) return;
    try {
      await api.deleteConsequenceDefinition(id);
      setMessage({ type: 'success', text: 'Consequence deleted' });
      fetchRules();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete consequence' });
    }
  };

  const handleSaveDetentionRule = async (rule: Partial<DetentionRule>) => {
    setSaving(true);
    try {
      // Map frontend rule format to backend format
      const backendRule = {
        id: editingDetentionRule?.id,
        action_type: 'detention',
        min_points: rule.trigger_value || 3,
        max_points: null,
        severity: rule.trigger_type === 'incident_type' ? rule.trigger_incident_type : null,
        detention_duration: 60,
        is_active: rule.is_active !== undefined ? rule.is_active : true,
      };

      // Call API to save rule
      await api.saveDetentionRule(backendRule);
      
      // Refresh rules from database
      await fetchRules();
      
      setMessage({ 
        type: 'success', 
        text: editingDetentionRule ? 'Detention rule updated successfully' : 'Detention rule created successfully' 
      });
      setShowDetentionRuleModal(false);
      setEditingDetentionRule(null);
    } catch (error) {
      console.error('Error saving detention rule:', error);
      setMessage({ type: 'error', text: 'Failed to save detention rule' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsequenceRule = async (rule: Partial<ConsequenceRule>) => {
    setSaving(true);
    try {
      if (editingConsequenceRule) {
        setConsequenceRules(consequenceRules.map(r => 
          r.id === editingConsequenceRule.id ? { ...r, ...rule } : r
        ));
        setMessage({ type: 'success', text: 'Consequence rule updated successfully' });
      } else {
        const newRule: ConsequenceRule = {
          id: Date.now(),
          name: rule.name || '',
          description: rule.description || '',
          consequence_type: rule.consequence_type || 'verbal_warning',
          trigger_type: rule.trigger_type || 'incident_count',
          trigger_value: rule.trigger_value || 3,
          time_period_days: rule.time_period_days || 30,
          requires_admin_approval: rule.requires_admin_approval || false,
          is_active: true,
        };
        setConsequenceRules([...consequenceRules, newRule]);
        setMessage({ type: 'success', text: 'Consequence rule created successfully' });
      }
      setShowConsequenceRuleModal(false);
      setEditingConsequenceRule(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save consequence rule' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDetentionRule = async (id: number) => {
    try {
      // Call API to delete rule (need to implement delete endpoint)
      // For now, we'll disable the rule instead
      await api.saveDetentionRule({ id, is_active: false });
      
      // Refresh rules from database
      await fetchRules();
      
      setMessage({ type: 'success', text: 'Detention rule deleted' });
    } catch (error) {
      console.error('Error deleting detention rule:', error);
      setMessage({ type: 'error', text: 'Failed to delete detention rule' });
    }
  };

  const handleDeleteConsequenceRule = (id: number) => {
    setConsequenceRules(consequenceRules.filter(r => r.id !== id));
    setMessage({ type: 'success', text: 'Consequence rule deleted' });
  };

  const handleToggleDetentionRule = async (id: number) => {
    try {
      const rule = detentionRules.find(r => r.id === id);
      if (!rule) return;

      // Call API to toggle rule active status
      await api.saveDetentionRule({ 
        id, 
        is_active: !rule.is_active 
      });
      
      // Refresh rules from database
      await fetchRules();
    } catch (error) {
      console.error('Error toggling detention rule:', error);
      setMessage({ type: 'error', text: 'Failed to toggle detention rule' });
    }
  };

  const handleToggleConsequenceRule = (id: number) => {
    setConsequenceRules(consequenceRules.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    ));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In real implementation, save to API
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'incidents' as const, label: 'Incident Types', icon: FileWarning },
    { id: 'merits' as const, label: 'Merit Types', icon: Award },
    { id: 'interventions' as const, label: 'Interventions', icon: Heart },
    { id: 'consequences' as const, label: 'Consequences', icon: AlertTriangle },
    { id: 'detention' as const, label: 'Detention Rules', icon: Clock },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="text-white" size={20} />
            </div>
            <span>Discipline Rules</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Configure automatic detention and consequence rules</p>
        </div>
      </motion.div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center justify-between ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg border border-gray-100 overflow-x-auto"
      >
        <div className="flex gap-1 sm:gap-2 min-w-max">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base min-h-[44px] ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Incident Types Tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
              <div className="flex items-start space-x-3">
                <Info className="text-red-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900">Incident Types (Demerits)</h3>
                  <p className="text-red-700 text-sm mt-1">
                    Define the types of behavioral incidents that can be recorded. Each type can have default points and severity levels.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingIncidentType(null);
                  setShowIncidentTypeModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                <span>Add Incident Type</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidentTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-5 shadow-lg border ${
                    type.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      type.default_severity === 'high' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      type.default_severity === 'medium' ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
                      'bg-gradient-to-br from-yellow-400 to-amber-400'
                    }`}>
                      <FileWarning className="text-white" size={20} />
                    </div>
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingIncidentType(type);
                          setShowIncidentTypeModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteIncidentType(type.id)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900">{type.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{type.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {type.default_points} pts
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      type.default_severity === 'high' ? 'bg-red-100 text-red-700' :
                      type.default_severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {type.default_severity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {incidentTypes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <FileWarning className="mx-auto text-gray-300" size={48} />
                <p className="text-gray-500 mt-4">No incident types configured</p>
                <p className="text-gray-400 text-sm">Add incident types to categorize behavioral issues</p>
              </div>
            )}
          </div>
        )}

        {/* Merit Types Tab */}
        {activeTab === 'merits' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-start space-x-3">
                <Info className="text-green-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-green-900">Merit Types (Positive Behaviors)</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Define types of positive behaviors that can be rewarded. Each merit type can have default points.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingMeritType(null);
                  setShowMeritTypeModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                <span>Add Merit Type</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meritTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-5 shadow-lg border ${
                    type.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                      <Award className="text-white" size={20} />
                    </div>
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingMeritType(type);
                          setShowMeritTypeModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteMeritType(type.id)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900">{type.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{type.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      +{type.default_points} pts
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {meritTypes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Award className="mx-auto text-gray-300" size={48} />
                <p className="text-gray-500 mt-4">No merit types configured</p>
                <p className="text-gray-400 text-sm">Add merit types to reward positive behaviors</p>
              </div>
            )}
          </div>
        )}

        {/* Intervention Types Tab */}
        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start space-x-3">
                <Info className="text-blue-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-900">Intervention Types</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Define types of interventions that can be assigned to students. Interventions help address behavioral issues constructively.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingInterventionType(null);
                  setShowInterventionTypeModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                <span>Add Intervention Type</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interventionTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-5 shadow-lg border ${
                    type.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
                      <Heart className="text-white" size={20} />
                    </div>
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingInterventionType(type);
                          setShowInterventionTypeModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteInterventionType(type.id)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900">{type.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{type.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {type.default_duration && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {type.default_duration} min
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {interventionTypes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Heart className="mx-auto text-gray-300" size={48} />
                <p className="text-gray-500 mt-4">No intervention types configured</p>
                <p className="text-gray-400 text-sm">Add intervention types to help address student behavior</p>
              </div>
            )}
          </div>
        )}

        {/* Detention Rules Tab */}
        {activeTab === 'detention' && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-start space-x-3">
                <Info className="text-purple-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-purple-900">How Detention Rules Work</h3>
                  <p className="text-purple-700 text-sm mt-1">
                    When a student meets the criteria defined in a rule, they are automatically added to the detention queue. 
                    The system will assign them to the next available detention session based on capacity settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Rule Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingDetentionRule(null);
                  setShowDetentionRuleModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                <span>Add Detention Rule</span>
              </motion.button>
            </div>

            {/* Rules List */}
            <div className="space-y-4">
              {detentionRules.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-lg border ${
                    rule.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        rule.is_active 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                          : 'bg-gray-300'
                      }`}>
                        <Clock className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{rule.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{rule.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {rule.trigger_type === 'incident_count' && `${rule.trigger_value} incidents`}
                            {rule.trigger_type === 'incident_type' && `${rule.trigger_incident_type}`}
                            {rule.trigger_type === 'points_threshold' && `${rule.trigger_value} points`}
                          </span>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            Within {rule.time_period_days} days
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rule.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleDetentionRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingDetentionRule(rule);
                          setShowDetentionRuleModal(true);
                        }}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteDetentionRule(rule.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {detentionRules.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Clock className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No detention rules configured</p>
                  <p className="text-gray-400 text-sm">Add a rule to automatically assign detentions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consequences Tab */}
        {activeTab === 'consequences' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-start space-x-3">
                <Info className="text-amber-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-amber-900">Consequence Types</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Define the types of consequences that can be assigned to students. These will appear when teachers and admins assign consequences.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingConsequence(null);
                  setShowConsequenceModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                <span>Add Consequence</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consequences.map((consequence, index) => (
                <motion.div
                  key={consequence.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-5 shadow-lg border ${
                    consequence.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      consequence.severity === 'high' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      consequence.severity === 'medium' ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
                      'bg-gradient-to-br from-yellow-400 to-amber-400'
                    }`}>
                      <AlertTriangle className="text-white" size={20} />
                    </div>
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingConsequence(consequence);
                          setShowConsequenceModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteConsequence(consequence.id)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1">{consequence.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{consequence.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      consequence.severity === 'high' ? 'bg-red-100 text-red-700' :
                      consequence.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {consequence.severity.charAt(0).toUpperCase() + consequence.severity.slice(1)} Severity
                    </span>
                    {consequence.default_duration && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {consequence.default_duration}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      consequence.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {consequence.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </motion.div>
              ))}

              {consequences.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <AlertTriangle className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No consequences configured</p>
                  <p className="text-gray-400 text-sm">Add consequences that teachers can assign to students</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Settings className="text-purple-600" size={24} />
                <span>Detention Session Settings</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Max Students */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Students per Session
                  </label>
                  <input
                    type="number"
                    value={detentionSettings.max_students_per_session}
                    onChange={(e) => setDetentionSettings({
                      ...detentionSettings,
                      max_students_per_session: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Students exceeding this limit will be assigned to the next session
                  </p>
                </div>

                {/* Default Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={detentionSettings.default_duration_minutes}
                    onChange={(e) => setDetentionSettings({
                      ...detentionSettings,
                      default_duration_minutes: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    min="15"
                    max="180"
                    step="15"
                  />
                </div>

                {/* Detention Days */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detention Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const days = detentionSettings.detention_days.includes(day)
                            ? detentionSettings.detention_days.filter(d => d !== day)
                            : [...detentionSettings.detention_days, day];
                          setDetentionSettings({ ...detentionSettings, detention_days: days });
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          detentionSettings.detention_days.includes(day)
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select the days when detention sessions are held
                  </p>
                </div>

                {/* Notification Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notify Parents (days before)
                  </label>
                  <input
                    type="number"
                    value={detentionSettings.notification_days_before}
                    onChange={(e) => setDetentionSettings({
                      ...detentionSettings,
                      notification_days_before: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    min="1"
                    max="7"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Parents will be notified this many days before the detention
                  </p>
                </div>

                {/* Auto Assign Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Assign Students
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDetentionSettings({
                      ...detentionSettings,
                      auto_assign_enabled: !detentionSettings.auto_assign_enabled
                    })}
                    className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                      detentionSettings.auto_assign_enabled
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span>{detentionSettings.auto_assign_enabled ? 'Enabled' : 'Disabled'}</span>
                    <div className={`w-12 h-6 rounded-full transition-all ${
                      detentionSettings.auto_assign_enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <motion.div
                        animate={{ x: detentionSettings.auto_assign_enabled ? 24 : 0 }}
                        className="w-6 h-6 bg-white rounded-full shadow-md"
                      />
                    </div>
                  </motion.button>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically assign students to sessions based on rules
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  <Save size={20} />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detention Rule Modal */}
      <AnimatePresence>
        {showDetentionRuleModal && (
          <DetentionRuleModal
            rule={editingDetentionRule}
            incidentTypes={incidentTypes}
            onSave={handleSaveDetentionRule}
            onClose={() => {
              setShowDetentionRuleModal(false);
              setEditingDetentionRule(null);
            }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Consequence Modal */}
      <AnimatePresence>
        {showConsequenceModal && (
          <ConsequenceModal
            consequence={editingConsequence}
            onSave={handleSaveConsequence}
            onClose={() => {
              setShowConsequenceModal(false);
              setEditingConsequence(null);
            }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Incident Type Modal */}
      <AnimatePresence>
        {showIncidentTypeModal && (
          <IncidentTypeModal
            type={editingIncidentType}
            onSave={handleSaveIncidentType}
            onClose={() => {
              setShowIncidentTypeModal(false);
              setEditingIncidentType(null);
            }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Merit Type Modal */}
      <AnimatePresence>
        {showMeritTypeModal && (
          <MeritTypeModal
            type={editingMeritType}
            onSave={handleSaveMeritType}
            onClose={() => {
              setShowMeritTypeModal(false);
              setEditingMeritType(null);
            }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Intervention Type Modal */}
      <AnimatePresence>
        {showInterventionTypeModal && (
          <InterventionTypeModal
            type={editingInterventionType}
            onSave={handleSaveInterventionType}
            onClose={() => {
              setShowInterventionTypeModal(false);
              setEditingInterventionType(null);
            }}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Detention Rule Modal Component
const DetentionRuleModal: React.FC<{
  rule: DetentionRule | null;
  incidentTypes: IncidentType[];
  onSave: (rule: Partial<DetentionRule>) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ rule, incidentTypes, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger_type: rule?.trigger_type || 'incident_count',
    trigger_value: rule?.trigger_value || 3,
    trigger_incident_type: rule?.trigger_incident_type || '',
    time_period_days: rule?.time_period_days || 7,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {rule ? 'Edit Detention Rule' : 'Add Detention Rule'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., 3 Incidents Rule"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder="Describe when this rule triggers..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="incident_count">Number of Incidents</option>
              <option value="incident_type">Specific Incident Type</option>
              <option value="points_threshold">Points Threshold</option>
            </select>
          </div>

          {formData.trigger_type === 'incident_type' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type</label>
              <select
                value={formData.trigger_incident_type}
                onChange={(e) => setFormData({ ...formData, trigger_incident_type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select incident type...</option>
                {incidentTypes.map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.trigger_type === 'incident_count' ? 'Number of Incidents' :
                 formData.trigger_type === 'points_threshold' ? 'Points Threshold' : 'Occurrences'}
              </label>
              <input
                type="number"
                value={formData.trigger_value}
                onChange={(e) => setFormData({ ...formData, trigger_value: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period (days)</label>
              <input
                type="number"
                value={formData.time_period_days}
                onChange={(e) => setFormData({ ...formData, time_period_days: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={saving || !formData.name}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Rule'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Consequence Rule Modal Component
const ConsequenceRuleModal: React.FC<{
  rule: ConsequenceRule | null;
  onSave: (rule: Partial<ConsequenceRule>) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ rule, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    consequence_type: rule?.consequence_type || 'verbal_warning',
    trigger_type: rule?.trigger_type || 'incident_count',
    trigger_value: rule?.trigger_value || 3,
    time_period_days: rule?.time_period_days || 30,
    requires_admin_approval: rule?.requires_admin_approval || false,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {rule ? 'Edit Consequence Rule' : 'Add Consequence Rule'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., First Warning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={2}
              placeholder="Describe when this consequence applies..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Consequence Type</label>
            <select
              value={formData.consequence_type}
              onChange={(e) => setFormData({ ...formData, consequence_type: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="verbal_warning">Verbal Warning</option>
              <option value="written_warning">Written Warning</option>
              <option value="suspension">Suspension</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="incident_count">Number of Incidents</option>
              <option value="detention_count">Number of Detentions</option>
              <option value="points_threshold">Points Threshold</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.trigger_type === 'incident_count' ? 'Number of Incidents' :
                 formData.trigger_type === 'detention_count' ? 'Number of Detentions' : 'Points Threshold'}
              </label>
              <input
                type="number"
                value={formData.trigger_value}
                onChange={(e) => setFormData({ ...formData, trigger_value: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period (days)</label>
              <input
                type="number"
                value={formData.time_period_days}
                onChange={(e) => setFormData({ ...formData, time_period_days: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_admin_approval}
                onChange={(e) => setFormData({ ...formData, requires_admin_approval: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-gray-700">Requires Admin Approval</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              If enabled, this consequence must be approved by an admin before being applied
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={saving || !formData.name}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Rule'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Incident Type Modal Component
const IncidentTypeModal: React.FC<{
  type: IncidentType | null;
  onSave: (data: Partial<IncidentType>) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ type, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: type?.name || '',
    description: type?.description || '',
    default_points: type?.default_points || 1,
    default_severity: type?.default_severity || 'low',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {type ? 'Edit Incident Type' : 'Add Incident Type'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Late to Class"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={2}
              placeholder="Describe this incident type..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Points</label>
              <input
                type="number"
                value={formData.default_points}
                onChange={(e) => setFormData({ ...formData, default_points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={formData.default_severity}
                onChange={(e) => setFormData({ ...formData, default_severity: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={saving || !formData.name}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Merit Type Modal Component
const MeritTypeModal: React.FC<{
  type: MeritType | null;
  onSave: (data: Partial<MeritType>) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ type, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: type?.name || '',
    description: type?.description || '',
    default_points: type?.default_points || 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {type ? 'Edit Merit Type' : 'Add Merit Type'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Academic Excellence"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
              placeholder="Describe this merit type..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Points</label>
            <input
              type="number"
              value={formData.default_points}
              onChange={(e) => setFormData({ ...formData, default_points: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="1"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={saving || !formData.name}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Intervention Type Modal Component
const InterventionTypeModal: React.FC<{
  type: InterventionType | null;
  onSave: (data: Partial<InterventionType>) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ type, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    default_duration: number | null;
  }>({
    name: type?.name || '',
    description: type?.description || '',
    default_duration: type?.default_duration || 30,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {type ? 'Edit Intervention Type' : 'Add Intervention Type'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Counseling Session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Describe this intervention type..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Duration (minutes)</label>
            <input
              type="number"
              value={formData.default_duration || ''}
              onChange={(e) => setFormData({ ...formData, default_duration: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              placeholder="Leave empty if no default duration"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={saving || !formData.name}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Consequence Modal Component
const ConsequenceModal: React.FC<{
  consequence: Consequence | null;
  onSave: (data: Partial<Consequence>) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ consequence, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: consequence?.name || '',
    description: consequence?.description || '',
    severity: consequence?.severity || 'low',
    default_duration: consequence?.default_duration || '',
    is_active: consequence?.is_active !== undefined ? consequence.is_active : 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {consequence ? 'Edit Consequence' : 'Add Consequence'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Verbal Warning, Detention"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={3}
              placeholder="Describe this consequence..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Duration</label>
              <input
                type="text"
                value={formData.default_duration}
                onChange={(e) => setFormData({ ...formData, default_duration: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., 1 day, 1 week"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(formData)}
            disabled={saving || !formData.name}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DisciplineRules;
