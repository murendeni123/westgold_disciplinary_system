import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Plus,
  Trash2,
  Save,
  Sparkles,
  Calendar,
  Zap
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface TimetableTemplate {
  id: number;
  name: string;
  academic_year: string;
  timetable_type: string;
  is_active: boolean;
}

interface TimeSlot {
  id: number;
  template_id: number;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  slot_type: 'lesson' | 'break';
  applies_to_days: string;
}

interface SlotFormRow {
  period_name: string;
  slot_type: 'lesson' | 'break';
}

const TimetableManagementNew: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TimetableTemplate | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [subjectViewMode, setSubjectViewMode] = useState<'catalogue' | 'custom'>('catalogue');
  
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ period_name: string; slot_type: 'lesson' | 'break' }>({ period_name: '', slot_type: 'lesson' });
  
  // Predefined subjects catalogue
  const predefinedSubjects = [
    { code: 'AFR', name: 'Afrikaans', description: 'Afrikaans language and literature' },
    { code: 'ENG', name: 'English', description: 'English language and literature' },
    { code: 'MAT', name: 'Mathematics', description: 'Mathematics' },
    { code: 'NS', name: 'Natural Sciences', description: 'Natural Sciences' },
    { code: 'SS', name: 'Social Sciences', description: 'Social Sciences' },
    { code: 'LO', name: 'Life Orientation', description: 'Life Orientation' },
    { code: 'EMS', name: 'Economic & Management Sciences', description: 'Economic & Management Sciences' },
    { code: 'TECH', name: 'Technology', description: 'Technology' },
    { code: 'CA', name: 'Creative Arts', description: 'Creative Arts' }
  ];
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    academic_year: '',
    timetable_type: 'fixed_weekly',
  });

  const [slotRows, setSlotRows] = useState<SlotFormRow[]>([
    { period_name: '', slot_type: 'lesson' }
  ]);

  useEffect(() => {
    fetchTemplates();
    fetchSubjects();
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

  const fetchSubjects = async () => {
    try {
      const response = await api.getSubjects();
      console.log('Subjects response:', response.data);
      setSubjects(response.data || []);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      console.error('Error details:', err.response?.data);
      setSubjects([]);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTimetableTemplate(templateForm);
      success('Timetable template created successfully');
      setIsTemplateModalOpen(false);
      setTemplateForm({ name: '', academic_year: '', timetable_type: 'fixed_weekly' });
      fetchTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
      error('Failed to create template');
    }
  };

  const handleAddSlotRow = () => {
    setSlotRows([...slotRows, { period_name: '', slot_type: 'lesson' }]);
  };

  const handleRemoveSlotRow = (index: number) => {
    if (slotRows.length > 1) {
      setSlotRows(slotRows.filter((_, i) => i !== index));
    }
  };

  const handleSlotRowChange = (index: number, field: keyof SlotFormRow, value: string) => {
    const newRows = [...slotRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setSlotRows(newRows);
  };


  const handleSaveSlots = async () => {
    if (!selectedTemplate) return;

    // Validate all rows
    const invalidRows = slotRows.filter(row => !row.period_name);

    if (invalidRows.length > 0) {
      error('Please enter a name for each period');
      return;
    }

    try {
      const slots = slotRows.map((row, index) => ({
        period_number: index + 1,
        period_name: row.period_name,
        slot_type: row.slot_type
      }));

      await api.bulkCreateTimeSlots(selectedTemplate.id, { slots });
      success('Time slots saved successfully');
      setIsSlotsModalOpen(false);
      setSlotRows([{ period_name: '', slot_type: 'lesson' }]);
      fetchTimeSlots(selectedTemplate.id);
    } catch (err: any) {
      console.error('Error saving slots:', err);
      error(err.response?.data?.error || 'Failed to save time slots');
    }
  };

  const handleQuickSetup = async () => {
    const standardPeriods = [
      { period_name: 'Period 1', slot_type: 'lesson' as const },
      { period_name: 'Period 2', slot_type: 'lesson' as const },
      { period_name: 'Tea Break', slot_type: 'break' as const },
      { period_name: 'Period 3', slot_type: 'lesson' as const },
      { period_name: 'Period 4', slot_type: 'lesson' as const },
      { period_name: 'Period 5', slot_type: 'lesson' as const },
      { period_name: 'Lunch', slot_type: 'break' as const },
      { period_name: 'Period 6', slot_type: 'lesson' as const },
      { period_name: 'Period 7', slot_type: 'lesson' as const },
    ];

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    try {
      // Create 5 separate templates (one for each day)
      for (const day of daysOfWeek) {
        // Create template for this day
        const templateResponse = await api.createTimetableTemplate({
          name: `${day} Timetable`,
          academic_year: academicYear,
          timetable_type: 'fixed_weekly'
        });

        const newTemplate = templateResponse.data;

        // Create time slots for this template
        const slots = standardPeriods.map((period, index) => ({
          period_number: index + 1,
          ...period
        }));

        await api.bulkCreateTimeSlots(newTemplate.id, { slots });
      }

      success('5 day-specific templates created successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error creating day templates:', err);
      error(err.response?.data?.error || 'Failed to create day templates');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) {
      error('Subject name is required');
      return;
    }

    try {
      await api.createSubject(subjectForm);
      success('Subject created successfully');
      setIsSubjectsModalOpen(false);
      setSubjectForm({ name: '', code: '', description: '' });
      fetchSubjects();
    } catch (err: any) {
      console.error('Error creating subject:', err);
      error(err.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.deleteSubject(id);
      success('Subject deleted successfully');
      fetchSubjects();
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      error(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  const handleAddFromCatalogue = async (catalogueSubject: any) => {
    // Check if subject already exists in local state
    const exists = subjects.find(s => s.code === catalogueSubject.code);
    if (exists) {
      error(`${catalogueSubject.name} is already added`);
      return;
    }

    try {
      await api.createSubject(catalogueSubject);
      success(`${catalogueSubject.name} added successfully`);
      fetchSubjects();
    } catch (err: any) {
      console.error('Error adding subject from catalogue:', err);
      
      // Handle 409 conflict - subject already exists in database
      if (err.response?.status === 409) {
        error(`${catalogueSubject.name} already exists in your school`);
        // Refresh subjects list to sync with database
        fetchSubjects();
      } else {
        error(err.response?.data?.error || 'Failed to add subject');
      }
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

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlotId(slot.id);
    setEditForm({
      period_name: slot.period_name,
      slot_type: slot.slot_type
    });
  };

  const handleCancelEdit = () => {
    setEditingSlotId(null);
    setEditForm({ period_name: '', slot_type: 'lesson' });
  };

  const handleSaveEdit = async (slotId: number) => {
    if (!editForm.period_name.trim()) {
      error('Period name is required');
      return;
    }

    try {
      await api.updateTimeSlot(slotId, editForm);
      success('Time slot updated successfully');
      setEditingSlotId(null);
      if (selectedTemplate) {
        fetchTimeSlots(selectedTemplate.id);
      }
    } catch (err: any) {
      console.error('Error updating slot:', err);
      error(err.response?.data?.error || 'Failed to update time slot');
    }
  };

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Timetable Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Create and manage school timetable templates</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleQuickSetup}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            <Zap size={20} className="mr-2" />
            Quick Setup (5 Days)
          </Button>
          <Button
            onClick={() => setIsTemplateModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Plus size={20} className="mr-2" />
            New Template
          </Button>
        </div>
      </motion.div>

      {/* All Templates Display */}
      {templates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-12 bg-white rounded-2xl shadow-lg"
        >
          <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-6">Click "Quick Setup (5 Days)" to create day-specific templates</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {templates.map((template, index) => (
            <TemplateSection
              key={template.id}
              template={template}
              index={index}
              isSelected={selectedTemplate?.id === template.id}
              onSelect={() => setSelectedTemplate(template)}
              onAddPeriods={(template) => {
                setSelectedTemplate(template);
                setIsSlotsModalOpen(true);
              }}
              onAddSubjects={() => setIsSubjectsModalOpen(true)}
            />
          ))}
        </div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Standard Timetable"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
              onChange={(e) => setTemplateForm({ ...templateForm, timetable_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="fixed_weekly">Fixed Weekly</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTemplateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              Create Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Periods Modal */}
      <Modal
        isOpen={isSlotsModalOpen}
        onClose={() => setIsSlotsModalOpen(false)}
        title="Add Time Slots"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Define your daily period schedule. These periods will apply to this template.
          </p>

          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Period Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slotRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.period_name}
                        onChange={(e) => handleSlotRowChange(index, 'period_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Period 1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.slot_type}
                        onChange={(e) => handleSlotRowChange(index, 'slot_type', e.target.value as 'lesson' | 'break')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="lesson">Lesson</option>
                        <option value="break">Break</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveSlotRow(index)}
                        className="text-red-600 hover:text-red-700"
                        disabled={slotRows.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={handleAddSlotRow}
            variant="secondary"
            className="w-full"
          >
            <Plus size={18} className="mr-2" />
            Add Row
          </Button>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSlotsModalOpen(false);
                setSlotRows([{ period_name: '', slot_type: 'lesson' }]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSlots}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save size={18} className="mr-2" />
              Save Slots
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Subjects Modal - Catalogue Style */}
      <Modal
        isOpen={isSubjectsModalOpen}
        onClose={() => {
          setIsSubjectsModalOpen(false);
          setSubjectViewMode('catalogue');
        }}
        title="Subject Catalogue"
        size="xl"
      >
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSubjectViewMode('catalogue')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                subjectViewMode === 'catalogue'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse Catalogue
            </button>
            <button
              onClick={() => setSubjectViewMode('custom')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                subjectViewMode === 'custom'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Add Custom Subject
            </button>
          </div>

          {/* Catalogue View */}
          {subjectViewMode === 'catalogue' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select subjects from our predefined catalogue. Click on a subject to add it to your school.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predefinedSubjects.map((subject) => {
                  const isAdded = subjects.some(s => s.code === subject.code);
                  return (
                    <div
                      key={subject.code}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isAdded
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 cursor-pointer'
                      }`}
                      onClick={() => !isAdded && handleAddFromCatalogue(subject)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{subject.code}</p>
                          <p className="text-sm text-gray-500 mt-1">{subject.description}</p>
                        </div>
                        {isAdded && (
                          <div className="flex-shrink-0 ml-3">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Your Subjects List */}
              {subjects.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your School's Subjects</h3>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{subject.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({subject.code})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Subject Form */}
          {subjectViewMode === 'custom' && (
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., CS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of the subject"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsSubjectsModalOpen(false);
                    setSubjectViewMode('catalogue');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  Add Subject
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

// Template Section Component
const TemplateSection: React.FC<{
  template: TimetableTemplate;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onAddPeriods: (template: TimetableTemplate) => void;
  onAddSubjects: () => void;
}> = ({ template, index, isSelected, onSelect, onAddPeriods, onAddSubjects }) => {
  const { success, error } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ period_name: string; slot_type: 'lesson' | 'break' }>({ 
    period_name: '', 
    slot_type: 'lesson' 
  });

  useEffect(() => {
    fetchTimeSlots();
  }, [template.id]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await api.getTimeSlots(template.id);
      setTimeSlots(response.data || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlotId(slot.id);
    setEditForm({
      period_name: slot.period_name,
      slot_type: slot.slot_type
    });
  };

  const handleCancelEdit = () => {
    setEditingSlotId(null);
    setEditForm({ period_name: '', slot_type: 'lesson' });
  };

  const handleSaveEdit = async (slotId: number) => {
    if (!editForm.period_name.trim()) {
      error('Period name is required');
      return;
    }

    try {
      await api.updateTimeSlot(slotId, editForm);
      success('Time slot updated successfully');
      setEditingSlotId(null);
      fetchTimeSlots();
    } catch (err: any) {
      console.error('Error updating slot:', err);
      error(err.response?.data?.error || 'Failed to update time slot');
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;

    try {
      await api.deleteTimeSlot(slotId);
      success('Time slot deleted successfully');
      fetchTimeSlots();
    } catch (err) {
      console.error('Error deleting slot:', err);
      error('Failed to delete time slot');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* Template Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Calendar className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600">Academic Year: {template.academic_year}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => onAddSubjects()}
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <Plus size={18} className="mr-2" />
            Add Subjects
          </Button>
          <Button
            onClick={() => onAddPeriods(template)}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Plus size={18} className="mr-2" />
            Add Periods
          </Button>
        </div>
      </div>

      {/* Time Slots */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No periods defined for this template</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                editingSlotId === slot.id
                  ? 'border-blue-400 bg-blue-50 shadow-lg'
                  : slot.slot_type === 'break'
                  ? 'border-orange-200 bg-orange-50 hover:border-orange-300 cursor-pointer'
                  : 'border-purple-200 bg-purple-50 hover:border-purple-300 cursor-pointer'
              }`}
              onClick={() => editingSlotId !== slot.id && handleEditSlot(slot)}
            >
              {editingSlotId === slot.id ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Period Name</label>
                      <input
                        type="text"
                        value={editForm.period_name}
                        onChange={(e) => setEditForm({ ...editForm, period_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Period 1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={editForm.slot_type}
                        onChange={(e) => setEditForm({ ...editForm, slot_type: e.target.value as 'lesson' | 'break' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="lesson">Lesson</option>
                        <option value="break">Break</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(slot.id);
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save size={16} className="mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      slot.slot_type === 'break' ? 'bg-orange-200' : 'bg-purple-200'
                    }`}>
                      <Clock size={20} className={
                        slot.slot_type === 'break' ? 'text-orange-700' : 'text-purple-700'
                      } />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{slot.period_name}</h3>
                      <p className="text-sm text-gray-600">
                        {slot.start_time} - {slot.end_time}
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-white">
                          {slot.slot_type === 'break' ? 'Break' : 'Lesson'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSlot(slot.id);
                    }}
                    size="sm"
                    variant="secondary"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TimetableManagementNew;

// Modals are rendered in the main component, not in TemplateSection
// Need to add them back to the main component's return statement
