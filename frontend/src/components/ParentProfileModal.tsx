import React from 'react';
import { X, Phone, Mail, MapPin, Heart, AlertCircle, UserCircle, GraduationCap, Users } from 'lucide-react';

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: any;
  student?: any;
}

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
    {value ? (
      <span className="text-sm font-medium text-gray-800">{value}</span>
    ) : (
      <span className="text-sm text-gray-400 italic">Not provided</span>
    )}
  </div>
);

const ParentProfileModal: React.FC<ParentProfileModalProps> = ({ isOpen, onClose, parent, student }) => {
  if (!isOpen || !parent) return null;

  // Merge parent.children with the directly-linked student (avoids empty list when
  // parent_details comes from the student response and doesn't include children array)
  const childrenFromParent: any[] = parent.children || [];
  const children: any[] = childrenFromParent.length > 0
    ? childrenFromParent
    : student
      ? [student]
      : [];
  const initials = (parent.name || '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasEmergencyContact1 = parent.emergency_contact_1_name || parent.emergency_contact_1_phone;
  const hasEmergencyContact2 = parent.emergency_contact_2_name || parent.emergency_contact_2_phone;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 px-6 pt-8 pb-16 flex-shrink-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white" />
          </button>

          {/* Avatar */}
          <div className="flex flex-col items-center text-center gap-3">
            {parent.photo_path ? (
              <img
                src={parent.photo_path}
                alt={parent.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-white/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/25 ring-4 ring-white/40 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {initials || <UserCircle size={36} className="text-white" />}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{parent.name}</h2>
              {parent.relationship_to_child && (
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-white/20 text-xs font-medium text-white/90">
                  {parent.relationship_to_child}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 -mt-8 px-5 pb-6 space-y-4">

          {/* Contact card (floats over the gradient) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                <Phone size={13} className="text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Contact</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Email" value={parent.email} />
              <InfoRow label="Phone" value={parent.phone} />
              <InfoRow label="Work Phone" value={parent.work_phone} />
            </div>
          </div>

          {/* Linked children */}
          {children.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                  <GraduationCap size={13} className="text-amber-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Linked {children.length === 1 ? 'Child' : 'Children'}
                </span>
              </div>
              <div className="space-y-2">
                {children.map((child: any, i: number) => (
                  <div
                    key={child.id || i}
                    className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm border border-amber-100"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {((child.first_name?.[0] || '') + (child.last_name?.[0] || '')).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[child.class_name, child.student_id && `#${child.student_id}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency contacts */}
          {(hasEmergencyContact1 || hasEmergencyContact2) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle size={13} className="text-red-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Emergency Contacts</span>
              </div>
              {hasEmergencyContact1 && (
                <div className="bg-red-50/60 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Contact 1</p>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow label="Name" value={parent.emergency_contact_1_name} />
                    <InfoRow label="Phone" value={parent.emergency_contact_1_phone} />
                  </div>
                </div>
              )}
              {hasEmergencyContact2 && (
                <div className="bg-red-50/60 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Contact 2</p>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow label="Name" value={parent.emergency_contact_2_name} />
                    <InfoRow label="Phone" value={parent.emergency_contact_2_phone} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {(parent.home_address || parent.city || parent.postal_code) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                  <MapPin size={13} className="text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Address</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <InfoRow label="Street Address" value={parent.home_address} />
                </div>
                <InfoRow label="City" value={parent.city} />
                <InfoRow label="Postal Code" value={parent.postal_code} />
              </div>
            </div>
          )}

          {/* No children fallback */}
          {children.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Users size={14} className="text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">No linked children</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentProfileModal;
