import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import ModernFilter from '../../components/ModernFilter';
import { motion } from 'framer-motion';
import { Filter, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const TeacherInterventions: React.FC = () => {
  const { ToastContainer, success, error } = useToast();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
    type: '',
  });

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

  const fetchInterventionTypes = async () => {
    try {
      const response = await api.getInterventionTypes();
      setInterventionTypes(response.data || []);
    } catch (err) {
      console.error('Error fetching intervention types:', err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchInterventionTypes(),
        fetchAllStudents(),
        fetchInterventions(),
      ]);
    };
    init();
  }, []);

  useEffect(() => {
    fetchInterventions();
  }, [filters]);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.student_id) params.student_id = filters.student_id;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await api.getInterventions(params);
      // Show all interventions for students in the same school (backend handles school_id filtering)
      setInterventions(response.data || []);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
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
          <SearchableSelect
            label="Student"
            value={newIntervention.student_id}
            onChange={(value) => setNewIntervention({ ...newIntervention, student_id: value.toString() })}
            options={students.map((student: any) => ({
              value: student.id.toString(),
              label: `${student.first_name} ${student.last_name}`,
            }))}
            placeholder="Search and select a student..."
            required
            showClear={!!newIntervention.student_id}
            onClear={() => setNewIntervention({ ...newIntervention, student_id: '' })}
          />
          <SearchableSelect
            label="Intervention Type"
            value={newIntervention.type}
            onChange={(value) => setNewIntervention({ ...newIntervention, type: value.toString() })}
            options={interventionTypes.map((type: any) => ({
              value: type.name,
              label: type.name,
            }))}
            placeholder="Search and select intervention type..."
            required
            showClear={!!newIntervention.type}
            onClear={() => setNewIntervention({ ...newIntervention, type: '' })}
          />
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

      {/* Modern Filters */}
      <ModernFilter
        fields={[
          {
            type: 'searchable-select',
            name: 'student_id',
            label: 'Student',
            placeholder: 'Search and select a student...',
            options: students.map((student: any) => ({
              value: student.id.toString(),
              label: `${student.first_name} ${student.last_name}`,
            })),
          },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
          },
          {
            type: 'select',
            name: 'type',
            label: 'Type',
            options: Array.from(new Set(interventions.map(i => i.type))).map((type: string) => ({
              value: type,
              label: type,
            })),
          },
        ]}
        values={filters}
        onChange={(name, value) => setFilters({ ...filters, [name]: value })}
        onClear={() => setFilters({ student_id: '', status: '', type: '' })}
      />

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

