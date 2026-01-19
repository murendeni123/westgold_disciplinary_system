import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import { motion } from 'framer-motion';
import { Save, Lock, User, Settings as SettingsIcon, CheckCircle, AlertCircle, Building2, Users, Plus } from 'lucide-react';
import Input from '../../components/Input';

const ModernSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { students } = useParentStudents();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'school'>('profile');
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  // School & Children state
  const [linkedSchools, setLinkedSchools] = useState<any[]>([]);
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [loadingSchoolData, setLoadingSchoolData] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: profile?.full_name || '',
        email: user.email || '',
      });
    }
  }, [user, profile]);

  // Fetch linked schools and children when school tab is active
  useEffect(() => {
    const fetchSchoolData = async () => {
      if (activeTab !== 'school' || profile?.role !== 'parent') return;
      
      setLoadingSchoolData(true);
      try {
        // Fetch linked schools
        const schoolsRes = await api.getLinkedSchools();
        setLinkedSchools(schoolsRes.data || []);

        // Fetch children (students linked to this parent)
        try {
          const studentsRes = await api.getStudents();
          const myChildren = studentsRes.data?.filter?.((s: any) => s.parent_id === user?.id) || [];
          setLinkedChildren(myChildren);
        } catch {
          setLinkedChildren([]);
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
      } finally {
        setLoadingSchoolData(false);
      }
    };

    fetchSchoolData();
  }, [activeTab, user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileData.name.trim() || !profileData.email.trim()) {
      setProfileError('Name and email are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      setProfileError('Please enter a valid email address');
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await api.updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase(),
      });
      setProfileSuccess('Profile updated successfully!');
      await refreshProfile();
    } catch (error: any) {
      setProfileError(error.response?.data?.error || 'Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 mb-4"
          >
            <SettingsIcon className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Settings</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <ModernCard variant="glass">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User size={18} />
                <span>Profile</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Lock size={18} />
                <span>Password</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('school')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === 'school'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 size={18} />
                <span>School & Children</span>
              </motion.button>
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <Input
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                />
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Role</p>
                  <p className="text-lg font-bold capitalize text-gray-900">{user?.role}</p>
                </div>
                {students && students.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-2">Linked Children</p>
                    <p className="text-lg font-bold text-gray-900">{students.length} child(ren)</p>
                  </div>
                )}
                {profileError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3"
                  >
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-800 text-sm">{profileError}</p>
                  </motion.div>
                )}
                {profileSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-3"
                  >
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-green-800 text-sm">{profileSuccess}</p>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={updatingProfile}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  <span>{updatingProfile ? 'Updating...' : 'Update Profile'}</span>
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3"
                  >
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-800 text-sm">{passwordError}</p>
                  </motion.div>
                )}
                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-3"
                  >
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-green-800 text-sm">{passwordSuccess}</p>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={changingPassword}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Lock size={20} />
                  <span>{changingPassword ? 'Changing Password...' : 'Change Password'}</span>
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* School & Children Tab */}
          {activeTab === 'school' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {loadingSchoolData ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Linked Schools Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Building2 size={20} className="text-blue-600" />
                        <span>Linked Schools</span>
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/parent/link-school')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        <Plus size={16} />
                        <span>Link Another School</span>
                      </motion.button>
                    </div>
                    
                    {linkedSchools.length > 0 ? (
                      <div className="grid gap-3">
                        {linkedSchools.map((school: any) => (
                          <div
                            key={school.id}
                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <Building2 size={20} className="text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{school.name}</p>
                                <p className="text-sm text-gray-500">{school.email || 'No email'}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              school.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {school.status || 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-xl text-center">
                        <Building2 size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">No schools linked yet</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/parent/link-school')}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                        >
                          Link Your First School
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Linked Children Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Users size={20} className="text-purple-600" />
                        <span>Linked Children</span>
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/parent/link-child')}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        <Plus size={16} />
                        <span>Link Another Child</span>
                      </motion.button>
                    </div>
                    
                    {linkedChildren.length > 0 ? (
                      <div className="grid gap-3">
                        {linkedChildren.map((child: any) => (
                          <div
                            key={child.id}
                            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                <Users size={20} className="text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {child.first_name} {child.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {child.grade_level || 'No grade'} • ID: {child.student_id}
                                </p>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/parent/children/${child.id}`)}
                              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium"
                            >
                              View Profile
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-xl text-center">
                        <Users size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">No children linked yet</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/parent/link-child')}
                          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                        >
                          Link Your First Child
                        </motion.button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </ModernCard>
      </motion.div>
    </motion.div>
  );
};

export default ModernSettings;

