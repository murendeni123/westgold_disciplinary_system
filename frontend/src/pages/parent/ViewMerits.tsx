import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Award, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const ViewMerits: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [merits, setMerits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild || user?.children?.[0]) {
      fetchMerits();
    }
  }, [selectedChild, startDate, endDate, user]);

  const fetchMerits = async () => {
    try {
      const studentId = selectedChild || user?.children?.[0]?.id;
      if (!studentId) return;

      const response = await api.getMerits({
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
      });
      setMerits(response.data);

      // Calculate summary
      const totalPoints = response.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
      const totalMerits = response.data.length;
      const byType = response.data.reduce((acc: any, m: any) => {
        acc[m.merit_type] = (acc[m.merit_type] || 0) + 1;
        return acc;
      }, {});

      setSummary({
        totalPoints,
        totalMerits,
        byType,
      });

      // Prepare monthly chart data
      const monthlyData: Record<string, { merits: number; points: number }> = {};
      response.data.forEach((merit: any) => {
        const month = new Date(merit.merit_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { merits: 0, points: 0 };
        }
        monthlyData[month].merits++;
        monthlyData[month].points += merit.points || 0;
      });

      const chartDataArray = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setChartData(chartDataArray);

      // Prepare type breakdown data
      const typeDataArray = Object.entries(byType).map(([type, count]) => ({
        name: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
      }));
      setTypeData(typeDataArray);
    } catch (error) {
      console.error('Error fetching merits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const studentId = selectedChild || user?.children?.[0]?.id;
      if (!studentId) return;
      await api.exportStudentRecord(Number(studentId), 'pdf');
      alert('Export started! Check your downloads.');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting merits');
    }
  };

  const columns = [
    {
      key: 'merit_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'merit_type',
      label: 'Type',
      render: (value: string) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (value: number) => (
        <span className="font-semibold text-green-600">{value || 0}</span>
      ),
    },
    {
      key: 'teacher_name',
      label: 'Awarded By',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => value || 'No description',
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Merits</h1>
        <p className="text-gray-600 mt-2">View your child's positive achievements and rewards</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Merits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalMerits}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalPoints}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Points</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary.totalMerits > 0
                    ? (summary.totalPoints / summary.totalMerits).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {user?.children && user.children.length > 1 && (
            <Select
              label="Child"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              options={user.children.map((c: any) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}`,
              }))}
            />
          )}
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={handleExport} variant="secondary" className="w-full">
              <Download size={16} className="mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Merit Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Merit Trends Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="merits" stroke="#10b981" name="Number of Merits" strokeWidth={2} />
                <Line type="monotone" dataKey="points" stroke="#3b82f6" name="Total Points" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {typeData.length > 0 && (
            <Card title="Merit Type Breakdown">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {merits.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <Award className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No merits found for the selected period</p>
          </div>
        </Card>
      ) : (
        <Card title="Merit Records">
          <Table columns={columns} data={merits} />
        </Card>
      )}
    </div>
  );
};

export default ViewMerits;


