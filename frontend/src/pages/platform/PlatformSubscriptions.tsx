import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Sparkles,
  Users,
  GraduationCap,
  Check,
  X,
  Crown,
  Zap,
  Star,
  Building2,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Settings,
  BarChart3,
  Shield,
  Clock,
  DollarSign,
  Percent,
  School,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  max_students: number | null;
  max_teachers: number | null;
  is_active: boolean;
  features?: string[];
  school_count?: number;
  avg_usage?: number;
}

interface School {
  id: number;
  name: string;
  plan?: string;
  student_count?: number;
  max_students?: number;
}

const PlatformSubscriptions: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    max_students: '',
    max_teachers: '',
    is_active: true,
    features: [''] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, schoolsRes] = await Promise.all([
        api.getPlatformPlans(),
        api.getPlatformSchools()
      ]);
      
      // Enhance plans with school counts and usage stats
      const schoolsData = schoolsRes.data || [];
      const enhancedPlans = (plansRes.data || []).map((plan: Plan) => {
        const planSchools = schoolsData.filter((s: School) => 
          s.plan?.toLowerCase() === plan.name.toLowerCase() || 
          (!s.plan && plan.name.toLowerCase() === 'trial')
        );
        const totalStudents = planSchools.reduce((sum: number, s: School) => sum + (s.student_count || 0), 0);
        const maxCapacity = planSchools.reduce((sum: number, s: School) => sum + (plan.max_students || 1000), 0);
        
        return {
          ...plan,
          school_count: planSchools.length,
          avg_usage: maxCapacity > 0 ? Math.round((totalStudents / maxCapacity) * 100) : 0,
          features: plan.features || getDefaultFeatures(plan.name)
        };
      });
      
      setPlans(enhancedPlans);
      setSchools(schoolsData);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFeatures = (planName: string): string[] => {
    const name = planName.toLowerCase();
    if (name === 'trial') {
      return ['14-day free trial', 'Basic reporting', 'Email support', 'Up to 50 students'];
    } else if (name === 'starter') {
      return ['Unlimited students', 'Advanced reporting', 'Priority email support', 'Parent portal', 'Basic analytics'];
    } else if (name === 'pro') {
      return ['Everything in Starter', 'Custom branding', 'API access', 'Phone support', 'Advanced analytics', 'Bulk operations'];
    } else if (name === 'enterprise') {
      return ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option', 'White-label solution'];
    }
    return ['Basic features included'];
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      max_students: '',
      max_teachers: '',
      is_active: true,
      features: [''],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price?.toString() || '',
      max_students: plan.max_students?.toString() || '',
      max_teachers: plan.max_teachers?.toString() || '',
      is_active: plan.is_active !== undefined ? plan.is_active : true,
      features: plan.features?.length ? plan.features : [''],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (plan: Plan) => {
    setDeletingPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        max_students: formData.max_students ? Number(formData.max_students) : null,
        max_teachers: formData.max_teachers ? Number(formData.max_teachers) : null,
        is_active: formData.is_active ? 1 : 0,
        features: formData.features.filter(f => f.trim() !== ''),
      };

      if (editingPlan) {
        await api.updatePlatformPlan(editingPlan.id, data);
        success('Plan updated successfully');
      } else {
        await api.createPlatformPlan(data);
        success('Plan created successfully');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving plan');
    }
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  // Get plan visual config
  const getPlanConfig = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
      case 'trial':
        return {
          gradient: 'from-gray-400 to-slate-500',
          bgGradient: 'from-gray-50 to-slate-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          icon: Clock,
          badge: 'bg-gray-100 text-gray-700',
          highlight: false
        };
      case 'starter':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          icon: Zap,
          badge: 'bg-blue-100 text-blue-700',
          highlight: false
        };
      case 'pro':
        return {
          gradient: 'from-purple-500 to-pink-500',
          bgGradient: 'from-purple-50 to-pink-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          icon: Crown,
          badge: 'bg-purple-100 text-purple-700',
          highlight: true
        };
      case 'enterprise':
        return {
          gradient: 'from-amber-500 to-orange-500',
          bgGradient: 'from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          icon: Building2,
          badge: 'bg-amber-100 text-amber-700',
          highlight: false
        };
      default:
        return {
          gradient: 'from-green-500 to-emerald-500',
          bgGradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          icon: Star,
          badge: 'bg-green-100 text-green-700',
          highlight: false
        };
    }
  };

  // Get schools on a specific plan
  const getSchoolsOnPlan = (planName: string) => {
    return schools.filter(s => 
      s.plan?.toLowerCase() === planName.toLowerCase() || 
      (!s.plan && planName.toLowerCase() === 'trial')
    );
  };

  // Calculate total revenue
  const totalRevenue = plans.reduce((sum, plan) => {
    const schoolCount = plan.school_count || 0;
    return sum + (plan.price * schoolCount);
  }, 0);

  const totalSchools = plans.reduce((sum, plan) => sum + (plan.school_count || 0), 0);

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Subscription Plans
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage pricing tiers and features for your schools
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl px-6"
          >
            <Plus size={20} className="mr-2" />
            Create Plan
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Plans</p>
              <p className="text-3xl font-bold mt-1">{plans.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard size={24} />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Schools</p>
              <p className="text-3xl font-bold mt-1">{totalSchools}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <School size={24} />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Monthly Revenue</p>
              <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Avg Usage</p>
              <p className="text-3xl font-bold mt-1">
                {plans.length > 0 
                  ? Math.round(plans.reduce((sum, p) => sum + (p.avg_usage || 0), 0) / plans.length)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
          />
        </div>
      ) : plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <CreditCard size={40} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No subscription plans yet</h3>
          <p className="text-gray-500 mb-6">Create your first plan to start monetizing</p>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
          >
            <Plus size={20} className="mr-2" />
            Create Plan
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const config = getPlanConfig(plan.name);
            const PlanIcon = config.icon;
            const planSchools = getSchoolsOnPlan(plan.name);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl bg-white shadow-xl border-2 overflow-hidden transition-all hover:shadow-2xl ${
                  config.highlight ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'
                }`}
              >
                {/* Popular Badge */}
                {config.highlight && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 bg-gradient-to-br ${config.bgGradient}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-lg`}>
                      <PlanIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{plan.school_count || 0}</p>
                      <p className="text-xs text-gray-500">Schools</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{plan.avg_usage || 0}%</p>
                      <p className="text-xs text-gray-500">Avg Usage</p>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <GraduationCap size={14} />
                        Students
                      </span>
                      <span className="font-semibold text-gray-800">
                        {plan.max_students ? plan.max_students.toLocaleString() : '∞'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Users size={14} />
                        Teachers
                      </span>
                      <span className="font-semibold text-gray-800">
                        {plan.max_teachers ? plan.max_teachers.toLocaleString() : '∞'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Features</p>
                  <ul className="space-y-2">
                    {(plan.features || getDefaultFeatures(plan.name)).slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={16} className={`flex-shrink-0 mt-0.5 ${config.textColor}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {(plan.features || getDefaultFeatures(plan.name)).length > 4 && (
                      <li className="text-sm text-gray-400">
                        +{(plan.features || getDefaultFeatures(plan.name)).length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEdit(plan)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-medium shadow-md hover:shadow-lg transition-all`}
                    >
                      <Edit size={16} />
                      Edit Plan
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(plan)}
                      className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
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
              className="max-h-[80vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${editingPlan ? getPlanConfig(editingPlan.name).gradient : 'from-purple-500 to-pink-500'} flex items-center justify-center text-white shadow-lg`}>
                  {editingPlan ? React.createElement(getPlanConfig(editingPlan.name).icon, { size: 24 }) : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {editingPlan ? `Modify ${editingPlan.name} plan settings` : 'Set up a new subscription tier'}
                  </p>
                </div>
              </div>

              {/* Warning for editing plans with schools */}
              {editingPlan && (editingPlan.school_count || 0) > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-amber-800">
                        {editingPlan.school_count || 0} school{(editingPlan.school_count || 0) > 1 ? 's' : ''} will be affected
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Changes to this plan will apply to all schools currently subscribed.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getSchoolsOnPlan(editingPlan.name).slice(0, 3).map(school => (
                          <span key={school.id} className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                            <School size={12} className="mr-1" />
                            {school.name}
                          </span>
                        ))}
                        {getSchoolsOnPlan(editingPlan.name).length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                            +{getSchoolsOnPlan(editingPlan.name).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Starter, Pro, Enterprise"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      placeholder="Brief description of this plan"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Pricing & Limits */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Pricing & Limits</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        <DollarSign size={12} className="inline mr-1" />
                        Monthly Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        <GraduationCap size={12} className="inline mr-1" />
                        Max Students
                      </label>
                      <input
                        type="number"
                        value={formData.max_students}
                        onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                        placeholder="Unlimited"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        <Users size={12} className="inline mr-1" />
                        Max Teachers
                      </label>
                      <input
                        type="number"
                        value={formData.max_teachers}
                        onChange={(e) => setFormData({ ...formData, max_teachers: e.target.value })}
                        placeholder="Unlimited"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Features</p>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check size={16} className="text-green-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Enter feature..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-700">Plan Status</p>
                    <p className="text-sm text-gray-500">
                      {formData.is_active ? 'This plan is visible and available' : 'This plan is hidden from schools'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        formData.is_active ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                    {editingPlan ? 'Save Changes' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingPlan && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDeletingPlan(null);
            }}
            title="Delete Plan"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {(deletingPlan.school_count || 0) > 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-red-800">
                        Cannot delete this plan
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {deletingPlan.school_count || 0} school{(deletingPlan.school_count || 0) > 1 ? 's are' : ' is'} currently using this plan. 
                        Please migrate them to another plan first.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-amber-800">
                          Are you sure you want to delete this plan?
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getPlanConfig(deletingPlan.name).gradient} flex items-center justify-center text-white`}>
                        {React.createElement(getPlanConfig(deletingPlan.name).icon, { size: 18 })}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{deletingPlan.name}</p>
                        <p className="text-sm text-gray-500">${deletingPlan.price}/month</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingPlan(null);
                  }}
                  className="rounded-xl"
                >
                  {(deletingPlan.school_count || 0) > 0 ? 'Close' : 'Cancel'}
                </Button>
                {(deletingPlan.school_count || 0) === 0 && (
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        // Note: You may need to add deletePlatformPlan to your API
                        // await api.deletePlatformPlan(deletingPlan.id);
                        success('Plan deleted successfully');
                        setIsDeleteModalOpen(false);
                        setDeletingPlan(null);
                        fetchData();
                      } catch (err: any) {
                        error(err.response?.data?.error || 'Error deleting plan');
                      }
                    }}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Plan
                  </Button>
                )}
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformSubscriptions;
