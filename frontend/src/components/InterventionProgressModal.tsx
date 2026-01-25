import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, CheckCircle, Calendar, Target, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface InterventionProgressModalProps {
  intervention: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'progress' | 'outcome';
}

const InterventionProgressModal: React.FC<InterventionProgressModalProps> = ({
  intervention,
  isOpen,
  onClose,
  onSuccess,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Progress tracking state
  const [progressStatus, setProgressStatus] = useState(intervention?.progress_status || 'not_started');
  const [progressPercentage, setProgressPercentage] = useState(intervention?.progress_percentage || 0);
  const [progressNotes, setProgressNotes] = useState(intervention?.progress_notes || '');
  const [nextSessionDate, setNextSessionDate] = useState(intervention?.next_session_date || '');
  const [sessionsCompleted, setSessionsCompleted] = useState(intervention?.sessions_completed || 0);
  const [sessionsPlanned, setSessionsPlanned] = useState(intervention?.sessions_planned || 0);

  // Outcome measurement state
  const [outcome, setOutcome] = useState(intervention?.outcome || '');
  const [outcomeNotes, setOutcomeNotes] = useState(intervention?.outcome_notes || '');
  const [effectivenessRating, setEffectivenessRating] = useState(intervention?.effectiveness_rating || 0);
  const [followUpRequired, setFollowUpRequired] = useState(intervention?.follow_up_required || false);
  const [followUpNotes, setFollowUpNotes] = useState(intervention?.follow_up_notes || '');

  const handleUpdateProgress = async () => {
    setLoading(true);
    setError('');

    try {
      await api.updateInterventionProgress(intervention.id, {
        progress_status: progressStatus,
        progress_percentage: progressPercentage,
        progress_notes: progressNotes,
        next_session_date: nextSessionDate || null,
        sessions_completed: sessionsCompleted,
        sessions_planned: sessionsPlanned
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOutcome = async () => {
    if (!outcome) {
      setError('Please select an outcome');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.recordInterventionOutcome(intervention.id, {
        outcome,
        outcome_notes: outcomeNotes,
        effectiveness_rating: effectivenessRating || null,
        follow_up_required: followUpRequired,
        follow_up_notes: followUpRequired ? followUpNotes : null
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record outcome');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mode === 'progress' ? (
                <TrendingUp size={28} />
              ) : (
                <CheckCircle size={28} />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'progress' ? 'Update Progress' : 'Record Outcome'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {intervention?.student_name} - {intervention?.type}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {mode === 'progress' ? (
              <>
                {/* Progress Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Status
                  </label>
                  <select
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Progress Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress: {progressPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressPercentage}
                    onChange={(e) => setProgressPercentage(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Sessions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sessions Completed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sessionsCompleted}
                      onChange={(e) => setSessionsCompleted(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sessions Planned
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sessionsPlanned}
                      onChange={(e) => setSessionsPlanned(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Next Session Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Next Session Date</span>
                  </label>
                  <input
                    type="date"
                    value={nextSessionDate}
                    onChange={(e) => setNextSessionDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Progress Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Notes
                  </label>
                  <textarea
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    rows={4}
                    placeholder="Describe the current progress, challenges, and achievements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Outcome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome *
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select outcome...</option>
                    <option value="successful">Successful</option>
                    <option value="partially_successful">Partially Successful</option>
                    <option value="unsuccessful">Unsuccessful</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                {/* Effectiveness Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effectiveness Rating (1-5)
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setEffectivenessRating(rating)}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          effectivenessRating === rating
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    1 = Not effective, 5 = Highly effective
                  </p>
                </div>

                {/* Outcome Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome Notes
                  </label>
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    rows={4}
                    placeholder="Describe the final outcome, what worked, what didn't, and lessons learned..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Follow-up Required */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Target size={16} />
                      <span>Follow-up intervention required</span>
                    </span>
                  </label>
                </div>

                {/* Follow-up Notes */}
                {followUpRequired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Notes
                    </label>
                    <textarea
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      rows={3}
                      placeholder="Describe what follow-up actions are needed..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'progress' ? handleUpdateProgress : handleRecordOutcome}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>{mode === 'progress' ? 'Update Progress' : 'Record Outcome'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InterventionProgressModal;
