import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Settings,
  Users,
  BarChart3,
  FileText,
  Phone,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  MessageCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

interface WhatsAppStatus {
  enabled: boolean;
  configured: boolean;
  phoneNumberId: string | null;
  stats: {
    last30Days: {
      total: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
    };
  };
}

interface NotificationLog {
  id: number;
  user_id: number;
  student_id: number;
  channel: string;
  type: string;
  template_name: string;
  recipient_phone: string;
  status: string;
  message_id: string;
  error_message: string;
  created_at: string;
  delivered_at: string;
  read_at: string;
  student_name: string;
  parent_name: string;
}

interface WhatsAppTemplate {
  id: number;
  template_name: string;
  template_type: string;
  template_text: string;
  language_code: string;
  status: string;
  parameter_count: number;
}

interface OptedInUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  role: string;
  linked_students: number;
}

interface Stats {
  overall: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  byType: Array<{
    type: string;
    total: number;
    successful: number;
    failed: number;
  }>;
  dailyTrend: Array<{
    date: string;
    total: number;
    successful: number;
  }>;
  optedInUsers: number;
}

type TabType = 'overview' | 'logs' | 'templates' | 'users' | 'settings';

const WhatsAppManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [optedInUsers, setOptedInUsers] = useState<OptedInUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Logs pagination and filters
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [logsLimit] = useState(20);
  const [logFilters, setLogFilters] = useState({
    type: '',
    status: '',
    search: '',
  });

  // Test notification
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'users') {
      fetchOptedInUsers();
    }
  }, [activeTab, logsPage, logFilters]);

  const fetchStatus = async () => {
    try {
      const response = await api.getWhatsAppStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getWhatsAppStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await api.getWhatsAppLogs({
        type: logFilters.type || undefined,
        status: logFilters.status || undefined,
        limit: logsLimit,
        offset: logsPage * logsLimit,
      });
      setLogs(response.data.logs);
      setLogsTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.getWhatsAppTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchOptedInUsers = async () => {
    try {
      const response = await api.getWhatsAppOptedInUsers();
      setOptedInUsers(response.data);
    } catch (error) {
      console.error('Error fetching opted-in users:', error);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    setSendingTest(true);
    try {
      const response = await api.sendWhatsAppTest(testPhone);
      if (response.data.success) {
        toast.success('Test message sent successfully!');
        setTestPhone('');
      } else {
        toast.error(response.data.error || 'Failed to send test message');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send test message');
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'read':
        return 'text-purple-600 bg-purple-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'disabled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'read':
        return <Eye className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      attendance_absent: 'Absence',
      attendance_late: 'Late Arrival',
      behaviour_incident: 'Incident',
      merit_awarded: 'Merit',
      detention_scheduled: 'Detention',
      test: 'Test',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-ZA', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'logs', label: 'Notification Logs', icon: FileText },
    { id: 'templates', label: 'Templates', icon: MessageCircle },
    { id: 'users', label: 'Opted-In Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Notifications</h1>
            <p className="text-gray-500">Manage WhatsApp messaging and view notification logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status?.enabled ? (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              Disabled
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Sent (30 days)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.overall.total || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {stats?.overall.delivered || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Read</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {stats?.overall.read || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Failed</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">
                      {stats?.overall.failed || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats by Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications by Type</h3>
                <div className="space-y-3">
                  {stats?.byType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-gray-700">{getTypeLabel(item.type)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{item.total} total</span>
                        <span className="text-sm text-green-600">{item.successful} delivered</span>
                        {item.failed > 0 && (
                          <span className="text-sm text-red-600">{item.failed} failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!stats?.byType || stats.byType.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No notifications sent yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Opted-in Parents</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats?.optedInUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Delivery Rate</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {stats?.overall.total
                        ? Math.round(((stats.overall.delivered + stats.overall.read) / stats.overall.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Service Status</span>
                    </div>
                    <span className={`font-medium ${status?.enabled ? 'text-green-600' : 'text-yellow-600'}`}>
                      {status?.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Trend */}
            {stats?.dailyTrend && stats.dailyTrend.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 7 Days</h3>
                <div className="flex items-end justify-between gap-2 h-32">
                  {stats.dailyTrend.map((day) => {
                    const maxTotal = Math.max(...stats.dailyTrend.map((d) => d.total));
                    const height = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs text-gray-500 mb-1">{day.total}</span>
                          <div
                            className="w-full bg-green-500 rounded-t-md transition-all"
                            style={{ height: `${Math.max(height, 4)}px` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(day.date).toLocaleDateString('en-ZA', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                <select
                  value={logFilters.type}
                  onChange={(e) => {
                    setLogFilters({ ...logFilters, type: e.target.value });
                    setLogsPage(0);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Types</option>
                  <option value="attendance_absent">Absence</option>
                  <option value="attendance_late">Late Arrival</option>
                  <option value="behaviour_incident">Incident</option>
                  <option value="merit_awarded">Merit</option>
                  <option value="detention_scheduled">Detention</option>
                </select>
                <select
                  value={logFilters.status}
                  onChange={(e) => {
                    setLogFilters({ ...logFilters, status: e.target.value });
                    setLogsPage(0);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="read">Read</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  onClick={() => {
                    setLogFilters({ type: '', status: '', search: '' });
                    setLogsPage(0);
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
                <button
                  onClick={fetchLogs}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No notification logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(log.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                              {getTypeLabel(log.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{log.student_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{log.parent_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.recipient_phone || '-'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                log.status
                              )}`}
                            >
                              {getStatusIcon(log.status)}
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(log.delivered_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logsTotal > logsLimit && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Showing {logsPage * logsLimit + 1} to {Math.min((logsPage + 1) * logsLimit, logsTotal)} of{' '}
                    {logsTotal} results
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLogsPage(Math.max(0, logsPage - 1))}
                      disabled={logsPage === 0}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {logsPage + 1} of {Math.ceil(logsTotal / logsLimit)}
                    </span>
                    <button
                      onClick={() => setLogsPage(logsPage + 1)}
                      disabled={(logsPage + 1) * logsLimit >= logsTotal}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Template Approval Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    WhatsApp message templates must be created and approved in the Meta Business Manager before they
                    can be used. The templates below are reference entries - ensure they match your approved templates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{template.template_name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            template.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : template.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {template.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Type: {getTypeLabel(template.template_type)}</p>
                    </div>
                    <span className="text-sm text-gray-500">{template.parameter_count} parameters</span>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap">{template.template_text}</p>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No templates found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Parents Opted-In for WhatsApp</h3>
                <p className="text-sm text-gray-500 mt-1">
                  These parents have consented to receive WhatsApp notifications about their children.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        WhatsApp Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Linked Students
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {optedInUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No parents have opted in for WhatsApp notifications yet
                        </td>
                      </tr>
                    ) : (
                      optedInUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{user.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{user.whatsapp_number || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.linked_students}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Configuration Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${status?.configured ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="text-gray-700">API Credentials</span>
                  </div>
                  <span className={status?.configured ? 'text-green-600' : 'text-red-600'}>
                    {status?.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${status?.enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-gray-700">Service Enabled</span>
                  </div>
                  <span className={status?.enabled ? 'text-green-600' : 'text-yellow-600'}>
                    {status?.enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                {status?.phoneNumberId && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">Phone Number ID</span>
                    </div>
                    <span className="text-gray-600 font-mono">{status.phoneNumberId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Notification */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test Notification</h3>
              <p className="text-sm text-gray-500 mb-4">
                Send a test message to verify your WhatsApp integration is working correctly.
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest || !status?.enabled}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingTest ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Test
                </button>
              </div>
              {!status?.enabled && (
                <p className="text-sm text-yellow-600 mt-2">
                  WhatsApp is currently disabled. Enable it in your .env file to send messages.
                </p>
              )}
            </div>

            {/* Environment Variables */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Configuration</h3>
              <p className="text-sm text-gray-500 mb-4">
                The following environment variables must be set in your backend <code className="bg-gray-100 px-1 rounded">.env</code> file:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                <pre>{`# WhatsApp Cloud API Configuration
WHATSAPP_ENABLED=true
WHATSAPP_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-id
WHATSAPP_VERIFY_TOKEN=pds_whatsapp_verify_token`}</pre>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WhatsAppManagement;
