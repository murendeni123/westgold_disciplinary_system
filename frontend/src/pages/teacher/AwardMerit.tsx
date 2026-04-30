import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
import Textarea from '../../components/Textarea';
import { motion } from 'framer-motion';
import { Award, CheckCircle, User, Calendar, Star, FileText } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import BadgeStatusModal from '../../components/BadgeStatusModal';

const AwardMerit: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [meritTypes, setMeritTypes] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    merit_date: new Date().toISOString().split('T')[0],
    merit_type_id: '',
    description: '',
    points: '1',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeModalData, setBadgeModalData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchClasses(),
          fetchMeritTypes(),
          fetchAllStudents(),
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchMeritTypes = async () => {
    try {
      const response = await api.getMeritTypes({ active_only: 'true' });
      setMeritTypes(response.data);
    } catch (error) {
      console.error('Error fetching merit types:', error);
    }
  };

  const handleMeritTypeChange = (typeId: string) => {
    const selectedType = meritTypes.find((t) => t.id === Number(typeId));
    if (selectedType) {
      setFormData({
        ...formData,
        merit_type_id: typeId,
        points: String(selectedType.points),
      });
    } else {
      setFormData({
        ...formData,
        merit_type_id: '',
        points: '1',
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses({ bypass_grade_filter: true });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.getStudents({ bypass_grade_filter: true });
      setAllStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching all students:', error);
    }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setFormData({ ...formData, student_id: '' });
    if (classId) {
      try {
        const response = await api.getClass(Number(classId));
        setClassStudents(response.data.students || []);
      } catch (error) {
        console.error('Error fetching class students:', error);
        setClassStudents([]);
      }
    } else {
      setClassStudents([]);
    }
  };

  // Get students to display - use class students if class is selected, otherwise all students
  const getStudentOptions = () => {
    const studentsToUse = selectedClassId ? classStudents : allStudents;
    return studentsToUse.map((s) => ({
      value: String(s.id),
      label: `${s.first_name} ${s.last_name} (${s.student_id})${s.class_name ? ` - ${s.class_name}` : ''}`,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      error('Description is required');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.createMerit({
        ...formData,
        points: Number(formData.points),
      });

      if (response.data.badgeStatusChange) {
        const { badgeEarned, badgeLost, studentName, cleanPoints, totalMerits } = response.data.badgeStatusChange;
        if (badgeEarned || badgeLost) {
          setBadgeModalData({ badgeEarned, badgeLost, studentName, cleanPoints, totalMerits });
          setShowBadgeModal(true);
        }
      }

      success('Merit awarded successfully!');
      setShowConfirmation(false);
      setFormData({
        student_id: '',
        merit_date: new Date().toISOString().split('T')[0],
        merit_type_id: '',
        description: '',
        points: '1',
      });
      setSelectedClassId('');
      setClassStudents([]);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error awarding merit');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />

      {/* Confirmation Modal */}
      {showConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-white/20 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 text-white">
              <div className="flex items-center space-x-3">
                <CheckCircle size={28} />
                <div>
                  <h2 className="text-xl font-bold">Confirm Merit Award</h2>
                  <p className="text-green-100 text-sm">Please review before confirming</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  icon: User,
                  label: 'Student',
                  value: (() => {
                    const all = selectedClassId ? classStudents : allStudents;
                    const s = all.find((s: any) => String(s.id) === formData.student_id);
                    return s ? `${s.first_name} ${s.last_name}` : '—';
                  })(),
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  icon: Star,
                  label: 'Merit Type',
                  value: meritTypes.find((t: any) => String(t.id) === formData.merit_type_id)?.name || '—',
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                },
                {
                  icon: Award,
                  label: 'Points',
                  value: `+${formData.points} merit point${Number(formData.points) !== 1 ? 's' : ''}`,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  icon: Calendar,
                  label: 'Date',
                  value: new Date(formData.merit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                },
                {
                  icon: FileText,
                  label: 'Description',
                  value: formData.description,
                  color: 'text-gray-600',
                  bg: 'bg-gray-50',
                },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className={`flex items-start space-x-3 p-3 rounded-xl ${bg}`}>
                  <Icon className={`${color} mt-0.5 flex-shrink-0`} size={18} />
                  <div>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-xl"
              >
                Go Back
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
              >
                <Award size={18} />
                <span>{loading ? 'Awarding...' : 'Confirm Award'}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Badge Status Modal */}
      {badgeModalData && (
        <BadgeStatusModal
          isOpen={showBadgeModal}
          onClose={() => {
            setShowBadgeModal(false);
            setBadgeModalData(null);
          }}
          badgeEarned={badgeModalData.badgeEarned}
          studentName={badgeModalData.studentName}
          cleanPoints={badgeModalData.cleanPoints}
          totalMerits={badgeModalData.totalMerits}
        />
      )}
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Award Merit
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Recognize and reward positive student behavior</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
          >
            <Award size={20} />
            <span className="font-semibold">Merit Award</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SearchableSelect
                label="Class (Optional - filter students by class)"
                value={selectedClassId}
                onChange={(value) => {
                  if (value === '') {
                    setSelectedClassId('');
                    setClassStudents([]);
                    setFormData({ ...formData, student_id: '' });
                  } else {
                    handleClassChange(value.toString());
                  }
                }}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c.id.toString(), label: c.class_name })),
                ]}
                placeholder="Search and select a class..."
                showClear={!!selectedClassId}
                onClear={() => {
                  setSelectedClassId('');
                  setClassStudents([]);
                  setFormData({ ...formData, student_id: '' });
                }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SearchableSelect
                label="Student"
                value={formData.student_id}
                onChange={(value) => setFormData({ ...formData, student_id: String(value) })}
                options={getStudentOptions()}
                placeholder="Search and select a student..."
                required
                showClear={!!formData.student_id}
                onClear={() => setFormData({ ...formData, student_id: '' })}
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                label="Merit Date"
                type="date"
                value={formData.merit_date}
                onChange={(e) => setFormData({ ...formData, merit_date: e.target.value })}
                required
                className="rounded-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Input
                label="Merit Points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                min="1"
                max="10"
                required
                className="rounded-xl"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <SearchableSelect
              label="Merit Type"
              value={formData.merit_type_id}
              onChange={(value) => handleMeritTypeChange(value.toString())}
              options={meritTypes.map((t) => ({
                value: t.id.toString(),
                label: t.name,
              }))}
              placeholder="Search and select merit type..."
              required
              showClear={!!formData.merit_type_id}
              onClear={() => handleMeritTypeChange('')}
            />
          </motion.div>

          {formData.merit_type_id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            >
              <div className="text-sm text-gray-700">
                Selected: <span className="font-bold text-green-600">{meritTypes.find(t => t.id === Number(formData.merit_type_id))?.name}</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              placeholder="Describe why this merit is being awarded..."
              className="rounded-xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex justify-end space-x-4 pt-6 border-t border-gray-200"
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/teacher')}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                <Award size={20} className="mr-2" />
                {loading ? 'Awarding...' : 'Award Merit'}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default AwardMerit;


