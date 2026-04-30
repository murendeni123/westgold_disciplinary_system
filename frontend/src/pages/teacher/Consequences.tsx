import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  User, 
  Shield,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  Eye,
  Calendar
} from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class_name?: string;
}

interface Consequence {
  id: number;
  name: string;
  consequence_type: string;
  description: string;
  severity: string;
}

interface ConsequenceAssignment {
  id: number;
  student_name: string;
  student_number: string;
  consequence_type: string;
  reason: string;
  assigned_at: string;
  status: string;
  assigned_by_name: string;
  assigned_by_role: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

interface ConsequenceStats {
  total_consequences: number;
  verbal_warnings: number;
  written_warnings: number;
  suspensions: number;
  active_consequences: number;
  this_week: number;
  this_month: number;
}

const TeacherConsequences: React.FC = () => {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [assignments, setAssignments] = useState<ConsequenceAssignment[]>([]);
  const [stats, setStats] = useState<ConsequenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    consequence_type: '',
    reason: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, consequencesRes, assignmentsRes, statsRes] = await Promise.all([
        api.getStudents(),
        api.getAvailableConsequences(),
        api.getConsequenceAssignments(),
        api.getConsequenceStatistics()
      ]);

      setStudents(studentsRes.data || []);
      // Filter to only show verbal and written warnings for teachers
      const teacherConsequences = (consequencesRes.data || []).filter(
        (c: Consequence) => c.consequence_type === 'verbal_warning' || c.consequence_type === 'written_warning'
      );
      setConsequences(teacherConsequences);
      setAssignments(assignmentsRes.data || []);
      setStats(statsRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateStudent = async (studentId: number) => {
    try {
      const response = await api.evaluateStudentConsequences(studentId);
      setEvaluation(response.data);
      setSelectedStudent(studentId);
      setShowEvaluationModal(true);
    } catch (error: any) {
      console.error('Error evaluating student:', error);
      toast.error(error.response?.data?.error || 'Failed to evaluate student');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.consequence_type || !formData.reason) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.assignConsequenceToStudent(formData);
      toast.success('Consequence assigned successfully!');
      
      // Reset form and close modal
      setFormData({
        student_id: '',
        consequence_type: '',
        reason: '',
        description: ''
      });
      setShowModal(false);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error assigning consequence:', error);
      toast.error(error.response?.data?.error || 'Failed to assign consequence');
    } finally {
      setSubmitting(false);
    }
  };

