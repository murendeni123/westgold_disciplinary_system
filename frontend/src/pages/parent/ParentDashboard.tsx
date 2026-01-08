import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import { Users, AlertTriangle, Calendar, Bell, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [behaviorData, setBehaviorData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchBehaviorData();
    fetchAttendanceData();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.getNotifications({ is_read: 'false' }),
        api.getUnreadCount(),
      ]);
      setNotifications(notifsRes.data.slice(0, 5));
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBehaviorData = async () => {
    try {
      if (!user?.children || user.children.length === 0) return;

      // Get incidents and merits for all children
      const allIncidents: any[] = [];
      const allMerits: any[] = [];

      for (const child of user.children) {
        try {
          const [incidentsRes, meritsRes] = await Promise.all([
            api.getIncidents({ student_id: child.id }),
            api.getMerits({ student_id: child.id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
          ]);
          allIncidents.push(...incidentsRes.data);
          allMerits.push(...meritsRes.data);
        } catch (error) {
          console.error(`Error fetching data for child ${child.id}:`, error);
        }
      }

      // Group by month
      const monthlyData: Record<string, { incidents: number; merits: number; demeritPoints: number; meritPoints: number }> = {};

      allIncidents.forEach((incident: any) => {
        const month = new Date(incident.incident_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, merits: 0, demeritPoints: 0, meritPoints: 0 };
        }
        monthlyData[month].incidents++;
        monthlyData[month].demeritPoints += incident.points || 0;
      });

      allMerits.forEach((merit: any) => {
        const month = new Date(merit.merit_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { incidents: 0, merits: 0, demeritPoints: 0, meritPoints: 0 };
        }
        monthlyData[month].merits++;
        monthlyData[month].meritPoints += merit.points || 0;
      });

      const chartData = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6); // Last 6 months

      setBehaviorData(chartData);
    } catch (error) {
      console.error('Error fetching behavior data:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      if (!user?.children || user.children.length === 0) return;

      // Get attendance for all children for last 30 days
      const allAttendance: any[] = [];
      for (const child of user.children) {
        try {
          const response = await api.getAttendance({
            student_id: child.id,
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          allAttendance.push(...response.data);
        } catch (error) {
          console.error(`Error fetching attendance for child ${child.id}:`, error);
        }
      }

      // Group by date
      const dailyData: Record<string, { present: number; absent: number; late: number; total: number }> = {};
      allAttendance.forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) {
          dailyData[date] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        dailyData[date].total++;
        if (record.status === 'present') dailyData[date].present++;
        else if (record.status === 'absent') dailyData[date].absent++;
        else if (record.status === 'late') dailyData[date].late++;
      });

      const chartData = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

      setAttendanceData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your children's progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Children</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.myChildren || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.childrenIncidents || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Merits</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.childrenMerits || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Award className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{unreadCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Bell className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      {user?.children && user.children.length > 0 && (
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/parent/children')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View Children</p>
                  <p className="text-sm text-gray-600">See all your children</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/parent/attendance')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View Attendance</p>
                  <p className="text-sm text-gray-600">Check attendance records</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/parent/merits')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View Merits</p>
                  <p className="text-sm text-gray-600">See positive achievements</p>
                </div>
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* Attendance Trends */}
      {attendanceData.length > 0 && (
        <Card title="Attendance Trends (Last 14 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#10b981" name="Present" />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Behavior Analytics */}
      {behaviorData.length > 0 && (
        <Card title="Behavior Trends (Last 6 Months)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Incidents vs Merits</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="incidents" fill="#ef4444" name="Incidents" />
                  <Bar dataKey="merits" fill="#10b981" name="Merits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Points Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="demeritPoints" stroke="#ef4444" name="Demerit Points" />
                  <Line type="monotone" dataKey="meritPoints" stroke="#10b981" name="Merit Points" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card title={`Recent Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
          <div className="space-y-3">
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border-l-4 ${
                  notif.is_read === 0
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {notif.is_read === 0 && (
                    <button
                      onClick={async () => {
                        await api.markNotificationRead(notif.id);
                        fetchNotifications();
                      }}
                      className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ParentDashboard;

