import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Award, Shield, ChevronDown, ChevronUp, Search, Gavel, Eye, X, Calendar, User, Star, FileText, TrendingDown } from 'lucide-react';
import { decodeHtmlEntities } from '../utils/htmlDecode';

interface StudentDetailedHistoryProps {
  incidents: any[];
  merits: any[];
  consequences: any[];
  detentions: any[];
  historyLoading: boolean;
  expandedSection: string | null;
  incidentSearch: string;
  meritSearch: string;
  onToggleSection: (section: string) => void;
  onIncidentSearchChange: (value: string) => void;
  onMeritSearchChange: (value: string) => void;
}

const StudentDetailedHistory: React.FC<StudentDetailedHistoryProps> = ({
  incidents,
  merits,
  consequences,
  detentions,
  historyLoading,
  expandedSection,
  incidentSearch,
  meritSearch,
  onToggleSection,
  onIncidentSearchChange,
  onMeritSearchChange,
}) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'incident' | 'merit' | null>(null);

  const openModal = (item: any, type: 'incident' | 'merit') => {
    setSelectedItem(item);
    setSelectedType(type);
  };
  const closeModal = () => { setSelectedItem(null); setSelectedType(null); };
  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const severityColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'high': case 'critical': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const statusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'approved': case 'completed': case 'served': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'declined': case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (!incidentSearch.trim()) return true;
    const q = incidentSearch.toLowerCase();
    return (i.incident_type || '').toLowerCase().includes(q) ||
           (i.description || '').toLowerCase().includes(q) ||
           (i.teacher_name || '').toLowerCase().includes(q) ||
           (i.severity || '').toLowerCase().includes(q);
  });

  const filteredMerits = merits.filter(m => {
    if (!meritSearch.trim()) return true;
    const q = meritSearch.toLowerCase();
    return (m.merit_type || '').toLowerCase().includes(q) ||
           (m.description || '').toLowerCase().includes(q) ||
           (m.teacher_name || '').toLowerCase().includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Student History</h2>

      {/* Incidents */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden">
        <button
          onClick={() => onToggleSection('incidents')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">Incidents ({incidents.length})</h3>
          </div>
          {expandedSection === 'incidents' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
        <AnimatePresence>
          {expandedSection === 'incidents' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={incidentSearch}
                    onChange={(e) => onIncidentSearchChange(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {historyLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : filteredIncidents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No incidents found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DATE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">TYPE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DESCRIPTION</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">SEVERITY</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">POINTS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">LOGGED BY</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredIncidents.map((inc, idx) => (
                          <tr
                            key={inc.id || idx}
                            className="hover:bg-red-50 cursor-pointer transition-colors"
                            onClick={() => openModal(inc, 'incident')}
                          >
                            <td className="px-4 py-3 text-sm">{formatDate(inc.date || inc.incident_date)}</td>
                            <td className="px-4 py-3 text-sm">{inc.incident_type_name || inc.incident_type || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate">{decodeHtmlEntities(inc.description) || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColor(inc.severity)}`}>
                                {inc.severity || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600">-{inc.points_deducted || inc.points || 0}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(inc.status)}`}>
                                {inc.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{inc.teacher_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              <Eye size={16} className="text-gray-400 hover:text-red-500 transition-colors" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Merits */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden">
        <button
          onClick={() => onToggleSection('merits')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Award className="text-green-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">Merits ({merits.length})</h3>
          </div>
          {expandedSection === 'merits' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
        <AnimatePresence>
          {expandedSection === 'merits' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search merits..."
                    value={meritSearch}
                    onChange={(e) => onMeritSearchChange(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {historyLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : filteredMerits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No merits found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DATE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">TYPE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DESCRIPTION</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">POINTS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">AWARDED BY</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredMerits.map((mer, idx) => (
                          <tr
                            key={mer.id || idx}
                            className="hover:bg-green-50 cursor-pointer transition-colors"
                            onClick={() => openModal(mer, 'merit')}
                          >
                            <td className="px-4 py-3 text-sm">{formatDate(mer.merit_date || mer.date || mer.created_at)}</td>
                            <td className="px-4 py-3 text-sm">{mer.merit_type || mer.merit_type_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate">{decodeHtmlEntities(mer.description) || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">+{mer.points || 0}</td>
                            <td className="px-4 py-3 text-sm">{mer.teacher_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              <Eye size={16} className="text-gray-400 hover:text-green-500 transition-colors" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Consequences */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden">
        <button
          onClick={() => onToggleSection('consequences')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Shield className="text-orange-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">Consequences ({consequences.length})</h3>
          </div>
          {expandedSection === 'consequences' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
        <AnimatePresence>
          {expandedSection === 'consequences' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200"
            >
              <div className="p-6">
                {historyLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : consequences.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No consequences assigned</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DATE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">TYPE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DESCRIPTION</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ASSIGNED BY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {consequences.map((con, idx) => (
                          <tr key={con.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDate(con.assigned_date || con.created_at)}</td>
                            <td className="px-4 py-3 text-sm">{con.consequence_type || con.type || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate" title={con.description || con.reason}>{con.description || con.reason || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(con.status)}`}>
                                {con.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{con.assigned_by_name || con.teacher_name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detentions */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden">
        <button
          onClick={() => onToggleSection('detentions')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Gavel className="text-purple-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">Detentions ({detentions.length})</h3>
          </div>
          {expandedSection === 'detentions' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
        <AnimatePresence>
          {expandedSection === 'detentions' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200"
            >
              <div className="p-6">
                {historyLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : detentions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No detentions assigned</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DATE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">TIME</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">REASON</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ATTENDANCE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">NOTES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detentions.map((det, idx) => (
                          <tr key={det.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDate(det.detention_date)}</td>
                            <td className="px-4 py-3 text-sm">{det.detention_time || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate" title={det.reason}>{det.reason || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(det.attendance_status || det.status)}`}>
                                {det.attendance_status || det.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate" title={det.notes}>{det.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && selectedType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className={`p-5 text-white bg-gradient-to-r ${
                selectedType === 'incident' ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedType === 'incident' ? <AlertTriangle size={24} /> : <Award size={24} />}
                    <div>
                      <h2 className="text-lg font-bold">
                        {selectedType === 'incident' ? 'Incident Details' : 'Merit Details'}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {selectedType === 'incident'
                          ? (selectedItem.incident_type_name || selectedItem.incident_type || 'Behaviour Incident')
                          : (selectedItem.merit_type || selectedItem.merit_type_name || 'Merit Award')}
                      </p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedType === 'incident' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Date</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatDate(selectedItem.date || selectedItem.incident_date)}</p>
                        {selectedItem.time && <p className="text-xs text-gray-500">at {selectedItem.time}</p>}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Severity</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColor(selectedItem.severity)}`}>
                          {selectedItem.severity || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingDown size={12} /> Points Deducted</p>
                        <p className="font-semibold text-red-600 text-sm">-{selectedItem.points_deducted || selectedItem.points || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(selectedItem.status)}`}>
                          {selectedItem.status || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Logged By</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedItem.teacher_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><FileText size={12} /> Description</p>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{decodeHtmlEntities(selectedItem.description) || 'No description provided'}</p>
                    </div>
                  </>
                )}

                {selectedType === 'merit' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Date</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatDate(selectedItem.merit_date || selectedItem.date || selectedItem.created_at)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Star size={12} /> Merit Type</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedItem.merit_type || selectedItem.merit_type_name || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Award size={12} /> Points Awarded</p>
                        <p className="font-semibold text-green-600 text-sm">+{selectedItem.points || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Awarded By</p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedItem.teacher_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><FileText size={12} /> Description</p>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{decodeHtmlEntities(selectedItem.description) || 'No description provided'}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentDetailedHistory;
