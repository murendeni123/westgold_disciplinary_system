import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Save, User, Phone, MapPin, AlertCircle } from 'lucide-react';

const ParentProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    work_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
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
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
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
      setSuccess('Profile updated successfully!');
      if (updateUser) {
        const updatedUser = { ...user, ...formData };
        updateUser(updatedUser);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your profile information</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <Card title="Account Information">
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              icon="user"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              icon="mail"
            />
          </div>
        </Card>

        {/* Contact Details */}
        <Card title="Contact Details">
          <div className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              icon="phone"
              placeholder="Enter your phone number"
            />
            <Input
              label="Work Phone"
              type="tel"
              value={formData.work_phone}
              onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
              icon="phone"
              placeholder="Enter your work phone number"
            />
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card title="Emergency Contacts">
          <div className="space-y-4">
            <Input
              label="Emergency Contact Name"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              icon="user"
              placeholder="Enter emergency contact name"
            />
            <Input
              label="Emergency Contact Phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              icon="phone"
              placeholder="Enter emergency contact phone"
            />
          </div>
        </Card>

        {/* Address */}
        <Card title="Address">
          <div className="space-y-4">
            <Input
              label="Home Address"
              value={formData.home_address}
              onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
              icon="map-pin"
              placeholder="Enter your home address"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
              />
              <Input
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Enter postal code"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            <Save size={20} className="mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ParentProfile;

