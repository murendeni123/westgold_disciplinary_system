import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortalPrefix } from '../../hooks/usePortalPrefix';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import ParentProfileModal from '../../components/ParentProfileModal';
import GoldieBadge from '../../components/GoldieBadge';
import GoldenDotIndicator from '../../components/GoldenDotIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Copy, Camera, Upload, User, Award, AlertTriangle, 
  TrendingUp, Clock, FileText, Shield, ChevronDown, ChevronRight, 
  Search, Gavel, Phone, Mail, MapPin, Users, BookOpen, Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl, handlePhotoError } from '../../utils/photoUrl';

type TabType = 'overview' | 'incidents' | 'merits' | 'consequences' | 'detentions';

const StudentProfileRedesigned: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const portal = usePortalPrefix();
  const { success, error, ToastContainer } = useToast();
  
  const [student, setStudent] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [assigningClass, setAssigningClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [parentData, setParentData] = useState<any>(null);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [merits, setMerits] = useState<any[]>([]);
  const [consequences, setConsequences] = useState<any[]>([]);
  const [detentions, setDetentions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [behaviorTrend, setBehaviorTrend] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchClasses();
      fetchStats();
      fetchDetailedHistory();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await api.getStudent(Number(id));
      setStudent(response.data);
      setSelectedClassId(response.data.class_id ? String(response.data.class_id) : '');
      
      if (response.data.parent_details) {
        setParentData(response.data.parent_details);
      } else if (response.data.parent_id) {
        try {
          const parentResponse = await api.getParent(response.data.parent_id);
          setParentData(parentResponse.data);
        } catch (err) {
          console.error('Error fetching parent:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchStats = async () => {
    if (!id) return;
    try {
      const [meritsRes, incidentsRes] = await Promise.all([
        api.getMerits({ student_id: id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
        api.getIncidents({ student_id: id }),
      ]);

      const totalMerits = meritsRes.data.length;
      const totalMeritPoints = meritsRes.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
      const totalIncidents = incidentsRes.data.length;
      const totalDemeritPoints = incidentsRes.data.reduce((sum: number, i: any) => sum + (i.points || 0), 0);

      setStats({ totalMerits, totalMeritPoints, totalIncidents, totalDemeritPoints });

      // Build behavior trend (last 6 months)
      const monthlyBehavior: Record<string, { merits: number; incidents: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short' });
        monthlyBehavior[key] = { merits: 0, incidents: 0 };
      }

      meritsRes.data.forEach((m: any) => {
        const key = new Date(m.merit_date || m.created_at).toLocaleDateString('en-US', { month: 'short' });
        if (monthlyBehavior[key]) monthlyBehavior[key].merits++;
      });

      incidentsRes.data.forEach((i: any) => {
        const key = new Date(i.incident_date || i.created_at).toLocaleDateString('en-US', { month: 'short' });
        if (monthlyBehavior[key]) monthlyBehavior[key].incidents++;
      });

      setBehaviorTrend(Object.entries(monthlyBehavior).map(([month, data]) => ({ month, ...data })));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchDetailedHistory = async () => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const [incRes, merRes, conRes, detRes] = await Promise.allSettled([
        api.getIncidents({ student_id: id }),
        api.getMerits({ student_id: id }),
        api.getStudentConsequences(Number(id)),
        api.getStudentDetentionHistory(Number(id)),
      ]);
      if (incRes.status === 'fulfilled') setIncidents(incRes.value.data || []);
      if (merRes.status === 'fulfilled') setMerits(merRes.value.data || []);
      if (conRes.status === 'fulfilled') setConsequences(conRes.value.data || []);
      if (detRes.status === 'fulfilled') setDetentions(detRes.value.data || []);
    } catch (err) {
      console.error('Error fetching detailed history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAssignClass = async () => {
    if (!id) return;
    setAssigningClass(true);
    try {
      const classId = selectedClassId === '' ? null : Number(selectedClassId);
      const selectedClass = classes.find(c => c.id === classId);
      await api.assignStudentToClass(Number(id), {
        class_id: classId,
        grade_level: selectedClass?.grade_level || null,
      });
      await fetchStudent();
      setIsClassModalOpen(false);
      success('Class assigned successfully!');
    } catch (err: any) {
      error(err.response?.data?.error || 'Error assigning class');
    } finally {
      setAssigningClass(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await api.generateLinkCode(Number(id));
      setStudent({ ...student, parent_link_code: response.data.parent_link_code });
      success('New link code generated!');
    } catch (err) {
      error('Error generating link code');
    }
  };

  const handleCopyLink = () => {
    if (student?.parent_link_code) {
      navigator.clipboard.writeText(student.parent_link_code);
      success('Link code copied!');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      await api.uploadStudentPhoto(Number(id), file);
      fetchStudent();
      success('Photo uploaded!');
    } catch (err) {
      error('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const severityBadge = (s: string) => {
    const base = 'px-2 py-1 rounded-lg text-xs font-medium';
    switch (s?.toLowerCase()) {
      case 'high': case 'critical': return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'medium': return `${base} bg-amber-500/20 text-amber-400 border border-amber-500/30`;
      case 'low': return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      default: return `${base} bg-surface-700 text-surface-300`;
    }
  };

  const statusBadge = (s: string) => {
    const base = 'px-2 py-1 rounded-lg text-xs font-medium';
    switch (s?.toLowerCase()) {
      case 'approved': case 'completed': case 'served': return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'pending': return `${base} bg-amber-500/20 text-amber-400 border border-amber-500/30`;
      case 'declined': case 'rejected': return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
      default: return `${base} bg-surface-700 text-surface-300`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full"
        />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <User className="mx-auto mb-4 text-surface-500" size={64} />
          <p className="text-xl text-surface-400">Student not found</p>
        </div>
      </div>
    );
  }

  const netPoints = (stats?.totalMeritPoints || 0) - (stats?.totalDemeritPoints || 0);
  const isGoldie = stats && stats.totalMerits >= 10 && (stats.totalMerits - stats.totalIncidents) >= 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ToastContainer />
      
      {/* Back Button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Button
          variant="secondary"
          onClick={() => navigate(`${portal}/students`)}
          className="rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Students
        </Button>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-header-dark"
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo Section */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-surface-800 border-2 border-white/10">
                  {student.photo_path ? (
                    <img
                      src={getPhotoUrl(student.photo_path) || ''}
                      alt="Student"
                      className="w-full h-full object-cover"
                      onError={handlePhotoError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="text-surface-500" size={48} />
                    </div>
                  )}
                </div>
                {isGoldie && (
                  <div className="absolute -top-2 -right-2">
                    <GoldenDotIndicator size="lg" showTooltip animated />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-surface-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-surface-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Camera size={16} />
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {student.first_name} {student.last_name}
                  </h1>
                  <p className="text-surface-400 mt-1">Student ID: {student.student_id}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="badge-dark-primary">{student.grade_level ? `Grade ${student.grade_level}` : 'No Grade'}</span>
                    <span className="badge-dark-accent">{student.class_name || 'No Class'}</span>
                    {isGoldie && <span className="badge-dark-warning">⭐ Goldie</span>}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsClassModalOpen(true)}
                  className="rounded-xl bg-brand-green/20 border-brand-green/30 text-brand-green hover:bg-brand-green/30"
                >
                  {student.class_id ? 'Change Class' : 'Assign Class'}
                </Button>
              </div>

              {/* Quick Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <div className="compact-stat-dark">
                    <Award className="text-green-400 mb-2" size={20} />
                    <p className="text-2xl font-bold text-white">{stats.totalMerits}</p>
                    <p className="text-xs text-surface-400">Merits</p>
                  </div>
                  <div className="compact-stat-dark">
                    <AlertTriangle className="text-red-400 mb-2" size={20} />
                    <p className="text-2xl font-bold text-white">{stats.totalIncidents}</p>
                    <p className="text-xs text-surface-400">Incidents</p>
                  </div>
                  <div className="compact-stat-dark">
                    <Star className="text-amber-400 mb-2" size={20} />
                    <p className="text-2xl font-bold text-white">{stats.totalMeritPoints}</p>
                    <p className="text-xs text-surface-400">Merit Points</p>
                  </div>
                  <div className="compact-stat-dark">
                    <TrendingUp className={`mb-2 ${netPoints >= 0 ? 'text-green-400' : 'text-red-400'}`} size={20} />
                    <p className={`text-2xl font-bold ${netPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>{netPoints}</p>
                    <p className="text-xs text-surface-400">Net Points</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Parent Info & Link Code */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Parent Information */}
          <div className="profile-section-dark">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-brand-cyan/20">
                <Users className="text-brand-cyan" size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white">Parent Information</h3>
            </div>
            
            <div className="space-y-3">
              <div className="info-row-dark">
                <span className="info-label-dark">Name</span>
                <span className="info-value-dark">{student.parent_name || 'Not linked'}</span>
              </div>
              <div className="info-row-dark">
                <span className="info-label-dark">Email</span>
                <span className="info-value-dark text-sm truncate max-w-[180px]">{student.parent_email || 'N/A'}</span>
              </div>
              {parentData && (
                <>
                  <div className="info-row-dark">
                    <span className="info-label-dark">Phone</span>
                    <span className="info-value-dark">{parentData.phone || 'N/A'}</span>
                  </div>
                  <div className="info-row-dark">
                    <span className="info-label-dark">Relationship</span>
                    <span className="info-value-dark">{parentData.relationship_to_child || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>

            {student.parent_id && parentData && (
              <button
                onClick={() => setIsParentModalOpen(true)}
                className="w-full mt-4 py-2.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-sm font-medium hover:bg-brand-cyan/20 transition-all"
              >
                View Full Profile
              </button>
            )}
          </div>

          {/* Link Code */}
          <div className="profile-section-dark">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Shield className="text-violet-400" size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white">Parent Link Code</h3>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-800 border border-white/5">
              <code className="flex-1 font-mono text-lg text-white tracking-wider">
                {student.parent_link_code}
              </code>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-all"
              >
                <Copy size={18} />
              </button>
            </div>
            <button
              onClick={handleGenerateLink}
              className="w-full mt-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-all"
            >
              Generate New Code
            </button>
          </div>
        </motion.div>

        {/* Right Column - Tabs & Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {/* Tab Navigation */}
          <div className="tab-nav-dark mb-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: incidents.length },
              { id: 'merits', label: 'Merits', icon: Award, count: merits.length },
              { id: 'consequences', label: 'Consequences', icon: Gavel, count: consequences.length },
              { id: 'detentions', label: 'Detentions', icon: Clock, count: detentions.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`tab-item-dark flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="profile-section-dark min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Goldie Badge */}
                  {isGoldie && (
                    <GoldieBadge
                      totalMerits={stats.totalMerits}
                      totalDemerits={stats.totalIncidents}
                      studentName={`${student.first_name} ${student.last_name}`}
                      showDetails
                      size="md"
                    />
                  )}

                  {/* Behavior Trend Chart */}
                  {behaviorTrend.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-surface-400 mb-4">Behavior Trend (6 Months)</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={behaviorTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                          <YAxis stroke="#64748B" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.95)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px',
                            }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="merits" fill="#42C978" name="Merits" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="incidents" fill="#EF4444" name="Incidents" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent Activity Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400 mb-1">Latest Merit</p>
                      <p className="text-sm text-white font-medium truncate">
                        {merits[0]?.merit_type || 'No merits yet'}
                      </p>
                      {merits[0] && <p className="text-xs text-surface-400 mt-1">{formatDate(merits[0].merit_date)}</p>}
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 mb-1">Latest Incident</p>
                      <p className="text-sm text-white font-medium truncate">
                        {incidents[0]?.incident_type || 'No incidents'}
                      </p>
                      {incidents[0] && <p className="text-xs text-surface-400 mt-1">{formatDate(incidents[0].incident_date)}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'incidents' && (
                <motion.div
                  key="incidents"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                    </div>
                  ) : incidents.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="mx-auto mb-3 text-surface-500" size={40} />
                      <p className="text-surface-400">No incidents recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {incidents.map((inc, idx) => (
                        <div key={inc.id || idx} className="list-item-dark">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium truncate">{inc.incident_type}</p>
                              <span className={severityBadge(inc.severity)}>{inc.severity}</span>
                            </div>
                            <p className="text-sm text-surface-400 truncate">{inc.description}</p>
                            <p className="text-xs text-surface-500 mt-1">
                              {formatDate(inc.incident_date)} • {inc.teacher_name || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-semibold">-{inc.points || 0}</p>
                            <p className="text-xs text-surface-500">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'merits' && (
                <motion.div
                  key="merits"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                    </div>
                  ) : merits.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="mx-auto mb-3 text-surface-500" size={40} />
                      <p className="text-surface-400">No merits awarded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {merits.map((mer, idx) => (
                        <div key={mer.id || idx} className="list-item-dark">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{mer.merit_type}</p>
                            <p className="text-sm text-surface-400 truncate">{mer.description}</p>
                            <p className="text-xs text-surface-500 mt-1">
                              {formatDate(mer.merit_date)} • {mer.teacher_name || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-semibold">+{mer.points || 0}</p>
                            <p className="text-xs text-surface-500">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'consequences' && (
                <motion.div
                  key="consequences"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                    </div>
                  ) : consequences.length === 0 ? (
                    <div className="text-center py-12">
                      <Gavel className="mx-auto mb-3 text-surface-500" size={40} />
                      <p className="text-surface-400">No consequences assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {consequences.map((con, idx) => (
                        <div key={con.id || idx} className="list-item-dark">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium truncate">{con.consequence_type || con.name}</p>
                              <span className={statusBadge(con.status)}>{con.status}</span>
                            </div>
                            <p className="text-sm text-surface-400 truncate">{con.reason || con.description}</p>
                            <p className="text-xs text-surface-500 mt-1">{formatDate(con.assigned_date || con.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'detentions' && (
                <motion.div
                  key="detentions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                    </div>
                  ) : detentions.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="mx-auto mb-3 text-surface-500" size={40} />
                      <p className="text-surface-400">No detentions assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {detentions.map((det, idx) => (
                        <div key={det.id || idx} className="list-item-dark">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{formatDate(det.session_date)}</p>
                              <span className={statusBadge(det.attendance_status || det.status)}>
                                {det.attendance_status || det.status}
                              </span>
                            </div>
                            <p className="text-sm text-surface-400">{det.location || 'TBD'}</p>
                            <p className="text-xs text-surface-500 mt-1">
                              {det.start_time} - {det.end_time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Assign to Class">
        <div className="space-y-4">
          <Select
            label="Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">No class assigned</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name} {cls.teacher_name ? `(${cls.teacher_name})` : ''}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsClassModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignClass} disabled={assigningClass}>
              {assigningClass ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </Modal>

      <ParentProfileModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        parent={parentData}
      />
    </div>
  );
};

export default StudentProfileRedesigned;
