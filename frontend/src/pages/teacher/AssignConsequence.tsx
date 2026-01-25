import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  User, 
  Calendar,
  CheckCircle,
  X,
  Loader2,
  Search,
  AlertCircle
} from 'lucide-react';

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
}

const AssignConsequence: React.FC = () => {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [assignments, setAssignments] = useState<ConsequenceAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      const [studentsRes, consequencesRes, assignmentsRes] = await Promise.all([
        api.getStudents(),
        api.getAvailableConsequences(),
        api.getConsequenceAssignments()
      ]);

      console.log('Teacher - Students response:', studentsRes.data);
      console.log('Teacher - Consequences response:', consequencesRes.data);
      console.log('Teacher - Assignments response:', assignmentsRes.data);

      setStudents(studentsRes.data || []);
      setConsequences(consequencesRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
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
      
      // Refresh assignments
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
        return <AlertTriangle className="text-red-600" size={20} />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={48} />
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
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <span>Assign Consequences</span>
          </h1>
          <p className="text-gray-500 mt-1">Assign verbal or written warnings to students</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSearchTerm('');
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <AlertTriangle size={20} />
          <span>Assign Consequence</span>
        </motion.button>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Teacher Permissions</h3>
            <p className="text-sm text-blue-700">
              As a teacher, you can assign <strong>Verbal Warnings</strong> and <strong>Written Warnings</strong> only. 
              Suspensions require administrator approval and can only be assigned by admins.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Recent Assignments</h2>
        
        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No consequences assigned yet</p>
            <p className="text-gray-400 text-sm mt-2">Click "Assign Consequence" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment, index) => (
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
                      <h3 className="font-semibold text-gray-900">{assignment.student_name}</h3>
                      <p className="text-sm text-gray-600">{assignment.student_number}</p>
                      <p className="text-sm text-gray-700 mt-1">{assignment.reason}</p>
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
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Assign Consequence</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Select a student and consequence type
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-2" size={16} />
                    Select Student *
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Select a student --</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.student_id}) {student.class_name ? `- ${student.class_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Consequence Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle className="inline mr-2" size={16} />
                    Consequence Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {getConsequenceIcon(consequence.consequence_type)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{consequence.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">{consequence.description}</p>
                          </div>
                          {formData.consequence_type === consequence.consequence_type && (
                            <CheckCircle className="text-orange-500" size={20} />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
    </div>
  );
};

export default AssignConsequence;
