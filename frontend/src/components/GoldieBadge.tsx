import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Star, Sparkles } from 'lucide-react';

interface GoldieBadgeProps {
  totalMerits: number;
  totalDemerits: number;
  studentName?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GoldieBadge: React.FC<GoldieBadgeProps> = ({
  totalMerits,
  totalDemerits,
  studentName,
  showDetails = true,
  size = 'md'
}) => {
  // Calculate Clean Points: Total Merits - Total Demerits
  const cleanPoints = totalMerits - totalDemerits;
  
  // Only show badge if student has 10 or more merits
  const isEligible = totalMerits >= 10;

  if (!isEligible) {
    return null;
  }

  // Determine badge tier based on clean points
  const getBadgeTier = () => {
    if (cleanPoints >= 50) return { tier: 'Platinum', color: 'from-purple-500 to-pink-500', icon: Sparkles };
    if (cleanPoints >= 30) return { tier: 'Gold', color: 'from-yellow-500 to-amber-500', icon: Star };
    if (cleanPoints >= 15) return { tier: 'Silver', color: 'from-gray-400 to-gray-500', icon: Award };
    return { tier: 'Bronze', color: 'from-orange-500 to-red-500', icon: TrendingUp };
  };

  const badge = getBadgeTier();
  const Icon = badge.icon;

  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 16,
      title: 'text-xs',
      points: 'text-lg',
      details: 'text-xs'
    },
    md: {
      container: 'p-4',
      icon: 24,
      title: 'text-sm',
      points: 'text-2xl',
      details: 'text-sm'
    },
    lg: {
      container: 'p-6',
      icon: 32,
      title: 'text-base',
      points: 'text-4xl',
      details: 'text-base'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl bg-gradient-to-r ${badge.color} shadow-xl border-2 border-white/30 ${sizes.container}`}
    >
      <div className="flex items-center space-x-4">
        {/* Badge Icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center"
        >
          <Icon size={sizes.icon} className="text-white" />
        </motion.div>

        {/* Badge Info */}
        <div className="flex-1 text-white">
          <div className="flex items-center space-x-2">
            <h3 className={`font-bold ${sizes.title} opacity-90`}>
              {badge.tier} Goldie Badge
            </h3>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles size={14} className="text-white/80" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`font-bold ${sizes.points}`}>{cleanPoints}</span>
            <span className={`${sizes.details} opacity-80`}>Clean Points</span>
          </div>

          {showDetails && (
            <div className={`mt-2 ${sizes.details} opacity-80 space-y-1`}>
              <div className="flex items-center justify-between">
                <span>Merits:</span>
                <span className="font-semibold">{totalMerits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Demerits:</span>
                <span className="font-semibold">{totalDemerits}</span>
              </div>
            </div>
          )}

          {studentName && (
            <p className={`mt-2 ${sizes.details} opacity-70 italic`}>
              Awarded to {studentName}
            </p>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -z-10" />
    </motion.div>
  );
};

export default GoldieBadge;
