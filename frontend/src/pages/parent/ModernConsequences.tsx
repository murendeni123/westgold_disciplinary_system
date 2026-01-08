import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import { AlertCircle, Scale, Eye, X, CheckCircle } from 'lucide-react';
import Table from '../../components/Table';
import Select from '../../components/Select';

const ModernConsequences: React.FC = () => {
  const { user } = useAuth();
  const [consequences, setConsequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsequence, setSelectedConsequence] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAcknowledgeModalOpen, setIsAcknowledgeModalOpen] = useState(false);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');
  const [filters, setFilters] = useState({
    student_id: '',
    status: '',
  });

  useEffect(() => {
    fetchConsequences();
  }, [filters, user]);

  const fetchConsequences = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (user?.children && user.children.length > 0) {
        if (filters.student_id) {
          params.student_id = filters.student_id;
        }
      } else {
        setConsequences([]);
        setLoading(false);
        return;
      }

      if (filters.status) params.status = filters.status;

      const response = await api.getConsequences(params);
      
      const childIds = user?.children?.map((child: any) => child.id) || [];
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

  const handleViewDetails = (consequence: any) => {
    setSelectedConsequence(consequence);
    setIsDetailsModalOpen(true);
  };

  const handleAcknowledge = () => {
    if (!selectedConsequence) return;
    setAcknowledgeNotes('');
    setIsAcknowledgeModalOpen(true);
  };

  const handleSubmitAcknowledge = async () => {
    if (!selectedConsequence) return;
    
    try {
      await api.acknowledgeConsequence(selectedConsequence.id, { parent_notes: acknowledgeNotes });
      alert('Consequence acknowledged successfully');
      setIsAcknowledgeModalOpen(false);
      fetchConsequences();
      // Update selected consequence
      const updated = consequences.find(c => c.id === selectedConsequence.id);
      if (updated) {
        setSelectedConsequence({ ...updated, parent_acknowledged: 1, parent_notes: acknowledgeNotes });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error acknowledging consequence');
    }
  };

  const columns = [
    { key: 'student_name', label: 'Child' },
    { key: 'consequence_name', label: 'Consequence' },
    { key: 'assigned_date', label: 'Assigned Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_by_name', label: 'Assigned By' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
        <p className="text-gray-600 mt-2">View consequences assigned to your children</p>
      </div>

      {user?.children && user.children.length > 0 ? (
        <>
          {/* Filters */}
          <Card title="Filters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </Card>

          {/* Table */}
          {loading ? (
            <Card>
              <div className="flex justify-center items-center h-64">Loading...</div>
            </Card>
          ) : consequences.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <Scale className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Consequences Found</h3>
                <p className="text-gray-600">No consequences found for your children.</p>
              </div>
            </Card>
          ) : (
            <Card title="Consequence Records">
              <Table columns={columns} data={tableData} />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-16">
            <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Children Linked</h3>
            <p className="text-gray-600 mb-4">You don't have any children linked to your account.</p>
            <p className="text-sm text-gray-500">Use the "Link Child" option to connect your child's account.</p>
          </div>
        </Card>
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
                    <label className="block text-sm font-medium text-gray-700">Child</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Acknowledged</label>
                    {selectedConsequence.parent_acknowledged ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          Acknowledged
                        </span>
                        {selectedConsequence.parent_acknowledged_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(selectedConsequence.parent_acknowledged_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="mt-1 inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Not Acknowledged
                      </span>
                    )}
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

                {selectedConsequence.parent_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Notes</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {selectedConsequence.parent_notes}
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

                {!selectedConsequence.parent_acknowledged && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleAcknowledge}>
                      <CheckCircle size={16} className="mr-2" />
                      Acknowledge Consequence
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      {isAcknowledgeModalOpen && selectedConsequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acknowledge Consequence</h2>
              <p className="text-gray-600 mb-4">
                Please acknowledge that you have been notified about this consequence for {selectedConsequence.student_name}.
              </p>
              <Textarea
                label="Your Notes (Optional)"
                value={acknowledgeNotes}
                onChange={(e) => setAcknowledgeNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes or comments..."
              />
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAcknowledgeModalOpen(false);
                    setAcknowledgeNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitAcknowledge}>
                  <CheckCircle size={16} className="mr-2" />
                  Acknowledge
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernConsequences;

