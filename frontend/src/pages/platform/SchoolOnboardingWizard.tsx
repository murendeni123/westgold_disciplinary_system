import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  User, 
  CreditCard, 
  Palette, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface OnboardingData {
  // Step 1: School Details
  school_name: string;
  school_code: string;
  school_email: string;
  school_phone: string;
  school_address: string;
  school_city: string;
  school_province: string;
  school_postal_code: string;
  
  // Step 2: Admin Account
  admin_name: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirm: string;
  
  // Step 3: Trial/Subscription
  trial_days: number;
  plan_id: number | null;
  
  // Step 4: Branding
  primary_color: string;
  secondary_color: string;
  logo_url: string;
}

const SchoolOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    school_name: '',
    school_code: '',
    school_email: '',
    school_phone: '',
    school_address: '',
    school_city: '',
    school_province: '',
    school_postal_code: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: '',
    trial_days: 30,
    plan_id: null,
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    logo_url: ''
  });

  const steps = [
    { number: 1, title: 'School Details', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { number: 2, title: 'Admin Account', icon: User, color: 'from-purple-500 to-pink-500' },
    { number: 3, title: 'Trial Setup', icon: CreditCard, color: 'from-green-500 to-emerald-500' },
    { number: 4, title: 'Branding', icon: Palette, color: 'from-orange-500 to-red-500' },
    { number: 5, title: 'Complete', icon: CheckCircle, color: 'from-teal-500 to-blue-500' }
  ];

  const validateStep = (step: number): boolean => {
    setError('');

    switch (step) {
      case 1:
        if (!formData.school_name.trim()) {
          setError('School name is required');
          return false;
        }
        // School code is optional - will be auto-generated if not provided
        if (formData.school_code.trim() && !/^[A-Z0-9]{2,10}$/i.test(formData.school_code)) {
          setError('School code must be 2-10 alphanumeric characters (e.g., WGS2025)');
          return false;
        }
        if (!formData.school_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.school_email)) {
          setError('Valid school email is required');
          return false;
        }
        break;

      case 2:
        if (!formData.admin_name.trim()) {
          setError('Admin name is required');
          return false;
        }
        if (!formData.admin_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
          setError('Valid admin email is required');
          return false;
        }
        if (!formData.admin_password || formData.admin_password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.admin_password !== formData.admin_password_confirm) {
          setError('Passwords do not match');
          return false;
        }
        break;

      case 3:
        if (formData.trial_days < 1 || formData.trial_days > 365) {
          setError('Trial days must be between 1 and 365');
          return false;
        }
        break;

      case 4:
        if (!formData.primary_color || !formData.secondary_color) {
          setError('Both primary and secondary colors are required');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.onboardSchool({
        school_name: formData.school_name,
        school_code: formData.school_code.trim() ? formData.school_code.toUpperCase() : undefined, // Will be auto-generated if empty
        school_email: formData.school_email,
        school_phone: formData.school_phone,
        school_address: formData.school_address,
        school_city: formData.school_city,
        school_province: formData.school_province,
        school_postal_code: formData.school_postal_code,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        trial_days: formData.trial_days,
        plan_id: formData.plan_id,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        logo_url: formData.logo_url || null
      });

      setResult(response.data);
      setSuccess(true);
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to onboard school');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="School Name"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              required
              placeholder="Enter school name"
            />
            <div>
              <Input
                label="School Code (Optional)"
                value={formData.school_code}
                onChange={(e) => setFormData({ ...formData, school_code: e.target.value.toUpperCase() })}
                placeholder="Leave empty to auto-generate"
              />
              <p className="text-xs text-gray-500 mt-1">
                If left empty, a unique code will be auto-generated (e.g., LEAR-2041)
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                ✨ <strong>Auto-generated school codes</strong> are created using your school name + random digits, making them easy to share with parents and teachers.
              </p>
            </div>
            <Input
              label="School Email"
              type="email"
              value={formData.school_email}
              onChange={(e) => setFormData({ ...formData, school_email: e.target.value })}
              required
              placeholder="contact@school.com"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.school_phone}
              onChange={(e) => setFormData({ ...formData, school_phone: e.target.value })}
              placeholder="School phone number"
            />
            <Input
              label="Address"
              value={formData.school_address}
              onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
              placeholder="Street address"
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.school_city}
                onChange={(e) => setFormData({ ...formData, school_city: e.target.value })}
                placeholder="City"
              />
              <Input
                label="Province"
                value={formData.school_province}
                onChange={(e) => setFormData({ ...formData, school_province: e.target.value })}
                placeholder="Province"
              />
              <Input
                label="Postal Code"
                value={formData.school_postal_code}
                onChange={(e) => setFormData({ ...formData, school_postal_code: e.target.value })}
                placeholder="Postal code"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Admin Name"
              value={formData.admin_name}
              onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
              required
              placeholder="Full name"
            />
            <Input
              label="Admin Email"
              type="email"
              value={formData.admin_email}
              onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
              required
              placeholder="admin@school.com"
            />
            <Input
              label="Password"
              type="password"
              value={formData.admin_password}
              onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
              required
              placeholder="Minimum 6 characters"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={formData.admin_password_confirm}
              onChange={(e) => setFormData({ ...formData, admin_password_confirm: e.target.value })}
              required
              placeholder="Re-enter password"
            />
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                💡 The admin will receive these credentials to access their school portal.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Input
              label="Trial Period (Days)"
              type="number"
              value={formData.trial_days.toString()}
              onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 30 })}
              required
              min="1"
              max="365"
            />
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 mb-2">
                <strong>Trial Period:</strong> {formData.trial_days} days
              </p>
              <p className="text-xs text-green-700">
                The school will have full access for {formData.trial_days} days. After that, they'll need an active subscription.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-300"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-300"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Preview</h4>
              <div className="space-y-3">
                <div 
                  className="h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ background: `linear-gradient(to right, ${formData.primary_color}, ${formData.secondary_color})` }}
                >
                  School Portal Header
                </div>
                <div className="flex space-x-2">
                  <div 
                    className="flex-1 h-20 rounded-lg"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <div 
                    className="flex-1 h-20 rounded-lg"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="inline-block"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={48} className="text-white" />
              </div>
            </motion.div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">School Onboarded Successfully!</h3>
              <p className="text-gray-600">
                {result?.school?.name} is now ready to use
              </p>
            </div>

            {result?.school?.school_code && (
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">School Registration Code</p>
                <code className="text-3xl font-bold text-purple-600">{result.school.school_code}</code>
                <p className="text-xs text-gray-500 mt-2">Share this code with teachers and parents for registration</p>
              </div>
            )}

            {result?.admin && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Admin Credentials</h4>
                <p className="text-sm text-blue-800">Email: {result.admin.email}</p>
                <p className="text-xs text-blue-600 mt-1">Password was set during onboarding</p>
              </div>
            )}

            {result?.next_steps && (
              <div className="text-left p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Next Steps:</h4>
                <ul className="space-y-2">
                  {result.next_steps.map((step: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                      <Sparkles size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4 justify-center pt-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/platform/schools')}
              >
                View All Schools
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setSuccess(false);
                  setResult(null);
                  setFormData({
                    school_name: '',
                    school_code: '',
                    school_email: '',
                    school_phone: '',
                    school_address: '',
                    school_city: '',
                    school_province: '',
                    school_postal_code: '',
                    admin_name: '',
                    admin_email: '',
                    admin_password: '',
                    admin_password_confirm: '',
                    trial_days: 30,
                    plan_id: null,
                    primary_color: '#3B82F6',
                    secondary_color: '#8B5CF6',
                    logo_url: ''
                  });
                }}
              >
                Onboard Another School
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            School Onboarding Wizard
          </h1>
          <p className="text-gray-600">Set up a new school in just a few steps</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number || success;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : isActive
                          ? `bg-gradient-to-r ${step.color}`
                          : 'bg-gray-200'
                      }`}
                    >
                      <Icon size={24} className="text-white" />
                    </motion.div>
                    <p className={`text-xs font-medium ${isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </motion.div>
          )}

          {currentStep < 5 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="secondary"
                onClick={currentStep === 1 ? () => navigate('/platform/schools') : handleBack}
                disabled={loading}
              >
                <ArrowLeft size={16} className="mr-2" />
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? 'Processing...' : currentStep === 4 ? 'Complete Onboarding' : 'Next'}
                {!loading && currentStep < 4 && <ArrowRight size={16} className="ml-2" />}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SchoolOnboardingWizard;
