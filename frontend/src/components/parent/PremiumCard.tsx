import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PremiumCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  className = '', 
  hover = true, 
  glass = false, 
  children,
  ...props 
}) => {
  const baseStyles = 'rounded-2xl border border-border p-6 transition-all';
  const hoverStyles = hover ? 'hover:border-primary hover:shadow-card hover:-translate-y-1 cursor-pointer' : '';
  const glassStyles = glass ? 'bg-surface/50 backdrop-blur-xl' : 'bg-surface';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
