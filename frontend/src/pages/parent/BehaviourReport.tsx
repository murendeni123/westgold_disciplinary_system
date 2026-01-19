import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const BehaviourReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { students } = useParentStudents();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [chartData, setChartData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild || students?.[0]) {
      fetchIncidents();
    }
  }, [selectedChild, students]);

  const fetchIncidents = async () => {
    try {
      const studentId = selectedChild || students?.[0]?.id;
      if (!studentId) return;

      const response = await api.getIncidents({ student_id: studentId });
      setIncidents(response.data);

      // Prepare monthly chart data
      const monthlyData: Record<string, { incidents: number; points: number }> = {};
      response.data.forEach((incident: any) => {
        const month = new Date(incident.incident_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, points: 0 };
        }
        monthlyData[month].incidents++;
        monthlyData[month].points += incident.points || 0;
      });

      const chartDataArray = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setChartData(chartDataArray);

      // Prepare severity breakdown
      const severityCounts: Record<string, number> = {};
      response.data.forEach((incident: any) => {
        const severity = incident.severity || 'low';
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      });

      const severityArray = Object.entries(severityCounts).map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count,
      }));
      setSeverityData(severityArray);

      // Prepare points accumulation over time
      let cumulativePoints = 0;
      const pointsArray = response.data
        .sort((a: any, b: any) => new Date(a.incident_date).getTime() - new Date(b.incident_date).getTime())
        .map((incident: any) => {
          cumulativePoints += incident.points || 0;
          return {
            date: new Date(incident.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            points: cumulativePoints,
          };
        });
      setPointsData(pointsArray);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'incident_date', label: 'Date' },
    { key: 'incident_type', label: 'Type' },
    {
      key: 'severity',
      label: 'Severity',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'high'
              ? 'bg-red-100 text-red-800'
              : value === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'points',
      label: 'Demerit Points',
      render: (value: number) => (
        <span className="font-semibold text-red-600">{value || 0}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : value === 'approved'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Behaviour Reports</h1>
        <p className="text-gray-600 mt-2">View your child's behaviour incidents</p>
      </div>

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

      {/* Behavior Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Incident Trends Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="incidents" fill="#ef4444" name="Number of Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {severityData.length > 0 && (
            <Card title="Severity Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#10b981'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {pointsData.length > 0 && (
        <Card title="Demerit Points Accumulation">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pointsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="points" stroke="#ef4444" name="Cumulative Points" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card title="Incident Records">
        <Table
          columns={columns}
          data={incidents}
          onRowClick={(row) => navigate(`/parent/behaviour/${row.id}`)}
        />
      </Card>
    </div>
  );
};

export default BehaviourReport;

