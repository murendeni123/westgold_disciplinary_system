import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Download } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PlatformBilling: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    school_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchBilling();
  }, [filters]);

  const fetchBilling = async () => {
    try {
      const params: any = {};
      if (filters.school_id) params.school_id = filters.school_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.getPlatformBilling(params);
      setBilling(response.data);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching billing');
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
      ['School', 'Plan', 'Amount', 'Status', 'Date'],
      ...billing.subscriptions.map((sub: any) => [
        sub.school_name,
        sub.plan_name,
        `$${sub.price}`,
        sub.status,
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

  const columns = [
    { key: 'school_name', label: 'School' },
    { key: 'plan_name', label: 'Plan' },
    { key: 'price', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Date' },
  ];

  const tableData = billing?.subscriptions?.map((sub: any) => ({
    ...sub,
    price: `$${sub.price}`,
    status: (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          sub.status === 'active'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {sub.status}
      </span>
    ),
    created_at: new Date(sub.created_at).toLocaleDateString(),
  })) || [];

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Billing & Payments
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Track revenue and subscription payments</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={handleExport}
            className="bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Download size={20} className="mr-2" />
            Export
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                ${billing?.total_revenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500">
              <DollarSign className="text-white" size={32} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900">{billing?.count || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Calendar className="text-white" size={32} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={fetchBilling}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
              >
                Apply Filters
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full"
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
        >
          <Table columns={columns} data={tableData} />
        </motion.div>
      )}
    </div>
  );
};

export default PlatformBilling;
