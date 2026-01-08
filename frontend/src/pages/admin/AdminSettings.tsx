import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Save, Lock, User, Settings, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const AdminSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

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
      const response = await api.updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase(),
      });
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      error(err.response?.data?.error || 'Error changing password');
    } finally {
      setChangingPassword(false);
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your account settings and preferences</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="border-b border-gray-200 mb-6">
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
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
              <User className="text-amber-600" size={24} />
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="text-lg font-semibold capitalize text-amber-700">{user?.role}</p>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
              <Lock className="text-amber-600" size={24} />
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                placeholder="Enter current password"
                className="rounded-xl"
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
                className="rounded-xl"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
                placeholder="Confirm new password"
                className="rounded-xl"
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </motion.div>
            </form>
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
              <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
              <Settings className="text-amber-600" size={24} />
            </div>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Notification Preferences</p>
                <p className="text-gray-500">Notification settings coming soon...</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Display Preferences</p>
                <p className="text-gray-500">Display settings coming soon...</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminSettings;
