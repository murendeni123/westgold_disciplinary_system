import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '',
  hover = true,
  blur = 'md',
  gradient = false
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { 
        y: -8,
        transition: { duration: 0.3, ease: 'easeOut' }
      } : undefined}
      className={`
        relative overflow-hidden rounded-2xl
        ${blurClasses[blur]}
        ${gradient 
          ? 'bg-gradient-to-br from-white/40 via-white/30 to-white/20' 
          : 'bg-white/30'
        }
        border border-white/20
        shadow-xl shadow-black/10
        ${hover ? 'hover:shadow-2xl hover:shadow-black/20 hover:border-white/30' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {/* Shine effect on hover */}
      {hover && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
