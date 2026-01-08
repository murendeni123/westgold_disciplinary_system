import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import { Heart, Activity } from 'lucide-react';
import Table from '../../components/Table';
import Select from '../../components/Select';

const ModernInterventions: React.FC = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
    type: '',
  });

  useEffect(() => {
    fetchInterventions();
  }, [filters, user]);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (user?.children && user.children.length > 0) {
        if (filters.student_id) {
          params.student_id = filters.student_id;
        }
      } else {
        setInterventions([]);
        setLoading(false);
        return;
      }

      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await api.getInterventions(params);
      
      const childIds = user?.children?.map((child: any) => child.id) || [];
      const filtered = response.data.filter((intervention: any) => {
        return childIds.includes(intervention.student_id);
      });
      
      setInterventions(filtered);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'student_name', label: 'Child' },
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        intervention.status === 'active' ? 'bg-green-100 text-green-800' :
        intervention.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {intervention.status}
      </span>
    ),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interventions</h1>
        <p className="text-gray-600 mt-2">View support interventions for your children</p>
      </div>

      {user?.children && user.children.length > 0 ? (
        <>
          {/* Filters */}
          <Card title="Filters">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Child"
                value={filters.student_id}
                onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
              >
                <option value="">All Children</option>
                {user.children.map((child: any) => (
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select
                label="Type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                {Array.from(new Set(interventions.map(i => i.type))).map((type: string) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Table */}
          {loading ? (
            <Card>
              <div className="flex justify-center items-center h-64">Loading...</div>
            </Card>
          ) : interventions.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <Heart className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Interventions Found</h3>
                <p className="text-gray-600">No interventions found for your children.</p>
              </div>
            </Card>
          ) : (
            <Card title="Intervention Records">
              <Table columns={columns} data={tableData} />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-16">
            <Activity className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Children Linked</h3>
            <p className="text-gray-600 mb-4">You don't have any children linked to your account.</p>
            <p className="text-sm text-gray-500">Use the "Link Child" option to connect your child's account.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModernInterventions;

