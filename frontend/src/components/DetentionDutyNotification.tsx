import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, MapPin, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface DetentionDutyNotificationProps {
  notification: {
    id: number;
    session_date: string;
    start_time: string;
    end_time: string;
    location: string;
    student_count: number;
    message: string;
  } | null;
  onClose: () => void;
  onAcknowledge: () => void;
}

const DetentionDutyNotification: React.FC<DetentionDutyNotificationProps> = ({
  notification,
  onClose,
  onAcknowledge,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setAcknowledged(false);
    }
  }, [notification]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    setTimeout(() => {
      onAcknowledge();
      setIsVisible(false);
    }, 1000);
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            onClick={onClose}
          />

          {/* Notification Card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg mx-4"
          >
            <div className="relative">
              {/* Animated Background Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl blur-2xl"
              />

              {/* Main Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header with Gradient */}
                <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-8 overflow-hidden">
                  {/* Animated Sparkles */}
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute top-4 right-4"
                  >
                    <Sparkles className="text-yellow-300" size={32} />
                  </motion.div>

                  {/* Floating Orbs */}
                  <motion.div
                    animate={{
                      y: [-10, 10, -10],
                      x: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute top-1/2 left-8 w-16 h-16 bg-white/20 rounded-full blur-xl"
                  />
                  <motion.div
                    animate={{
                      y: [10, -10, 10],
                      x: [5, -5, 5],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute bottom-4 right-12 w-20 h-20 bg-white/20 rounded-full blur-xl"
                  />

                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors z-10"
                  >
                    <X className="text-white" size={20} />
                  </motion.button>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="relative z-10 w-20 h-20 mx-auto bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4"
                  >
                    <Clock className="text-purple-600" size={40} />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative z-10 text-3xl font-bold text-white text-center mb-2"
                  >
                    Detention Duty Assigned!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-10 text-white/90 text-center text-sm"
                  >
                    You have been assigned to supervise a detention session
                  </motion.p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  {/* Session Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    {/* Date */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Date</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(notification.session_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Time</p>
                        <p className="text-lg font-bold text-gray-900">
                          {notification.start_time} - {notification.end_time}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-lg font-bold text-gray-900">{notification.location}</p>
                      </div>
                    </div>

                    {/* Student Count */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Expected Students</p>
                        <p className="text-lg font-bold text-gray-900">
                          {notification.student_count} {notification.student_count === 1 ? 'student' : 'students'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Message */}
                  {notification.message && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                    >
                      <p className="text-sm text-gray-600 italic">"{notification.message}"</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="flex-1 px-6 py-4 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      View Later
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAcknowledge}
                      disabled={acknowledged}
                      className={`flex-1 px-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center space-x-2 ${
                        acknowledged
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {acknowledged ? (
                        <>
                          <CheckCircle size={20} />
                          <span>Acknowledged!</span>
                        </>
                      ) : (
                        <span>Acknowledge</span>
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetentionDutyNotification;
