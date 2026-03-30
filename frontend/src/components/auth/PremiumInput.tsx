import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PremiumInputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder: string;
  label: string;
  icon: LucideIcon;
  isFocused?: boolean;
  required?: boolean;
  id?: string;
  rightElement?: React.ReactNode;
}

const PremiumInput: React.FC<PremiumInputProps> = ({
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  label,
  icon: Icon,
  isFocused = false,
  required = false,
  id,
  rightElement,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <motion.div
        className="relative"
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Icon
            size={20}
            className={`transition-colors duration-300 ${
              isFocused ? 'text-primary' : 'text-gray-500'
            }`}
          />
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          className={`w-full pl-12 ${rightElement ? 'pr-12' : 'pr-4'} py-4 bg-white/5 backdrop-blur-sm border rounded-xl 
            focus:outline-none transition-all duration-300 text-white placeholder:text-gray-500
            ${
              isFocused
                ? 'border-primary shadow-lg shadow-primary/20 bg-white/10'
                : 'border-white/10 hover:border-white/20'
            }`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightElement}
          </div>
        )}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 -z-10 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PremiumInput;
