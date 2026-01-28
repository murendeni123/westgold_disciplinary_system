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
  ThumbsUp,
  ThumbsDown,
  X,
  Award,
} from 'lucide-react';

type TabType = 'behaviour' | 'detentions' | 'interventions' | 'consequences' | 'merits';

interface Incident {
  id: number;
  student_id: number;
  student_name: string;
  incident_type: string;
  incident_type_id: number;
  incident_type_name?: string;
  description: string;
  severity: string;
  date: string;
  time: string;
  points_deducted: number;
  teacher_name: string;
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
  assigned_by_name: string;
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

interface Merit {
  id: number;
  student_id: number;
  student_name: string;
  merit_type: string;
  merit_type_id?: number;
  description: string;
  points: number;
  date: string;
  teacher_name: string;
  created_at: string;
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
  const [merits, setMerits] = useState<Merit[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalIncidents: 0,
    pendingDetentions: 0,
    activeInterventions: 0,
    pendingConsequences: 0,
    totalMerits: 0,
  });

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailType, setDetailType] = useState<TabType>('behaviour');

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
          // Transform detention sessions to include student assignments
          const sessionsWithAssignments: Detention[] = [];
          for (const session of (detentionsRes.data || [])) {
            try {
              const detailRes = await api.getDetention(session.id);
              const assignments = detailRes.data?.assignments || [];
              assignments.forEach((assignment: any) => {
                sessionsWithAssignments.push({
                  id: assignment.id,
                  student_name: assignment.student_name || 'Unknown',
                  reason: assignment.notes || assignment.reason || session.notes || 'Detention',
                  date: session.detention_date,
                  time: session.detention_time,
                  duration: session.duration || 60,
                  status: assignment.status || session.status,
                  supervisor: session.teacher_name || 'Not assigned',
                });
              });
            } catch (err) {
              // If session has no assignments, show the session itself
              if (session.student_count > 0) continue;
            }
          }
          setDetentions(sessionsWithAssignments);
          break;
        case 'interventions':
          const interventionsRes = await api.getInterventions();
          setInterventions(interventionsRes.data || []);
          break;
        case 'consequences':
          const consequencesRes = await api.getConsequences();
          setConsequences(consequencesRes.data || []);
          break;
        case 'merits':
          const meritsRes = await api.getMerits();
          setMerits(meritsRes.data || []);
          break;
      }
      
      // Fetch stats
      const [incRes, detRes, intRes, conRes, merRes] = await Promise.all([
        api.getIncidents(),
        api.getDetentions(),
        api.getInterventions(),
        api.getConsequences(),
        api.getMerits(),
      ]);
      
      setStats({
        totalIncidents: incRes.data?.length || 0,
        pendingDetentions: detRes.data?.filter((d: any) => d.status === 'pending' || d.status === 'scheduled').length || 0,
        activeInterventions: intRes.data?.filter((i: any) => i.status === 'active' || i.status === 'in_progress').length || 0,
        pendingConsequences: conRes.data?.filter((c: any) => !c.completed && c.status !== 'completed').length || 0,
        totalMerits: merRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveIncident = async (incidentId: number) => {
    if (!window.confirm('Are you sure you want to approve this incident?')) return;
    
    setProcessing(true);
    try {
      await api.approveIncident(incidentId);
      alert('Incident approved successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving incident:', error);
      alert('Failed to approve incident');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineClick = (incidentId: number) => {
    setSelectedIncidentId(incidentId);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineSubmit = async () => {
    if (!selectedIncidentId) return;
    
    setProcessing(true);
    try {
      await api.declineIncident(selectedIncidentId, declineReason);
      alert('Incident declined successfully');
      setShowDeclineModal(false);
      setSelectedIncidentId(null);
      setDeclineReason('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error declining incident:', error);
      alert('Failed to decline incident');
    } finally {
      setProcessing(false);
    }
  };

  const handleRowClick = (item: any, type: TabType) => {
    setSelectedItem(item);
    setDetailType(type);
    setShowDetailModal(true);
  };

  const tabs = [
    { id: 'behaviour' as TabType, label: 'Behaviour', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
    { id: 'detentions' as TabType, label: 'Detentions', icon: Clock, color: 'from-amber-500 to-yellow-500' },
    { id: 'interventions' as TabType, label: 'Interventions', icon: Shield, color: 'from-blue-500 to-cyan-500' },
    { id: 'consequences' as TabType, label: 'Consequences', icon: FileText, color: 'from-purple-500 to-pink-500' },
    { id: 'merits' as TabType, label: 'Merits', icon: Award, color: 'from-green-500 to-emerald-500' },
  ];

  const statCards = [
    { label: 'Total Incidents', value: stats.totalIncidents, icon: AlertTriangle, color: 'from-red-500 to-orange-500', trend: 'down' },
    { label: 'Pending Detentions', value: stats.pendingDetentions, icon: Clock, color: 'from-amber-500 to-yellow-500', trend: 'neutral' },
    { label: 'Active Interventions', value: stats.activeInterventions, icon: Shield, color: 'from-blue-500 to-cyan-500', trend: 'up' },
    { label: 'Total Merits', value: stats.totalMerits, icon: Award, color: 'from-green-500 to-emerald-500', trend: 'up' },
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
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Severity</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Logged By</th>
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
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(incident, 'behaviour')}
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {incident.student_name?.charAt(0) || 'S'}
                </div>
                <span className="font-medium text-gray-900">{incident.student_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{incident.incident_type_name || incident.incident_type || 'N/A'}</td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                -{incident.points_deducted || 0}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadge(incident.severity)}`}>
                {incident.severity}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-500">
              <div className="flex flex-col">
                <span className="font-medium">{new Date(incident.date).toLocaleDateString()}</span>
                {incident.time && <span className="text-xs text-gray-400">{incident.time}</span>}
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600 text-sm">{incident.teacher_name || 'N/A'}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(incident.status)}`}>
                {incident.status || 'pending'}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end space-x-2">
                {incident.status === 'pending' && (incident.severity === 'high' || incident.severity === 'critical') && (
                  <>
                    <button
                      onClick={() => handleApproveIncident(incident.id)}
                      disabled={processing}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Approve Incident"
                    >
                      <ThumbsUp size={18} />
                    </button>
                    <button
                      onClick={() => handleDeclineClick(incident.id)}
                      disabled={processing}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Decline Incident"
                    >
                      <ThumbsDown size={18} />
                    </button>
                  </>
                )}
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye size={18} />
                </button>
              </div>
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
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(detention, 'detentions')}
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
                <span>
                  {detention.date && !isNaN(new Date(detention.date).getTime()) 
                    ? new Date(detention.date).toLocaleDateString() 
                    : 'Invalid Date'} {detention.time || ''}
                </span>
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
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(intervention, 'interventions')}
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
            <td className="px-6 py-4 text-gray-600">{intervention.assigned_by_name || intervention.assigned_to || 'N/A'}</td>
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
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(consequence, 'consequences')}
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

  const renderMeritsTable = () => (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Merit Type</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Awarded By</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {merits.map((merit, index) => (
          <motion.tr
            key={merit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(merit, 'merits')}
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {merit.student_name?.charAt(0) || 'S'}
                </div>
                <span className="font-medium text-gray-900">{merit.student_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{merit.merit_type || 'Merit'}</td>
            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{merit.description}</td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                +{merit.points || 1}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-500">
              <div className="flex flex-col">
                <span className="font-medium">{new Date(merit.date).toLocaleDateString()}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600 text-sm">{merit.teacher_name || 'Admin'}</td>
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
      case 'merits':
        return renderMeritsTable();
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
      case 'merits':
        return merits;
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

      {/* Decline Modal */}
      <AnimatePresence>
        {showDeclineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowDeclineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Decline Incident</h3>
                <button
                  onClick={() => !processing && setShowDeclineModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={processing}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Please provide a reason for declining this incident. This will be sent to the teacher who logged it.
              </p>

              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter reason for declining..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                disabled={processing}
              />

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => !processing && setShowDeclineModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineSubmit}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {processing ? 'Declining...' : 'Decline Incident'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`p-6 text-white bg-gradient-to-r ${
                detailType === 'behaviour' ? 'from-red-500 to-orange-500' :
                detailType === 'detentions' ? 'from-amber-500 to-yellow-500' :
                detailType === 'interventions' ? 'from-blue-500 to-cyan-500' :
                detailType === 'merits' ? 'from-green-500 to-emerald-500' :
                'from-purple-500 to-pink-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {detailType === 'behaviour' && <AlertTriangle size={24} />}
                    {detailType === 'detentions' && <Clock size={24} />}
                    {detailType === 'interventions' && <Shield size={24} />}
                    {detailType === 'consequences' && <FileText size={24} />}
                    {detailType === 'merits' && <Award size={24} />}
                    <div>
                      <h2 className="text-xl font-bold">
                        {detailType === 'behaviour' ? 'Behaviour Incident Details' :
                         detailType === 'detentions' ? 'Detention Details' :
                         detailType === 'interventions' ? 'Intervention Details' :
                         detailType === 'merits' ? 'Merit Details' :
                         'Consequence Details'}
                      </h2>
                      <p className="text-white/80 text-sm">{selectedItem.student_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {detailType === 'behaviour' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Incident Type</p>
                        <p className="font-semibold text-gray-900">{selectedItem.incident_type_name || selectedItem.incident_type || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Severity</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadge(selectedItem.severity)}`}>
                          {selectedItem.severity || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Points Deducted</p>
                        <p className="font-semibold text-red-600">-{selectedItem.points_deducted || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedItem.status)}`}>
                          {selectedItem.status || 'pending'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                        <p className="font-semibold text-gray-900">
                          {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : 'N/A'}
                          {selectedItem.time && ` at ${selectedItem.time}`}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Logged By</p>
                        <p className="font-semibold text-gray-900">{selectedItem.teacher_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-900">{selectedItem.description || 'No description provided'}</p>
                    </div>
                  </div>
                )}

                {detailType === 'detentions' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Date</p>
                        <p className="font-semibold text-gray-900">
                          {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">{selectedItem.time || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Duration</p>
                        <p className="font-semibold text-gray-900">{selectedItem.duration || 60} minutes</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedItem.status)}`}>
                          {selectedItem.status || 'scheduled'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Supervisor</p>
                        <p className="font-semibold text-gray-900">{selectedItem.supervisor || 'Not assigned'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Reason</p>
                      <p className="text-gray-900">{selectedItem.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                )}

                {detailType === 'interventions' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Type</p>
                        <p className="font-semibold text-gray-900">{selectedItem.type || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedItem.status)}`}>
                          {selectedItem.status || 'active'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Start Date</p>
                        <p className="font-semibold text-gray-900">
                          {selectedItem.start_date ? new Date(selectedItem.start_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">End Date</p>
                        <p className="font-semibold text-gray-900">
                          {selectedItem.end_date ? new Date(selectedItem.end_date).toLocaleDateString() : 'Ongoing'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Assigned By</p>
                        <p className="font-semibold text-gray-900">{selectedItem.assigned_by_name || selectedItem.assigned_to || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="text-gray-900">{selectedItem.notes || selectedItem.description || 'No notes provided'}</p>
                    </div>
                  </div>
                )}

                {detailType === 'consequences' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Type</p>
                        <p className="font-semibold text-gray-900">{selectedItem.type || selectedItem.consequence_name || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <div className="flex items-center space-x-2">
                          {selectedItem.completed ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-amber-500" />
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedItem.status)}`}>
                            {selectedItem.completed ? 'Completed' : selectedItem.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Date Assigned</p>
                        <p className="font-semibold text-gray-900">
                          {selectedItem.date_assigned || selectedItem.assigned_date 
                            ? new Date(selectedItem.date_assigned || selectedItem.assigned_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Due Date</p>
                        <p className="font-semibold text-gray-900">
                          {selectedItem.due_date ? new Date(selectedItem.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Reason</p>
                      <p className="text-gray-900">{selectedItem.reason || selectedItem.notes || 'No reason provided'}</p>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r ${
                      detailType === 'behaviour' ? 'from-red-500 to-orange-500' :
                      detailType === 'detentions' ? 'from-amber-500 to-yellow-500' :
                      detailType === 'interventions' ? 'from-blue-500 to-cyan-500' :
                      'from-purple-500 to-pink-500'
                    } hover:shadow-lg transition-all`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisciplineCenter;
