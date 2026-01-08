import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CheckCircle2 } from 'lucide-react';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';

const ModernNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    is_read: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      const params: any = {};
      if (filters.type) params.type = filters.type;
      if (filters.is_read !== '') params.is_read = filters.is_read === 'true';
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.getNotifications(params);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await api.deleteNotification(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
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
      className="space-y-8"
    >
      {/* Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-8 text-white shadow-2xl"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <Bell className="text-yellow-300" size={32} />
              <h1 className="text-4xl font-bold">Notifications</h1>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAllRead}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-semibold shadow-lg hover:bg-white/30 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 size={20} />
              <span>Mark All Read</span>
            </motion.button>
          </div>
          <p className="text-xl text-white/90 mt-4">
            Stay updated with important school notifications
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <ModernCard title="Filters" variant="glass">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              options={[
                { value: '', label: 'All Types' },
                { value: 'incident', label: 'Incident' },
                { value: 'merit', label: 'Merit' },
                { value: 'detention', label: 'Detention' },
                { value: 'attendance', label: 'Attendance' },
                { value: 'message', label: 'Message' },
                { value: 'intervention', label: 'Intervention' },
                { value: 'consequence', label: 'Consequence' },
              ]}
            />
            <Select
              label="Status"
              value={filters.is_read}
              onChange={(e) => setFilters({ ...filters, is_read: e.target.value })}
              options={[
                { value: '', label: 'All' },
                { value: 'false', label: 'Unread' },
                { value: 'true', label: 'Read' },
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
        </ModernCard>
      </motion.div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6"
              >
                <Bell className="text-white" size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">No notifications found</p>
            </div>
          </ModernCard>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <ModernCard variant="glass">
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all ${
                      !notification.is_read ? 'bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg"
                            >
                              New
                            </motion.span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{notification.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.is_read && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMarkRead(notification.id)}
                            className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-600 transition-colors"
                          >
                            <Check size={18} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModernNotifications;

