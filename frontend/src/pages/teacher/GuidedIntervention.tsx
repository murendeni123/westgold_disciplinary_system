import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Clock,
  TrendingUp,
  Lightbulb,
  Target,
  FileText
} from 'lucide-react';
import Button from '../../components/Button';
import SearchableSelect from '../../components/SearchableSelect';
import Textarea from '../../components/Textarea';
import Input from '../../components/Input';
import { useToast } from '../../hooks/useToast';

interface BehaviourCategory {
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface Strategy {
  id: number;
  strategy_id?: number;
  name: string;
  strategy_name?: string;
  description: string;
  times_used?: number;
  was_effective?: boolean;
  priority_score?: number;
}

const GuidedIntervention: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error, ToastContainer } = useToast();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<BehaviourCategory[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    student_id: searchParams.get('student') || '',
    behaviour_category: '',
    triggers: '',
    frequency: '',
    context_notes: '',
    start_date: new Date().toISOString().split('T')[0],
    review_date: '',
    engagement_score: '',
    tone_used: '',
    compliance_outcome: '',
    selected_strategies: [] as number[],
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.student_id && formData.behaviour_category) {
      fetchSuggestedStrategies();
      fetchStudentHistory();
    }
  }, [formData.student_id, formData.behaviour_category]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, categoriesRes] = await Promise.all([
        api.getStudents(),
        api.getBehaviourCategories()
      ]);
      setStudents(studentsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedStrategies = async () => {
    try {
      const response = await api.getSuggestedStrategies(
        Number(formData.student_id),
        formData.behaviour_category
      );
      setStrategies(response.data || []);
    } catch (err) {
      console.error('Error fetching strategies:', err);
    }
  };

  const fetchStudentHistory = async () => {
    try {
      const response = await api.getStudentInterventionHistory(Number(formData.student_id));
      setStudentHistory(response.data);
    } catch (err) {
      console.error('Error fetching student history:', err);
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, behaviour_category: category });
    setCurrentStep(2);
  };

  const toggleStrategy = (strategyId: number | string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const numericId = typeof strategyId === 'string' ? parseInt(strategyId, 10) : strategyId;
    
    setFormData(prev => {
      const selected = prev.selected_strategies;
      const isCurrentlySelected = selected.some(id => id === numericId);
      
      if (isCurrentlySelected) {
        return {
          ...prev,
          selected_strategies: selected.filter(id => id !== numericId)
        };
      } else {
        return {
          ...prev,
          selected_strategies: [...selected, numericId]
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.student_id || !formData.behaviour_category) {
      error('Please select a student and behaviour category');
      return;
    }

    if (formData.selected_strategies.length === 0) {
      error('Please select at least one intervention strategy');
      return;
    }

    setSubmitting(true);
    try {
      await api.createGuidedIntervention({
        student_id: Number(formData.student_id),
        behaviour_category: formData.behaviour_category,
        triggers: formData.triggers,
        frequency: formData.frequency,
        context_notes: formData.context_notes,
        start_date: formData.start_date,
        review_date: formData.review_date || null,
        engagement_score: formData.engagement_score ? Number(formData.engagement_score) : null,
        tone_used: formData.tone_used || null,
        compliance_outcome: formData.compliance_outcome || null,
        strategies: formData.selected_strategies,
        description: formData.description || `Guided intervention for ${categories.find(c => c.value === formData.behaviour_category)?.label}`
      });

      success('Intervention recorded successfully!');
      navigate('/teacher/interventions');
    } catch (err: any) {
      console.error('Error creating intervention:', err);
      error(err.response?.data?.error || 'Failed to create intervention');
    } finally {
      setSubmitting(false);
    }
  };

  const getUntriedStrategies = () => {
    return strategies.filter(s => !s.times_used || s.times_used === 0);
  };

  const getEffectiveStrategies = () => {
    return strategies.filter(s => s.was_effective === true);
  };

  const selectedCategory = categories.find(c => c.value === formData.behaviour_category);

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
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Lightbulb className="text-white" size={24} />
          </div>
          <span>Guided Intervention</span>
        </h1>
        <p className="text-gray-600 mt-2">2-step evidence-based intervention planning</p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">Behaviour Category</span>
        </div>
        <ArrowRight className="text-gray-400" size={20} />
        <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="font-medium">Intervention Strategies</span>
        </div>
      </div>

      {/* Student Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Student</h2>
        <SearchableSelect
          label="Student"
          value={formData.student_id}
          onChange={(value) => {
            setFormData({ ...formData, student_id: String(value) });
            setCurrentStep(1);
          }}
          options={students.map(s => ({
            value: s.id.toString(),
            label: `${s.first_name} ${s.last_name} (${s.student_id})${s.class_name ? ` - ${s.class_name}` : ''}`
          }))}
          placeholder="Search and select a student..."
          required
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Behaviour Category Selection */}
        {currentStep === 1 && formData.student_id && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Select Behaviour Category</h2>
              <p className="text-gray-600 mb-6">Choose the primary behaviour concern</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <motion.button
                    key={category.value}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category.value)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      formData.behaviour_category === category.value
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{category.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{category.label}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      {formData.behaviour_category === category.value && (
                        <CheckCircle className="text-blue-600" size={24} />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Intervention Strategies */}
        {currentStep === 2 && formData.behaviour_category && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Context Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText size={20} />
                <span>Context & Details</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Triggers
                  </label>
                  <Textarea
                    value={formData.triggers}
                    onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
                    placeholder="What triggers this behaviour?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select frequency...</option>
                    <option value="daily">Daily</option>
                    <option value="several_times_week">Several times per week</option>
                    <option value="weekly">Weekly</option>
                    <option value="occasional">Occasional</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Context
                  </label>
                  <Textarea
                    value={formData.context_notes}
                    onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
                    placeholder="Any additional context or observations..."
                    rows={3}
                  />
                </div>

                {formData.behaviour_category === 'low_engagement' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Engagement Score (1-5)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.engagement_score}
                      onChange={(e) => setFormData({ ...formData, engagement_score: e.target.value })}
                      placeholder="1 = Very Low, 5 = High"
                    />
                  </div>
                )}

                {formData.behaviour_category === 'non_compliance' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tone Used
                      </label>
                      <select
                        value={formData.tone_used}
                        onChange={(e) => setFormData({ ...formData, tone_used: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select tone...</option>
                        <option value="calm">Calm</option>
                        <option value="neutral">Neutral</option>
                        <option value="firm">Firm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compliance Outcome
                      </label>
                      <select
                        value={formData.compliance_outcome}
                        onChange={(e) => setFormData({ ...formData, compliance_outcome: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select outcome...</option>
                        <option value="complied">Complied</option>
                        <option value="delayed">Delayed Compliance</option>
                        <option value="refused">Refused</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Suggested Interventions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Target size={20} />
                  <span>Suggested Interventions</span>
                </h2>
                <div className="text-sm text-gray-600">
                  Selected: <span className="font-bold text-blue-600">{formData.selected_strategies.length}</span>
                </div>
              </div>

              {selectedCategory && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>{selectedCategory.icon} {selectedCategory.label}:</strong> {selectedCategory.description}
                  </p>
                </div>
              )}

              {/* Smart Suggestions */}
              {getUntriedStrategies().length > 0 && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="text-green-600" size={18} />
                    <span className="font-semibold text-green-900">Top Untried Strategies</span>
                  </div>
                  <p className="text-sm text-green-800">
                    {getUntriedStrategies().slice(0, 3).map(s => s.strategy_name || s.name).join(', ')}
                  </p>
                </div>
              )}

              {getEffectiveStrategies().length > 0 && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="text-purple-600" size={18} />
                    <span className="font-semibold text-purple-900">Previously Effective</span>
                  </div>
                  <p className="text-sm text-purple-800">
                    {getEffectiveStrategies().map(s => s.strategy_name || s.name).join(', ')}
                  </p>
                </div>
              )}

              {/* Strategy Checklist */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {strategies.map((strategy) => {
                  // Handle both 'id' and 'strategy_id' field names from API
                  const rawId = strategy.strategy_id || strategy.id;
                  const strategyId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
                  const isSelected = formData.selected_strategies.some(id => id === strategyId);
                  const isUntried = !strategy.times_used || strategy.times_used === 0;
                  const wasEffective = strategy.was_effective === true;
                  // Handle both 'name' and 'strategy_name' field names
                  const strategyName = strategy.strategy_name || strategy.name;

                  return (
                    <motion.div
                      key={strategyId}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      } ${isUntried ? 'ring-2 ring-green-200' : ''}`}
                      onClick={(e) => toggleStrategy(strategyId, e)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckCircle className="text-white" size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{strategyName}</h3>
                            {isUntried && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                Untried
                              </span>
                            )}
                            {wasEffective && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                Previously Effective
                              </span>
                            )}
                            {strategy.times_used && strategy.times_used > 0 && (
                              <span className="text-xs text-gray-500">
                                Used {strategy.times_used}x
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Review Plan */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar size={20} />
                <span>Review Plan</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Date
                  </label>
                  <Input
                    type="date"
                    value={formData.review_date}
                    onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                    min={formData.start_date}
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 3-5 days from start</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft size={18} />
                <span>Back to Categories</span>
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={submitting || formData.selected_strategies.length === 0}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Record Intervention</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuidedIntervention;
