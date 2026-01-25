import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Sparkles, AlertTriangle } from 'lucide-react';

interface BadgeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeEarned: boolean;
  studentName: string;
  cleanPoints?: number;
  totalMerits?: number;
}

const BadgeStatusModal: React.FC<BadgeStatusModalProps> = ({
  isOpen,
  onClose,
  badgeEarned,
  studentName,
  cleanPoints,
  totalMerits
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
            badgeEarned 
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50' 
              : 'bg-gradient-to-br from-gray-50 to-red-50'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all z-10"
          >
            <X size={20} className="text-gray-600" />
          </button>

          {badgeEarned ? (
            // Badge Earned Content
            <div className="p-8 text-center">
              {/* Animated Star Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="mx-auto mb-6 relative"
              >
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                  <Star size={64} className="text-white fill-white" />
                </div>
                
                {/* Sparkles Animation */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  className="absolute inset-0"
                >
                  <Sparkles className="absolute top-0 left-1/4 text-yellow-400" size={24} />
                  <Sparkles className="absolute top-1/4 right-0 text-amber-400" size={20} />
                  <Sparkles className="absolute bottom-1/4 left-0 text-yellow-500" size={18} />
                  <Sparkles className="absolute bottom-0 right-1/4 text-amber-500" size={22} />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Goldie Badge Earned! 🌟
              </motion.h2>

              {/* Student Name */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-700 mb-4"
              >
                <span className="font-semibold text-amber-600">{studentName}</span>
              </motion.p>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 mb-6"
              >
                This student has earned a Goldie Badge for outstanding behaviour!
              </motion.p>

              {/* Stats */}
              {(cleanPoints !== undefined || totalMerits !== undefined) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/80 rounded-xl p-4 mb-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {totalMerits !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-amber-600">{totalMerits}</div>
                        <div className="text-sm text-gray-600">Total Merits</div>
                      </div>
                    )}
                    {cleanPoints !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{cleanPoints}</div>
                        <div className="text-sm text-gray-600">Clean Points</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg"
              >
                Awesome!
              </motion.button>
            </div>
          ) : (
            // Badge Lost Content
            <div className="p-8 text-center">
              {/* Warning Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="mx-auto mb-6"
              >
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-gray-400 to-red-400 rounded-full flex items-center justify-center shadow-2xl">
                  <AlertTriangle size={64} className="text-white" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Badge Privileges Lost
              </motion.h2>

              {/* Student Name */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-700 mb-4"
              >
                <span className="font-semibold text-red-600">{studentName}</span>
              </motion.p>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 mb-6"
              >
                This student has lost their Goldie Badge privileges due to recent behaviour.
              </motion.p>

              {/* Stats */}
              {cleanPoints !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/80 rounded-xl p-4 mb-6"
                >
                  <div className="text-2xl font-bold text-red-600">{cleanPoints}</div>
                  <div className="text-sm text-gray-600">Current Clean Points</div>
                  <div className="text-xs text-gray-500 mt-2">Needs 10+ to regain badge</div>
                </motion.div>
              )}

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg"
              >
                Understood
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BadgeStatusModal;
