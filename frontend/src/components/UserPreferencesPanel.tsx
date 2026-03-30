import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useDarkMode } from '../contexts/DarkModeContext';
import {
  Moon, Sun, Bell, BellOff, Mail, MailCheck, AlertTriangle,
  Award, Clock, CalendarX, Save, Loader2, Monitor
} from 'lucide-react';

interface Prefs {
  email_notifications_enabled: boolean;
  email_on_behaviour: boolean;
  email_on_merits: boolean;
  email_on_detention: boolean;
  email_on_absence: boolean;
  dark_mode: boolean;
  compact_view: boolean;
}

const defaults: Prefs = {
  email_notifications_enabled: false,
  email_on_behaviour: false,
  email_on_merits: false,
  email_on_detention: false,
  email_on_absence: false,
  dark_mode: false,
  compact_view: false,
};

interface Props {
  onSaved?: () => void;
  accentColor?: string;
}

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}> = ({ checked, onChange, disabled, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
      checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const UserPreferencesPanel: React.FC<Props> = ({ onSaved, accentColor = 'indigo' }) => {
  const { darkMode, setDarkMode } = useDarkMode();
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getPreferences()
      .then(res => {
        setPrefs({ ...defaults, ...res.data });
        // Sync dark mode from DB on load
        if (res.data.dark_mode !== undefined) {
          setDarkMode(res.data.dark_mode);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof Prefs, value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      // If disabling email master toggle, turn off all sub-options
      if (key === 'email_notifications_enabled' && !value) {
        next.email_on_behaviour = false;
        next.email_on_merits = false;
        next.email_on_detention = false;
        next.email_on_absence = false;
      }
      return next;
    });
    // Apply dark mode immediately
    if (key === 'dark_mode') setDarkMode(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updatePreferences(prefs);
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Error saving preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Display Settings */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <Monitor size={20} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
        </div>
        <div className="space-y-4">

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prefs.dark_mode ? 'bg-indigo-900 text-yellow-300' : 'bg-amber-100 text-amber-600'}`}>
                {prefs.dark_mode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch to a darker, easier-on-the-eyes theme</p>
              </div>
            </div>
            <Toggle id="dark_mode" checked={prefs.dark_mode} onChange={v => update('dark_mode', v)} />
          </div>

          {/* Compact View */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Monitor size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Compact View</p>
                <p className="text-sm text-gray-500">Reduce spacing to fit more content on screen</p>
              </div>
            </div>
            <Toggle id="compact_view" checked={prefs.compact_view} onChange={v => update('compact_view', v)} />
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <Bell size={20} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          In-app notifications are always enabled. Email notifications are <strong>off by default</strong> — enable them below to also receive emails.
        </p>

        <div className="space-y-3">
          {/* Master email toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
            prefs.email_notifications_enabled
              ? 'border-indigo-300 bg-indigo-50'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                prefs.email_notifications_enabled ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {prefs.email_notifications_enabled ? <MailCheck size={20} /> : <Mail size={20} />}
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">
                  {prefs.email_notifications_enabled
                    ? 'You will receive email + in-app notifications'
                    : 'Only in-app notifications (no emails)'}
                </p>
              </div>
            </div>
            <Toggle
              id="email_notifications_enabled"
              checked={prefs.email_notifications_enabled}
              onChange={v => update('email_notifications_enabled', v)}
            />
          </div>

          {/* Sub-toggles — only shown when email is enabled */}
          {prefs.email_notifications_enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-4 space-y-2 overflow-hidden"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                Email me when...
              </p>

              {[
                {
                  key: 'email_on_behaviour' as keyof Prefs,
                  icon: AlertTriangle,
                  color: 'text-red-500 bg-red-50',
                  label: 'Behaviour incident logged',
                  description: 'A behaviour incident is recorded for a student'
                },
                {
                  key: 'email_on_merits' as keyof Prefs,
                  icon: Award,
                  color: 'text-green-500 bg-green-50',
                  label: 'Merit or demerit awarded',
                  description: 'A merit or demerit is added for a student'
                },
                {
                  key: 'email_on_detention' as keyof Prefs,
                  icon: Clock,
                  color: 'text-orange-500 bg-orange-50',
                  label: 'Detention scheduled',
                  description: 'A student is assigned to a detention session'
                },
                {
                  key: 'email_on_absence' as keyof Prefs,
                  icon: CalendarX,
                  color: 'text-purple-500 bg-purple-50',
                  label: 'Attendance alert',
                  description: 'A student is marked absent or late'
                }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <Toggle
                      id={item.key}
                      checked={prefs[item.key] as boolean}
                      onChange={v => update(item.key, v)}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* In-app always on badge */}
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-50 border border-green-200">
            <Bell size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">
              <strong>In-app notifications</strong> are always enabled and cannot be disabled.
            </p>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center justify-end pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-md disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : saved ? (
            <MailCheck size={18} />
          ) : (
            <Save size={18} />
          )}
          <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default UserPreferencesPanel;
