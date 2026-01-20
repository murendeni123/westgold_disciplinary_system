import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Save, 
  Trash2,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Users,
  Home
} from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../hooks/useToast';

interface Class {
  id: number;
  class_name: string;
  grade_level: string;
}

interface TimetableTemplate {
  id: number;
  name: string;
  academic_year: string;
}

interface TimeSlot {
  id: number;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  day_of_week?: number | null;
  slot_type?: 'lesson' | 'break';
  is_break?: boolean;
}

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
  assigned_classroom_name?: string;
}

interface Classroom {
  id: number;
  name: string;
}

interface ClassTimetableEntry {
  id?: number;
  time_slot_id: number;
  subject_id: number | null;
  teacher_id: number | null;
  classroom_id: number | null;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  subject_name?: string;
  teacher_name?: string;
  classroom_name?: string;
}

const ClassTimetableAssignment: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TimetableTemplate | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classTimetable, setClassTimetable] = useState<ClassTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [newClassroom, setNewClassroom] = useState({ name: '', room_number: '', capacity: '' });
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [dayTemplates, setDayTemplates] = useState<{ [key: number]: TimetableTemplate | null }>({
    1: null, 2: null, 3: null, 4: null, 5: null
  });

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      fetchTimeSlots(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    // When day changes, auto-select the template for that day
    const dayTemplate = dayTemplates[selectedDay];
    if (dayTemplate) {
      setSelectedTemplate(dayTemplate);
    }
  }, [selectedDay, dayTemplates]);

  useEffect(() => {
    if (selectedClass && selectedTemplate) {
      fetchClassTimetable(selectedClass.id);
    }
  }, [selectedClass, selectedTemplate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesRes, templatesRes, subjectsRes, teachersRes, classroomsRes] = await Promise.all([
        api.getClasses(),
        api.getTimetableTemplates(),
        api.getSubjects(),
        api.getTeachers(),
        api.getClassrooms()
      ]);

      setClasses(classesRes.data || []);
      setTemplates(templatesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setClassrooms(classroomsRes.data || []);

      // Map templates to days based on their names
      const dayTemplateMap: { [key: number]: TimetableTemplate | null } = {
        1: null, 2: null, 3: null, 4: null, 5: null
      };
      
      if (templatesRes.data) {
        templatesRes.data.forEach((template: TimetableTemplate) => {
          const nameLower = template.name.toLowerCase();
          if (nameLower.includes('monday')) dayTemplateMap[1] = template;
          else if (nameLower.includes('tuesday')) dayTemplateMap[2] = template;
          else if (nameLower.includes('wednesday')) dayTemplateMap[3] = template;
          else if (nameLower.includes('thursday')) dayTemplateMap[4] = template;
          else if (nameLower.includes('friday')) dayTemplateMap[5] = template;
        });
      }
      
      setDayTemplates(dayTemplateMap);

      if (classesRes.data && classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0]);
      }
      
      // Auto-select Monday's template by default
      if (dayTemplateMap[1]) {
        setSelectedTemplate(dayTemplateMap[1]);
      } else if (templatesRes.data && templatesRes.data.length > 0) {
        setSelectedTemplate(templatesRes.data[0]);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      error('Failed to load data');
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
    }
  };

  const fetchClassTimetable = async (classId: number) => {
    try {
      const response = await api.getClassTimetable(classId);
      setClassTimetable(response.data || []);
    } catch (err) {
      console.error('Error fetching class timetable:', err);
    }
  };

  const handleAssignPeriod = async (timeSlot: TimeSlot, subjectId: number | null, teacherId: number | null, classroomId: number | null) => {
    if (!selectedClass || !selectedTemplate) return;

    try {
      await api.assignClassPeriod(selectedClass.id, {
        template_id: selectedTemplate.id,
        time_slot_id: timeSlot.id,
        subject_id: subjectId,
        teacher_id: teacherId,
        classroom_id: classroomId,
        effective_from: new Date().toISOString().split('T')[0]
      });

      success('Period assigned successfully');
      fetchClassTimetable(selectedClass.id);
    } catch (err: any) {
      console.error('Error assigning period:', err);
      error(err.response?.data?.error || 'Failed to assign period');
    }
  };

  const handleUpdatePeriod = async (entryId: number, subjectId: number | null, teacherId: number | null, classroomId: number | null) => {
    try {
      await api.updateClassTimetable(entryId, {
        subject_id: subjectId,
        teacher_id: teacherId,
        classroom_id: classroomId
      });

      success('Period updated successfully');
      if (selectedClass) {
        fetchClassTimetable(selectedClass.id);
      }
    } catch (err: any) {
      console.error('Error updating period:', err);
      error(err.response?.data?.error || 'Failed to update period');
    }
  };

  const handleDeletePeriod = async (entryId: number) => {
    if (!window.confirm('Are you sure you want to remove this period assignment?')) return;

    try {
      await api.deleteClassTimetable(entryId);
      success('Period removed successfully');
      if (selectedClass) {
        fetchClassTimetable(selectedClass.id);
      }
    } catch (err) {
      console.error('Error deleting period:', err);
      error('Failed to remove period');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject(newSubject);
      success('Subject created successfully');
      setIsSubjectModalOpen(false);
      setNewSubject({ name: '', code: '' });
      const response = await api.getSubjects();
      setSubjects(response.data || []);
    } catch (err: any) {
      console.error('Error creating subject:', err);
      error(err.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClassroom({
        name: newClassroom.name,
        room_number: newClassroom.room_number,
        capacity: newClassroom.capacity ? parseInt(newClassroom.capacity) : null
      });
      success('Classroom created successfully');
      setIsClassroomModalOpen(false);
      setNewClassroom({ name: '', room_number: '', capacity: '' });
      const response = await api.getClassrooms();
      setClassrooms(response.data || []);
    } catch (err: any) {
      console.error('Error creating classroom:', err);
      error(err.response?.data?.error || 'Failed to create classroom');
    }
  };

  const getTimetableEntry = (timeSlotId: number): ClassTimetableEntry | undefined => {
    return classTimetable.find(entry => entry.time_slot_id === timeSlotId);
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
          <h1 className="text-4xl font-bold text-gray-900">Class Timetable Assignment</h1>
          <p className="text-gray-500 mt-2">Assign subjects, teachers, and classrooms to each period</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setIsSubjectModalOpen(true)}
            variant="secondary"
            className="rounded-lg"
          >
            <Plus size={18} className="mr-2" />
            Add Subject
          </Button>
          <Button
            onClick={() => setIsClassroomModalOpen(true)}
            variant="secondary"
            className="rounded-lg"
          >
            <Plus size={18} className="mr-2" />
            Add Classroom
          </Button>
        </div>
      </motion.div>

      {/* Class Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass?.id || ''}
          onChange={(e) => {
            const classItem = classes.find(c => c.id === parseInt(e.target.value));
            setSelectedClass(classItem || null);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {classes.map(classItem => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.class_name} - Grade {classItem.grade_level}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Timetable Grid */}
      {selectedClass && selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedClass.class_name} Timetable
          </h2>

          {/* Day Tabs */}
          <div className="mb-6">
            <div className="flex space-x-2 border-b border-gray-200">
              {daysOfWeek.map((day) => {
                const hasTemplate = dayTemplates[day.id] !== null;
                return (
                  <button
                    key={day.id}
                    onClick={() => hasTemplate && setSelectedDay(day.id)}
                    disabled={!hasTemplate}
                    className={`px-6 py-3 font-medium transition-all ${
                      selectedDay === day.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : hasTemplate
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{day.name}</span>
                      {!hasTemplate && (
                        <span className="text-xs text-red-400 mt-1">No template</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedTemplate && (
              <div className="mt-3 text-sm text-gray-600">
                Using template: <span className="font-semibold text-gray-900">{selectedTemplate.name}</span>
              </div>
            )}
          </div>

          {timeSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No time slots defined for this template</p>
              <p className="text-sm mt-2">Please create time slots in Timetable Management first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeSlots.map((slot) => {
                if (slot.is_break || slot.slot_type === 'break') {
                  return (
                    <div key={slot.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{slot.period_name}</div>
                          <div className="text-sm text-gray-500">
                            {slot.start_time} - {slot.end_time}
                          </div>
                        </div>
                        <span className="text-xs px-3 py-1 bg-amber-200 text-amber-800 rounded-full">
                          Break
                        </span>
                      </div>
                    </div>
                  );
                }

                const entry = getTimetableEntry(slot.id);

                return (
                  <PeriodAssignmentRow
                    key={slot.id}
                    slot={slot}
                    entry={entry}
                    subjects={subjects}
                    teachers={teachers}
                    classes={classes}
                    onAssign={handleAssignPeriod}
                    onUpdate={handleUpdatePeriod}
                    onDelete={handleDeletePeriod}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add Subject"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mathematics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Code (Optional)
            </label>
            <input
              type="text"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., MATH"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSubjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Classroom Modal */}
      <Modal
        isOpen={isClassroomModalOpen}
        onClose={() => setIsClassroomModalOpen(false)}
        title="Add Classroom"
      >
        <form onSubmit={handleCreateClassroom} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classroom Name
            </label>
            <input
              type="text"
              value={newClassroom.name}
              onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Room 101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Number (Optional)
            </label>
            <input
              type="text"
              value={newClassroom.room_number}
              onChange={(e) => setNewClassroom({ ...newClassroom, room_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity (Optional)
            </label>
            <input
              type="number"
              value={newClassroom.capacity}
              onChange={(e) => setNewClassroom({ ...newClassroom, capacity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 30"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsClassroomModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Classroom
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Period Assignment Row Component
interface PeriodAssignmentRowProps {
  slot: TimeSlot;
  entry?: ClassTimetableEntry;
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  onAssign: (slot: TimeSlot, subjectId: number | null, teacherId: number | null, classroomId: number | null) => void;
  onUpdate: (entryId: number, subjectId: number | null, teacherId: number | null, classroomId: number | null) => void;
  onDelete: (entryId: number) => void;
}

const PeriodAssignmentRow: React.FC<PeriodAssignmentRowProps> = ({
  slot,
  entry,
  subjects,
  teachers,
  classes,
  onAssign,
  onUpdate,
  onDelete
}) => {
  const [subjectId, setSubjectId] = useState<number | null>(entry?.subject_id || null);
  const [teacherId, setTeacherId] = useState<number | null>(entry?.teacher_id || null);
  const [classroomId, setClassroomId] = useState<number | null>(entry?.classroom_id || null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (entry) {
      setSubjectId(entry.subject_id || null);
      setTeacherId(entry.teacher_id || null);
      setClassroomId(entry.classroom_id || null);
    }
  }, [entry]);

  useEffect(() => {
    if (entry) {
      const changed = 
        subjectId !== entry.subject_id ||
        teacherId !== entry.teacher_id ||
        classroomId !== entry.classroom_id;
      setHasChanges(changed);
    }
  }, [subjectId, teacherId, classroomId, entry]);

  // Auto-select classroom when teacher is selected
  useEffect(() => {
    if (teacherId) {
      const selectedTeacher = teachers.find(t => t.id === teacherId);
      if (selectedTeacher?.assigned_classroom_name) {
        // Find class that matches the teacher's assigned class name (just the class_name, e.g., "A")
        const matchingClass = classes.find(
          c => c.class_name?.toLowerCase() === selectedTeacher.assigned_classroom_name?.toLowerCase()
        );
        if (matchingClass && classroomId !== matchingClass.id) {
          setClassroomId(matchingClass.id);
        }
      }
    }
  }, [teacherId, teachers, classes]);

  const handleSave = () => {
    if (entry) {
      onUpdate(entry.id!, subjectId, teacherId, classroomId);
    } else {
      onAssign(slot, subjectId, teacherId, classroomId);
    }
    setHasChanges(false);
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-900">{slot.period_name}</div>
          <div className="text-sm text-gray-500">
            {slot.start_time} - {slot.end_time}
          </div>
        </div>
        {entry && (
          <button
            onClick={() => onDelete(entry.id!)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <BookOpen size={14} className="inline mr-1" />
            Subject
          </label>
          <select
            value={subjectId || ''}
            onChange={(e) => setSubjectId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select subject</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <Users size={14} className="inline mr-1" />
            Teacher
          </label>
          <select
            value={teacherId || ''}
            onChange={(e) => setTeacherId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select teacher</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <Home size={14} className="inline mr-1" />
            Classroom
          </label>
          <select
            value={classroomId || ''}
            onChange={(e) => setClassroomId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select classroom</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.grade_level} {cls.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(hasChanges || !entry) && (subjectId || teacherId || classroomId) && (
        <div className="mt-3 flex justify-end">
          <Button
            onClick={handleSave}
            size="sm"
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={14} className="mr-1" />
            {entry ? 'Update' : 'Assign'}
          </Button>
        </div>
      )}

      {entry && !hasChanges && (
        <div className="mt-3 flex items-center text-xs text-green-600">
          <CheckCircle size={14} className="mr-1" />
          Assigned
        </div>
      )}
    </div>
  );
};

export default ClassTimetableAssignment;
