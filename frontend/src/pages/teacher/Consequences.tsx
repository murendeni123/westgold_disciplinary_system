import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Select from '../../components/Select';
import { motion } from 'framer-motion';
import { Filter, Eye, X, Scale } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const TeacherConsequences: React.FC = () => {
  const { ToastContainer } = useToast();
  const [consequences, setConsequences] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[] | null>(null);
  const [consequenceTypes, setConsequenceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsequence, setSelectedConsequence] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
    consequence_type: '',
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchMyClasses(),
        fetchConsequenceTypes()
      ]);
    };
    loadData();
  }, []);

  useEffect(() => {
    // Only fetch consequences after classes are loaded (even if empty)
    // This prevents infinite loops and ensures proper data flow
    if (myClasses !== null) {
      fetchConsequences();
    }
  }, [filters, myClasses]);

  const fetchMyClasses = async () => {
    try {
      const response = await api.getClasses();
      setMyClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setMyClasses([]); // Set to empty array on error
    }
  };

  const fetchConsequenceTypes = async () => {
    try {
      const response = await api.getConsequenceDefinitions();
      // Filter to only show active consequence types
      const activeTypes = (response.data || []).filter((type: any) => type.is_active !== 0);
      setConsequenceTypes(activeTypes);
    } catch (error) {
      console.error('Error fetching consequence types:', error);
      setConsequenceTypes([]);
    }
  };

  const fetchConsequences = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.student_id) params.student_id = filters.student_id;
      if (filters.status) params.status = filters.status;

      const response = await api.getConsequences(params);
      
      // Get all students from teacher's classes
      const allStudentIds = await getAllStudentIdsFromMyClasses();
      
      // Filter to only show consequences for students in teacher's classes
      // If teacher has no classes, show empty array
      let filtered = Array.isArray(response.data) ? response.data : [];
      if (allStudentIds.length > 0) {
        filtered = filtered.filter((consequence: any) => {
          return consequence && allStudentIds.includes(consequence.student_id);
        });
      } else {
        // If no classes, show no consequences
        filtered = [];
      }
      
      // Filter by consequence type if specified
      if (filters.consequence_type) {
        filtered = filtered.filter((consequence: any) => {
          const consequenceName = (consequence.consequence_name || '').toLowerCase();
          return consequenceName.includes(filters.consequence_type.toLowerCase());
        });
      }
      
      setConsequences(filtered);
    } catch (error) {
      console.error('Error fetching consequences:', error);
      setConsequences([]);
    } finally {
      setLoading(false);
    }
  };

  const getAllStudentIdsFromMyClasses = async () => {
    const studentIds: number[] = [];
    try {
      if (!myClasses || myClasses.length === 0) {
        return studentIds;
      }
      for (const classItem of myClasses) {
        const classResponse = await api.getClass(classItem.id);
        if (classResponse.data && classResponse.data.students) {
          classResponse.data.students.forEach((student: any) => {
            if (student && student.id && !studentIds.includes(student.id)) {
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
      if (!myClasses || myClasses.length === 0) {
        return students;
      }
      for (const classItem of myClasses) {
        const classResponse = await api.getClass(classItem.id);
        if (classResponse.data && classResponse.data.students) {
          classResponse.data.students.forEach((student: any) => {
            if (student && student.id && !students.find(s => s.id === student.id)) {
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

  const handleViewDetails = (consequence: any) => {
    setSelectedConsequence(consequence);
    setIsDetailsModalOpen(true);
  };

  const columns = [
    { key: 'student_name', label: 'Student' },
    { 
      key: 'consequence_name', 
      label: 'Consequence Type',
      render: (value: string) => value || 'Custom Consequence'
    },
    { key: 'assigned_date', label: 'Assigned Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_by_name', label: 'Assigned By' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: any, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(row);
          }}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  const tableData = consequences.map((consequence) => ({
    ...consequence,
    assigned_date: consequence.assigned_date ? new Date(consequence.assigned_date).toLocaleDateString() : 'N/A',
    due_date: consequence.due_date ? new Date(consequence.due_date).toLocaleDateString() : 'No due date',
    status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        consequence.status === 'completed' ? 'bg-green-100 text-green-800' :
        consequence.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {consequence.status}
      </span>
    ),
  }));

  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const loadStudents = async () => {
      const studentList = await getStudentsFromMyClasses();
      setStudents(studentList);
    };
    if (myClasses && myClasses.length > 0) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [myClasses]);

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
          Consequences
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View consequences for students in your classes</p>
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
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            label="Consequence Type"
            value={filters.consequence_type}
            onChange={(e) => setFilters({ ...filters, consequence_type: e.target.value })}
            className="rounded-xl"
          >
            <option value="">All Types</option>
            {consequenceTypes.map((type: any) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      {consequences.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <Scale className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500 text-lg">No consequences found for your students.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Consequence Records ({consequences.length})</h2>
            <Scale className="text-emerald-600" size={24} />
          </div>
          <Table columns={columns} data={tableData} />
        </motion.div>
      )}

      {/* Consequence Details Modal */}
      {isDetailsModalOpen && selectedConsequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Consequence Details</h2>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedConsequence(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student</label>
                    <p className="mt-1 text-gray-900">{selectedConsequence.student_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consequence</label>
                    <p className="mt-1 text-gray-900">{selectedConsequence.consequence_name || 'Custom'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <span
                      className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
                        selectedConsequence.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : selectedConsequence.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedConsequence.severity?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned By</label>
                    <p className="mt-1 text-gray-900">{selectedConsequence.assigned_by_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
                    <p className="mt-1 text-gray-900">
                      {selectedConsequence.assigned_date ? new Date(selectedConsequence.assigned_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <p className="mt-1 text-gray-900">
                      {selectedConsequence.due_date ? new Date(selectedConsequence.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`mt-1 inline-block px-2 py-1 rounded text-xs font-semibold ${
                        selectedConsequence.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedConsequence.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedConsequence.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {selectedConsequence.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedConsequence.notes}
                    </p>
                  </div>
                )}

                {selectedConsequence.incident_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Incident</label>
                    <p className="text-gray-600 text-sm">
                      This consequence is linked to a behavior incident (ID: {selectedConsequence.incident_id})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherConsequences;

