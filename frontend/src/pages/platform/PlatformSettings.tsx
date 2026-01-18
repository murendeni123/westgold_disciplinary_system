import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { usePlatformAuth } from '../../contexts/PlatformAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Save, Settings, User, Lock, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PlatformSettings: React.FC = () => {
  const { user } = usePlatformAuth();
  const { success, error, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'platform' | 'profile' | 'password'>('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    platform_name: '',
    support_email: '',
    max_schools: '',
    max_students_per_school: '',
    goldie_badge_enabled: true,
    goldie_badge_threshold: '10',
  });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.getPlatformSettings();
      setSettings({
        platform_name: response.data.platform_name || '',
        support_email: response.data.support_email || '',
        max_schools: response.data.max_schools || '',
        max_students_per_school: response.data.max_students_per_school || '',
        goldie_badge_enabled: response.data.goldie_badge_enabled === 1 || response.data.goldie_badge_enabled === true,
        goldie_badge_threshold: String(response.data.goldie_badge_threshold || 10),
      });
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.getPlatformUserProfile();
      setProfileData({
        name: response.data.name || '',
        email: response.data.email || '',
      });
    } catch (err: any) {
      if (user) {
        setProfileData({
          name: user.name || '',
          email: user.email || '',
        });
      }
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePlatformSettings({
        platform_name: settings.platform_name,
        support_email: settings.support_email,
        max_schools: Number(settings.max_schools),
        max_students_per_school: Number(settings.max_students_per_school),
        goldie_badge_enabled: settings.goldie_badge_enabled,
        goldie_badge_threshold: Number(settings.goldie_badge_threshold),
      });
      success('Platform settings saved successfully');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePlatformUserProfile(profileData);
      success('Profile updated successfully');
      fetchProfile();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await api.changePlatformUserPassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      error(err.response?.data?.error || 'Error changing password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'platform', label: 'Platform Config', icon: Settings, color: 'from-purple-500 to-pink-500' },
    { id: 'profile', label: 'Profile', icon: User, color: 'from-blue-500 to-cyan-500' },
    { id: 'password', label: 'Password', icon: Lock, color: 'from-teal-500 to-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Platform Settings
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Configure platform-wide settings and manage your profile</p>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ y: -2 }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 relative ${
                  isActive
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r"
                    style={{
                      background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'platform' && (
          <motion.form
            key="platform"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSettingsSubmit}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-8"
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Settings className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Platform Configuration</h3>
                  <p className="text-sm text-gray-500">Manage global platform settings</p>
                </div>
              </div>
              <Input
                label="Platform Name"
                value={settings.platform_name}
                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Support Email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Max Schools"
                type="number"
                value={settings.max_schools}
                onChange={(e) => setSettings({ ...settings, max_schools: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Max Students per School"
                type="number"
                value={settings.max_students_per_school}
                onChange={(e) => setSettings({ ...settings, max_students_per_school: e.target.value })}
                required
                className="rounded-xl"
              />

              <div className="flex justify-end pt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    <Save size={20} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.form>
        )}

        {activeTab === 'profile' && (
          <motion.form
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleProfileSubmit}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-8"
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
                  <p className="text-sm text-gray-500">Update your personal information</p>
                </div>
              </div>
              <Input
                label="Name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
                className="rounded-xl"
              />
              <div className="flex justify-end pt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    <Save size={20} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.form>
        )}

        {activeTab === 'password' && (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handlePasswordSubmit}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-8"
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500">
                  <Lock className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
              </div>
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                className="rounded-xl"
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                className="rounded-xl"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="rounded-xl"
              />
              <div className="flex justify-end pt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    <Save size={20} className="mr-2" />
                    {saving ? 'Changing...' : 'Change Password'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformSettings;
