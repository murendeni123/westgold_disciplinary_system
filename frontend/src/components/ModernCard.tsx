import React from 'react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient';
  hover?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className = '',
  title,
  action,
  variant = 'default',
  hover = true,
}) => {
  const baseClasses = 'rounded-2xl overflow-hidden transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white shadow-lg border border-gray-100',
    glass: 'bg-white/80 backdrop-blur-xl shadow-xl border border-white/20',
    gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-100',
  };

  const hoverClasses = hover ? 'hover:shadow-2xl hover:-translate-y-1' : '';

  const cardContent = (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );

  if (hover) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
};

export default ModernCard;
