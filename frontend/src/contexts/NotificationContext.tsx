import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './SupabaseAuthContext';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
  related_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearAllRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const NOTIFICATIONS_PER_PAGE = 20;
const CACHE_DURATION = 60000; // 1 minute cache

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  // Cache management refs
  const lastFetchRef = useRef<number>(0);
  const unreadCountCacheRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user || isFetchingRef.current) return;
    
    // Avoid duplicate fetches within cache duration (unless reset)
    const now = Date.now();
    if (!reset && now - lastFetchRef.current < CACHE_DURATION && notifications.length > 0) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      const response = await api.getNotifications({
        limit: NOTIFICATIONS_PER_PAGE,
        offset: currentOffset,
      });
      
      const newNotifications = response.data || [];
      
      if (reset) {
        setNotifications(newNotifications);
        setOffset(NOTIFICATIONS_PER_PAGE);
        // Update unread count from fetched notifications
        const unread = newNotifications.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
        setOffset((prev) => prev + NOTIFICATIONS_PER_PAGE);
      }
      
      setHasMore(newNotifications.length === NOTIFICATIONS_PER_PAGE);
      lastFetchRef.current = now;
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, offset, notifications.length]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications(false);
  }, [hasMore, loading, fetchNotifications]);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    
    // Cache unread count for 10 seconds
    const now = Date.now();
    if (now - unreadCountCacheRef.current < 10000) {
      return;
    }

    try {
      const response = await api.getUnreadCount();
      setUnreadCount(response.data.count || 0);
      unreadCountCacheRef.current = now;
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Initial fetch and periodic unread count refresh
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      
      // Refresh unread count every 60 seconds (reduced from 30s)
      const interval = setInterval(refreshUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Socket.io real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNotification = (notification: Notification) => {
        // Add to top of list
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Show toast notification with custom styling
        const typeConfig: Record<string, { icon: string; color: string }> = {
          incident: { icon: '⚠️', color: 'border-l-red-500' },
          detention: { icon: '📋', color: 'border-l-orange-500' },
          merit: { icon: '⭐', color: 'border-l-green-500' },
          attendance: { icon: '📅', color: 'border-l-blue-500' },
          message: { icon: '💬', color: 'border-l-purple-500' },
          intervention: { icon: '🤝', color: 'border-l-teal-500' },
          consequence: { icon: '⚡', color: 'border-l-amber-500' },
        };
        
        const config = typeConfig[notification.type] || { icon: '🔔', color: 'border-l-gray-500' };
        
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-sm w-full bg-white shadow-2xl rounded-xl pointer-events-auto border-l-4 ${config.color} overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">Just now</p>
                  </div>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  const clearAllRead = useCallback(async () => {
    try {
      const readNotifications = notifications.filter((n) => n.is_read);
      await Promise.all(readNotifications.map((n) => api.deleteNotification(n.id)));
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success('Cleared all read notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
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
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

