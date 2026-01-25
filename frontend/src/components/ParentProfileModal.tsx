import React from 'react';
import Modal from './Modal';
import { User, Phone, Mail, MapPin, Building2, UserCircle } from 'lucide-react';

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: any;
}

const ParentProfileModal: React.FC<ParentProfileModalProps> = ({ isOpen, onClose, parent }) => {
  if (!parent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Parent Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {parent.photo_path ? (
              <img
                src={parent.photo_path}
                alt={parent.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <UserCircle size={32} className="text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{parent.name}</h3>
            <p className="text-gray-600">{parent.email}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Phone size={16} className="mr-2" />
            Contact Information
          </h4>
          <div className="space-y-2 pl-6">
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{parent.phone || <span className="text-gray-400 italic">Not provided</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Work Phone</p>
              <p className="text-sm text-gray-900">{parent.work_phone || <span className="text-gray-400 italic">Not provided</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Relationship to Child</p>
              <p className="text-sm text-gray-900">{parent.relationship_to_child || <span className="text-gray-400 italic">Not provided</span>}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <User size={16} className="mr-2" />
            Emergency Contacts
          </h4>
          <div className="space-y-4 pl-6">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Emergency Contact 1</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">{parent.emergency_contact_1_name || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{parent.emergency_contact_1_phone || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Emergency Contact 2</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">{parent.emergency_contact_2_name || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{parent.emergency_contact_2_phone || <span className="text-gray-400 italic">Not provided</span>}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        {(parent.home_address || parent.city || parent.postal_code) && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <MapPin size={16} className="mr-2" />
              Address
            </h4>
            <div className="space-y-2 pl-6">
              <div>
                <p className="text-xs text-gray-500">Street Address</p>
                <p className="text-sm text-gray-900">{parent.home_address || <span className="text-gray-400 italic">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">City</p>
                <p className="text-sm text-gray-900">{parent.city || <span className="text-gray-400 italic">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Postal Code</p>
                <p className="text-sm text-gray-900">{parent.postal_code || <span className="text-gray-400 italic">Not provided</span>}</p>
              </div>
            </div>
          </div>
        )}

        {/* Children */}
        {parent.children && parent.children.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Building2 size={16} className="mr-2" />
              Linked Children
            </h4>
            <div className="pl-6">
              <p className="text-sm text-gray-900">{parent.children.length} child(ren) linked</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ParentProfileModal;

