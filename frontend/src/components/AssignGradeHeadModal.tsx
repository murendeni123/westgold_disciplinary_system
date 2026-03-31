import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Shield, Users } from 'lucide-react';
import { api } from '../services/api';

interface AssignGradeHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: {
    id: number;
    name: string;
    email: string;
    is_grade_head?: boolean;
    grade_head_for?: string;
    has_class?: boolean;
  };
  onSuccess: () => void;
}

const AssignGradeHeadModal: React.FC<AssignGradeHeadModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSuccess
}) => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasClass, setHasClass] = useState(false);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Fetch available grades from classes and check if teacher has a class
  useEffect(() => {
    const fetchGradesAndCheckClass = async () => {
      try {
        const response = await api.getClasses({ bypass_grade_filter: true });
        const classes = response.data;
        
        // Extract unique grades from classes
        const gradesSet = new Set<string>();
        classes.forEach((c: any) => {
          if (c.grade_level) {
            gradesSet.add(String(c.grade_level));
          }
        });
        
        // Sort grades numerically
        const sortedGrades = Array.from(gradesSet).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });
        
        setAvailableGrades(sortedGrades);
        
        // Check if teacher has a class (informational only)
        const teacherClass = classes.find((c: any) => c.teacher_id === teacher.id);
        setHasClass(!!teacherClass);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setError('Failed to load available grades');
      }
    };

    if (isOpen) {
      fetchGradesAndCheckClass();
    }
  }, [isOpen, teacher.id]);

  // Pre-fill grade if editing existing grade head
  useEffect(() => {
    if (isOpen && teacher.is_grade_head) {
      setSelectedGrade(teacher.grade_head_for || '');
    } else if (isOpen) {
      setSelectedGrade('');
    }
    setError('');
  }, [isOpen, teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedGrade) {
      setError('Please select a grade');
      return;
    }

    setLoading(true);

    try {
      const response = await api.assignGradeHead({
        teacherId: teacher.id,
        grade: selectedGrade
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to assign Grade Head';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${teacher.name} as Grade Head for Grade ${teacher.grade_head_for}?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.removeGradeHead(teacher.id);

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove Grade Head';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {teacher.is_grade_head ? 'Edit Grade Head' : 'Assign Grade Head'}
                </h2>
                <p className="text-indigo-100 text-sm">{teacher.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="text-white" size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start space-x-2"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Class info notice */}
            <div className={`flex items-start space-x-3 p-4 rounded-xl border ${
              hasClass
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {hasClass
                  ? <Users size={18} className="text-indigo-600" />
                  : <Shield size={18} className="text-gray-400" />}
              </div>
              <div className="text-sm">
                {hasClass ? (
                  <>
                    <p className="font-semibold text-indigo-900">Teacher with assigned class</p>
                    <p className="text-indigo-700 mt-0.5">
                      This teacher will manage their own class <strong>and</strong> oversee the selected grade.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-700">No class assigned</p>
                    <p className="text-gray-500 mt-0.5">
                      This teacher will only oversee the selected grade. Assign them a class first to enable class-level management.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Grade Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Grade <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                disabled={loading || availableGrades.length === 0}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                required
              >
                <option value="">
                  {availableGrades.length === 0 ? '-- Loading grades... --' : '-- Select a grade --'}
                </option>
                {availableGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {availableGrades.length === 0 
                  ? 'Grades are loaded from classes in your system'
                  : 'Only one Grade Head can be assigned per grade'}
              </p>
            </div>

            {/* Summary */}
            {selectedGrade && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4"
              >
                <div className="flex items-start space-x-2">
                  <CheckCircle size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Assignment Summary:</p>
                    <p className="text-gray-700 mt-1">
                      {teacher.name} will be assigned as{' '}
                      <span className="font-semibold">Grade Head</span>{' '}
                      for <span className="font-semibold">Grade {selectedGrade}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {teacher.is_grade_head && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Remove Grade Head
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedGrade}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : teacher.is_grade_head ? 'Update Assignment' : 'Assign Grade Head'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignGradeHeadModal;
