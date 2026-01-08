import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
      
      {/* Animated mesh gradient */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }}>
              <animate attributeName="stop-color" values="#3b82f6;#8b5cf6;#ec4899;#3b82f6" dur="10s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }}>
              <animate attributeName="stop-color" values="#8b5cf6;#ec4899;#3b82f6;#8b5cf6" dur="10s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
      </svg>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl rotate-12"
        animate={{
          y: [0, -30, 0],
          rotate: [12, 22, 12],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full"
        animate={{
          y: [0, 40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-2xl -rotate-12"
        animate={{
          y: [0, -20, 0],
          rotate: [-12, -22, -12],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
