import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  delay?: number;
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  bgGradient = 'from-blue-500/10 to-purple-500/10',
  trend,
  subtitle,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group"
    >
      <div className={`relative bg-gradient-to-br ${bgGradient} backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: 'spring' }}
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
              >
                {value}
              </motion.p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, delay: delay + 0.3 }}
                    className={`text-sm font-semibold ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </motion.span>
                  <span className="text-xs text-gray-500 ml-2">vs last period</span>
                </div>
              )}
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
              className={`p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg ${iconColor}`}
            >
              <Icon size={24} />
            </motion.div>
          </div>
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </motion.div>
  );
};

export default AnimatedStatCard;

