import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, RefreshCw } from 'lucide-react';
import Input from './Input';
import Select from './Select';
import SearchableSelect from './SearchableSelect';

interface FilterField {
  type: 'select' | 'input' | 'date' | 'search' | 'searchable-select';
  name: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
}

interface ModernFilterProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onClear?: () => void;
  className?: string;
}

const ModernFilter: React.FC<ModernFilterProps> = ({
  fields,
  values,
  onChange,
  onClear,
  className = '',
}) => {
  const activeFiltersCount = Object.values(values).filter(v => v !== '').length;

  const handleClearAll = () => {
    if (onClear) {
      onClear();
    } else {
      // Default clear behavior
      Object.keys(values).forEach(key => {
        onChange(key, '');
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`relative overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 ${className}`}
    >
      {/* Modern gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <div className="relative p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <Filter className="text-white" size={24} />
              </div>
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Filters
              </h2>
              <AnimatePresence mode="wait">
                {activeFiltersCount > 0 ? (
                  <motion.p
                    key="active"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-blue-600 font-semibold mt-0.5"
                  >
                    {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                  </motion.p>
                ) : (
                  <motion.p
                    key="inactive"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-gray-500 mt-0.5"
                  >
                    Select filters to refine results
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {activeFiltersCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Clear All</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Active Filters Chips */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 flex flex-wrap gap-2.5"
            >
              {fields.map((field) => {
                const value = values[field.name];
                if (!value) return null;

                const displayValue = field.options 
                  ? field.options.find(opt => opt.value === value)?.label || value
                  : value;

                return (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-50" />
                    <div className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold shadow-lg">
                      <span className="text-blue-100 font-normal">{field.label}:</span>
                      <span className="max-w-[150px] truncate">{displayValue}</span>
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onChange(field.name, '')}
                        className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X size={14} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {fields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 100 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-300" />
              {field.type === 'searchable-select' ? (
                <div className="relative">
                  <SearchableSelect
                    label={field.label}
                    value={values[field.name]}
                    onChange={(value) => onChange(field.name, value.toString())}
                    options={field.options || []}
                    placeholder={field.placeholder || `Search and select ${field.label.toLowerCase()}...`}
                    showClear={!!values[field.name]}
                    onClear={() => onChange(field.name, '')}
                    className="transition-all duration-200"
                  />
                </div>
              ) : field.type === 'select' ? (
                <div className="relative">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <select
                      value={values[field.name]}
                      onChange={(e) => onChange(field.name, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer text-gray-700 font-medium group-hover:border-blue-300 group-hover:shadow-md"
                    >
                      <option value="">{field.placeholder || `All ${field.label}`}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-[42px] pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {values[field.name] && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onChange(field.name, '')}
                      className="absolute top-10 right-12 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors z-10 shadow-sm"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={values[field.name]}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 font-medium group-hover:border-blue-300 group-hover:shadow-md"
                  />
                  {values[field.name] && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onChange(field.name, '')}
                      className="absolute top-10 right-3 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors z-10 shadow-sm"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom info bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t border-gray-100"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💡
            </motion.span>
            <span className="font-medium">Tip: Combine multiple filters to narrow down your search</span>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-400/5 to-orange-400/5 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
};

export default ModernFilter;

