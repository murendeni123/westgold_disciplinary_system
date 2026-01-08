import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
import Textarea from '../../components/Textarea';
import { motion } from 'framer-motion';
import { Save, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Static consequence options for teachers to select when logging an incident.
// These are encoded into the incident description that is sent to the backend,
// so they work with the existing API without schema changes.
const CONSEQUENCE_OPTIONS: string[] = [
  'Verbal redirection / private talk',
  'Think / reflection sheet',
  'Loss of privilege (5–15 min)',
  'Time in buddy classroom / reset space',
  'Written apology / restitution task',
  'Parent contact (message / call logged)',
  'After-school detention (30–60 min)',
  'Behavior contract / goal sheet',
  'Loss of special activity / recess for the day',
];

const LogIncident: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedConsequences, setSelectedConsequences] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().slice(0, 5),
    incident_type: '',
    description: '',
    severity: 'low',
    points: '0',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchIncidentTypes();
    fetchAllStudents();
  }, []);

  const fetchIncidentTypes = async () => {
    try {
      const response = await api.getIncidentTypes({ active_only: 'true' });
      setIncidentTypes(response.data);
    } catch (error) {
      console.error('Error fetching incident types:', error);
    }
  };

  const handleIncidentTypeChange = (typeId: string) => {
    const selectedType = incidentTypes.find((t) => t.id === Number(typeId));
    if (selectedType) {
      setFormData({
        ...formData,
        incident_type: selectedType.name,
        severity: selectedType.default_severity,
        points: String(selectedType.default_points),
      });
    } else {
      setFormData({
        ...formData,
        incident_type: '',
        severity: 'low',
        points: '0',
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
      const consequencesSummary = selectedConsequences.length
        ? `\n\nConsequences applied: ${selectedConsequences.join(', ')}`
        : '';

      const payload = {
        ...formData,
        description: `${formData.description || ''}${consequencesSummary}`,
      };

      await api.createIncident(payload);
      success('Incident logged successfully!');
      // Reset form
      setFormData({
        student_id: '',
        incident_date: new Date().toISOString().split('T')[0],
        incident_time: new Date().toTimeString().slice(0, 5),
        incident_type: '',
        description: '',
        severity: 'low',
        points: '0',
      });
      setSelectedClassId('');
      setClassStudents([]);
      setSelectedConsequences([]);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error logging incident');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Log Incident
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Record a behaviour incident</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
          >
            <AlertTriangle size={20} />
            <span className="font-semibold">Incident Report</span>
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
                label="Incident Date"
                type="date"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
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
                label="Incident Time"
                type="time"
                value={formData.incident_time}
                onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
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
              label="Incident Type"
              value={incidentTypes.find((t) => t.name === formData.incident_type)?.id || ''}
              onChange={(e) => handleIncidentTypeChange(e.target.value)}
              options={[
                { value: '', label: 'Select an incident type...' },
                ...incidentTypes.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.default_points} pts, ${t.default_severity})`,
                })),
              ]}
              required
              className="rounded-xl"
            />
          </motion.div>

          {formData.incident_type && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
            >
              <div className="text-sm text-gray-700">
                Selected: <span className="font-bold text-red-600">{formData.incident_type}</span>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Select
                label="Severity"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                required
                className="rounded-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Input
                label="Demerit Points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                min="0"
                placeholder="0"
                className="rounded-xl"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              placeholder="Describe what happened..."
              className="rounded-xl"
            />
          </motion.div>

          {/* Consequence selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="mt-2"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Consequences (optional)
              </h3>
              <span className="text-xs text-gray-500">
                Choose one or more actions you are applying
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CONSEQUENCE_OPTIONS.map((label) => {
                const checked = selectedConsequences.includes(label);
                return (
                  <label
                    key={label}
                    className={`flex items-start space-x-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
                      checked
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-white border-gray-200 hover:border-red-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedConsequences((prev) =>
                            prev.includes(label) ? prev : [...prev, label]
                          );
                        } else {
                          setSelectedConsequences((prev) =>
                            prev.filter((c) => c !== label)
                          );
                        }
                      }}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex justify-end space-x-4 pt-6 border-t border-gray-200"
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/teacher/behaviour')}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                <Save size={20} className="mr-2" />
                {loading ? 'Saving...' : 'Log Incident'}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default LogIncident;

