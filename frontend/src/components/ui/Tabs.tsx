/**
 * Premium Tabs Component
 * 
 * Beautiful tab navigation with smooth animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'boxed';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
}) => {
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  if (variant === 'pills') {
    return (
      <div className={`flex ${fullWidth ? 'w-full' : ''} gap-2 p-1 bg-gray-100 rounded-xl`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`
                relative flex items-center gap-2 ${sizes[size]} font-medium rounded-lg
                transition-all duration-200
                ${fullWidth ? 'flex-1 justify-center' : ''}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="pill-bg"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon size={iconSizes[size]} />}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`
                    px-1.5 py-0.5 text-xs font-semibold rounded-full
                    ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'boxed') {
    return (
      <div className={`flex ${fullWidth ? 'w-full' : ''} border border-gray-200 rounded-xl overflow-hidden`}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`
                relative flex items-center gap-2 ${sizes[size]} font-medium
                transition-all duration-200
                ${fullWidth ? 'flex-1 justify-center' : ''}
                ${index > 0 ? 'border-l border-gray-200' : ''}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {Icon && <Icon size={iconSizes[size]} />}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`
                  px-1.5 py-0.5 text-xs font-semibold rounded-full
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`flex ${fullWidth ? 'w-full' : ''} border-b border-gray-200`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`
                relative flex items-center gap-2 ${sizes[size]} font-medium -mb-px
                transition-all duration-200
                ${fullWidth ? 'flex-1 justify-center' : ''}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {Icon && <Icon size={iconSizes[size]} />}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`
                  px-1.5 py-0.5 text-xs font-semibold rounded-full
                  ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex ${fullWidth ? 'w-full' : ''} gap-1`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`
              relative flex items-center gap-2 ${sizes[size]} font-medium rounded-lg
              transition-all duration-200
              ${fullWidth ? 'flex-1 justify-center' : ''}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
          >
            {Icon && <Icon size={iconSizes[size]} />}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`
                px-1.5 py-0.5 text-xs font-semibold rounded-full
                ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// TAB PANELS COMPONENT
// ============================================================================

interface TabPanelProps {
  children: React.ReactNode;
  value: string;
  activeValue: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  activeValue,
}) => {
  if (value !== activeValue) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default Tabs;
