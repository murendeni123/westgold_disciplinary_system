import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Filter, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const TeacherInterventions: React.FC = () => {
  const { ToastContainer, success, error } = useToast();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
    type: '',
  });

  useEffect(() => {
    fetchMyClasses();
    fetchInterventions();
  }, []);

  useEffect(() => {
    fetchInterventions();
  }, [filters]);

  const [students, setStudents] = useState<any[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [newIntervention, setNewIntervention] = useState({
    student_id: '',
    type: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    notes: '',
  });

  const fetchMyClasses = async () => {
    try {
      const response = await api.getClasses();
      setMyClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchInterventionTypes = async () => {
    try {
      const response = await api.getInterventionTypes();
      setInterventionTypes(response.data || []);
    } catch (err) {
      console.error('Error fetching intervention types:', err);
    }
  };

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.student_id) params.student_id = filters.student_id;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await api.getInterventions(params);
      
      // Get all students from teacher's classes
      const allStudentIds = await getAllStudentIdsFromMyClasses();
      
      // Filter to only show interventions for students in teacher's classes
      const filtered = response.data.filter((intervention: any) => {
        return allStudentIds.includes(intervention.student_id);
      });
      
      setInterventions(filtered);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllStudentIdsFromMyClasses = async () => {
    const studentIds: number[] = [];
    try {
      for (const classItem of myClasses) {
        const classResponse = await api.getClass(classItem.id);
        if (classResponse.data.students) {
          classResponse.data.students.forEach((student: any) => {
            if (!studentIds.includes(student.id)) {
              studentIds.push(student.id);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching students from classes:', error);
    }
    return studentIds;
  };

  const getStudentsFromMyClasses = async () => {
    const students: any[] = [];
    try {
      for (const classItem of myClasses) {
        const classResponse = await api.getClass(classItem.id);
        if (classResponse.data.students) {
          classResponse.data.students.forEach((student: any) => {
            if (!students.find(s => s.id === student.id)) {
              students.push(student);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching students from classes:', error);
    }
    return students;
  };

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'type', label: 'Type' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_by_name', label: 'Assigned By' },
  ];

  const tableData = interventions.map((intervention) => ({
    ...intervention,
    start_date: intervention.start_date ? new Date(intervention.start_date).toLocaleDateString() : 'N/A',
    end_date: intervention.end_date ? new Date(intervention.end_date).toLocaleDateString() : 'Ongoing',
    status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        intervention.status === 'active' ? 'bg-green-100 text-green-800' :
        intervention.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {intervention.status}
      </span>
    ),
  }));

  useEffect(() => {
    const loadStudents = async () => {
      const studentList = await getStudentsFromMyClasses();
      setStudents(studentList);
    };
    if (myClasses.length > 0) {
      loadStudents();
    }
  }, [myClasses]);

  useEffect(() => {
    fetchInterventionTypes();
  }, []);

  const handleAssignIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntervention.student_id || !newIntervention.type) {
      error('Please select a student and intervention type');
      return;
    }

    try {
      setAssigning(true);
      await api.createIntervention({
        student_id: Number(newIntervention.student_id),
        type: newIntervention.type,
        description: newIntervention.description || null,
        start_date: newIntervention.start_date || null,
        end_date: newIntervention.end_date || null,
        notes: newIntervention.notes || null,
      });
      success('Intervention assigned successfully');
      setNewIntervention({
        student_id: '',
        type: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: '',
        notes: '',
      });
      fetchInterventions();
    } catch (err: any) {
      console.error('Error assigning intervention:', err);
      error(err.response?.data?.error || 'Error assigning intervention');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Interventions
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View interventions for students in your classes</p>
      </motion.div>

      {/* Assign Intervention */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assign Intervention</h2>
          <Sparkles className="text-emerald-600" size={24} />
        </div>
        <form onSubmit={handleAssignIntervention} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Student"
            value={newIntervention.student_id}
            onChange={(e) => setNewIntervention({ ...newIntervention, student_id: e.target.value })}
            className="rounded-xl"
            required
          >
            <option value="">Select a student</option>
            {students.map((student: any) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </Select>
          <Select
            label="Intervention Type"
            value={newIntervention.type}
            onChange={(e) => setNewIntervention({ ...newIntervention, type: e.target.value })}
            className="rounded-xl"
            required
          >
            <option value="">Select a type</option>
            {interventionTypes.map((type: any) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </Select>
          <Input
            label="Start Date"
            type="date"
            value={newIntervention.start_date}
            onChange={(e) => setNewIntervention({ ...newIntervention, start_date: e.target.value })}
            className="rounded-xl"
          />
          <Input
            label="End Date (optional)"
            type="date"
            value={newIntervention.end_date}
            onChange={(e) => setNewIntervention({ ...newIntervention, end_date: e.target.value })}
            className="rounded-xl"
          />
          <div className="md:col-span-2">
            <Textarea
              label="Description (optional)"
              value={newIntervention.description}
              onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
              rows={3}
              className="rounded-xl"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Notes (private)"
              value={newIntervention.notes}
              onChange={(e) => setNewIntervention({ ...newIntervention, notes: e.target.value })}
              rows={3}
              className="rounded-xl"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button
              type="submit"
              disabled={assigning}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl"
            >
              {assigning ? 'Assigning...' : 'Assign Intervention'}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
          <Filter className="text-emerald-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Student"
            value={filters.student_id}
            onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
            className="rounded-xl"
          >
            <option value="">All Students</option>
            {students.map((student: any) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-xl"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="rounded-xl"
          >
            <option value="">All Types</option>
            {Array.from(new Set(interventions.map(i => i.type))).map((type: string) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      {interventions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <Sparkles className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500 text-lg">No interventions found for your students.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Intervention Records ({interventions.length})</h2>
            <Sparkles className="text-emerald-600" size={24} />
          </div>
          <Table columns={columns} data={tableData} />
        </motion.div>
      )}
    </div>
  );
};

export default TeacherInterventions;

