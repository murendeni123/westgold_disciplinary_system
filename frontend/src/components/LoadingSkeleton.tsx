import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circle' | 'stat';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'card', 
  count = 1,
  className = '' 
}) => {
  const shimmerAnimation = {
    backgroundPosition: ['200% 0', '-200% 0'],
  };

  const shimmerTransition = {
    duration: 2,
    repeat: Infinity,
    ease: 'linear' as const,
  };

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white rounded-xl p-6 shadow-md ${className}`}
          >
            <motion.div
              animate={shimmerAnimation}
              transition={shimmerTransition}
              className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-4"
              style={{ backgroundSize: '200% 100%' }}
            />
            <motion.div
              animate={shimmerAnimation}
              transition={shimmerTransition}
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-3"
              style={{ backgroundSize: '200% 100%', width: '80%' }}
            />
            <motion.div
              animate={shimmerAnimation}
              transition={shimmerTransition}
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
              style={{ backgroundSize: '200% 100%', width: '60%' }}
            />
          </motion.div>
        );
      
      case 'stat':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-xl p-6 shadow-md ${className}`}
          >
            <motion.div
              animate={shimmerAnimation}
              transition={shimmerTransition}
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-4"
              style={{ backgroundSize: '200% 100%', width: '50%' }}
            />
            <motion.div
              animate={shimmerAnimation}
              transition={shimmerTransition}
              className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
              style={{ backgroundSize: '200% 100%', width: '70%' }}
            />
          </motion.div>
        );
      
      case 'text':
        return (
          <motion.div
            animate={shimmerAnimation}
            transition={shimmerTransition}
            className={`h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded ${className}`}
            style={{ backgroundSize: '200% 100%' }}
          />
        );
      
      case 'circle':
        return (
          <motion.div
            animate={shimmerAnimation}
            transition={shimmerTransition}
            className={`w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full ${className}`}
            style={{ backgroundSize: '200% 100%' }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-4 last:mb-0">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
