import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Search, 
  ArrowRight,
  Sparkles,
  Clock,
  Building2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface School {
  id: number;
  name: string;
  slug: string;
  code: string;
  subdomain?: string;
  logo?: string;
}

const SchoolSelect: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [recentSchools, setRecentSchools] = useState<School[]>([]);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getPublicSchoolsList();
        const fetchedSchools = response.data;
        setSchools(fetchedSchools);

        // Load recent schools from localStorage
        const recentSlugs = JSON.parse(localStorage.getItem('recentSchools') || '[]');
        const recent = fetchedSchools.filter((school: School) => recentSlugs.includes(school.slug));
        setRecentSchools(recent);
      } catch (err: any) {
        console.error('Error fetching schools:', err);
        setError('Failed to load schools. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    
    const query = searchQuery.toLowerCase();
    return schools.filter((school: School) => 
      school.name.toLowerCase().includes(query) ||
      school.code.toLowerCase().includes(query)
    );
  }, [searchQuery, schools]);

  const handleSchoolSelect = (school: School) => {
    // Save to localStorage
    const recentSlugs = JSON.parse(localStorage.getItem('recentSchools') || '[]');
    const updatedRecent = [school.slug, ...recentSlugs.filter((s: string) => s !== school.slug)].slice(0, 3);
    localStorage.setItem('recentSchools', JSON.stringify(updatedRecent));
    localStorage.setItem('lastSchoolSlug', school.slug);
    
    // Navigate to school-specific login
    navigate(`/s/${school.slug}/login`);
  };

  const getSchoolInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-indigo-600 to-secondary" />
        
        {/* Animated Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

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
        <motion.div
          className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-16 h-16 bg-surface/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <GraduationCap className="text-white" size={32} />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-primary">GREENSTEM DMS</h1>
                <p className="text-white/70 text-sm">Disciplinary Management System</p>
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
              Welcome to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300">
                GREENSTEM DMS
              </span>
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              Select your school to continue to your personalized dashboard and access all your discipline management tools.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span>Secure multi-school platform</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span>Personalized school experience</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span>Quick access to your data</span>
            </div>
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
              <span>Trusted by schools nationwide</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - School Selection */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-surface to-gray-100 relative overflow-y-auto">
        {/* Subtle Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl relative z-10 my-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary rounded-2xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <GraduationCap className="text-white" size={32} />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary">GREENSTEM DMS</h1>
            <p className="text-muted text-sm">Select your school</p>
          </div>

          {/* Selection Card */}
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
                <Building2 size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">School Selection</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-primary mb-2">Select Your School</h2>
              <p className="text-muted">Choose your school to continue</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by school name or code..."
                  className="w-full pl-12 pr-4 py-4 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-surface transition-all"
                />
              </div>
            </div>

            {/* Recently Used Section */}
            {recentSchools.length > 0 && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Clock size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-primary">Recently Used</h3>
                </div>
                <div className="space-y-2">
                  {recentSchools.map((school, index) => (
                    <motion.button
                      key={school.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSchoolSelect(school)}
                      onFocus={() => setFocusedCard(school.id)}
                      onBlur={() => setFocusedCard(null)}
                      className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-secondary to-purple-50 hover:from-secondary hover:to-purple-100 border-2 rounded-xl transition-all group ${
                        focusedCard === school.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary0 to-secondary flex items-center justify-center text-white font-bold shadow-lg">
                          {getSchoolInitials(school.name)}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-primary">{school.name}</p>
                          <p className="text-xs text-muted">{school.code}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-blue-600 group-hover:translate-x-1 transition-transform" size={20} />
                    </motion.button>
                  ))}
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-xs text-muted mb-3">All Schools</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-surface border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2"
              >
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <motion.div
                  className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-muted">Loading schools...</p>
              </div>
            )}

            {/* Schools Grid */}
            {!loading && !error && (
              <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {filteredSchools.length > 0 ? (
                  <motion.div
                    key="schools-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {filteredSchools.map((school, index) => (
                      <motion.button
                        key={school.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSchoolSelect(school)}
                        onFocus={() => setFocusedCard(school.id)}
                        onBlur={() => setFocusedCard(null)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 bg-surface border-2 rounded-xl transition-all text-left group ${
                          focusedCard === school.id 
                            ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary0 to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                            {getSchoolInitials(school.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text text-sm truncate group-hover:text-blue-600 transition-colors">
                              {school.name}
                            </p>
                            <p className="text-xs text-muted mt-0.5">{school.code}</p>
                          </div>
                          <ArrowRight 
                            className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" 
                            size={16} 
                          />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-2">No schools found</h3>
                    <p className="text-muted text-sm">
                      Try adjusting your search query
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default SchoolSelect;
