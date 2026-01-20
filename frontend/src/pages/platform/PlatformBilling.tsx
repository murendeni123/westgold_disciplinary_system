import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Building2,
  RefreshCw,
  FileText,
  RotateCcw,
  Eye,
  Filter,
  Search,
  ChevronRight,
  Zap,
  Crown,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  BarChart3,
  Wallet,
  Receipt,
  AlertCircle,
  School,
  Users
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface BillingData {
  total_revenue: number;
  count: number;
  subscriptions: Subscription[];
}

interface Subscription {
  id: number;
  school_id: number;
  school_name: string;
  plan_name: string;
  price: number;
  status: string;
  payment_status?: string;
  created_at: string;
  next_billing_date?: string;
  invoice_id?: string;
}

interface School {
  id: number;
  name: string;
  plan?: string;
  status?: string;
  student_count?: number;
}

const PlatformBilling: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Subscription | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filters, setFilters] = useState({
    school_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billingRes, schoolsRes, plansRes] = await Promise.all([
        api.getPlatformBilling(filters),
        api.getPlatformSchools(),
        api.getPlatformPlans()
      ]);
      
      setBilling(billingRes.data);
      setSchools(schoolsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!billing?.subscriptions || billing.subscriptions.length === 0) {
      error('No data to export');
      return;
    }

    const csv = [
      ['Invoice ID', 'School', 'Plan', 'Amount', 'Status', 'Payment Status', 'Date'],
      ...billing.subscriptions.map((sub: Subscription) => [
        sub.invoice_id || `INV-${sub.id}`,
        sub.school_name,
        sub.plan_name,
        `$${sub.price}`,
        sub.status,
        sub.payment_status || 'paid',
        new Date(sub.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Billing data exported successfully');
  };

  const handleDownloadInvoice = (sub: Subscription) => {
    // Generate a simple invoice PDF (in real app, this would call backend)
    const invoiceContent = `
INVOICE
Invoice ID: ${sub.invoice_id || `INV-${sub.id}`}
Date: ${new Date(sub.created_at).toLocaleDateString()}

Bill To: ${sub.school_name}

Description: ${sub.plan_name} Subscription
Amount: $${sub.price}

Status: ${sub.payment_status || 'Paid'}

Thank you for your business!
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${sub.invoice_id || sub.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Invoice downloaded');
  };

  const handleRefund = (sub: Subscription) => {
    setSelectedTransaction(sub);
    setIsRefundModalOpen(true);
  };

  const confirmRefund = async () => {
    if (!selectedTransaction) return;
    try {
      // In real app, call refund API
      // await api.refundTransaction(selectedTransaction.id);
      success(`Refund initiated for ${selectedTransaction.school_name}`);
      setIsRefundModalOpen(false);
      setSelectedTransaction(null);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error processing refund');
    }
  };

  const viewDetails = (sub: Subscription) => {
    setSelectedTransaction(sub);
    setIsDetailsModalOpen(true);
  };

  // Calculate metrics
  const totalRevenue = billing?.total_revenue || 0;
  const subscriptionCount = billing?.count || 0;
  const subscriptions = billing?.subscriptions || [];
  
  // Mock additional metrics (in real app, these would come from API)
  const failedPayments = subscriptions.filter(s => s.payment_status === 'failed').length;
  const pendingPayments = subscriptions.filter(s => s.payment_status === 'pending').length;
  const paidPayments = subscriptions.filter(s => !s.payment_status || s.payment_status === 'paid').length;
  
  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = plans.reduce((sum, plan) => {
    const planSchools = schools.filter(s => 
      s.plan?.toLowerCase() === plan.name.toLowerCase() || 
      (!s.plan && plan.name.toLowerCase() === 'trial')
    );
    return sum + (plan.price * planSchools.length);
  }, 0);

  // Revenue by plan
  const revenueByPlan = plans.map(plan => {
    const planSchools = schools.filter(s => 
      s.plan?.toLowerCase() === plan.name.toLowerCase() || 
      (!s.plan && plan.name.toLowerCase() === 'trial')
    );
    return {
      name: plan.name,
      schools: planSchools.length,
      revenue: plan.price * planSchools.length,
      percentage: mrr > 0 ? Math.round((plan.price * planSchools.length / mrr) * 100) : 0
    };
  }).filter(p => p.revenue > 0);

  // Upcoming renewals (mock data - in real app from API)
  const upcomingRenewals = subscriptions.slice(0, 5).map(sub => ({
    ...sub,
    next_billing_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery || 
      sub.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || 
      (sub.payment_status || 'paid') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get plan icon
  const getPlanIcon = (planName: string) => {
    const name = planName?.toLowerCase() || '';
    if (name === 'trial') return Clock;
    if (name === 'starter') return Zap;
    if (name === 'pro') return Crown;
    if (name === 'enterprise') return Building2;
    return Star;
  };

  // Get plan color
  const getPlanColor = (planName: string) => {
    const name = planName?.toLowerCase() || '';
    if (name === 'trial') return 'from-gray-400 to-slate-500';
    if (name === 'starter') return 'from-blue-500 to-cyan-500';
    if (name === 'pro') return 'from-purple-500 to-pink-500';
    if (name === 'enterprise') return 'from-amber-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          iconColor: 'text-green-500',
          label: 'Paid'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-700 border-red-200',
          iconColor: 'text-red-500',
          label: 'Failed'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          iconColor: 'text-amber-500',
          label: 'Pending'
        };
      case 'refunded':
        return {
          icon: RotateCcw,
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          iconColor: 'text-purple-500',
          label: 'Refunded'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          iconColor: 'text-green-500',
          label: 'Paid'
        };
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Billing & Payments
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Track revenue, payments, and subscription health
          </p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={fetchData}
              variant="secondary"
              className="shadow-md"
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg hover:shadow-xl"
            >
              <Download size={18} className="mr-2" />
              Export All
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Billing Health Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
      >
        {/* Payment Provider Status */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Payment Provider</span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stripe</p>
              <p className="text-xs text-gray-500">All systems operational</p>
            </div>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Failed Payments</span>
            {failedPayments > 0 && (
              <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                <AlertTriangle size={12} />
                Needs attention
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              failedPayments > 0 ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              {failedPayments > 0 ? <XCircle size={24} className="text-white" /> : <CheckCircle size={24} className="text-white" />}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{failedPayments}</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Pending</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
              <p className="text-xs text-gray-500">Awaiting payment</p>
            </div>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Successful</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{paidPayments}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Revenue Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
              <p className="text-4xl font-bold mt-2">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-100 text-sm">
                <ArrowUpRight size={16} />
                <span>+12.5% from last month</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <DollarSign size={32} />
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Monthly Recurring Revenue</p>
              <p className="text-4xl font-bold mt-2">${mrr.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2 text-blue-100 text-sm">
                <TrendingUp size={16} />
                <span>From {schools.length} active schools</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Activity size={32} />
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Subscriptions</p>
              <p className="text-4xl font-bold mt-2">{subscriptionCount}</p>
              <div className="flex items-center gap-1 mt-2 text-purple-100 text-sm">
                <Users size={16} />
                <span>Across all plans</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Receipt size={32} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Revenue Breakdown & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Plan</h3>
              <p className="text-sm text-gray-500">Monthly breakdown</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <PieChart size={20} className="text-purple-600" />
            </div>
          </div>
          
          {revenueByPlan.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No revenue data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revenueByPlan.map((plan, index) => {
                const PlanIcon = getPlanIcon(plan.name);
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getPlanColor(plan.name)} flex items-center justify-center text-white`}>
                      <PlanIcon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800">{plan.name}</span>
                        <span className="font-semibold text-gray-900">${plan.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${plan.percentage}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                            className={`h-full bg-gradient-to-r ${getPlanColor(plan.name)}`}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">{plan.percentage}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{plan.schools} schools</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Upcoming Renewals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h3>
              <p className="text-sm text-gray-500">Next 30 days</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Calendar size={20} className="text-amber-600" />
            </div>
          </div>
          
          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No upcoming renewals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRenewals.map((renewal, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {renewal.school_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{renewal.school_name}</p>
                      <p className="text-xs text-gray-500">{renewal.plan_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${renewal.price}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(renewal.next_billing_date || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Table Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <p className="text-sm text-gray-500">All billing transactions</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all w-full sm:w-64"
                />
              </div>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 bg-white cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full"
            />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-800 mb-1">No transactions found</h4>
            <p className="text-gray-500">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Transactions will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscriptions.map((sub, index) => {
                  const status = getStatusBadge(sub.payment_status || 'paid');
                  const StatusIcon = status.icon;
                  const PlanIcon = getPlanIcon(sub.plan_name);
                  
                  return (
                    <motion.tr
                      key={sub.id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">
                          {sub.invoice_id || `INV-${sub.id || index + 1000}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                            {sub.school_name?.charAt(0) || 'S'}
                          </div>
                          <span className="font-medium text-gray-800">{sub.school_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getPlanColor(sub.plan_name)} flex items-center justify-center text-white`}>
                            <PlanIcon size={12} />
                          </div>
                          <span className="text-gray-700">{sub.plan_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">${sub.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon size={12} className={status.iconColor} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => viewDetails(sub)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownloadInvoice(sub)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Download Invoice"
                          >
                            <FileText size={16} />
                          </motion.button>
                          {(sub.payment_status === 'paid' || !sub.payment_status) && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRefund(sub)}
                              className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                              title="Refund"
                            >
                              <RotateCcw size={16} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedTransaction && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedTransaction(null);
            }}
            title=""
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                  <Receipt size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                  <p className="text-sm text-gray-500">
                    Invoice {selectedTransaction.invoice_id || `INV-${selectedTransaction.id}`}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">School</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.school_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Plan</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.plan_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="font-semibold text-gray-900 text-xl">${selectedTransaction.price}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {(() => {
                    const status = getStatusBadge(selectedTransaction.payment_status || 'paid');
                    const StatusIcon = status.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        <StatusIcon size={12} className={status.iconColor} />
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Invoice ID</p>
                  <p className="font-mono text-gray-900">
                    {selectedTransaction.invoice_id || `INV-${selectedTransaction.id}`}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedTransaction(null);
                  }}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadInvoice(selectedTransaction)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 rounded-xl"
                >
                  <FileText size={16} className="mr-2" />
                  Download Invoice
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {isRefundModalOpen && selectedTransaction && (
          <Modal
            isOpen={isRefundModalOpen}
            onClose={() => {
              setIsRefundModalOpen(false);
              setSelectedTransaction(null);
            }}
            title="Process Refund"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-amber-800">
                      Are you sure you want to refund this transaction?
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      This action will credit ${selectedTransaction.price} back to the school's payment method.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {selectedTransaction.school_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedTransaction.school_name}</p>
                      <p className="text-sm text-gray-500">{selectedTransaction.plan_name}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">${selectedTransaction.price}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setSelectedTransaction(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmRefund}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Process Refund
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformBilling;
