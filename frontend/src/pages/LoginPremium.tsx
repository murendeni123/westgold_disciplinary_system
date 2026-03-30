import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { getSavedAccounts, removeAccount, formatLastLogin, SavedAccount } from '../utils/savedAccounts';
import PremiumInput from '../components/auth/PremiumInput';
import PremiumButton from '../components/auth/PremiumButton';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight,
  Shield,
  Users,
  Award,
  X,
  UserCircle,
  Zap,
  TrendingUp,
  Bell
} from 'lucide-react';

const LoginPremium: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { login, loginWithGoogle, isSupabaseEnabled } = useAuth();
  const { customizations, getImageUrl } = useSchoolTheme();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const accounts = getSavedAccounts();
    setSavedAccounts(accounts);
    setShowAccountSelection(accounts.length > 0);
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAccountSelect = (account: SavedAccount) => {
    setEmail(account.email);
    setSelectedAccount(account.email);
    setShowAccountSelection(false);
    setTimeout(() => {
      const passwordInput = document.getElementById('password-input');
      if (passwordInput) passwordInput.focus();
    }, 100);
  };

  const handleRemoveAccount = (accountEmail: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAccount(accountEmail);
    const accounts = getSavedAccounts();
    setSavedAccounts(accounts);
    if (accounts.length === 0) {
      setShowAccountSelection(false);
    }
    if (selectedAccount === accountEmail) {
      setEmail('');
      setSelectedAccount(null);
    }
  };

  const handleUseAnotherAccount = () => {
    setShowAccountSelection(false);
    setEmail('');
    setSelectedAccount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role || 'admin';
      
      if (role === 'parent') {
        const needsSchool = !user.school_id;
        const needsChildren = !user.children || user.children.length === 0;
        
        if (needsSchool || needsChildren) {
          navigate('/parent/onboarding');
          return;
        }
      }
      
      navigate(`/${role}`);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const welcomeMessage = customizations?.login_welcome_message || 'Welcome Back';
  const tagline = customizations?.login_tagline || 'Sign in to continue to your dashboard';
  const logoUrl = customizations?.logo_path ? getImageUrl(customizations.logo_path) : null;

  const features = [
    { icon: Shield, text: 'Secure & Private', gradient: 'from-emerald-500 to-teal-500' },
    { icon: Zap, text: 'Real-time Updates', gradient: 'from-yellow-500 to-orange-500' },
    { icon: TrendingUp, text: 'Track Progress', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Bell, text: 'Instant Alerts', gradient: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent" />
        
        {/* Animated Blobs */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Grid Pattern */}
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
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/50"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
              ) : (
                <GraduationCap className="text-white" size={32} />
              )}
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white">DMS</h1>
              <p className="text-gray-400 text-sm">Disciplinary Management System</p>
            </div>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Empowering
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-purple-400">
              Education Excellence
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
            A comprehensive platform for managing student behavior, tracking progress, and fostering positive school-home communication.
          </p>
        </motion.div>

        {/* Features Grid */}
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

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex items-center space-x-2 text-gray-400"
        >
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm">Trusted by schools worldwide</span>
        </motion.div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 shadow-2xl shadow-primary/50"
              whileHover={{ scale: 1.05 }}
            >
              <GraduationCap className="text-white" size={32} />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">DMS</h1>
          </div>

          {/* Glassmorphism Login Card */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm rounded-full mb-4 border border-primary/30"
              >
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium text-gray-200">Secure Login</span>
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">{welcomeMessage}</h2>
              <p className="text-gray-400">{tagline}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
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

              {/* Saved Accounts Section */}
              <AnimatePresence>
                {showAccountSelection && savedAccounts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-medium text-gray-300">Select Account</label>
                    <div className="space-y-2">
                      {savedAccounts.map((account, index) => (
                        <motion.button
                          key={account.email}
                          type="button"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleAccountSelect(account)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg">
                              {account.displayName?.charAt(0).toUpperCase() || account.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-white">{account.email}</p>
                              <p className="text-xs text-gray-400">{formatLastLogin(account.lastLogin)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAccount(account.email, e)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        </motion.button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleUseAnotherAccount}
                      className="w-full flex items-center justify-center space-x-2 p-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                    >
                      <UserCircle size={18} />
                      <span>Use another account</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <PremiumInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your email"
                label="Email Address"
                icon={Mail}
                isFocused={focusedField === 'email'}
                required
              />

              {/* Password Field */}
              <PremiumInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                label="Password"
                icon={Lock}
                isFocused={focusedField === 'password'}
                required
                id="password-input"
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

              {/* Submit Button */}
              <PremiumButton
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
                icon={ArrowRight}
              >
                Sign In
              </PremiumButton>

              {/* Google Sign In */}
              {isSupabaseEnabled && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-gray-400">or continue with</span>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={async () => {
                      try {
                        setError('');
                        await loginWithGoogle();
                      } catch (err: any) {
                        setError(err.message);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </motion.button>
                </>
              )}

              {/* Sign Up Link */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-gray-400">new here?</span>
                </div>
              </div>

              <Link to="/signup">
                <PremiumButton
                  type="button"
                  variant="secondary"
                  icon={ArrowRight}
                >
                  Sign up as Parent
                </PremiumButton>
              </Link>
            </form>
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

export default LoginPremium;
