import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PremiumInput from '../components/auth/PremiumInput';
import PremiumButton from '../components/auth/PremiumButton';
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
  CheckCircle2,
  Zap,
  TrendingUp,
  Bell
} from 'lucide-react';

type Step = 'welcome' | 'account' | 'verification' | 'school' | 'child' | 'complete';

const ParentSignup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signupWithGoogle, signupWithEmail, verifyOtp, resendVerificationEmail, isSupabaseEnabled, user } = useAuth();
  
  const getInitialStep = (): Step => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'school' || stepParam === 'child' || stepParam === 'complete') {
      return stepParam as Step;
    }
    return 'welcome';
  };
  
  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'school' || stepParam === 'child' || stepParam === 'complete') {
      setCurrentStep(stepParam as Step);
    }
  }, [searchParams]);
  
  const [schoolCode, setSchoolCode] = useState('');
  const [linkedSchool, setLinkedSchool] = useState<any>(null);
  const [childLinkCode, setChildLinkCode] = useState('');
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  
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
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showSchoolSuccess, setShowSchoolSuccess] = useState(false);
  const [showChildSuccess, setShowChildSuccess] = useState(false);
  const [lastLinkedChild, setLastLinkedChild] = useState<any>(null);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      if (isSupabaseEnabled) {
        const result = await signupWithEmail(
          accountData.email.trim().toLowerCase(),
          accountData.password,
          accountData.name.trim()
        );
        
        if (result?.requiresVerification) {
          setVerificationEmail(accountData.email.trim().toLowerCase());
          setCurrentStep('verification');
        } else {
          navigate('/parent/onboarding');
        }
      } else {
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

        await login(accountData.email.trim().toLowerCase(), accountData.password);
        navigate('/parent/onboarding');
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      navigate('/parent/onboarding');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setResendingCode(true);
    setResendSuccess(false);

    try {
      await resendVerificationEmail(verificationEmail);
      setResendSuccess(true);
      setOtpCode('');
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResendingCode(false);
    }
  };

  const features = [
    { icon: Shield, text: 'Secure & Private', gradient: 'from-emerald-500 to-teal-500' },
    { icon: Heart, text: 'Stay Connected', gradient: 'from-pink-500 to-rose-500' },
    { icon: Sparkles, text: 'Track Progress', gradient: 'from-yellow-500 to-orange-500' },
    { icon: Bell, text: 'Instant Alerts', gradient: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent" />
        
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-12 xl:px-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/50"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <GraduationCap className="text-white" size={32} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white">DMS</h1>
              <p className="text-gray-400 text-sm">Disciplinary Management System</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Join Your Child's
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Educational Journey
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
            Stay connected with your child's school, track their progress, and be part of their success story.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 max-w-lg"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                <feature.icon className="text-white" size={24} />
              </div>
              <span className="text-white font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex items-center space-x-2 text-gray-400"
        >
          <Sparkles size={16} className="text-emerald-400" />
          <span className="text-sm">Trusted by schools worldwide</span>
        </motion.div>
      </motion.div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md my-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-2xl shadow-emerald-500/50"
              whileHover={{ scale: 1.05 }}
            >
              <GraduationCap className="text-white" size={32} />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">DMS</h1>
          </div>

          {/* Glassmorphism Card */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <AnimatePresence mode="wait">
              {/* Welcome Step */}
              {currentStep === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full mb-4 border border-emerald-500/30"
                    >
                      <Sparkles size={16} className="text-emerald-400" />
                      <span className="text-sm font-medium text-gray-200">Parent Portal</span>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-3">Welcome to DMS!</h2>
                    <p className="text-gray-300">
                      Your one-stop portal to track your child's progress, attendance, and behavior at school.
                    </p>
                  </div>

                  <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-emerald-500/30">
                    <p className="text-sm font-semibold text-white mb-4">
                      What you'll be able to do:
                    </p>
                    <ul className="space-y-3 text-sm text-gray-300">
                      {[
                        'View your child\'s attendance records in real-time',
                        'Track behavior incidents and merits',
                        'Receive instant notifications about important updates',
                        'Communicate directly with teachers and administrators'
                      ].map((item, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <PremiumButton
                    onClick={() => setCurrentStep('account')}
                    variant="primary"
                    icon={ArrowRight}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/40"
                  >
                    Get Started
                  </PremiumButton>

                  <p className="text-center text-sm text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* Account Creation Step - Simplified for brevity */}
              {currentStep === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-h-[70vh] overflow-y-auto pr-2"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
                    <p className="text-gray-400 mt-2">Let's start with your basic information</p>
                  </div>

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
                        className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all mb-6"
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
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-transparent text-gray-400">Or sign up with email</span>
                        </div>
                      </div>
                    </>
                  )}

                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center space-x-2"
                        >
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <PremiumInput
                      type="text"
                      value={accountData.name}
                      onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your full name"
                      label="Full Name"
                      icon={User}
                      isFocused={focusedField === 'name'}
                      required
                    />

                    <PremiumInput
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your email"
                      label="Email Address"
                      icon={Mail}
                      isFocused={focusedField === 'email'}
                      required
                    />

                    <PremiumInput
                      type="tel"
                      value={accountData.phone}
                      onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your phone number"
                      label="Phone"
                      icon={Phone}
                      isFocused={focusedField === 'phone'}
                      required
                    />

                    <PremiumInput
                      type="text"
                      value={accountData.relationship_to_child}
                      onChange={(e) => setAccountData({ ...accountData, relationship_to_child: e.target.value })}
                      onFocus={() => setFocusedField('relationship')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g., Mother, Father, Legal Guardian"
                      label="Relationship to Child"
                      icon={Users}
                      isFocused={focusedField === 'relationship'}
                      required
                    />

                    <div className="pt-2">
                      <p className="text-sm font-semibold text-emerald-400">Emergency Contact 1</p>
                    </div>

                    <PremiumInput
                      type="text"
                      value={accountData.emergency_contact_1_name}
                      onChange={(e) => setAccountData({ ...accountData, emergency_contact_1_name: e.target.value })}
                      placeholder="Enter emergency contact name"
                      label="Name"
                      icon={User}
                      required
                    />

                    <PremiumInput
                      type="tel"
                      value={accountData.emergency_contact_1_phone}
                      onChange={(e) => setAccountData({ ...accountData, emergency_contact_1_phone: e.target.value })}
                      placeholder="Enter emergency contact phone"
                      label="Phone"
                      icon={Phone}
                      required
                    />

                    <div className="pt-2">
                      <p className="text-sm font-semibold text-emerald-400">Emergency Contact 2</p>
                    </div>

                    <PremiumInput
                      type="text"
                      value={accountData.emergency_contact_2_name}
                      onChange={(e) => setAccountData({ ...accountData, emergency_contact_2_name: e.target.value })}
                      placeholder="Enter emergency contact name"
                      label="Name"
                      icon={User}
                      required
                    />

                    <PremiumInput
                      type="tel"
                      value={accountData.emergency_contact_2_phone}
                      onChange={(e) => setAccountData({ ...accountData, emergency_contact_2_phone: e.target.value })}
                      placeholder="Enter emergency contact phone"
                      label="Phone"
                      icon={Phone}
                      required
                    />

                    <div className="pt-2">
                      <p className="text-sm font-semibold text-emerald-400">Home Address</p>
                    </div>

                    <PremiumInput
                      type="text"
                      value={accountData.home_address}
                      onChange={(e) => setAccountData({ ...accountData, home_address: e.target.value })}
                      placeholder="Street address"
                      label="Address"
                      icon={Building2}
                      required
                    />

                    <PremiumInput
                      type={showPassword ? 'text' : 'password'}
                      value={accountData.password}
                      onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      label="Password"
                      icon={Lock}
                      isFocused={focusedField === 'password'}
                      required
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      }
                    />

                    <PremiumInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Confirm your password"
                      label="Confirm Password"
                      icon={Lock}
                      isFocused={focusedField === 'confirmPassword'}
                      required
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      }
                    />

                    <div className="flex gap-3 pt-4">
                      <PremiumButton
                        type="button"
                        onClick={() => setCurrentStep('welcome')}
                        variant="outline"
                        icon={ArrowLeft}
                        iconPosition="left"
                        className="flex-1"
                      >
                        Back
                      </PremiumButton>
                      <PremiumButton
                        type="submit"
                        disabled={loading}
                        loading={loading}
                        variant="primary"
                        icon={ArrowRight}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/40"
                      >
                        Create Account
                      </PremiumButton>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-gray-500 text-sm"
          >
            <p>© 2026 DMS. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ParentSignup;
