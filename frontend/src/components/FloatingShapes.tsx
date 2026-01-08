import React from 'react';
import { motion } from 'framer-motion';

interface FloatingShapesProps {
  count?: number;
  colors?: string[];
}

const FloatingShapes: React.FC<FloatingShapesProps> = ({ 
  count = 5,
  colors = ['bg-blue-400/20', 'bg-purple-400/20', 'bg-pink-400/20', 'bg-indigo-400/20', 'bg-cyan-400/20']
}) => {
  const shapes = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 200 + 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    color: colors[i % colors.length],
    shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className={`absolute ${shape.color} blur-3xl opacity-30`}
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            borderRadius: shape.shape === 'circle' ? '50%' : shape.shape === 'square' ? '20%' : '0',
            clipPath: shape.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingShapes;
