import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface GoldenDotIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  animated?: boolean;
}

const GoldenDotIndicator: React.FC<GoldenDotIndicatorProps> = ({ 
  size = 'md', 
  showTooltip = true,
  animated = true 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 16
  };

  const DotComponent = animated ? motion.div : 'div';
  const animationProps = animated ? {
    animate: { 
      scale: [1, 1.2, 1],
      boxShadow: [
        '0 0 0 0 rgba(234, 179, 8, 0.7)',
        '0 0 0 4px rgba(234, 179, 8, 0)',
        '0 0 0 0 rgba(234, 179, 8, 0)'
      ]
    },
    transition: { 
      duration: 2, 
      repeat: Infinity,
      ease: 'easeInOut'
    }
  } : {};

  return (
    <div className="relative inline-flex items-center group">
      <DotComponent
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg`}
        {...animationProps}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles 
            size={iconSizes[size]} 
            className="text-white" 
            strokeWidth={3}
          />
        </div>
      </DotComponent>
      
      {showTooltip && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          <div className="flex items-center space-x-1">
            <Sparkles size={12} />
            <span className="font-semibold">Goldie Badge Holder</span>
          </div>
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-yellow-500 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default GoldenDotIndicator;
