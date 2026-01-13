import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { Filter } from 'lucide-react';

const ParentConsequences: React.FC = () => {
  const { profile } = useAuth();
  const { students } = useParentStudents();
  const [consequences, setConsequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
  });

  useEffect(() => {
    fetchConsequences();
  }, [filters, students]);

  const fetchConsequences = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      // Filter by children's student IDs
      if (students && students.length > 0) {
        if (filters.student_id) {
          params.student_id = filters.student_id;
        }
      } else {
        // No children linked, show empty
        setConsequences([]);
        setLoading(false);
        return;
      }

      if (filters.status) params.status = filters.status;

      const response = await api.getConsequences(params);
      
      // Filter to only show consequences for parent's children
      const childIds = students?.map((child: any) => child.id) || [];
      const filtered = response.data.filter((consequence: any) => {
        return childIds.includes(consequence.student_id);
      });
      
      setConsequences(filtered);
    } catch (error) {
      console.error('Error fetching consequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'student_name', label: 'Child' },
    { key: 'consequence_name', label: 'Consequence' },
    { key: 'assigned_date', label: 'Assigned Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_by_name', label: 'Assigned By' },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consequences</h1>
        <p className="text-gray-600 mt-2">View consequences for your children</p>
      </div>

      {students && students.length > 0 ? (
        <>
          <Card>
            <div className="flex items-center space-x-2 mb-4">
              <Filter size={20} className="text-gray-500" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Child"
                value={filters.student_id}
                onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
              >
                <option value="">All Children</option>
                {students.map((child: any) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </Select>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : consequences.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500">No consequences found for your children.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <Table columns={columns} data={tableData} />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You don't have any children linked to your account.</p>
            <p className="text-sm text-gray-400">Use the "Link Child" option to connect your child's account.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ParentConsequences;

