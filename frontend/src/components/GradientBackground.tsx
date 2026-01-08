import React from 'react';
import { motion } from 'framer-motion';

interface GradientBackgroundProps {
  variant?: 'primary' | 'secondary' | 'success' | 'purple' | 'ocean';
  animated?: boolean;
  children?: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  variant = 'primary',
  animated = true,
  children 
}) => {
  const gradients = {
    primary: 'from-blue-600 via-indigo-600 to-purple-700',
    secondary: 'from-purple-600 via-pink-600 to-red-600',
    success: 'from-emerald-500 via-teal-600 to-cyan-600',
    purple: 'from-violet-600 via-purple-600 to-fuchsia-700',
    ocean: 'from-blue-500 via-cyan-500 to-teal-500',
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]}`}
        animate={animated ? {
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        } : undefined}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ backgroundSize: '200% 200%' }}
      />
      
      {/* Floating orbs */}
      {animated && (
        <>
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"
            animate={{
              x: [-50, 50, -50],
              y: [-50, 50, -50],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GradientBackground;
