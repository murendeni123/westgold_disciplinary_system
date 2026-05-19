import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import PasswordChangeForm from '../../components/PasswordChangeForm';
import { motion } from 'framer-motion';
import { Save, Lock, User, Settings, Building2, Copy, Check, Bell, Globe, Info } from 'lucide-react';
import UserPreferencesPanel from '../../components/UserPreferencesPanel';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import { SupportedLanguage } from '../../locales';

const AdminSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const { userLanguage, globalLanguage, setUserLanguage, setGlobalLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'school' | 'preferences' | 'language'>('profile');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Language state
  const [pendingUserLang, setPendingUserLang] = useState<SupportedLanguage | null>(userLanguage);
  const [pendingGlobalLang, setPendingGlobalLang] = useState<SupportedLanguage>(globalLanguage);
  const [savingUserLang, setSavingUserLang] = useState(false);
  const [savingGlobalLang, setSavingGlobalLang] = useState(false);

  useEffect(() => {
    setPendingUserLang(userLanguage);
  }, [userLanguage]);

  useEffect(() => {
    setPendingGlobalLang(globalLanguage);
  }, [globalLanguage]);

  const handleSaveUserLanguage = async () => {
    setSavingUserLang(true);
    try {
      await setUserLanguage(pendingUserLang);
      success(t('language.savedSuccess'));
    } catch {
      error('Failed to save language preference');
    } finally {
      setSavingUserLang(false);
    }
  };

  const handleSaveGlobalLanguage = async () => {
    setSavingGlobalLang(true);
    try {
      await setGlobalLanguage(pendingGlobalLang);
      success(t('language.globalSavedSuccess'));
    } catch {
      error('Failed to update global language');
    } finally {
      setSavingGlobalLang(false);
    }
  };


  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
      fetchSchoolInfo();
    }
  }, [user]);

  const fetchSchoolInfo = async () => {
    try {
      const response = await api.getCurrentSchoolInfo();
      setSchoolInfo(response.data);
    } catch (err) {
      console.error('Error fetching school info:', err);
    }
  };

  const copySchoolCode = () => {
    if (schoolInfo?.school_code) {
      navigator.clipboard.writeText(schoolInfo.school_code);
      setCopiedCode(true);
      success('School code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
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
              { id: 'profile', label: t('settings.profile'), icon: User },
              { id: 'password', label: t('settings.password'), icon: Lock },
              { id: 'school', label: t('settings.schoolInfo'), icon: Building2 },
              { id: 'preferences', label: t('settings.preferences'), icon: Bell },
              { id: 'language', label: t('settings.language'), icon: Globe },
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
            <PasswordChangeForm
              onSuccess={() => success('Password changed successfully!')}
              onError={(errorMsg) => error(errorMsg)}
            />
          </motion.div>
        )}

        {/* School Information Tab */}
        {activeTab === 'school' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
              <Building2 className="text-amber-600" size={24} />
            </div>
            <div className="space-y-6">
              {schoolInfo ? (
                <>
                  <div className="p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">School Name</p>
                    <p className="text-2xl font-bold text-gray-900">{schoolInfo.name}</p>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">School Code</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copySchoolCode}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                      >
                        {copiedCode ? (
                          <>
                            <Check size={16} className="text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">Copy</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 tracking-wider font-mono">
                      {schoolInfo.school_code || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Share this code with parents to link their accounts
                    </p>
                  </div>

                  {schoolInfo.email && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">School Email</p>
                      <p className="text-lg text-gray-900">{schoolInfo.email}</p>
                    </div>
                  )}

                  {schoolInfo.phone && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">School Phone</p>
                      <p className="text-lg text-gray-900">{schoolInfo.phone}</p>
                    </div>
                  )}

                  {schoolInfo.address && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">School Address</p>
                      <p className="text-lg text-gray-900">
                        {schoolInfo.address}
                        {schoolInfo.city && `, ${schoolInfo.city}`}
                        {schoolInfo.postal_code && ` ${schoolInfo.postal_code}`}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 rounded-xl bg-gray-50 border border-gray-200 text-center">
                  <p className="text-gray-500">Loading school information...</p>
                </div>
              )}
            </div>
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
              <h2 className="text-2xl font-bold text-gray-900">{t('settings.preferences')}</h2>
              <Bell className="text-amber-600" size={24} />
            </div>
            <UserPreferencesPanel onSaved={() => success('Preferences saved!')} />
          </motion.div>
        )}

        {/* Language Tab */}
        {activeTab === 'language' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('language.title')}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('language.subtitle')}</p>
              </div>
              <Globe className="text-amber-600" size={24} />
            </div>

            {/* Admin info banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">{t('language.adminNote')}</p>
                <p className="text-xs text-amber-600 mt-1">{t('language.hierarchyNote')}</p>
              </div>
            </div>

            {/* Global Language — School default */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex items-center gap-2 mb-1">
                <Globe size={16} className="text-amber-600" />
                <h3 className="text-base font-bold text-gray-900">{t('language.globalLanguage')}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">{t('language.globalLanguageDesc')}</p>
              <LanguageSelector
                value={pendingGlobalLang}
                onChange={(lang) => setPendingGlobalLang(lang || 'en')}
                accentColor="amber"
                allowReset={false}
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
                <Button
                  onClick={handleSaveGlobalLanguage}
                  disabled={savingGlobalLang || pendingGlobalLang === globalLanguage}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {savingGlobalLang ? t('language.saving') : t('language.saveGlobalLanguage')}
                </Button>
              </motion.div>
            </div>

            {/* Personal Language — Admin only changes theirs */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 mb-1">
                <User size={16} className="text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">{t('language.myLanguage')}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">{t('language.myLanguageDesc')}</p>
              <LanguageSelector
                value={pendingUserLang}
                onChange={(lang) => setPendingUserLang(lang)}
                accentColor="blue"
                allowReset={true}
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
                <Button
                  onClick={handleSaveUserLanguage}
                  disabled={savingUserLang || pendingUserLang === userLanguage}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingUserLang ? t('language.saving') : t('language.saveMyLanguage')}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminSettings;
