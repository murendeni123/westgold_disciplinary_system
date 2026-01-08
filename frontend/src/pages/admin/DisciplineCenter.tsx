import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import {
  Scale,
  AlertTriangle,
  Clock,
  FileText,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  UserX,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type TabType = 'behaviour' | 'detentions' | 'interventions' | 'consequences';

interface Incident {
  id: number;
  student_name: string;
  incident_type: string;
  description: string;
  severity: string;
  date: string;
  reported_by: string;
  status: string;
}

interface Detention {
  id: number;
  student_name: string;
  reason: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  supervisor: string;
}

interface Intervention {
  id: number;
  student_name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  assigned_to: string;
  notes: string;
}

interface Consequence {
  id: number;
  student_name: string;
  type: string;
  reason: string;
  date_assigned: string;
  due_date: string;
  status: string;
  completed: boolean;
}

const DisciplineCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('behaviour');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Data states
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalIncidents: 0,
    pendingDetentions: 0,
    activeInterventions: 0,
    pendingConsequences: 0,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'behaviour':
          const incidentsRes = await api.getIncidents();
          setIncidents(incidentsRes.data || []);
          break;
        case 'detentions':
          const detentionsRes = await api.getDetentions();
          setDetentions(detentionsRes.data || []);
          break;
        case 'interventions':
          const interventionsRes = await api.getInterventions();
          setInterventions(interventionsRes.data || []);
          break;
        case 'consequences':
          const consequencesRes = await api.getConsequences();
          setConsequences(consequencesRes.data || []);
          break;
      }
      
      // Fetch stats
      const [incRes, detRes, intRes, conRes] = await Promise.all([
        api.getIncidents(),
        api.getDetentions(),
        api.getInterventions(),
        api.getConsequences(),
      ]);
      
      setStats({
        totalIncidents: incRes.data?.length || 0,
        pendingDetentions: detRes.data?.filter((d: any) => d.status === 'pending' || d.status === 'scheduled').length || 0,
        activeInterventions: intRes.data?.filter((i: any) => i.status === 'active' || i.status === 'in_progress').length || 0,
        pendingConsequences: conRes.data?.filter((c: any) => !c.completed && c.status !== 'completed').length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'behaviour' as TabType, label: 'Behaviour', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
    { id: 'detentions' as TabType, label: 'Detentions', icon: Clock, color: 'from-amber-500 to-yellow-500' },
    { id: 'interventions' as TabType, label: 'Interventions', icon: Shield, color: 'from-blue-500 to-cyan-500' },
    { id: 'consequences' as TabType, label: 'Consequences', icon: FileText, color: 'from-purple-500 to-pink-500' },
  ];

  const statCards = [
    { label: 'Total Incidents', value: stats.totalIncidents, icon: AlertTriangle, color: 'from-red-500 to-orange-500', trend: 'down' },
    { label: 'Pending Detentions', value: stats.pendingDetentions, icon: Clock, color: 'from-amber-500 to-yellow-500', trend: 'neutral' },
    { label: 'Active Interventions', value: stats.activeInterventions, icon: Shield, color: 'from-blue-500 to-cyan-500', trend: 'up' },
    { label: 'Pending Consequences', value: stats.pendingConsequences, icon: FileText, color: 'from-purple-500 to-pink-500', trend: 'down' },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
      case 'moderate':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
      case 'minor':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'resolved':
      case 'attended':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'scheduled':
        return 'bg-amber-100 text-amber-700';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'missed':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderBehaviourTable = () => (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Incident Type</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Severity</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {incidents.map((incident, index) => (
          <motion.tr
            key={incident.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {incident.student_name?.charAt(0) || 'S'}
                </div>
                <span className="font-medium text-gray-900">{incident.student_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{incident.incident_type}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadge(incident.severity)}`}>
                {incident.severity}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-500">{new Date(incident.date).toLocaleDateString()}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(incident.status)}`}>
                {incident.status}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Eye size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );

  const renderDetentionsTable = () => (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {detentions.map((detention, index) => (
          <motion.tr
            key={detention.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {detention.student_name?.charAt(0) || 'S'}
                </div>
                <span className="font-medium text-gray-900">{detention.student_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{detention.reason}</td>
            <td className="px-6 py-4 text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>{new Date(detention.date).toLocaleDateString()} {detention.time}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-500">{detention.duration} mins</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(detention.status)}`}>
                {detention.status}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Eye size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );

  const renderInterventionsTable = () => (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {interventions.map((intervention, index) => (
          <motion.tr
            key={intervention.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {intervention.student_name?.charAt(0) || 'S'}
                </div>
                <span className="font-medium text-gray-900">{intervention.student_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{intervention.type}</td>
            <td className="px-6 py-4 text-gray-500">
              {new Date(intervention.start_date).toLocaleDateString()} - {intervention.end_date ? new Date(intervention.end_date).toLocaleDateString() : 'Ongoing'}
            </td>
            <td className="px-6 py-4 text-gray-600">{intervention.assigned_to}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(intervention.status)}`}>
                {intervention.status}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Eye size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );

  const renderConsequencesTable = () => (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {consequences.map((consequence, index) => (
          <motion.tr
            key={consequence.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {consequence.student_name?.charAt(0) || 'S'}
                </div>
                <span className="font-medium text-gray-900">{consequence.student_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{consequence.type}</td>
            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{consequence.reason}</td>
            <td className="px-6 py-4 text-gray-500">{consequence.due_date ? new Date(consequence.due_date).toLocaleDateString() : 'N/A'}</td>
            <td className="px-6 py-4">
              <div className="flex items-center space-x-2">
                {consequence.completed ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-amber-500" />
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(consequence.status)}`}>
                  {consequence.completed ? 'Completed' : consequence.status}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Eye size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (activeTab) {
      case 'behaviour':
        return renderBehaviourTable();
      case 'detentions':
        return renderDetentionsTable();
      case 'interventions':
        return renderInterventionsTable();
      case 'consequences':
        return renderConsequencesTable();
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'behaviour':
        return incidents;
      case 'detentions':
        return detentions;
      case 'interventions':
        return interventions;
      case 'consequences':
        return consequences;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="text-white" size={24} />
            </div>
            <span>Discipline Center</span>
          </h1>
          <p className="text-gray-500 mt-1">Manage behaviour, detentions, interventions, and consequences</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                  {stat.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                  {stat.trend === 'neutral' && <Activity size={16} className="text-gray-400" />}
                </div>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="text-white" size={22} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100"
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col md:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full"
            />
          </div>
        ) : getCurrentData().length === 0 ? (
          <div className="p-12 text-center">
            <UserX size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No {activeTab} records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderTable()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DisciplineCenter;
