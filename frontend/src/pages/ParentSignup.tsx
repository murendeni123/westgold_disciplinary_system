import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  Check,
  Sparkles,
  Shield,
  Heart,
  CheckCircle2
} from 'lucide-react';

type Step = 'account' | 'school' | 'child' | 'complete';

const ParentSignup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState<Step>('account');
  
  // Account form data
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  
  // School linking
  const [schoolCode, setSchoolCode] = useState('');
  const [linkedSchool, setLinkedSchool] = useState<any>(null);
  
  // Child linking
  const [childLinkCode, setChildLinkCode] = useState('');
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = [
    { id: 'account', label: 'Create Account', icon: User },
    { id: 'school', label: 'Link School', icon: Building2 },
    { id: 'child', label: 'Link Child', icon: Users },
    { id: 'complete', label: 'Complete', icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  // Step 1: Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!accountData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!accountData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (accountData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.signup({
        name: accountData.name.trim(),
        email: accountData.email.trim().toLowerCase(),
        password: accountData.password,
        phone: accountData.phone.trim() || undefined,
      });

      // Auto-login after successful signup
      await login(accountData.email.trim().toLowerCase(), accountData.password);
      
      // Move to next step
      setCurrentStep('school');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Link School
  const handleLinkSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!schoolCode.trim()) {
      setError('Please enter a school code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.linkSchoolByCode(schoolCode.trim().toUpperCase());
      setLinkedSchool(response.data.school);
      setCurrentStep('child');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid school code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Link Child
  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!childLinkCode.trim()) {
      setError('Please enter a child link code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.linkChild(childLinkCode.trim().toUpperCase());
      setLinkedChildren([...linkedChildren, response.data.student]);
      setChildLinkCode('');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid link code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setCurrentStep('complete');
    // After a brief delay, navigate to dashboard
    setTimeout(() => {
      navigate('/parent');
    }, 2000);
  };

  const handleSkipChild = () => {
    if (linkedChildren.length === 0) {
      setError('Please link at least one child to continue');
      return;
    }
    handleComplete();
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        
        {/* Animated Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <GraduationCap size={32} />
              </div>
              <span className="text-2xl font-bold">PDS</span>
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Join Your Child's
              <br />
              <span className="text-yellow-300">Educational Journey</span>
            </h1>

            <p className="text-xl text-white/80 mb-12 max-w-md">
              Stay connected with your child's school, track their progress, and be part of their success story.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Secure & Private', desc: 'Your data is protected' },
                { icon: Heart, text: 'Stay Connected', desc: 'Real-time updates from school' },
                { icon: Sparkles, text: 'Track Progress', desc: 'Monitor achievements & growth' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <feature.icon size={24} className="text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.text}</p>
                    <p className="text-sm text-white/60">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12 bg-gradient-to-br from-gray-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto"
        >
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = getCurrentStepIndex() > index;
                
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb',
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted || isActive ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {isCompleted ? <Check size={20} /> : <StepIcon size={20} />}
                      </motion.div>
                      <span className={`text-xs mt-2 font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${
                        getCurrentStepIndex() > index ? 'bg-emerald-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 1: Account Creation */}
            {currentStep === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
                    <User className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
                  <p className="text-gray-600 mt-2">Let's start with your basic information</p>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <div className="relative">
                      <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={accountData.name}
                        onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                        required
                        placeholder="Enter your full name"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={accountData.email}
                        onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                        required
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone (Optional)</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={accountData.phone}
                        onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={accountData.password}
                        onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Create a password (min 6 characters)"
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Confirm your password"
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Link School */}
            {currentStep === 'school' && (
              <motion.div
                key="school"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
                    <Building2 className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Link Your School</h2>
                  <p className="text-gray-600 mt-2">Enter the school code provided by your child's school</p>
                </div>

                <form onSubmit={handleLinkSchool} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">School Code</label>
                    <div className="relative">
                      <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        required
                        placeholder="e.g., WS2025"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-center text-2xl font-mono tracking-widest uppercase"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Ask your child's school for their unique school code
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        <span>Link School</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-700">
                    <strong>💡 Tip:</strong> The school code is usually shared during enrollment or can be found in communications from the school.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Link Child */}
            {currentStep === 'child' && (
              <motion.div
                key="child"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
                    <Users className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Link Your Child</h2>
                  <p className="text-gray-600 mt-2">Enter the unique link code for your child</p>
                </div>

                {/* Linked School Info */}
                {linkedSchool && (
                  <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">School Linked</p>
                      <p className="text-emerald-800 font-semibold">{linkedSchool.name}</p>
                    </div>
                  </div>
                )}

                {/* Linked Children */}
                {linkedChildren.length > 0 && (
                  <div className="mb-6 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Linked Children:</p>
                    {linkedChildren.map((child, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center space-x-3"
                      >
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {child.first_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-purple-800">{child.first_name} {child.last_name}</p>
                          <p className="text-sm text-purple-600">Grade {child.grade_level}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleLinkChild} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Child Link Code</label>
                    <div className="relative">
                      <Users size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={childLinkCode}
                        onChange={(e) => setChildLinkCode(e.target.value.toUpperCase())}
                        placeholder="e.g., ABC123XY"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-center text-2xl font-mono tracking-widest uppercase"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      This code is provided by the school for each student
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        <span>Link Child</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </motion.button>
                </form>

                {linkedChildren.length > 0 && (
                  <motion.button
                    onClick={handleComplete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Complete Setup</span>
                    <CheckCircle2 size={20} />
                  </motion.button>
                )}

                <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-700">
                    <strong>💡 Tip:</strong> You can link multiple children. Just enter each child's unique code one at a time.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6 shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle2 className="text-white" size={48} />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h2>
                <p className="text-gray-600 mb-8">
                  Your account is ready. Redirecting to your dashboard...
                </p>

                <motion.div
                  className="w-16 h-1 bg-emerald-500 rounded-full mx-auto"
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ duration: 2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ParentSignup;
