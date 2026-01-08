import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';

const AttendanceOverview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedChild || user?.children?.[0]) {
      fetchAttendance();
    }
  }, [selectedChild, startDate, endDate, user]);

  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const fetchAttendance = async () => {
    try {
      const studentId = selectedChild || user?.children?.[0]?.id;
      if (!studentId) return;

      const response = await api.getAttendance({
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
      });
      setAttendance(response.data);

      // Calculate summary statistics
      const total = response.data.length;
      const present = response.data.filter((a: any) => a.status === 'present').length;
      const absent = response.data.filter((a: any) => a.status === 'absent').length;
      const late = response.data.filter((a: any) => a.status === 'late').length;
      const excused = response.data.filter((a: any) => a.status === 'excused').length;
      const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

      setSummary({
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate: parseFloat(attendanceRate),
      });

      // Prepare daily chart data
      const dailyData: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
      response.data.forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) {
          dailyData[date] = { present: 0, absent: 0, late: 0, excused: 0 };
        }
        if (record.status === 'present') dailyData[date].present++;
        else if (record.status === 'absent') dailyData[date].absent++;
        else if (record.status === 'late') dailyData[date].late++;
        else if (record.status === 'excused') dailyData[date].excused++;
      });

      const chartDataArray = Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days
      setChartData(chartDataArray);

      // Prepare monthly data
      const monthlyDataMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
      response.data.forEach((record: any) => {
        const month = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyDataMap[month]) {
          monthlyDataMap[month] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        monthlyDataMap[month].total++;
        if (record.status === 'present') monthlyDataMap[month].present++;
        else if (record.status === 'absent') monthlyDataMap[month].absent++;
        else if (record.status === 'late') monthlyDataMap[month].late++;
      });

      const monthlyArray = Object.entries(monthlyDataMap)
        .map(([month, data]) => ({
          month,
          ...data,
          rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setMonthlyData(monthlyArray);
    } catch (error) {
      console.error('Error fetching attendance:', error);
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
      alert('Error exporting attendance records');
    }
  };

  const columns = [
    { key: 'attendance_date', label: 'Date' },
    { key: 'class_name', label: 'Class' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === 'present'
              ? 'bg-green-100 text-green-800'
              : value === 'absent'
              ? 'bg-red-100 text-red-800'
              : value === 'late'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    { key: 'period', label: 'Period' },
    { key: 'notes', label: 'Notes' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Overview</h1>
        <p className="text-gray-600 mt-2">View your child's attendance records</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.attendanceRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-green-600 text-2xl">✓</span>
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

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.absent}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-red-600 text-2xl">✗</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.late}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="text-yellow-600 text-2xl">⏰</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-blue-600 text-2xl">📅</span>
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

      {/* Attendance Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Daily Attendance Trends (Last 14 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#10b981" name="Present" />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
                <Bar dataKey="excused" stackId="a" fill="#3b82f6" name="Excused" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Attendance Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: summary?.present || 0 },
                    { name: 'Absent', value: summary?.absent || 0 },
                    { name: 'Late', value: summary?.late || 0 },
                    { name: 'Excused', value: summary?.excused || 0 },
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
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Monthly Attendance Comparison */}
      {monthlyData.length > 0 && (
        <Card title="Monthly Attendance Rate">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" name="Attendance Rate %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card title="Attendance Records">
        <Table
          columns={columns}
          data={attendance}
          onRowClick={(row) => navigate(`/parent/attendance/${row.attendance_date}`)}
        />
      </Card>
    </div>
  );
};

const ParentAttendanceOverview = AttendanceOverview;
export default ParentAttendanceOverview;

