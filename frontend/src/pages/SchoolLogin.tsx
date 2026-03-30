import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  Shield,
  Users,
  Award,
  AlertCircle
} from 'lucide-react';

// Helper function to get full image URL
const getImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const hostname = window.location.hostname;
  const backendUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
    ? 'http://192.168.18.160:5000'
    : 'http://localhost:5000';
  return `${backendUrl}${path}`;
};

const SchoolLogin: React.FC = () => {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; code: string; schemaName?: string } | null>(null);
  const { login, loginWithGoogle, isSupabaseEnabled } = useAuth();
  const { theme, isPreviewMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const fetchSchoolInfo = async () => {
      if (!schoolSlug) {
        navigate('/');
        return;
      }

      try {
        setLoadingSchool(true);
        const response = await api.getSchoolBySlug(schoolSlug);
        setSchoolInfo(response.data);
      } catch (err: any) {
        console.error('Error fetching school info:', err);
        setError('School not found. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoadingSchool(false);
      }
    };

    fetchSchoolInfo();

    return () => {
      document.body.style.overflow = '';
    };
  }, [schoolSlug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Store school code in localStorage for backend to use during login
      if (schoolInfo?.code) {
        localStorage.setItem('selectedSchoolCode', schoolInfo.code);
      }
      
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

  const getSchoolInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const features = [
    { icon: Shield, text: 'Secure & Private', color: 'from-secondary0 to-surface0' },
    { icon: Users, text: 'Family Connected', color: 'from-secondary0 to-secondary' },
    { icon: Award, text: 'Track Progress', color: 'from-primary0 to-surface0' },
  ];

  if (loadingSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface to-gray-100">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-muted">Loading school information...</p>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center space-x-2 text-red-600"
            >
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (!schoolInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface to-gray-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary mb-2">School Not Found</h2>
          <p className="text-muted mb-4">The school you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-secondary text-white rounded-xl hover:bg-secondary transition-colors"
          >
            Back to School Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background - Banner Image or Gradient */}
        {theme?.login?.bannerUrl ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${getImageUrl(theme.login.bannerUrl)})`,
              }}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60" />
          </>
        ) : (
          <>
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-indigo-600 to-secondary" />
            
            {/* Animated Pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </>
        )}

        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-surface/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* School Logo/Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-4">
              {theme?.brand?.logoUrl ? (
                <motion.div 
                  className="w-16 h-16 bg-surface/20 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <img 
                    src={getImageUrl(theme.brand.logoUrl) || ''} 
                    alt="School Logo" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  className="w-16 h-16 bg-surface/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <span className="text-white text-xl font-bold">
                    {getSchoolInitials(schoolInfo.name)}
                  </span>
                </motion.div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {theme?.brand?.schoolName || schoolInfo.name}
                </h1>
                <p className="text-white/70 text-sm">{schoolInfo.code}</p>
              </div>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-primary leading-tight mb-4">
              {theme?.login?.headline || 'Welcome Back to'}
              {!theme?.login?.headline && (
                <>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300">
                    {schoolInfo.name}
                  </span>
                </>
              )}
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              {theme?.login?.subtext || 'Sign in to access your personalized dashboard and manage student discipline effectively.'}
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                  <feature.icon className="text-white" size={24} />
                </div>
                <span className="text-white font-medium text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute bottom-12 left-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center space-x-2 text-white/50 text-sm">
              <Sparkles size={16} />
              <span>Powered by GREENSTEM DMS</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface relative">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Back Button */}
          <motion.button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center space-x-2 text-muted hover:text-blue-600 transition-colors"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Change School</span>
          </motion.button>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary rounded-2xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-white text-xl font-bold">
                {getSchoolInitials(schoolInfo.name)}
              </span>
            </motion.div>
            <h1 className="text-xl font-bold text-primary">{schoolInfo.name}</h1>
            <p className="text-muted text-sm">{schoolInfo.code}</p>
          </div>

          {/* Login Card */}
          <motion.div
            className="bg-surface rounded-3xl shadow-2xl p-8 border border-gray-100"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-secondary to-purple-100 rounded-full mb-4"
              >
                <Sparkles size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Secure Login</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-primary mb-2">Welcome Back</h2>
              <p className="text-muted">Sign in to continue to your dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-surface0 rounded-full" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Email Address</label>
                <div className={`relative rounded-xl transition-all duration-300 ${
                  focusedField === 'email' 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : ''
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className={`transition-colors ${
                      focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-4 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:bg-surface transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Password</label>
                <div className={`relative rounded-xl transition-all duration-300 ${
                  focusedField === 'password' 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : ''
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className={`transition-colors ${
                      focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:bg-surface transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-muted transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-secondary via-indigo-600 to-secondary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <motion.div
                    className="w-6 h-6 border-2 border-border border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              {/* Google Sign In Button */}
              {isSupabaseEnabled && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-surface text-muted">or continue with</span>
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
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-surface border-2 border-gray-200 rounded-xl font-semibold text-text hover:bg-surface hover:border-gray-300 transition-all shadow-md"
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
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface text-muted">new here?</span>
                </div>
              </div>

              <Link to="/signup">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Sign up as Parent</span>
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-gray-400 text-sm"
          >
            <p>© 2026 GREENSTEM DMS. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SchoolLogin;
