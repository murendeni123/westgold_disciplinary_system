import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { FileText, Filter, Search } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PlatformLogs: React.FC = () => {
  const { error, ToastContainer } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action_type: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    limit: '100',
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const params: any = {};
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.limit) params.limit = filters.limit;

      const response = await api.getPlatformLogs(params);
      setLogs(response.data);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching logs');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'action_type', label: 'Action' },
    { key: 'entity_type', label: 'Entity' },
    { key: 'description', label: 'Description' },
    { key: 'user_id', label: 'User ID' },
    { key: 'created_at', label: 'Timestamp' },
  ];

  const tableData = logs.map((log) => ({
    ...log,
    action_type: (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          log.action_type === 'create'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : log.action_type === 'update'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
        }`}
      >
        {log.action_type}
      </span>
    ),
    created_at: new Date(log.created_at).toLocaleString(),
  }));

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
            Activity Logs
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Track all platform activities and changes</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Action Type"
            value={filters.action_type}
            onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
            ]}
          />
          <Select
            label="Entity Type"
            value={filters.entity_type}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
            options={[
              { value: '', label: 'All Entities' },
              { value: 'school', label: 'School' },
              { value: 'user', label: 'User' },
              { value: 'subscription', label: 'Subscription' },
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
          <Input
            label="Limit"
            type="number"
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full"
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

export default PlatformLogs;
