import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
import Textarea from '../../components/Textarea';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

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
    merit_type: '',
    description: '',
    points: '1',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
        merit_type: selectedType.name,
        points: String(selectedType.default_points),
      });
    } else {
      setFormData({
        ...formData,
        merit_type: '',
        points: '1',
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.getStudents();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createMerit({
        ...formData,
        points: Number(formData.points),
      });
      success('Merit awarded successfully!');
      // Reset form
      setFormData({
        student_id: '',
        merit_date: new Date().toISOString().split('T')[0],
        merit_type: '',
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
              <Select
                label="Class (Optional - filter students by class)"
                value={selectedClassId}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setSelectedClassId('');
                    setClassStudents([]);
                    setFormData({ ...formData, student_id: '' });
                  } else {
                    handleClassChange(e.target.value);
                  }
                }}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c.id, label: c.class_name })),
                ]}
                className="rounded-xl"
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
            <Select
              label="Merit Type"
              value={meritTypes.find((t) => t.name === formData.merit_type)?.id || ''}
              onChange={(e) => handleMeritTypeChange(e.target.value)}
              options={[
                { value: '', label: 'Select a merit type...' },
                ...meritTypes.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.default_points} pts)`,
                })),
              ]}
              required
              className="rounded-xl"
            />
          </motion.div>

          {formData.merit_type && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            >
              <div className="text-sm text-gray-700">
                Selected: <span className="font-bold text-green-600">{formData.merit_type}</span>
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


