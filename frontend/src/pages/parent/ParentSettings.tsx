import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Save, Lock, User, Bell, AlertTriangle, Settings, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const ParentSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
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
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching parent profile...');
      const response = await api.getParentProfile();
      console.log('Profile response:', response);
      console.log('Profile data:', response.data);
      
      const profile = response.data;
      
      const newProfileData = {
        name: profile.name || user?.name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        work_phone: profile.work_phone || '',
        relationship_to_child: profile.relationship_to_child || '',
        emergency_contact_1_name: profile.emergency_contact_1_name || '',
        emergency_contact_1_phone: profile.emergency_contact_1_phone || '',
        emergency_contact_2_name: profile.emergency_contact_2_name || '',
        emergency_contact_2_phone: profile.emergency_contact_2_phone || '',
        home_address: profile.home_address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
      };
      
      console.log('Setting profile data:', newProfileData);
      setProfileData(newProfileData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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
      const response = await api.updateParentProfile(profileData);
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your account settings</p>
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
              { id: 'notifications', label: 'Push Notifications', icon: Bell },
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
                      ? 'border-blue-500 text-blue-600'
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
              <User className="text-blue-600" size={24} />
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
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    required
                    placeholder="Enter your phone number"
                    className="rounded-xl"
                  />
                  <Input
                    label="Work Phone (Optional)"
                    type="tel"
                    value={profileData.work_phone}
                    onChange={(e) => setProfileData({ ...profileData, work_phone: e.target.value })}
                    placeholder="Enter your work phone"
                    className="rounded-xl"
                  />
                  <Input
                    label="Relationship to Child"
                    value={profileData.relationship_to_child}
                    onChange={(e) => setProfileData({ ...profileData, relationship_to_child: e.target.value })}
                    required
                    placeholder="e.g., Mother, Father, Guardian"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
                <div className="space-y-4">
                  <Input
                    label="Emergency Contact 1 Name"
                    value={profileData.emergency_contact_1_name}
                    onChange={(e) => setProfileData({ ...profileData, emergency_contact_1_name: e.target.value })}
                    required
                    placeholder="Enter emergency contact name"
                    className="rounded-xl"
                  />
                  <Input
                    label="Emergency Contact 1 Phone"
                    type="tel"
                    value={profileData.emergency_contact_1_phone}
                    onChange={(e) => setProfileData({ ...profileData, emergency_contact_1_phone: e.target.value })}
                    required
                    placeholder="Enter emergency contact phone"
                    className="rounded-xl"
                  />
                  <Input
                    label="Emergency Contact 2 Name"
                    value={profileData.emergency_contact_2_name}
                    onChange={(e) => setProfileData({ ...profileData, emergency_contact_2_name: e.target.value })}
                    required
                    placeholder="Enter emergency contact name"
                    className="rounded-xl"
                  />
                  <Input
                    label="Emergency Contact 2 Phone"
                    type="tel"
                    value={profileData.emergency_contact_2_phone}
                    onChange={(e) => setProfileData({ ...profileData, emergency_contact_2_phone: e.target.value })}
                    required
                    placeholder="Enter emergency contact phone"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="space-y-4">
                  <Input
                    label="Home Address"
                    value={profileData.home_address}
                    onChange={(e) => setProfileData({ ...profileData, home_address: e.target.value })}
                    required
                    placeholder="Enter your home address"
                    className="rounded-xl"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      placeholder="Enter city"
                      className="rounded-xl"
                    />
                    <Input
                      label="Postal Code"
                      value={profileData.postal_code}
                      onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                      placeholder="Enter postal code"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="text-lg font-semibold capitalize text-blue-700">{user?.role}</p>
                </div>
                {user?.children && user.children.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Linked Children</p>
                    <p className="text-lg font-semibold text-blue-700">{user.children.length} child(ren)</p>
                  </div>
                )}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl"
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
              <Lock className="text-blue-600" size={24} />
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
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}

        {/* Push Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Push Notifications</h2>
              <Bell className="text-blue-600" size={24} />
            </div>
            <div className="space-y-6">
              {!isSupported && (
                <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Push notifications not supported</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isSupported && (
                <>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notification Permission</p>
                      <p className="text-sm text-gray-600">
                        Status: <span className="font-semibold capitalize text-blue-700">{notificationPermission}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Subscription Status</p>
                      <p className="text-sm text-gray-600">
                        {isSubscribed ? (
                          <span className="text-green-600 font-semibold">Subscribed</span>
                        ) : (
                          <span className="text-gray-500">Not subscribed</span>
                        )}
                      </p>
                    </div>

                    {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                      <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                          <div>
                            <p className="text-sm font-medium text-red-800">HTTPS Required</p>
                            <p className="text-sm text-red-700 mt-1">
                              Push notifications require HTTPS. Please access the app over HTTPS to enable push notifications.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      {!isSubscribed ? (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={async () => {
                              if (Notification.permission === 'default') {
                                const permission = await Notification.requestPermission();
                                setNotificationPermission(permission);
                                if (permission === 'granted') {
                                  await subscribe();
                                }
                              } else if (Notification.permission === 'granted') {
                                await subscribe();
                              } else {
                                alert('Notification permission denied. Please enable it in your browser settings.');
                              }
                            }}
                            disabled={notificationPermission === 'denied'}
                            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl"
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Enable Push Notifications
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              await unsubscribe();
                            }}
                            className="rounded-xl"
                          >
                            Disable Push Notifications
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ParentSettings;
