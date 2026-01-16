import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  Users,
  Phone,
  ArrowRight,
  ArrowLeft,
  Building2,
  Sparkles,
  Shield,
  Heart,
  Check,
  CheckCircle2
} from 'lucide-react';

type Step = 'welcome' | 'account' | 'verification' | 'school' | 'child' | 'complete';

const ParentSignup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signupWithGoogle, signupWithEmail, verifyOtp, resendVerificationEmail, isSupabaseEnabled, user } = useAuth();
  
  // Get initial step from URL query parameter (for OAuth redirect)
  const getInitialStep = (): Step => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'school' || stepParam === 'child' || stepParam === 'complete') {
      return stepParam as Step;
    }
    return 'welcome';
  };
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep);
  
  // Update step when URL parameter changes (for redirects from OnboardingGuard)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'school' || stepParam === 'child' || stepParam === 'complete') {
      setCurrentStep(stepParam as Step);
    }
  }, [searchParams]);
  
  // School linking
  const [schoolCode, setSchoolCode] = useState('');
  const [linkedSchool, setLinkedSchool] = useState<any>(null);
  
  // Child linking
  const [childLinkCode, setChildLinkCode] = useState('');
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  
  // Account form data
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    work_phone: '',
    relationship_to_child: '',
    emergency_contact_1_name: '',
    emergency_contact_1_phone: '',
    emergency_contact_2_name: '',
    emergency_contact_2_phone: '',
    home_address: '',
    city: '',
    postal_code: '',
  });
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email for verification message
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Success popup states
  const [showSchoolSuccess, setShowSchoolSuccess] = useState(false);
  const [showChildSuccess, setShowChildSuccess] = useState(false);
  const [lastLinkedChild, setLastLinkedChild] = useState<any>(null);

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

    if (!accountData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!accountData.relationship_to_child.trim()) {
      setError('Relationship to child is required');
      return;
    }

    if (!accountData.emergency_contact_1_name.trim() || !accountData.emergency_contact_1_phone.trim()) {
      setError('Emergency contact 1 name and phone are required');
      return;
    }

    if (!accountData.emergency_contact_2_name.trim() || !accountData.emergency_contact_2_phone.trim()) {
      setError('Emergency contact 2 name and phone are required');
      return;
    }

    if (!accountData.home_address.trim()) {
      setError('Home address is required');
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
      // Use Supabase Auth if enabled, otherwise fall back to legacy API
      if (isSupabaseEnabled) {
        const result = await signupWithEmail(
          accountData.email.trim().toLowerCase(),
          accountData.password,
          accountData.name.trim()
        );
        
        if (result?.requiresVerification) {
          // Email verification required - show verification pending screen
          setVerificationEmail(accountData.email.trim().toLowerCase());
          setCurrentStep('verification');
        } else {
          // Auto-confirmed, redirect to parent onboarding
          navigate('/parent/onboarding');
        }
      } else {
        // Legacy signup flow (without Supabase)
        await api.signup({
          name: accountData.name.trim(),
          email: accountData.email.trim().toLowerCase(),
          password: accountData.password,
          phone: accountData.phone.trim(),
          work_phone: accountData.work_phone.trim() || undefined,
          relationship_to_child: accountData.relationship_to_child.trim(),
          emergency_contact_1_name: accountData.emergency_contact_1_name.trim(),
          emergency_contact_1_phone: accountData.emergency_contact_1_phone.trim(),
          emergency_contact_2_name: accountData.emergency_contact_2_name.trim(),
          emergency_contact_2_phone: accountData.emergency_contact_2_phone.trim(),
          home_address: accountData.home_address.trim(),
          city: accountData.city.trim() || undefined,
          postal_code: accountData.postal_code.trim() || undefined,
        });

        // Auto-login after successful signup
        await login(accountData.email.trim().toLowerCase(), accountData.password);
        
        // Redirect to parent onboarding
        navigate('/parent/onboarding');
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.length !== 8) {
      setError('Please enter a valid 8-digit verification code');
      return;
    }

    setVerifyingOtp(true);

    try {
      await verifyOtp(verificationEmail, otpCode.trim());
      // After successful verification, redirect to parent onboarding
      navigate('/parent/onboarding');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    setError('');
    setResendingCode(true);
    setResendSuccess(false);

    try {
      await resendVerificationEmail(verificationEmail);
      setResendSuccess(true);
      setOtpCode(''); // Clear the old code
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResendingCode(false);
    }
  };

  // Step 3: Link School
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
      // Show success popup
      setShowSchoolSuccess(true);
      // Move to child step after showing popup
      setTimeout(() => {
        setShowSchoolSuccess(false);
        setCurrentStep('child');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid school code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Link Child
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
      const newChild = response.data.student;
      setLinkedChildren([...linkedChildren, newChild]);
      setLastLinkedChild(newChild);
      setChildLinkCode('');
      setError('');
      // Show success popup
      setShowChildSuccess(true);
      setTimeout(() => {
        setShowChildSuccess(false);
      }, 2000);
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
          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg shadow-emerald-500/30">
                    <GraduationCap className="text-white" size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to PDS!</h2>
                  <p className="text-gray-600 text-lg">
                    Your one-stop portal to track your child's progress, attendance, and behavior at school.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    What you'll be able to do:
                  </p>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span>View your child's attendance records in real-time</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span>Track behavior incidents and merits</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span>Receive instant notifications about important updates</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span>Communicate directly with teachers and administrators</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <p className="text-center text-gray-600 text-sm mb-2">
                    Let's get you set up in just a few steps
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                    <span className="flex items-center space-x-1">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                      <span>Account</span>
                    </span>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                    <span className="flex items-center space-x-1">
                      <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">2</div>
                      <span>School</span>
                    </span>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                    <span className="flex items-center space-x-1">
                      <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">3</div>
                      <span>Child</span>
                    </span>
                  </div>

                  <motion.button
                    onClick={() => setCurrentStep('account')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight size={20} />
                  </motion.button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

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

                {/* Google Sign Up Button */}
                {isSupabaseEnabled && (
                  <>
                    <motion.button
                      type="button"
                      onClick={async () => {
                        try {
                          setError('');
                          await signupWithGoogle();
                        } catch (err: any) {
                          setError(err.message);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Sign up with Google</span>
                    </motion.button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gradient-to-br from-gray-50 to-white text-gray-500">Or sign up with email</span>
                      </div>
                    </div>
                  </>
                )}

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
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={accountData.phone}
                        onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                        required
                        placeholder="Enter your phone number"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Work Phone (Optional)</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={accountData.work_phone}
                        onChange={(e) => setAccountData({ ...accountData, work_phone: e.target.value })}
                        placeholder="Enter your work phone number"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Relationship to Child</label>
                    <div className="relative">
                      <Users size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={accountData.relationship_to_child}
                        onChange={(e) => setAccountData({ ...accountData, relationship_to_child: e.target.value })}
                        required
                        placeholder="e.g., Mother, Father, Legal Guardian"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-semibold text-gray-900">Emergency Contact 1</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <div className="relative">
                      <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={accountData.emergency_contact_1_name}
                        onChange={(e) => setAccountData({ ...accountData, emergency_contact_1_name: e.target.value })}
                        required
                        placeholder="Enter emergency contact name"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={accountData.emergency_contact_1_phone}
                        onChange={(e) => setAccountData({ ...accountData, emergency_contact_1_phone: e.target.value })}
                        required
                        placeholder="Enter emergency contact phone"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-semibold text-gray-900">Emergency Contact 2</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <div className="relative">
                      <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={accountData.emergency_contact_2_name}
                        onChange={(e) => setAccountData({ ...accountData, emergency_contact_2_name: e.target.value })}
                        required
                        placeholder="Enter emergency contact name"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={accountData.emergency_contact_2_phone}
                        onChange={(e) => setAccountData({ ...accountData, emergency_contact_2_phone: e.target.value })}
                        required
                        placeholder="Enter emergency contact phone"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-semibold text-gray-900">Home Address</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <div className="relative">
                      <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={accountData.home_address}
                        onChange={(e) => setAccountData({ ...accountData, home_address: e.target.value })}
                        required
                        placeholder="Street address"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">City (Optional)</label>
                      <input
                        type="text"
                        value={accountData.city}
                        onChange={(e) => setAccountData({ ...accountData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Postal Code (Optional)</label>
                      <input
                        type="text"
                        value={accountData.postal_code}
                        onChange={(e) => setAccountData({ ...accountData, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
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

            {/* Step 1.5: Email Verification Pending */}
            {currentStep === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
                    <Mail className="text-white" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                  <p className="text-gray-600">
                    We've sent a verification link to
                  </p>
                  <p className="text-blue-600 font-semibold mt-1">{verificationEmail}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Mail className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Two ways to verify:</h3>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li>Click the verification link in the email, OR</li>
                        <li>Enter the 6-digit code from the email below</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* OTP Input Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-4 mb-6">
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
                    <label className="text-sm font-medium text-gray-700 text-center block">
                      Or enter your verification code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="00000000"
                      maxLength={8}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-center text-3xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 8-digit code from your email
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={verifyingOtp || otpCode.length !== 8}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyingOtp ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <CheckCircle2 size={20} />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Resend Success Message */}
                {resendSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4"
                  >
                    ✓ New verification code sent! Check your email.
                  </motion.div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>Code expired or didn't receive the email?</strong>
                  </p>
                  <button
                    onClick={handleResendCode}
                    disabled={resendingCode}
                    className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendingCode ? 'Sending...' : 'Resend Verification Code'}
                  </button>
                  <p className="text-xs text-amber-700 mt-2">
                    Or check your spam folder, or{' '}
                    <button 
                      onClick={() => setCurrentStep('account')}
                      className="text-amber-800 underline hover:text-amber-900"
                    >
                      try signing up again
                    </button>
                  </p>
                </div>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Already verified? Sign in here
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Step 3: Link School */}
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

                <button
                  onClick={() => setCurrentStep('account')}
                  className="mt-4 flex items-center justify-center space-x-2 text-gray-500 hover:text-gray-700 w-full"
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm">Back to account</span>
                </button>
              </motion.div>
            )}

            {/* Step 4: Link Child */}
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

            {/* Step 5: Complete */}
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

      {/* School Success Popup */}
      <AnimatePresence>
        {showSchoolSuccess && linkedSchool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg"
              >
                <CheckCircle2 className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">School Linked!</h3>
              <p className="text-gray-600 mb-2">Successfully linked to</p>
              <p className="text-emerald-600 font-bold text-lg">{linkedSchool.name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Child Success Popup */}
      <AnimatePresence>
        {showChildSuccess && lastLinkedChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4 shadow-lg"
              >
                <Users className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Child Linked!</h3>
              <p className="text-gray-600 mb-2">Successfully linked</p>
              <p className="text-purple-600 font-bold text-lg">
                {lastLinkedChild.first_name} {lastLinkedChild.last_name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParentSignup;
