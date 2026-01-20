import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter, 
  Search,
  CheckCheck,
  AlertCircle,
  Award,
  Clock,
  Calendar,
  Shield,
  Heart,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
  related_type?: string;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, selectedType, selectedStatus]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications();
      setNotifications(response.data || []);
      
      const unreadCount = response.data?.filter((n: Notification) => !n.is_read).length || 0;
      setStats({
        total: response.data?.length || 0,
        unread: unreadCount,
        read: (response.data?.length || 0) - unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    if (selectedStatus === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (selectedStatus === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setStats(prev => ({ ...prev, unread: prev.unread - 1, read: prev.read + 1 }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setStats(prev => ({ total: prev.total, unread: 0, read: prev.total }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setStats(prev => ({
        total: prev.total - 1,
        unread: notification && !notification.is_read ? prev.unread - 1 : prev.unread,
        read: notification && notification.is_read ? prev.read - 1 : prev.read
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }

    if (notification.related_type && notification.related_id) {
      switch (notification.related_type) {
        case 'incident':
          navigate(`/parent/child-behaviour`);
          break;
        case 'merit':
          navigate(`/parent/child-merits`);
          break;
        case 'detention':
          navigate(`/parent/child-detentions`);
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertCircle className="text-red-500" size={24} />;
      case 'merit':
        return <Award className="text-green-500" size={24} />;
      case 'detention':
        return <Clock className="text-orange-500" size={24} />;
      case 'intervention':
        return <Shield className="text-blue-500" size={24} />;
      case 'academic':
        return <BookOpen className="text-purple-500" size={24} />;
      default:
        return <Bell className="text-gray-500" size={24} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'incident':
        return 'bg-red-100 text-red-700';
      case 'merit':
        return 'bg-green-100 text-green-700';
      case 'detention':
        return 'bg-orange-100 text-orange-700';
      case 'intervention':
        return 'bg-blue-100 text-blue-700';
      case 'academic':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">Stay updated about your child's progress</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMarkAllRead}
          disabled={stats.unread === 0}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <CheckCheck size={20} />
          <span>Mark All Read</span>
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total', value: stats.total, icon: Bell, color: 'from-blue-500 to-cyan-500' },
          { label: 'Unread', value: stats.unread, icon: AlertCircle, color: 'from-red-500 to-pink-500' },
          { label: 'Read', value: stats.read, icon: Check, color: 'from-green-500 to-emerald-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modern Inline Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Filter className="text-white" size={18} />
            </div>
            <h2 className="text-base font-semibold text-white">Filter Notifications</h2>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="incident">Behaviour Incidents</option>
                <option value="merit">Merits & Awards</option>
                <option value="detention">Detentions</option>
                <option value="intervention">Interventions</option>
                <option value="academic">Academic Updates</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
      >
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all ${
                    !notification.is_read ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-lg font-semibold text-gray-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{formatTime(notification.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notification.id);
                              }}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check size={18} className="text-green-600" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotificationsPage;
