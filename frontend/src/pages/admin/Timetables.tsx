import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Card from '../../components/Card';
import { Plus, Edit, Trash2, Printer } from 'lucide-react';

const Timetables: React.FC = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [formData, setFormData] = useState({
    class_id: '',
    teacher_id: '',
    day_of_week: '0',
    period_number: '1',
    subject: '',
    start_time: '',
    end_time: '',
    room: '',
    is_break: false,
  });
  const [, setBulkEntries] = useState<any[]>([]);
  const [bulkFormData, setBulkFormData] = useState({
    class_id: '',
    teacher_id: '',
    selectedDays: [] as number[],
    dayPeriods: {} as Record<number, Array<{
      period_number: number;
      subject: string;
      start_time: string;
      end_time: string;
      room: string;
      is_break: boolean;
    }>>,
  });

  const days = [
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
    { value: '5', label: 'Saturday' },
    { value: '6', label: 'Sunday' },
  ];

  useEffect(() => {
    fetchTimetables();
    fetchClasses();
    fetchTeachers();
  }, [selectedClass, selectedTeacher, viewMode]);

  const fetchTimetables = async () => {
    try {
      const params: any = {};
      if (viewMode === 'class' && selectedClass) {
        params.class_id = selectedClass;
      } else if (viewMode === 'teacher' && selectedTeacher) {
        params.teacher_id = selectedTeacher;
      }
      const response = await api.getTimetables(params);
      setTimetables(response.data);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
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

  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleCreate = () => {
    setEditingTimetable(null);
    setFormData({
      class_id: viewMode === 'class' ? selectedClass : '',
      teacher_id: viewMode === 'teacher' ? selectedTeacher : '',
      day_of_week: '0',
      period_number: '1',
      subject: '',
      start_time: '',
      end_time: '',
      room: '',
      is_break: false,
    });
    setIsModalOpen(true);
  };

  const handleBulkCreate = () => {
    setBulkFormData({
      class_id: viewMode === 'class' ? selectedClass : '',
      teacher_id: viewMode === 'teacher' ? selectedTeacher : '',
      selectedDays: [],
      dayPeriods: {},
    });
    setIsBulkModalOpen(true);
  };

  const initializeDayPeriods = (day: number) => {
    if (!bulkFormData.dayPeriods[day]) {
      setBulkFormData(prev => ({
        ...prev,
        dayPeriods: {
          ...prev.dayPeriods,
          [day]: Array.from({ length: 8 }, (_, i) => ({
            period_number: i + 1,
            subject: '',
            start_time: '',
            end_time: '',
            room: '',
            is_break: false,
          })),
        },
      }));
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkFormData.selectedDays.length === 0) {
      alert('Please select at least one day');
      return;
    }

    const entries: any[] = [];
    bulkFormData.selectedDays.forEach(day => {
      const periods = bulkFormData.dayPeriods[day] || [];
      periods.forEach(period => {
        if (period.subject || period.is_break) {
          entries.push({
            class_id: bulkFormData.class_id || null,
            teacher_id: bulkFormData.teacher_id || null,
            day_of_week: day,
            period_number: period.period_number,
            subject: period.is_break ? null : period.subject,
            start_time: period.start_time || null,
            end_time: period.end_time || null,
            room: period.room || null,
            is_break: period.is_break ? 1 : 0,
          });
        }
      });
    });

    if (entries.length === 0) {
      alert('Please fill in at least one period for at least one day');
      return;
    }

    try {
      await api.createBulkTimetables({ timetables: entries });
      setIsBulkModalOpen(false);
      fetchTimetables();
      alert(`Successfully created ${entries.length} timetable entries!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating timetable entries');
    }
  };

  const toggleDay = (day: number) => {
    setBulkFormData(prev => {
      const isSelected = prev.selectedDays.includes(day);
      const newSelectedDays = isSelected
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day].sort();
      
      // Initialize periods for newly selected day
      if (!isSelected && !prev.dayPeriods[day]) {
        setTimeout(() => {
          initializeDayPeriods(day);
        }, 0);
      }
      
      return {
        ...prev,
        selectedDays: newSelectedDays,
      };
    });
  };

  const updateBulkPeriod = (day: number, periodIndex: number, field: string, value: any) => {
    setBulkFormData(prev => ({
      ...prev,
      dayPeriods: {
        ...prev.dayPeriods,
        [day]: (prev.dayPeriods[day] || []).map((p, i) =>
          i === periodIndex ? { ...p, [field]: value } : p
        ),
      },
    }));
  };

  const handleEdit = (timetable: any) => {
    setEditingTimetable(timetable);
    setFormData({
      class_id: timetable.class_id || '',
      teacher_id: timetable.teacher_id || '',
      day_of_week: String(timetable.day_of_week),
      period_number: String(timetable.period_number),
      subject: timetable.subject || '',
      start_time: timetable.start_time || '',
      end_time: timetable.end_time || '',
      room: timetable.room || '',
      is_break: timetable.is_break === 1,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        await api.deleteTimetable(id);
        fetchTimetables();
      } catch (error) {
        console.error('Error deleting timetable:', error);
        alert('Error deleting timetable');
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timetableByDay: Record<number, any[]> = {};
    
    timetables.forEach(tt => {
      if (!timetableByDay[tt.day_of_week]) {
        timetableByDay[tt.day_of_week] = [];
      }
      timetableByDay[tt.day_of_week].push(tt);
    });

    let title = '';
    if (viewMode === 'class') {
      const classData = classes.find(c => c.id === Number(selectedClass));
      title = `Class Timetable - ${classData?.class_name || 'All Classes'}`;
    } else {
      const teacherData = teachers.find(t => t.id === Number(selectedTeacher));
      title = `Teacher Schedule - ${teacherData?.name || 'All Teachers'}`;
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #3b82f6; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .break { background-color: #fef3c7; }
          .off-period { background-color: #e5e7eb; color: #6b7280; font-style: italic; }
          .lesson { background-color: #dbeafe; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Period</th>
              <th>${viewMode === 'teacher' ? 'Class/Subject' : 'Subject'}</th>
              <th>Time</th>
              <th>Room</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Get all periods (1-8 typically)
    const allPeriods = Array.from({ length: 8 }, (_, i) => i + 1);

    daysOfWeek.forEach((day, dayIndex) => {
      const dayTimetables = timetableByDay[dayIndex] || [];
      const periodsMap = new Map(dayTimetables.map(tt => [tt.period_number, tt]));
      
      allPeriods.forEach((periodNum, periodIdx) => {
        const tt = periodsMap.get(periodNum);
        if (tt) {
          const isBreak = tt.is_break === 1;
          const className = isBreak ? 'break' : 'lesson';
          html += `
            <tr class="${className}">
              ${periodIdx === 0 ? `<td rowspan="${allPeriods.length}">${day}</td>` : ''}
              <td>${periodNum}</td>
              <td>${tt.subject || (isBreak ? 'Break' : viewMode === 'teacher' ? tt.class_name || '-' : '-')}</td>
              <td>${tt.start_time || ''} - ${tt.end_time || ''}</td>
              <td>${tt.room || '-'}</td>
              <td>${isBreak ? 'Break' : 'Lesson'}</td>
            </tr>
          `;
        } else {
          // Off period for teacher
          if (viewMode === 'teacher') {
            html += `
              <tr class="off-period">
                ${periodIdx === 0 ? `<td rowspan="${allPeriods.length}">${day}</td>` : ''}
                <td>${periodNum}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>Off Period</td>
              </tr>
            `;
          }
        }
      });
    });

    html += `
          </tbody>
        </table>
        <p style="text-align: center; color: #6b7280; margin-top: 30px;">
          Generated on ${new Date().toLocaleDateString()}
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTimetable) {
        await api.updateTimetable(editingTimetable.id, formData);
      } else {
        await api.createTimetable(formData);
      }
      setIsModalOpen(false);
      fetchTimetables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving timetable');
    }
  };

  const columns = [
    { key: 'day_of_week', label: 'Day', render: (value: number) => days[value]?.label || 'Unknown' },
    { key: 'period_number', label: 'Period' },
    {
      key: viewMode === 'teacher' ? 'class_name' : 'subject',
      label: viewMode === 'teacher' ? 'Class/Subject' : 'Subject',
      render: (_: any, row: any) => {
        if (viewMode === 'teacher') {
          return row.class_name ? `${row.class_name} - ${row.subject || '-'}` : row.subject || '-';
        }
        return row.subject || '-';
      },
    },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
    { key: 'room', label: 'Room' },
    {
      key: 'is_break',
      label: 'Status',
      render: (value: number, _row: any) => {
        if (value === 1) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Break</span>;
        if (viewMode === 'teacher') return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Lesson</span>;
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Lesson</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timetables & Schedules</h1>
          <p className="text-gray-600 mt-2">Manage class timetables and teacher daily schedules</p>
        </div>
        <div className="flex space-x-3">
          {(selectedClass || selectedTeacher) && (
            <Button variant="secondary" onClick={handlePrint}>
              <Printer size={20} className="mr-2" />
              Print {viewMode === 'teacher' ? 'Schedule' : 'Timetable'}
            </Button>
          )}
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={handleBulkCreate}>
              <Plus size={20} className="mr-2" />
              Bulk Add Entries
            </Button>
            <Button onClick={handleCreate}>
              <Plus size={20} className="mr-2" />
              Add Single Entry
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setViewMode('class');
                  setSelectedTeacher('');
                }}
                className={`px-4 py-2 rounded ${
                  viewMode === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Class Timetables
              </button>
              <button
                onClick={() => {
                  setViewMode('teacher');
                  setSelectedClass('');
                }}
                className={`px-4 py-2 rounded ${
                  viewMode === 'teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Teacher Schedules
              </button>
            </div>
          </div>
          {viewMode === 'class' ? (
            <Select
              label="Filter by Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[{ value: '', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.class_name }))]}
            />
          ) : (
            <Select
              label="Filter by Teacher"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              options={[{ value: '', label: 'All Teachers' }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]}
            />
          )}
        </div>
      </Card>

      <Table columns={columns} data={timetables} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTimetable ? 'Edit Timetable' : 'Add Timetable Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            value={formData.class_id ? 'class' : formData.teacher_id ? 'teacher' : ''}
            onChange={(e) => {
              if (e.target.value === 'class') {
                setFormData({ ...formData, class_id: selectedClass || '', teacher_id: '' });
              } else {
                setFormData({ ...formData, teacher_id: selectedTeacher || '', class_id: '' });
              }
            }}
            options={[
              { value: 'class', label: 'Class Timetable' },
              { value: 'teacher', label: 'Teacher Schedule' },
            ]}
            required
          />
          {formData.class_id || (!formData.teacher_id && !formData.class_id) ? (
            <Select
              label="Class"
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value, teacher_id: '' })}
              options={[{ value: '', label: 'Select Class' }, ...classes.map((c) => ({ value: c.id, label: c.class_name }))]}
              required={!formData.teacher_id}
            />
          ) : null}
          {formData.teacher_id || (!formData.class_id && !formData.teacher_id) ? (
            <Select
              label="Teacher"
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value, class_id: '' })}
              options={[{ value: '', label: 'Select Teacher' }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]}
              required={!formData.class_id}
            />
          ) : null}
          <Select
            label="Day of Week"
            value={formData.day_of_week}
            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
            options={days}
            required
          />
          <Input
            label="Period Number"
            type="number"
            value={formData.period_number}
            onChange={(e) => setFormData({ ...formData, period_number: e.target.value })}
            required
            min="1"
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g., Mathematics, English"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
          <Input
            label="Room"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder="e.g., Room 101"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_break"
              checked={formData.is_break}
              onChange={(e) => setFormData({ ...formData, is_break: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_break" className="text-sm text-gray-700">
              This is a break period
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Entry Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Add Timetable Entries"
        size="xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {viewMode === 'class' ? (
              <Select
                label="Class"
                value={bulkFormData.class_id}
                onChange={(e) => {
                  setBulkFormData({ ...bulkFormData, class_id: e.target.value, teacher_id: '' });
                }}
                options={[{ value: '', label: 'Select Class' }, ...classes.map((c) => ({ value: c.id, label: c.class_name }))]}
                required
              />
            ) : (
              <Select
                label="Teacher"
                value={bulkFormData.teacher_id}
                onChange={(e) => {
                  setBulkFormData({ ...bulkFormData, teacher_id: e.target.value, class_id: '' });
                }}
                options={[{ value: '', label: 'Select Teacher' }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(Number(day.value))}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    bulkFormData.selectedDays.includes(Number(day.value))
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {bulkFormData.selectedDays.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Selected: {bulkFormData.selectedDays.map(d => days[d].label).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Period Details (Fill separately for each day)
            </label>
            {bulkFormData.selectedDays.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                Select days above to start filling in period details
              </div>
            ) : (
              <div className="space-y-6">
                {bulkFormData.selectedDays.map((dayNum) => {
                  const dayLabel = days[dayNum]?.label || 'Unknown';
                  const periods = bulkFormData.dayPeriods[dayNum] || Array.from({ length: 8 }, (_, i) => ({
                    period_number: i + 1,
                    subject: '',
                    start_time: '',
                    end_time: '',
                    room: '',
                    is_break: false,
                  }));

                  // Initialize if not exists
                  if (!bulkFormData.dayPeriods[dayNum]) {
                    setTimeout(() => initializeDayPeriods(dayNum), 0);
                  }

                  return (
                    <div key={dayNum} className="border rounded-lg overflow-hidden">
                      <div className="bg-blue-50 px-4 py-2 border-b">
                        <h3 className="font-semibold text-blue-900">{dayLabel}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {viewMode === 'teacher' ? 'Class/Subject' : 'Subject'}
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {viewMode === 'teacher' ? 'Off Period' : 'Break'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {periods.map((period, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {period.period_number}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={period.subject}
                                    onChange={(e) => updateBulkPeriod(dayNum, index, 'subject', e.target.value)}
                                    placeholder={viewMode === 'teacher' ? 'Class/Subject (e.g., Grade 5A - Math)' : 'Subject name'}
                                    disabled={period.is_break}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="time"
                                    value={period.start_time}
                                    onChange={(e) => updateBulkPeriod(dayNum, index, 'start_time', e.target.value)}
                                    disabled={period.is_break}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="time"
                                    value={period.end_time}
                                    onChange={(e) => updateBulkPeriod(dayNum, index, 'end_time', e.target.value)}
                                    disabled={period.is_break}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={period.room}
                                    onChange={(e) => updateBulkPeriod(dayNum, index, 'room', e.target.value)}
                                    placeholder="Room"
                                    disabled={period.is_break}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={period.is_break}
                                    onChange={(e) => {
                                      updateBulkPeriod(dayNum, index, 'is_break', e.target.checked);
                                      if (e.target.checked) {
                                        updateBulkPeriod(dayNum, index, 'subject', '');
                                        updateBulkPeriod(dayNum, index, 'start_time', '');
                                        updateBulkPeriod(dayNum, index, 'end_time', '');
                                        updateBulkPeriod(dayNum, index, 'room', '');
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {viewMode === 'teacher' 
                ? "Tip: Each day has its own period table. Fill in different lessons/classes for each day. Leave periods empty for off periods, or check 'Off Period' to mark them."
                : "Tip: Each day has its own period table. Fill in different lessons for each day as needed."}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create {bulkFormData.selectedDays.reduce((total, day) => {
                const periods = bulkFormData.dayPeriods[day] || [];
                return total + periods.filter(p => p.subject || p.is_break).length;
              }, 0)} Entries
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Timetables;

