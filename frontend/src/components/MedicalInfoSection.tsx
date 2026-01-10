import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';
import Modal from './Modal';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, Phone, Plus, Edit2, Trash2, User, Shield } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface MedicalInfoSectionProps {
  studentId: number;
  canEdit: boolean; // admin or teacher
}

const MedicalInfoSection: React.FC<MedicalInfoSectionProps> = ({ studentId, canEdit }) => {
  const { success, error, ToastContainer } = useToast();
  const [medicalInfo, setMedicalInfo] = useState<any>({});
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [medicalForm, setMedicalForm] = useState({
    blood_type: '',
    chronic_illnesses: [] as string[],
    allergies: [] as string[],
    medications: '',
    medical_conditions: '',
    dietary_restrictions: '',
    special_needs: '',
    doctor_name: '',
    doctor_phone: '',
    hospital_preference: '',
    medical_notes: '',
  });

  const [contactForm, setContactForm] = useState({
    contact_name: '',
    relationship: '',
    phone_primary: '',
    phone_secondary: '',
    email: '',
    address: '',
    is_primary: false,
    can_pickup: true,
    priority_order: 1,
    notes: '',
  });

  const [newIllness, setNewIllness] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    fetchMedicalInfo();
    fetchEmergencyContacts();
  }, [studentId]);

  const fetchMedicalInfo = async () => {
    try {
      const response = await api.getMedicalInfo(studentId);
      setMedicalInfo(response.data || {});
      setMedicalForm({
        blood_type: response.data?.blood_type || '',
        chronic_illnesses: response.data?.chronic_illnesses || [],
        allergies: response.data?.allergies || [],
        medications: response.data?.medications || '',
        medical_conditions: response.data?.medical_conditions || '',
        dietary_restrictions: response.data?.dietary_restrictions || '',
        special_needs: response.data?.special_needs || '',
        doctor_name: response.data?.doctor_name || '',
        doctor_phone: response.data?.doctor_phone || '',
        hospital_preference: response.data?.hospital_preference || '',
        medical_notes: response.data?.medical_notes || '',
      });
    } catch (err) {
      console.error('Error fetching medical info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await api.getEmergencyContacts(studentId);
      setEmergencyContacts(response.data || []);
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
    }
  };

  const handleSaveMedical = async () => {
    setSaving(true);
    try {
      await api.saveMedicalInfo(studentId, medicalForm);
      await fetchMedicalInfo();
      setIsEditingMedical(false);
      success('Medical information saved successfully');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving medical information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      if (editingContactId) {
        await api.updateEmergencyContact(editingContactId, contactForm);
        success('Emergency contact updated successfully');
      } else {
        await api.addEmergencyContact(studentId, contactForm);
        success('Emergency contact added successfully');
      }
      await fetchEmergencyContacts();
      setIsEditingContact(false);
      setEditingContactId(null);
      resetContactForm();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return;
    try {
      await api.deleteEmergencyContact(contactId);
      await fetchEmergencyContacts();
      success('Emergency contact deleted successfully');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting emergency contact');
    }
  };

  const handleEditContact = (contact: any) => {
    setContactForm({
      contact_name: contact.contact_name,
      relationship: contact.relationship,
      phone_primary: contact.phone_primary,
      phone_secondary: contact.phone_secondary || '',
      email: contact.email || '',
      address: contact.address || '',
      is_primary: contact.is_primary === 1,
      can_pickup: contact.can_pickup === 1,
      priority_order: contact.priority_order,
      notes: contact.notes || '',
    });
    setEditingContactId(contact.id);
    setIsEditingContact(true);
  };

  const resetContactForm = () => {
    setContactForm({
      contact_name: '',
      relationship: '',
      phone_primary: '',
      phone_secondary: '',
      email: '',
      address: '',
      is_primary: false,
      can_pickup: true,
      priority_order: 1,
      notes: '',
    });
  };

  const addIllness = () => {
    if (newIllness.trim()) {
      setMedicalForm({
        ...medicalForm,
        chronic_illnesses: [...medicalForm.chronic_illnesses, newIllness.trim()],
      });
      setNewIllness('');
    }
  };

  const removeIllness = (index: number) => {
    setMedicalForm({
      ...medicalForm,
      chronic_illnesses: medicalForm.chronic_illnesses.filter((_, i) => i !== index),
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setMedicalForm({
        ...medicalForm,
        allergies: [...medicalForm.allergies, newAllergy.trim()],
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setMedicalForm({
      ...medicalForm,
      allergies: medicalForm.allergies.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full"
        />
      </div>
    );
  }

  const hasMedicalInfo = medicalInfo.blood_type || 
    (medicalInfo.chronic_illnesses && medicalInfo.chronic_illnesses.length > 0) ||
    (medicalInfo.allergies && medicalInfo.allergies.length > 0) ||
    medicalInfo.medications ||
    medicalInfo.medical_conditions;

  return (
    <>
      <ToastContainer />
      
      {/* Medical Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medical Information</h2>
              <p className="text-sm text-gray-600">Health records and medical history</p>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={() => setIsEditingMedical(true)}
              className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Medical Info
            </Button>
          )}
        </div>

        {!hasMedicalInfo && !canEdit ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
            <p>No medical information on file</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blood Type */}
            {medicalInfo.blood_type && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Blood Type</p>
                <p className="text-lg font-bold text-red-700">{medicalInfo.blood_type}</p>
              </div>
            )}

            {/* Chronic Illnesses */}
            {medicalInfo.chronic_illnesses && medicalInfo.chronic_illnesses.length > 0 && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 md:col-span-2">
                <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center">
                  <AlertCircle size={16} className="mr-2 text-orange-600" />
                  Chronic Illnesses
                </p>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.chronic_illnesses.map((illness: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium"
                    >
                      {illness}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 md:col-span-2">
                <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center">
                  <Shield size={16} className="mr-2 text-red-600" />
                  Allergies
                </p>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.allergies.map((allergy: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {medicalInfo.medications && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 md:col-span-2">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Current Medications</p>
                <p className="text-gray-800">{medicalInfo.medications}</p>
              </div>
            )}

            {/* Medical Conditions */}
            {medicalInfo.medical_conditions && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 md:col-span-2">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Medical Conditions</p>
                <p className="text-gray-800">{medicalInfo.medical_conditions}</p>
              </div>
            )}

            {/* Dietary Restrictions */}
            {medicalInfo.dietary_restrictions && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Dietary Restrictions</p>
                <p className="text-gray-800">{medicalInfo.dietary_restrictions}</p>
              </div>
            )}

            {/* Special Needs */}
            {medicalInfo.special_needs && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Special Needs</p>
                <p className="text-gray-800">{medicalInfo.special_needs}</p>
              </div>
            )}

            {/* Doctor Information */}
            {(medicalInfo.doctor_name || medicalInfo.doctor_phone) && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Primary Doctor</p>
                {medicalInfo.doctor_name && (
                  <p className="text-gray-800 font-medium">{medicalInfo.doctor_name}</p>
                )}
                {medicalInfo.doctor_phone && (
                  <p className="text-gray-600 text-sm">{medicalInfo.doctor_phone}</p>
                )}
              </div>
            )}

            {/* Hospital Preference */}
            {medicalInfo.hospital_preference && (
              <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Preferred Hospital</p>
                <p className="text-gray-800">{medicalInfo.hospital_preference}</p>
              </div>
            )}

            {/* Medical Notes */}
            {medicalInfo.medical_notes && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 md:col-span-2">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Important Notes</p>
                <p className="text-gray-800">{medicalInfo.medical_notes}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Emergency Contacts Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
              <Phone className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Emergency Contacts</h2>
              <p className="text-sm text-gray-600">People to contact in case of emergency</p>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={() => {
                resetContactForm();
                setEditingContactId(null);
                setIsEditingContact(true);
              }}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
            >
              <Plus size={16} className="mr-2" />
              Add Contact
            </Button>
          )}
        </div>

        {emergencyContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User size={48} className="mx-auto mb-3 text-gray-400" />
            <p>No emergency contacts on file</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 rounded-xl border-2 ${
                  contact.is_primary
                    ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-gray-900">{contact.contact_name}</h3>
                      {contact.is_primary && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-medium">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{contact.relationship}</p>
                  </div>
                  {canEdit && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-1 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700 font-medium">{contact.phone_primary}</p>
                  {contact.phone_secondary && (
                    <p className="text-gray-600">{contact.phone_secondary}</p>
                  )}
                  {contact.email && <p className="text-gray-600">{contact.email}</p>}
                  {contact.can_pickup === 1 && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium mt-2">
                      Authorized Pickup
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Edit Medical Info Modal */}
      <Modal
        isOpen={isEditingMedical}
        onClose={() => setIsEditingMedical(false)}
        title="Edit Medical Information"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Select
            label="Blood Type"
            value={medicalForm.blood_type}
            onChange={(e) => setMedicalForm({ ...medicalForm, blood_type: e.target.value })}
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="Unknown">Unknown</option>
          </Select>

          {/* Chronic Illnesses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chronic Illnesses
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newIllness}
                onChange={(e) => setNewIllness(e.target.value)}
                placeholder="Add chronic illness"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIllness())}
              />
              <Button type="button" onClick={addIllness}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicalForm.chronic_illnesses.map((illness, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium flex items-center space-x-2"
                >
                  <span>{illness}</span>
                  <button onClick={() => removeIllness(index)} className="hover:text-orange-900">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              />
              <Button type="button" onClick={addAllergy}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicalForm.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium flex items-center space-x-2"
                >
                  <span>{allergy}</span>
                  <button onClick={() => removeAllergy(index)} className="hover:text-red-900">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Textarea
            label="Current Medications"
            value={medicalForm.medications}
            onChange={(e) => setMedicalForm({ ...medicalForm, medications: e.target.value })}
            rows={3}
            placeholder="List current medications and dosages"
          />

          <Textarea
            label="Medical Conditions"
            value={medicalForm.medical_conditions}
            onChange={(e) => setMedicalForm({ ...medicalForm, medical_conditions: e.target.value })}
            rows={3}
            placeholder="Other medical conditions"
          />

          <Input
            label="Dietary Restrictions"
            value={medicalForm.dietary_restrictions}
            onChange={(e) => setMedicalForm({ ...medicalForm, dietary_restrictions: e.target.value })}
            placeholder="e.g., Vegetarian, Gluten-free"
          />

          <Textarea
            label="Special Needs"
            value={medicalForm.special_needs}
            onChange={(e) => setMedicalForm({ ...medicalForm, special_needs: e.target.value })}
            rows={2}
            placeholder="Any special needs or accommodations"
          />

          <Input
            label="Primary Doctor Name"
            value={medicalForm.doctor_name}
            onChange={(e) => setMedicalForm({ ...medicalForm, doctor_name: e.target.value })}
            placeholder="Dr. John Smith"
          />

          <Input
            label="Doctor Phone"
            value={medicalForm.doctor_phone}
            onChange={(e) => setMedicalForm({ ...medicalForm, doctor_phone: e.target.value })}
            placeholder="(555) 123-4567"
          />

          <Input
            label="Preferred Hospital"
            value={medicalForm.hospital_preference}
            onChange={(e) => setMedicalForm({ ...medicalForm, hospital_preference: e.target.value })}
            placeholder="City General Hospital"
          />

          <Textarea
            label="Important Medical Notes"
            value={medicalForm.medical_notes}
            onChange={(e) => setMedicalForm({ ...medicalForm, medical_notes: e.target.value })}
            rows={3}
            placeholder="Any other important medical information"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditingMedical(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMedical} disabled={saving}>
              {saving ? 'Saving...' : 'Save Medical Info'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Emergency Contact Modal */}
      <Modal
        isOpen={isEditingContact}
        onClose={() => {
          setIsEditingContact(false);
          setEditingContactId(null);
          resetContactForm();
        }}
        title={editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
      >
        <div className="space-y-4">
          <Input
            label="Contact Name *"
            value={contactForm.contact_name}
            onChange={(e) => setContactForm({ ...contactForm, contact_name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <Input
            label="Relationship *"
            value={contactForm.relationship}
            onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
            placeholder="Parent, Guardian, Grandparent, etc."
            required
          />

          <Input
            label="Primary Phone *"
            value={contactForm.phone_primary}
            onChange={(e) => setContactForm({ ...contactForm, phone_primary: e.target.value })}
            placeholder="(555) 123-4567"
            required
          />

          <Input
            label="Secondary Phone"
            value={contactForm.phone_secondary}
            onChange={(e) => setContactForm({ ...contactForm, phone_secondary: e.target.value })}
            placeholder="(555) 987-6543"
          />

          <Input
            label="Email"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            placeholder="john.doe@email.com"
          />

          <Textarea
            label="Address"
            value={contactForm.address}
            onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
            rows={2}
            placeholder="123 Main St, City, State ZIP"
          />

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={contactForm.is_primary}
                onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Primary Contact</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={contactForm.can_pickup}
                onChange={(e) => setContactForm({ ...contactForm, can_pickup: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Authorized Pickup</span>
            </label>
          </div>

          <Input
            label="Priority Order"
            type="number"
            min="1"
            value={contactForm.priority_order}
            onChange={(e) =>
              setContactForm({ ...contactForm, priority_order: parseInt(e.target.value) || 1 })
            }
          />

          <Textarea
            label="Notes"
            value={contactForm.notes}
            onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
            rows={2}
            placeholder="Additional notes about this contact"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditingContact(false);
                setEditingContactId(null);
                resetContactForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving ? 'Saving...' : editingContactId ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MedicalInfoSection;
