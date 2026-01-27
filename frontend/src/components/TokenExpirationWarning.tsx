import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TokenExpirationWarning: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token') || localStorage.getItem('platform_token');
      
      if (!token || !user) {
        setShowWarning(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const minutesRemaining = Math.floor((expiresAt - now) / 1000 / 60);

        setTimeRemaining(minutesRemaining);

        // Show warning if less than 5 minutes remaining
        if (minutesRemaining <= 5 && minutesRemaining > 0) {
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      } catch (e) {
        console.error('Error checking token expiration:', e);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      setShowWarning(false);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-2xl p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">Session Expiring Soon</h3>
                <p className="text-sm text-white/90 mb-3">
                  Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}. 
                  Click refresh to stay logged in.
                </p>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDismiss}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TokenExpirationWarning;
