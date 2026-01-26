import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl, handlePhotoError } from '../../utils/photoUrl';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChildProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [child, setChild] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [behaviorTrend, setBehaviorTrend] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchChild();
      fetchStats();
    }
  }, [id]);

  const fetchChild = async () => {
    try {
      console.log('ChildProfile - Route ID:', id);
      console.log('ChildProfile - User children:', user?.children);
      
      // Verify this child belongs to the logged-in parent
      const linkedChild = user?.children?.find((c: any) => c.id === Number(id));
      
      console.log('ChildProfile - Linked child found:', linkedChild);
      
      if (!linkedChild) {
        setError('Child not found or not linked to your account');
        setLoading(false);
        return;
      }

      // Use the linked child data directly from user context to ensure consistency
      // This prevents showing wrong student data if API returns incorrect information
      setChild(linkedChild);
      
      // Optionally fetch additional details if needed, but use linkedChild as base
      try {
        const response = await api.getStudent(Number(id));
        console.log('ChildProfile - Student data received:', response.data);
        
        // Only update if the fetched data matches the linked child
        if (response.data.id === linkedChild.id) {
          setChild({
            ...linkedChild,
            ...response.data
          });
        } else {
          console.warn('API returned different student than expected. Using linked child data.');
        }
      } catch (apiError) {
        console.warn('Could not fetch additional student details, using linked child data:', apiError);
        // Continue with linkedChild data
      }
    } catch (error) {
      console.error('Error fetching child:', error);
      setError('Failed to load child profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch recent stats
      const [meritsRes, incidentsRes, attendanceRes] = await Promise.all([
        api.getMerits({ student_id: id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
        api.getIncidents({ student_id: id }),
        api.getAttendance({ student_id: id, start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
      ]);

      const totalMerits = meritsRes.data.length;
      const totalMeritPoints = meritsRes.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
      const totalIncidents = incidentsRes.data.length;
      const totalDemeritPoints = incidentsRes.data.reduce((sum: number, i: any) => sum + (i.points || 0), 0);
      const totalAttendance = attendanceRes.data.length;
      const presentCount = attendanceRes.data.filter((a: any) => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';

      setStats({
        totalMerits,
        totalMeritPoints,
        totalIncidents,
        totalDemeritPoints,
        attendanceRate: parseFloat(attendanceRate),
      });

      // Prepare attendance trend (last 14 days)
      const dailyAttendance: Record<string, { present: number; total: number }> = {};
      attendanceRes.data.slice(-14).forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyAttendance[date]) {
          dailyAttendance[date] = { present: 0, total: 0 };
        }
        dailyAttendance[date].total++;
        if (record.status === 'present') dailyAttendance[date].present++;
      });

      const attendanceTrendArray = Object.entries(dailyAttendance)
        .map(([date, data]) => ({
          date,
          rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(0) : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setAttendanceTrend(attendanceTrendArray);

      // Prepare behavior trend (last 6 months)
      const monthlyBehavior: Record<string, { merits: number; incidents: number }> = {};
      [...meritsRes.data, ...incidentsRes.data].forEach((item: any) => {
        const month = new Date(item.merit_date || item.incident_date).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyBehavior[month]) {
          monthlyBehavior[month] = { merits: 0, incidents: 0 };
        }
        if (item.merit_date) monthlyBehavior[month].merits++;
        else monthlyBehavior[month].incidents++;
      });

      const behaviorTrendArray = Object.entries(monthlyBehavior)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6);
      setBehaviorTrend(behaviorTrendArray);

      // Prepare recent activity (last 10 items)
      const activities: any[] = [];
      meritsRes.data.slice(-5).forEach((merit: any) => {
        activities.push({
          type: 'merit',
          date: merit.merit_date,
          description: `Awarded ${merit.points} merit points`,
          points: merit.points,
        });
      });
      incidentsRes.data.slice(-5).forEach((incident: any) => {
        activities.push({
          type: 'incident',
          date: incident.incident_date,
          description: incident.description || 'Behavior incident',
          points: -incident.points,
        });
      });

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!child) {
    return <div>Child not found</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button variant="secondary" onClick={() => navigate('/parent/children')} className="min-h-[44px]">
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {child.first_name} {child.last_name}
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Child Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Basic Information">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Photo in top left corner */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mx-auto sm:mx-0">
                {child.photo_path ? (
                  <img
                    src={getPhotoUrl(child.photo_path) || ''}
                    alt="Child"
                    className="w-full h-full object-cover"
                    onError={handlePhotoError}
                  />
                ) : null}
                {!child.photo_path && (
                  <span className="text-gray-400 text-sm photo-placeholder">No Photo</span>
                )}
                <span className="text-gray-400 text-sm photo-placeholder hidden">Photo not found</span>
              </div>
            </div>

            {/* Information on the right */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Student ID</p>
                <p className="text-base sm:text-lg font-semibold">{child.student_id}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Full Name</p>
                <p className="text-base sm:text-lg font-semibold break-words">
                  {child.first_name} {child.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Date of Birth</p>
                <p className="text-base sm:text-lg font-semibold">{child.date_of_birth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Grade Level</p>
                <p className="text-base sm:text-lg font-semibold">{child.grade_level || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Class</p>
                <p className="text-base sm:text-lg font-semibold">{child.class_name || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Quick Stats">
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">Total Merits</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalMerits}</p>
                <p className="text-xs text-gray-500">{stats.totalMeritPoints} points</p>
              </div>
              <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600">Total Incidents</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalIncidents}</p>
                <p className="text-xs text-gray-500">{stats.totalDemeritPoints} points</p>
              </div>
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:col-span-2">
                <p className="text-xs text-gray-600">Attendance Rate (Last 30 days)</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">Loading stats...</div>
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2 sm:space-y-3">
            <Button
              className="w-full min-h-[48px]"
              onClick={() => navigate(`/parent/attendance?student=${id}`)}
            >
              View Attendance
            </Button>
            <Button
              className="w-full min-h-[48px]"
              variant="secondary"
              onClick={() => navigate(`/parent/behaviour?student=${id}`)}
            >
              View Behaviour Reports
            </Button>
            <Button
              className="w-full min-h-[48px]"
              variant="secondary"
              onClick={() => navigate(`/parent/merits?student=${id}`)}
            >
              View Merits
            </Button>
            <Button
              className="w-full min-h-[48px]"
              variant="secondary"
              onClick={() => navigate(`/parent/detentions?student=${id}`)}
            >
              View Detentions
            </Button>
          </div>
        </Card>
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {attendanceTrend.length > 0 && (
          <Card title="Attendance Trend (Last 14 Days)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {behaviorTrend.length > 0 && (
          <Card title="Behavior Trend (Last 6 Months)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={behaviorTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="merits" fill="#10b981" name="Merits" />
                <Bar dataKey="incidents" fill="#ef4444" name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className={`p-2.5 sm:p-3 rounded-lg border-l-4 ${
                  activity.type === 'merit'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      activity.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {activity.points > 0 ? '+' : ''}{activity.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChildProfile;

