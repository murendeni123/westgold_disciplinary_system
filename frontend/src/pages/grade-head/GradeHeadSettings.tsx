import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import PasswordChangeForm from '../../components/PasswordChangeForm';
import { motion } from 'framer-motion';
import { Save, Lock, User, Settings, Building2, Shield, Bell } from 'lucide-react';
import UserPreferencesPanel from '../../components/UserPreferencesPanel';
import { useToast } from '../../hooks/useToast';

const GradeHeadSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

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
      const response = await api.updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase(),
      });

      if (profileData.phone !== (user?.teacher?.phone || '')) {
        try {
          await api.updateTeacher(user?.teacher?.id || user?.id, {
            phone: profileData.phone.trim() || null,
          });
        } catch (phoneErr) {
          console.error('Error updating phone:', phoneErr);
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
    <div className="space-y-8 p-6">
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your account settings and preferences</p>
      </motion.div>

      {/* Grade Head badge */}
      {user?.gradeHeadFor && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Shield size={16} />
          <span>Grade Head — Grade {user.gradeHeadFor}</span>
        </motion.div>
      )}

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
                      ? 'border-indigo-500 text-indigo-600'
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
              <User className="text-indigo-600" size={24} />
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
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="text-lg font-semibold capitalize text-indigo-700">Grade Head</p>
                </div>
                {user?.teacher?.employee_id && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                    <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                    <p className="text-lg font-semibold text-indigo-700">{user.teacher.employee_id}</p>
                  </div>
                )}
                {user?.gradeHeadFor && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <p className="text-sm text-gray-600 mb-1">Grade Responsibility</p>
                    <p className="text-lg font-semibold text-amber-700">Grade {user.gradeHeadFor}</p>
                  </div>
                )}
              </div>
              {teacherData?.school_name && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Building2 size={16} className="text-blue-600" />
                    <p className="text-sm text-gray-600">Assigned School</p>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">{teacherData.school_name}</p>
                </div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
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
              <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
              <Bell className="text-indigo-600" size={24} />
            </div>
            <UserPreferencesPanel onSaved={() => success('Preferences saved!')} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default GradeHeadSettings;