  const getConsequenceIcon = (type: string) => {
    switch (type) {
      case 'verbal_warning':
        return <MessageSquare className="text-yellow-600" size={20} />;
      case 'written_warning':
        return <FileText className="text-orange-600" size={20} />;
      case 'suspension':
        return <Shield className="text-red-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getConsequenceColor = (type: string) => {
    switch (type) {
      case 'verbal_warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'written_warning':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'suspension':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredStudents = students.filter(s => 
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignments = assignments.filter(a => 
    filterType === 'all' || a.consequence_type === filterType
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

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
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={24} />
            </div>
            <span>Consequence Management</span>
          </h1>
          <p className="text-gray-500 mt-1">Assign and manage verbal and written warnings</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSearchTerm('');
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <AlertTriangle size={20} />
          <span>Assign Consequence</span>
        </motion.button>
      </motion.div>

      {/* Statistics Dashboard */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare size={24} />
              <span className="text-3xl font-bold">{stats.verbal_warnings || 0}</span>
            </div>
            <h3 className="text-lg font-semibold">Verbal Warnings</h3>
            <p className="text-white/80 text-sm">Total assigned</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText size={24} />
              <span className="text-3xl font-bold">{stats.written_warnings || 0}</span>
            </div>
            <h3 className="text-lg font-semibold">Written Warnings</h3>
            <p className="text-white/80 text-sm">Total assigned</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 size={24} />
              <span className="text-3xl font-bold">{stats.total_consequences || 0}</span>
            </div>
            <h3 className="text-lg font-semibold">Total Assigned</h3>
            <p className="text-white/80 text-sm">All consequences</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={24} />
              <span className="text-3xl font-bold">{stats.this_week || 0}</span>
            </div>
            <h3 className="text-lg font-semibold">This Week</h3>
            <p className="text-white/80 text-sm">New assignments</p>
          </div>
        </motion.div>
      )}

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900 mb-1">Teacher Permissions</h3>
            <p className="text-sm text-emerald-700">
              As a teacher, you can assign <strong>Verbal Warnings</strong> and <strong>Written Warnings</strong> to students. 
              Suspensions require administrator approval and can only be assigned by admins. You can also evaluate student behavior to see automated recommendations.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Consequences</option>
              <option value="verbal_warning">Verbal Warnings</option>
              <option value="written_warning">Written Warnings</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* All Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Consequence Assignments</h2>
        
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No consequences assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-xl ${getConsequenceColor(assignment.consequence_type)}`}>
                      {getConsequenceIcon(assignment.consequence_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{assignment.student_name}</h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const student = students.find(s => 
                              `${s.first_name} ${s.last_name}` === assignment.student_name
                            );
                            if (student) handleEvaluateStudent(student.id);
                          }}
                          className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Evaluate student"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </motion.button>
                      </div>
                      <p className="text-sm text-gray-600">{assignment.student_number}</p>
                      <p className="text-sm text-gray-700 mt-1">{assignment.reason}</p>
                      {assignment.description && (
                        <p className="text-xs text-gray-500 mt-1">{assignment.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Assigned by: <strong>{assignment.assigned_by_name}</strong> ({assignment.assigned_by_role})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getConsequenceColor(assignment.consequence_type)}`}>
                      {assignment.consequence_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Assign Consequence</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Verbal and Written Warnings only
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Student Selection */}
                <div>
                  <SearchableSelect
                    label="Select Student"
                    value={formData.student_id}
                    onChange={(value) => setFormData({ ...formData, student_id: String(value) })}
                    options={students.map((student) => ({
                      value: student.id.toString(),
                      label: `${student.first_name} ${student.last_name} (${student.student_id})${student.class_name ? ` - ${student.class_name}` : ''}`
                    }))}
                    placeholder="Search and select a student..."
                    required
                    showClear={!!formData.student_id}
                    onClear={() => setFormData({ ...formData, student_id: '' })}
                  />
                  {formData.student_id && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEvaluateStudent(parseInt(formData.student_id))}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <BarChart3 size={14} />
                      <span>Evaluate student behavior</span>
                    </motion.button>
                  )}
                </div>

                {/* Consequence Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle className="inline mr-2" size={16} />
                    Consequence Type *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {consequences.map((consequence) => (
                      <motion.div
                        key={consequence.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData({ 
                          ...formData, 
                          consequence_type: consequence.consequence_type 
                        })}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.consequence_type === consequence.consequence_type
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {getConsequenceIcon(consequence.consequence_type)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{consequence.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">{consequence.description}</p>
                          </div>
                          {formData.consequence_type === consequence.consequence_type && (
                            <CheckCircle className="text-emerald-500" size={20} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline mr-2" size={16} />
                    Reason *
                  </label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Repeated disruption in class"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="inline mr-2" size={16} />
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide additional context or details..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        <span>Assign Consequence</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluation Modal */}
      <AnimatePresence>
        {showEvaluationModal && evaluation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEvaluationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Student Evaluation</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Automated consequence recommendations
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEvaluationModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Student Stats */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Behavior Statistics (Last 30 Days)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Incidents</p>
                      <p className="text-2xl font-bold text-gray-900">{evaluation.student?.total_incidents || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Points</p>
                      <p className="text-2xl font-bold text-gray-900">{evaluation.student?.total_points || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Verbal Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">{evaluation.student?.verbal_warnings || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Written Warnings</p>
                      <p className="text-2xl font-bold text-orange-600">{evaluation.student?.written_warnings || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                  {!evaluation.recommendations || evaluation.recommendations.length === 0 ? (
                    <div className="text-center py-8 bg-green-50 rounded-xl">
                      <CheckCircle className="mx-auto text-green-600 mb-2" size={48} />
                      <p className="text-green-700 font-medium">No consequences recommended</p>
                      <p className="text-green-600 text-sm mt-1">Student behavior is within acceptable limits</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evaluation.recommendations.map((rec: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-2 ${
                            rec.severity === 'critical' ? 'bg-red-50 border-red-300' :
                            rec.severity === 'high' ? 'bg-orange-50 border-orange-300' :
                            rec.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                            'bg-blue-50 border-blue-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {getConsequenceIcon(rec.consequence_type)}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {rec.consequence_type.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-gray-700 mt-1">{rec.reason}</p>
                              {rec.requires_admin && (
                                <p className="text-xs text-red-600 mt-2 font-medium">
                                  ⚠️ Requires administrator approval
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEvaluationModal(false)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherConsequences;
