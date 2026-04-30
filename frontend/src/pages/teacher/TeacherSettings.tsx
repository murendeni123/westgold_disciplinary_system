import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import PasswordChangeForm from '../../components/PasswordChangeForm';
import { motion } from 'framer-motion';
import { Save, Lock, User, Settings, Building2, Bell } from 'lucide-react';
import UserPreferencesPanel from '../../components/UserPreferencesPanel';
import { useToast } from '../../hooks/useToast';

const TeacherSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [teacherData, setTeacherData] = useState<any>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);


  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.teacher?.phone || '',
      });
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    try {
      if (!user?.id) return;
      const response = await api.getTeacher(user.id);
      console.log('Teacher data with school:', response.data);
      setTeacherData(response.data);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.name.trim() || !profileData.email.trim()) {
      error('Name and email are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      error('Please enter a valid email address');
      return;
    }

    setUpdatingProfile(true);
    try {
      // Update user profile
      const response = await api.updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase(),
      });
      
      // Update teacher phone if changed
      if (profileData.phone !== (user?.teacher?.phone || '')) {
        try {
          await api.updateTeacher(user?.teacher?.id || user?.id, {
            phone: profileData.phone.trim() || null,
          });
        } catch (error) {
          console.error('Error updating teacher phone:', error);
        }
      }

      success('Profile updated successfully!');
      if (updateUser && response.data.user) {
        updateUser(response.data.user);
      }
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };


  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-text-muted mt-2 text-lg">Manage your account settings and preferences</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card-bg backdrop-blur-xl shadow-card border border-border-line p-6"
      >
        <div className="border-b border-border-line mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'password', label: 'Password', icon: Lock },
              { id: 'preferences', label: 'Preferences', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-accent-green text-accent-green'
                      : 'border-transparent text-text-muted hover:text-text-main hover:border-border-line'
                  }`}
                >
                  <Icon className="inline-block w-4 h-4 mr-2" />
                  {tab.label}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-main">Profile Information</h2>
              <User className="text-accent-green" size={24} />
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <Input
                label="Full Name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                placeholder="Enter your full name"
                className="rounded-xl"
              />
              <Input
                label="Email Address"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
                placeholder="Enter your email"
                className="rounded-xl"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Enter your phone number (optional)"
                className="rounded-xl"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border border-accent-green/30">
                  <p className="text-sm text-text-muted mb-1">Role</p>
                  <p className="text-lg font-semibold capitalize text-accent-green">{user?.role}</p>
                </div>
                {user?.teacher?.employee_id && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border border-accent-green/30">
                    <p className="text-sm text-text-muted mb-1">Employee ID</p>
                    <p className="text-lg font-semibold text-accent-green">{user.teacher.employee_id}</p>
                  </div>
                )}
              </div>
              {teacherData?.school_name && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent-cyan/10 to-accent-green/10 border border-accent-cyan/30">
                  <div className="flex items-center space-x-2 mb-1">
                    <Building2 size={16} className="text-accent-cyan" />
                    <p className="text-sm text-text-muted">Assigned School</p>
                  </div>
                  <p className="text-lg font-semibold text-accent-cyan">{teacherData.school_name}</p>
                </div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="rounded-xl bg-gradient-to-r from-accent-green to-accent-cyan hover:from-accent-green/90 hover:to-accent-cyan/90 text-card-bg border-0 shadow-primary hover:shadow-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updatingProfile ? 'Updating...' : 'Update Profile'}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PasswordChangeForm
              onSuccess={() => success('Password changed successfully!')}
              onError={(errorMsg) => error(errorMsg)}
            />
          </motion.div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-main">Preferences</h2>
              <Bell className="text-accent-green" size={24} />
            </div>
            <UserPreferencesPanel onSaved={() => success('Preferences saved!')} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TeacherSettings;
