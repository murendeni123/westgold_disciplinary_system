import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import { AlertTriangle, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ViewDetentions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const _navigate = useNavigate();
  const { profile } = useAuth();
  const { students } = useParentStudents();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [selectedDetention, setSelectedDetention] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild || students?.[0]) {
      fetchDetentions();
    }
  }, [selectedChild, students]);

  const fetchDetentions = async () => {
    try {
      const studentId = selectedChild || students?.[0]?.id;
      if (!studentId) return;

      // Get all detentions and filter by student
      const response = await api.getDetentions({});
      const allDetentions = response.data;

      // Get detention assignments for this student
      const studentDetentions: any[] = [];
      for (const detention of allDetentions) {
        try {
          const detResponse = await api.getDetention(detention.id);
          const assignments = detResponse.data.assignments || [];
          const studentAssignment = assignments.find(
            (a: any) => a.student_id === Number(studentId)
          );
          if (studentAssignment) {
            studentDetentions.push({
              ...detention,
              assignment: studentAssignment,
              attendance_status: studentAssignment.status || 'pending',
            });
          }
        } catch (error) {
          console.error(`Error fetching detention ${detention.id}:`, error);
        }
      }

      setDetentions(studentDetentions);

      // Calculate summary
      const total = studentDetentions.length;
      const present = studentDetentions.filter((d: any) => d.attendance_status === 'present').length;
      const absent = studentDetentions.filter((d: any) => d.attendance_status === 'absent').length;
      const late = studentDetentions.filter((d: any) => d.attendance_status === 'late').length;
      const pending = studentDetentions.filter((d: any) => !d.attendance_status || d.attendance_status === 'pending').length;
      const completed = studentDetentions.filter((d: any) => d.status === 'completed').length;
      const scheduled = studentDetentions.filter((d: any) => d.status === 'scheduled').length;

      setSummary({
        total,
        present,
        absent,
        late,
        pending,
        completed,
        scheduled,
      });

      // Prepare monthly chart data
      const monthlyData: Record<string, number> = {};
      studentDetentions.forEach((detention: any) => {
        const month = new Date(detention.detention_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const chartDataArray = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error fetching detentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (detention: any) => {
    try {
      const response = await api.getDetention(detention.id);
      setSelectedDetention({ ...detention, ...response.data });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching detention details:', error);
    }
  };

  const columns = [
    {
      key: 'detention_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'detention_time',
      label: 'Time',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value: number) => `${value || 60} minutes`,
    },
    {
      key: 'attendance_status',
      label: 'Attendance',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'present'
              ? 'bg-green-100 text-green-800'
              : value === 'absent'
              ? 'bg-red-100 text-red-800'
              : value === 'late'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? value.toUpperCase() : 'PENDING'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'assignment',
      label: 'Reason',
      render: (value: any) => value?.reason || 'N/A',
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Detentions</h1>
        <p className="text-gray-600 mt-2">View your child's detention assignments</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Detentions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.scheduled}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.present}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {students && students.length > 1 && (
        <Card title="Filters">
          <Select
            label="Child"
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            options={students.map((c: any) => ({
              value: c.id,
              label: `${c.first_name} ${c.last_name}`,
            }))}
          />
        </Card>
      )}

      {/* Detention Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Detention Frequency Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ef4444" name="Number of Detentions" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {summary && (
            <Card title="Attendance at Detentions">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: summary.present || 0 },
                      { name: 'Absent', value: summary.absent || 0 },
                      { name: 'Late', value: summary.late || 0 },
                      { name: 'Pending', value: summary.pending || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#9ca3af" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {detentions.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No detention assignments found</p>
          </div>
        </Card>
      ) : (
        <Card title="Detention Records">
          <Table
            columns={columns}
            data={detentions}
            onRowClick={handleViewDetails}
          />
        </Card>
      )}

      {/* Detention Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDetention(null);
        }}
        title={`Detention Details - ${selectedDetention ? new Date(selectedDetention.detention_date).toLocaleDateString() : ''}`}
      >
        {selectedDetention && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {new Date(selectedDetention.detention_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">{selectedDetention.detention_time || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{selectedDetention.duration || 60} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{selectedDetention.status}</p>
              </div>
              {selectedDetention.location && (
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{selectedDetention.location}</p>
                </div>
              )}
              {selectedDetention.assignment && (
                <div>
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="font-semibold capitalize">
                    {selectedDetention.assignment.status || 'Pending'}
                  </p>
                </div>
              )}
            </div>

            {selectedDetention.assignment?.reason && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Reason</p>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedDetention.assignment.reason}</p>
              </div>
            )}

            {selectedDetention.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedDetention.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewDetentions;


