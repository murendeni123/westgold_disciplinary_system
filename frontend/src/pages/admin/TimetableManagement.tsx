import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2,
  Save,
  X,
  ChevronRight
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../hooks/useToast';

interface TimetableTemplate {
  id: number;
  name: string;
  academic_year: string;
  timetable_type: 'fixed_weekly' | 'rotating_cycle';
  cycle_length: number;
  is_active: boolean;
  created_at: string;
}

interface TimeSlot {
  id: number;
  template_id: number;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  day_of_week: number;
  cycle_day: number;
}

const TimetableManagement: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TimetableTemplate | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimetableTemplate | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: '',
    academic_year: '2025-2026',
    timetable_type: 'fixed_weekly' as 'fixed_weekly' | 'rotating_cycle',
    cycle_length: 1
  });

  const [slotForm, setSlotForm] = useState({
    period_number: 1,
    period_name: '',
    start_time: '',
    end_time: '',
    is_break: false,
    day_of_week: 1,
    cycle_day: 1
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      fetchTimeSlots(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTimetableTemplates();
      setTemplates(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedTemplate(response.data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      // Only show error if it's an actual error, not just empty results
      if (err.response?.status !== 404) {
        error('Failed to load timetable templates');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async (templateId: number) => {
    try {
      const response = await api.getTimeSlots(templateId);
      setTimeSlots(response.data || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      error('Failed to load time slots');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTimetableTemplate(templateForm);
      success('Timetable template created successfully');
      setIsTemplateModalOpen(false);
      setTemplateForm({ name: '', academic_year: '', timetable_type: 'fixed_weekly', cycle_length: 1 });
      fetchTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
      error('Failed to create template');
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await api.createTimeSlot(selectedTemplate.id, slotForm);
      success('Time slot created successfully');
      setIsSlotModalOpen(false);
      fetchTimeSlots(selectedTemplate.id);
      setSlotForm({
        period_number: 1,
        period_name: '',
        start_time: '',
        end_time: '',
        is_break: false,
        day_of_week: 1,
        cycle_day: 1
      });
    } catch (err: any) {
      console.error('Error creating slot:', err);
      error(err.response?.data?.error || 'Failed to create time slot');
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;

    try {
      await api.deleteTimeSlot(slotId);
      success('Time slot deleted successfully');
      if (selectedTemplate) {
        fetchTimeSlots(selectedTemplate.id);
      }
    } catch (err) {
      console.error('Error deleting slot:', err);
      error('Failed to delete time slot');
    }
  };

  const handleQuickSetup = async () => {
    if (!selectedTemplate) return;

    const standardPeriods = [
      { period_number: 1, period_name: 'Period 1', start_time: '08:00', end_time: '08:45', is_break: false },
      { period_number: 2, period_name: 'Period 2', start_time: '08:50', end_time: '09:35', is_break: false },
      { period_number: 3, period_name: 'Tea Break', start_time: '09:35', end_time: '09:55', is_break: true },
      { period_number: 4, period_name: 'Period 3', start_time: '09:55', end_time: '10:40', is_break: false },
      { period_number: 5, period_name: 'Period 4', start_time: '10:45', end_time: '11:30', is_break: false },
      { period_number: 6, period_name: 'Period 5', start_time: '11:35', end_time: '12:20', is_break: false },
      { period_number: 7, period_name: 'Lunch', start_time: '12:20', end_time: '13:00', is_break: true },
      { period_number: 8, period_name: 'Period 6', start_time: '13:00', end_time: '13:45', is_break: false },
      { period_number: 9, period_name: 'Period 7', start_time: '13:50', end_time: '14:35', is_break: false },
    ];

    try {
      const slots = [];
      for (let day = 1; day <= 5; day++) {
        for (const period of standardPeriods) {
          slots.push({
            ...period,
            day_of_week: day,
            cycle_day: 1
          });
        }
      }

      await api.bulkCreateTimeSlots(selectedTemplate.id, { slots });
      success('Standard timetable created successfully');
      fetchTimeSlots(selectedTemplate.id);
    } catch (err: any) {
      console.error('Error creating standard timetable:', err);
      error(err.response?.data?.error || 'Failed to create standard timetable');
    }
  };

  const groupSlotsByDay = () => {
    const grouped: { [key: number]: TimeSlot[] } = {};
    timeSlots.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push(slot);
    });
    
    // Sort periods within each day
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => a.period_number - b.period_number);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  const groupedSlots = groupSlotsByDay();

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-500 mt-2">Create and manage school timetables</p>
        </div>
        <Button
          onClick={() => setIsTemplateModalOpen(true)}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={20} className="mr-2" />
          New Template
        </Button>
      </motion.div>

      {/* Template Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Timetable Templates</h2>
        
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No timetable templates found</p>
            <Button onClick={() => setIsTemplateModalOpen(true)} className="mt-4">
              Create Your First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.academic_year}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {template.timetable_type === 'fixed_weekly' ? 'Fixed Weekly' : `${template.cycle_length}-Week Cycle`}
                      </span>
                      {template.is_active && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Time Slots */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Time Slots - {selectedTemplate.name}
            </h2>
            <div className="flex space-x-3">
              <Button
                onClick={handleQuickSetup}
                variant="secondary"
                className="rounded-lg"
              >
                <Clock size={18} className="mr-2" />
                Quick Setup (Standard)
              </Button>
              <Button
                onClick={() => setIsSlotModalOpen(true)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={18} className="mr-2" />
                Add Period
              </Button>
            </div>
          </div>

          {timeSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No time slots defined for this template</p>
              <p className="text-sm mt-2">Use "Quick Setup" for a standard timetable or add periods manually</p>
            </div>
          ) : (
            <div className="space-y-6">
              {daysOfWeek.map((dayName, index) => {
                const dayNumber = index + 1;
                const daySlots = groupedSlots[dayNumber] || [];

                if (daySlots.length === 0) return null;

                return (
                  <div key={dayNumber} className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-3">{dayName}</h3>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            slot.is_break ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-gray-900">P{slot.period_number}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{slot.period_name}</div>
                              <div className="text-sm text-gray-500">
                                {slot.start_time} - {slot.end_time}
                              </div>
                            </div>
                            {slot.is_break && (
                              <span className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded-full">
                                Break
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Create Timetable Template"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Main School Timetable"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <input
              type="text"
              value={templateForm.academic_year}
              onChange={(e) => setTemplateForm({ ...templateForm, academic_year: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 2025-2026"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timetable Type
            </label>
            <select
              value={templateForm.timetable_type}
              onChange={(e) => setTemplateForm({ 
                ...templateForm, 
                timetable_type: e.target.value as 'fixed_weekly' | 'rotating_cycle',
                cycle_length: e.target.value === 'fixed_weekly' ? 1 : 2
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fixed_weekly">Fixed Weekly</option>
              <option value="rotating_cycle">Rotating Cycle (Week A/B)</option>
            </select>
          </div>

          {templateForm.timetable_type === 'rotating_cycle' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Length (weeks)
              </label>
              <input
                type="number"
                min="2"
                max="4"
                value={templateForm.cycle_length}
                onChange={(e) => setTemplateForm({ ...templateForm, cycle_length: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTemplateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Time Slot Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title="Add Time Slot"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Number
              </label>
              <input
                type="number"
                min="1"
                value={slotForm.period_number}
                onChange={(e) => setSlotForm({ ...slotForm, period_number: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week
              </label>
              <select
                value={slotForm.day_of_week}
                onChange={(e) => setSlotForm({ ...slotForm, day_of_week: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {daysOfWeek.map((day, index) => (
                  <option key={index} value={index + 1}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Name
            </label>
            <input
              type="text"
              value={slotForm.period_name}
              onChange={(e) => setSlotForm({ ...slotForm, period_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Period 1, Tea Break"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={slotForm.start_time}
                onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={slotForm.end_time}
                onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_break"
              checked={slotForm.is_break}
              onChange={(e) => setSlotForm({ ...slotForm, is_break: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_break" className="ml-2 text-sm text-gray-700">
              This is a break period (no attendance)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSlotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Period
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetableManagement;
