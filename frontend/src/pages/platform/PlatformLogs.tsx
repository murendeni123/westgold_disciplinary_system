import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Building2,
  Globe,
  ChevronRight,
  Filter,
  Calendar,
  RefreshCw,
  Activity,
  Search,
} from 'lucide-react';

interface School {
  id: number;
  school_name: string;
  school_code: string;
  status: string;
}

interface LogEntry {
  id: number;
  action_type: string;
  entity_type: string;
  description: string;
  platform_user_id: number | null;
  school_id: number | null;
  created_at: string;
  performed_by?: string;
}

interface Filters {
  action_type: string;
  start_date: string;
  end_date: string;
}

type SelectedTarget = { type: 'platform' } | { type: 'school'; school: School };

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  update: 'bg-blue-100 text-blue-700 border border-blue-200',
  delete: 'bg-red-100 text-red-700 border border-red-200',
};

const getActionColor = (action: string) =>
  ACTION_COLORS[action?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border border-gray-200';

const SkeletonRow: React.FC = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
    <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  </div>
);

const PlatformLogs: React.FC = () => {
  const { showError } = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const [selected, setSelected] = useState<SelectedTarget>({ type: 'platform' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    action_type: '',
    start_date: '',
    end_date: '',
  });

  const [schoolSearch, setSchoolSearch] = useState('');

  // Fetch school list once on mount
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const res = await api.getPlatformSchools();
        setSchools(res.data?.schools ?? res.data ?? []);
      } catch (err: any) {
        showError(err.response?.data?.error || 'Failed to load schools');
      } finally {
        setSchoolsLoading(false);
      }
    };
    loadSchools();
  }, []);

  // Fetch logs whenever selection or filters change
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params: Record<string, any> = { limit: 100 };
      if (selected.type === 'platform') {
        params.school_id = 'platform';
      } else {
        params.school_id = selected.school.id;
      }
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const res = await api.getPlatformLogs(params);
      setLogs(res.data?.logs ?? res.data ?? []);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load logs');
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [selected, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredSchools = schools.filter((s) =>
    s.school_name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
    s.school_code.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const isPlatformSelected = selected.type === 'platform';
  const selectedSchoolId = selected.type === 'school' ? selected.school.id : null;

  const rightPanelTitle =
    selected.type === 'platform'
      ? 'Platform Activity'
      : selected.school.school_name;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-gray-500 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-gray-500 mt-1 text-base">
            Track all platform and school-level activities
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchLogs}
          className="p-3 rounded-xl bg-white shadow-md border border-gray-100 text-gray-500 hover:text-slate-700 transition-colors"
          title="Refresh logs"
        >
          <RefreshCw size={18} />
        </motion.button>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT — school list */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full lg:w-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Panel header */}
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">Select Source</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose a school or platform activity
            </p>
            {/* School search */}
            <div className="relative mt-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          <div className="p-3 space-y-1 max-h-[600px] overflow-y-auto">
            {/* Platform Activity item */}
            <button
              onClick={() => setSelected({ type: 'platform' })}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                isPlatformSelected
                  ? 'bg-gradient-to-r from-slate-700 to-gray-700 text-white shadow-md'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isPlatformSelected
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-slate-500 to-gray-600'
                }`}
              >
                <Globe size={18} className={isPlatformSelected ? 'text-white' : 'text-white'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isPlatformSelected ? 'text-white' : 'text-gray-900'}`}>
                  Platform Activity
                </p>
                <p className={`text-xs truncate ${isPlatformSelected ? 'text-white/70' : 'text-gray-500'}`}>
                  Super-admin actions, no school
                </p>
              </div>
              {isPlatformSelected && <ChevronRight size={16} className="text-white/70 shrink-0" />}
            </button>

            {/* Divider */}
            <div className="pt-1 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schools</p>
            </div>

            {/* School list */}
            {schoolsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Building2 size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No schools found</p>
              </div>
            ) : (
              filteredSchools.map((school) => {
                const isActive = selectedSchoolId === school.id;
                return (
                  <button
                    key={school.id}
                    onClick={() => setSelected({ type: 'school', school })}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-700 to-gray-700 text-white shadow-md'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      {school.school_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {school.school_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                          {school.school_code}
                        </span>
                        {school.status === 'active' && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-white/70 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* RIGHT — log table */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex-1 min-w-0 space-y-4"
        >
          {/* Filters card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-gray-500" />
              <span className="font-semibold text-gray-700 text-sm">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Action type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
                <select
                  value={filters.action_type}
                  onChange={(e) => setFilters((f) => ({ ...f, action_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* Start date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> From
                  </span>
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                />
              </div>
              {/* End date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> To
                  </span>
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Log table card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  {rightPanelTitle}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {logsLoading ? 'Loading...' : `${logs.length} log${logs.length !== 1 ? 's' : ''} found`}
                </p>
              </div>
            </div>

            {logsLoading ? (
              <div className="flex justify-center items-center h-48">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-gray-200 border-t-slate-600 rounded-full"
                />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileText size={48} className="mb-3 opacity-20" />
                <p className="font-medium text-gray-500">No activity logs found for this selection</p>
                <p className="text-sm mt-1">Try adjusting your filters or selecting a different source</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Action
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Entity
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Performed By
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence initial={false}>
                      {logs.map((log, index) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.2 }}
                          className="hover:bg-gray-50/70 transition-colors"
                        >
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getActionColor(
                                log.action_type
                              )}`}
                            >
                              {log.action_type || 'other'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-sm text-gray-600 font-medium capitalize">
                              {log.entity_type || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <p className="text-sm text-gray-700 truncate" title={log.description}>
                              {log.description || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {log.performed_by || (log.platform_user_id ? `User #${log.platform_user_id}` : 'System')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-sm text-gray-400">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : '—'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlatformLogs;
