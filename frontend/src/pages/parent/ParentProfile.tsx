import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Save, AlertCircle, User, Phone, Shield, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

const ParentProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.getParentProfile();
      const profile = response.data;
      setFormData({
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
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.updateParentProfile(formData);
      setSuccess(t('parent.profileUpdated'));
      if (user) {
        const updatedUser = { ...user, ...formData };
        updateUser(updatedUser);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('parent.profileError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('parent.profile')}</h1>
            <p className="text-purple-100 mt-1">{t('parent.profileSubtitle')}</p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3 shadow-md"
        >
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-lg flex items-center gap-3 shadow-md"
        >
          <CheckCircle size={20} className="flex-shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <User className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">{t('parent.personalInfo')}</h2>
            </div>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          </div>
        </motion.div>

        {/* Contact Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Phone className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">{t('parent.contactDetails')}</h2>
            </div>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            <Input
              label={t('common.phone')}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
              required
            />
            <Input
              label={t('parent.workPhone')}
              type="tel"
              value={formData.work_phone}
              onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
              placeholder="Enter your work phone number"
            />
            <Input
              label={t('parent.relationship')}
              value={formData.relationship_to_child}
              onChange={(e) => setFormData({ ...formData, relationship_to_child: e.target.value })}
              placeholder="e.g., Mother, Father, Legal Guardian"
              required
            />
          </div>
          </div>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Shield className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">{t('parent.emergencyContacts')}</h2>
            </div>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            <Input
              label={t('parent.emergency1Name')}
              value={formData.emergency_contact_1_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_1_name: e.target.value })}
              placeholder="Enter emergency contact name"
              required
            />
            <Input
              label={t('parent.emergency1Phone')}
              type="tel"
              value={formData.emergency_contact_1_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_1_phone: e.target.value })}
              placeholder="Enter emergency contact phone"
              required
            />
            <Input
              label={t('parent.emergency2Name')}
              value={formData.emergency_contact_2_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_2_name: e.target.value })}
              placeholder="Enter emergency contact name"
              required
            />
            <Input
              label={t('parent.emergency2Phone')}
              type="tel"
              value={formData.emergency_contact_2_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_2_phone: e.target.value })}
              placeholder="Enter emergency contact phone"
              required
            />
          </div>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <MapPin className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">{t('parent.addressInfo')}</h2>
            </div>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            <Input
              label={t('parent.homeAddress')}
              value={formData.home_address}
              onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
              placeholder="Enter your home address"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('parent.city')}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
              />
              <Input
                label={t('parent.postalCode')}
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Enter postal code"
              />
            </div>
          </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save size={20} />
            <span>{loading ? t('common.saving') : t('parent.saveChanges')}</span>
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};

export default ParentProfile;

