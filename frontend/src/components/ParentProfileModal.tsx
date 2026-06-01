import React from 'react';
import { X, Phone, AlertCircle, MapPin, GraduationCap, Users, UserCircle } from 'lucide-react';

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: any;
  student?: any;
}

const Field: React.FC<{ label: string; value?: string | null; fullWidth?: boolean }> = ({
  label,
  value,
  fullWidth,
}) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
    {value ? (
      <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
    ) : (
      <p className="text-sm text-gray-400 italic">Not provided</p>
    )}
  </div>
);

const SectionCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
  bg?: string;
}> = ({ icon, iconBg, title, children, bg = 'bg-white' }) => (
  <div className={`${bg} rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-gray-100">
      <div className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const ParentProfileModal: React.FC<ParentProfileModalProps> = ({ isOpen, onClose, parent, student }) => {
  if (!isOpen || !parent) return null;

  const childrenFromParent: any[] = parent.children || [];
  const children: any[] =
    childrenFromParent.length > 0 ? childrenFromParent : student ? [student] : [];

  const initials = (parent.name || '')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasEmergency1 = parent.emergency_contact_1_name || parent.emergency_contact_1_phone;
  const hasEmergency2 = parent.emergency_contact_2_name || parent.emergency_contact_2_phone;
  const hasAddress = parent.home_address || parent.city || parent.postal_code;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      {/* Sheet on mobile (slides from bottom), centered dialog on sm+ */}
      <div
        className="
          relative bg-white w-full sm:max-w-md
          rounded-t-3xl sm:rounded-3xl
          shadow-2xl
          flex flex-col
          max-h-[92dvh] sm:max-h-[88dvh]
          overflow-hidden
        "
        onClick={e => e.stopPropagation()}
      >
        {/* ── Drag handle (mobile only) ─────────────────────────────── */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* ── Hero header ───────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 px-5 py-5 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X size={15} className="text-white" />
          </button>

          <div className="flex items-center gap-4 pr-10">
            {/* Avatar */}
            {parent.photo_path ? (
              <img
                src={parent.photo_path}
                alt={parent.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/40 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center flex-shrink-0">
                {initials ? (
                  <span className="text-xl font-bold text-white">{initials}</span>
                ) : (
                  <UserCircle size={28} className="text-white/80" />
                )}
              </div>
            )}

            {/* Name + relationship */}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight truncate">{parent.name}</h2>
              <p className="text-sm text-white/70 truncate">{parent.email}</p>
              {parent.relationship_to_child && (
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium text-white/90">
                  {parent.relationship_to_child}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-3 pb-6">

            {/* Contact */}
            <SectionCard
              icon={<Phone size={13} className="text-blue-600" />}
              iconBg="bg-blue-50"
              title="Contact Information"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Phone" value={parent.phone} />
                <Field label="Work Phone" value={parent.work_phone} />
              </div>
            </SectionCard>

            {/* Linked children */}
            {children.length > 0 ? (
              <SectionCard
                icon={<GraduationCap size={13} className="text-amber-600" />}
                iconBg="bg-amber-50"
                title={`Linked ${children.length === 1 ? 'Child' : 'Children'}`}
                bg="bg-amber-50/40"
              >
                <div className="space-y-2">
                  {children.map((child: any, i: number) => (
                    <div
                      key={child.id ?? i}
                      className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-amber-100 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {(
                            (child.first_name?.[0] ?? '') + (child.last_name?.[0] ?? '')
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {child.first_name} {child.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {[child.class_name, child.student_id && `#${child.student_id}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : (
              <SectionCard
                icon={<Users size={13} className="text-gray-400" />}
                iconBg="bg-gray-100"
                title="Linked Children"
              >
                <p className="text-sm text-gray-400 italic">No children linked</p>
              </SectionCard>
            )}

            {/* Emergency contacts */}
            {(hasEmergency1 || hasEmergency2) && (
              <SectionCard
                icon={<AlertCircle size={13} className="text-red-500" />}
                iconBg="bg-red-50"
                title="Emergency Contacts"
              >
                <div className="space-y-3">
                  {hasEmergency1 && (
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
                        Contact 1
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <Field label="Name" value={parent.emergency_contact_1_name} />
                        <Field label="Phone" value={parent.emergency_contact_1_phone} />
                      </div>
                    </div>
                  )}
                  {hasEmergency2 && (
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
                        Contact 2
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <Field label="Name" value={parent.emergency_contact_2_name} />
                        <Field label="Phone" value={parent.emergency_contact_2_phone} />
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Address */}
            {hasAddress && (
              <SectionCard
                icon={<MapPin size={13} className="text-green-600" />}
                iconBg="bg-green-50"
                title="Address"
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Street Address" value={parent.home_address} fullWidth />
                  <Field label="City" value={parent.city} />
                  <Field label="Postal Code" value={parent.postal_code} />
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentProfileModal;
