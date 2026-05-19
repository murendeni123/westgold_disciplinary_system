import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../locales';

interface LanguageSelectorProps {
  /** Which value to show / change */
  value: SupportedLanguage | null;
  /** Called when the user picks a new language */
  onChange: (lang: SupportedLanguage | null) => void;
  /** Accent colour class for active state, e.g. 'amber', 'emerald', 'indigo' */
  accentColor?: string;
  /** Allow the user to clear their choice (reset to global default) */
  allowReset?: boolean;
  /** Label shown above the selector */
  label?: string;
  /** Smaller description shown below the label */
  description?: string;
  disabled?: boolean;
}

const ACCENT_MAP: Record<string, { ring: string; bg: string; text: string; border: string }> = {
  amber:   { ring: 'ring-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  emerald: { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  indigo:  { ring: 'ring-indigo-400',  bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  blue:    { ring: 'ring-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  green:   { ring: 'ring-green-400',   bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  accentColor = 'amber',
  allowReset = false,
  label,
  description,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const { t, globalLanguage } = useLanguage();
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.amber;

  const selectedOption = value
    ? SUPPORTED_LANGUAGES.find((l) => l.code === value)
    : null;

  const displayLabel = selectedOption
    ? selectedOption.nativeName
    : `${t('language.usingGlobal')} (${SUPPORTED_LANGUAGES.find(l => l.code === globalLanguage)?.nativeName || 'English'})`;

  return (
    <div className="relative w-full">
      {label && (
        <div className="mb-2">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Globe size={14} className="text-gray-500" />
            {label}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      )}

      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 bg-white text-left transition-all
          ${open ? `${accent.ring} ring-2 border-transparent` : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {selectedOption ? selectedOption.flag : '🌐'}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{displayLabel}</p>
            {value && (
              <p className="text-xs text-gray-500">{selectedOption?.name}</p>
            )}
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden"
          >
            <div className="py-1">
              {allowReset && (
                <>
                  <button
                    type="button"
                    onClick={() => { onChange(null); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      value === null ? `${accent.bg} ${accent.text}` : ''
                    }`}
                  >
                    <span className="text-xl">🌐</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{t('language.resetToGlobal')}</p>
                      <p className="text-xs text-gray-500">
                        {SUPPORTED_LANGUAGES.find(l => l.code === globalLanguage)?.nativeName || 'English'}
                      </p>
                    </div>
                    {value === null && <Check size={14} className={accent.text} />}
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                </>
              )}
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = value === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { onChange(lang.code); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      isActive ? `${accent.bg} ${accent.text}` : ''
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActive ? accent.text : 'text-gray-800'}`}>
                        {lang.nativeName}
                      </p>
                      <p className="text-xs text-gray-500">{lang.name}</p>
                    </div>
                    {isActive && <Check size={14} className={accent.text} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
