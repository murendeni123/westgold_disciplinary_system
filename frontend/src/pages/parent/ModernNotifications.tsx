import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CheckCircle2, Filter, Loader2, Eye } from 'lucide-react';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import NotificationDetailModal from '../../components/NotificationDetailModal';

const ModernNotifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
  } = useNotifications();

  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<{ id: number; type: string } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loading, loadMore]);

  // Refresh on mount
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // Get notification type config
  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
      incident: { icon: '⚠️', color: 'text-red-600', bgColor: 'bg-red-50', label: 'Incident' },
      detention: { icon: '📋', color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Detention' },
      merit: { icon: '⭐', color: 'text-green-600', bgColor: 'bg-green-50', label: 'Merit' },
      demerit: { icon: '👎', color: 'text-red-600', bgColor: 'bg-red-50', label: 'Demerit' },
      attendance: { icon: '📅', color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Attendance' },
      intervention: { icon: '🤝', color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Intervention' },
      consequence: { icon: '⚡', color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Consequence' },
      behavior: { icon: '📊', color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Behavior' },
    };
    return configs[type] || { icon: '🔔', color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Notification' };
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifs: Notification[]) => {
    const groups: Record<string, Notification[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    notifs.forEach((notif) => {
      const date = new Date(notif.created_at);
      date.setHours(0, 0, 0, 0);
      
      let groupKey: string;
      if (date.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else if (date >= thisWeek) {
        groupKey = 'This Week';
      } else {
        groupKey = 'Older';
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(notif);
    });

    return groups;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter && n.type !== typeFilter) return false;
    if (statusFilter === 'unread' && n.is_read) return false;
    if (statusFilter === 'read' && !n.is_read) return false;
    return true;
  });

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bell size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
                <p className="text-white/80 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
              >
                <Filter size={18} />
                <span>Filter</span>
              </motion.button>
              
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
                >
                  <CheckCircle2 size={18} />
                  <span className="hidden md:inline">Mark All Read</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    setTypeFilter('');
                    setStatusFilter('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {/* Type Filter */}
                <div className="flex flex-wrap gap-2">
                  {['', 'incident', 'detention', 'merit', 'demerit', 'attendance'].map((type) => {
                    const config = type ? getTypeConfig(type) : { icon: '📋', label: 'All' };
                    return (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          typeFilter === type
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Status Filter */}
                <div className="flex gap-2 ml-auto">
                  {[
                    { value: '', label: 'All' },
                    { value: 'unread', label: 'Unread' },
                    { value: 'read', label: 'Read' },
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setStatusFilter(status.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        statusFilter === status.value
                          ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-500">
              {typeFilter || statusFilter ? 'No notifications match your filters' : "You're all caught up!"}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((groupName) => {
            const groupNotifs = groupedNotifications[groupName];
            if (!groupNotifs || groupNotifs.length === 0) return null;

            return (
              <motion.div key={groupName} variants={itemVariants}>
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {groupName}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {groupNotifs.length}
                  </span>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  <AnimatePresence>
                    {groupNotifs.map((notification) => {
                      const config = getTypeConfig(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`group relative p-4 md:p-5 hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                              <span className="text-xl">{config.icon}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`font-semibold truncate ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </h3>
                                    {!notification.is_read && (
                                      <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                                      {config.label}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatTime(notification.created_at)}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedNotification({ id: notification.id, type: notification.type })}
                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye size={16} />
                                  </motion.button>
                                  {!notification.is_read && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => markAsRead(notification.id)}
                                      className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-600 transition-colors"
                                      title="Mark as read"
                                    >
                                      <Check size={16} />
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteNotification(notification.id)}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Load More / Infinite Scroll Trigger */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {loading && (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 size={20} className="animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
            {!hasMore && notifications.length > 0 && (
              <p className="text-sm text-gray-400">No more notifications</p>
            )}
          </div>

          {/* Clear Read Button */}
          {notifications.some((n) => n.is_read) && (
            <motion.div variants={itemVariants} className="text-center">
              <button
                onClick={clearAllRead}
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
              >
                Clear all read notifications
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={selectedNotification !== null}
        onClose={() => setSelectedNotification(null)}
        notificationId={selectedNotification?.id || null}
        notificationType={selectedNotification?.type || ''}
      />
    </motion.div>
  );
};

export default ModernNotifications;

