import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import Select from '../../components/Select';
import Input from '../../components/Input';
import { useToast } from '../../hooks/useToast';

const Notifications: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
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
      success('All notifications marked as read');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
      error('Error marking all notifications as read');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await api.deleteNotification(id);
      success('Notification deleted successfully');
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      error('Error deleting notification');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 mt-2 text-lg">View and manage your notifications</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleMarkAllRead}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Check size={20} className="mr-2" />
            Mark All Read
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
          <Filter className="text-emerald-600" size={24} />
        </div>
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
            ]}
            className="rounded-xl"
          />

          <Select
            label="Status"
            value={filters.is_read}
            onChange={(e) => setFilters({ ...filters, is_read: e.target.value })}
            className="rounded-xl"
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
            className="rounded-xl"
          />

          <Input
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
      >
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`p-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-colors ${
                  !notification.is_read ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        <Check size={16} />
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Notifications;

