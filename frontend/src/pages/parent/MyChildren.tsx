import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Card from '../../components/Card';
import { Award, AlertTriangle, Calendar } from 'lucide-react';

const MyChildren: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [childrenStats, setChildrenStats] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.children) {
      setChildren(user.children);
      fetchChildrenStats();
    }
  }, [user]);

  const fetchChildrenStats = async () => {
    try {
      if (!user?.children || user.children.length === 0) {
        setLoading(false);
        return;
      }

      const statsPromises = user.children.map(async (child: any) => {
        try {
          const [meritsRes, incidentsRes, attendanceRes] = await Promise.all([
            api.getMerits({ student_id: child.id, start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
            api.getIncidents({ student_id: child.id }),
            api.getAttendance({ student_id: child.id, start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
          ]);

          const totalMerits = meritsRes.data.length;
          const totalMeritPoints = meritsRes.data.reduce((sum: number, m: any) => sum + (m.points || 0), 0);
          const totalIncidents = incidentsRes.data.length;
          const totalDemeritPoints = incidentsRes.data.reduce((sum: number, i: any) => sum + (i.points || 0), 0);
          const totalAttendance = attendanceRes.data.length;
          const presentCount = attendanceRes.data.filter((a: any) => a.status === 'present').length;
          const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';

          return {
            ...child,
            totalMerits,
            totalMeritPoints,
            totalIncidents,
            totalDemeritPoints,
            attendanceRate: parseFloat(attendanceRate),
          };
        } catch (error) {
          console.error(`Error fetching stats for child ${child.id}:`, error);
          return {
            ...child,
            totalMerits: 0,
            totalMeritPoints: 0,
            totalIncidents: 0,
            totalDemeritPoints: 0,
            attendanceRate: 0,
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      setChildrenStats(stats);

      // Calculate overall stats
      const overall = {
        totalMerits: stats.reduce((sum, s) => sum + s.totalMerits, 0),
        totalMeritPoints: stats.reduce((sum, s) => sum + s.totalMeritPoints, 0),
        totalIncidents: stats.reduce((sum, s) => sum + s.totalIncidents, 0),
        totalDemeritPoints: stats.reduce((sum, s) => sum + s.totalDemeritPoints, 0),
        avgAttendanceRate: stats.length > 0 ? (stats.reduce((sum, s) => sum + s.attendanceRate, 0) / stats.length).toFixed(1) : 0,
      };
      setOverallStats(overall);
    } catch (error) {
      console.error('Error fetching children stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'photo_path',
      label: 'Photo',
      render: (value: string) => (
        value ? (
          <img
            src={(() => {
              const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                ? 'http://192.168.18.160:5000'
                : 'http://localhost:5000';
              return value.startsWith('http') ? value : `${baseUrl}${value}`;
            })()}
            alt="Student"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        )
      ),
    },
    { key: 'student_id', label: 'Student ID' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'class_name', label: 'Class' },
    {
      key: 'totalMerits',
      label: 'Merits',
      render: (value: number, row: any) => (
        <span className="text-green-600 font-semibold">{value || 0}</span>
      ),
    },
    {
      key: 'totalIncidents',
      label: 'Incidents',
      render: (value: number) => (
        <span className="text-red-600 font-semibold">{value || 0}</span>
      ),
    },
    {
      key: 'attendanceRate',
      label: 'Attendance',
      render: (value: number) => (
        <span className="text-blue-600 font-semibold">{value || 0}%</span>
      ),
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-600 mt-2">View your linked children and their progress</p>
      </div>

      {/* Overall Summary */}
      {overallStats && children.length > 1 && (
        <Card title="Overall Summary (All Children)">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Merits</p>
                  <p className="text-2xl font-bold text-green-600">{overallStats.totalMerits}</p>
                  <p className="text-xs text-gray-500">{overallStats.totalMeritPoints} points</p>
                </div>
                <Award className="text-green-600" size={32} />
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-red-600">{overallStats.totalIncidents}</p>
                  <p className="text-xs text-gray-500">{overallStats.totalDemeritPoints} points</p>
                </div>
                <AlertTriangle className="text-red-600" size={32} />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-blue-600">{overallStats.avgAttendanceRate}%</p>
                </div>
                <Calendar className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Children</p>
                  <p className="text-2xl font-bold text-purple-600">{children.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {children.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-4">No children linked yet.</p>
          <button
            onClick={() => navigate('/parent/link-child')}
            className="btn btn-primary"
          >
            Link a Child
          </button>
        </div>
      ) : (
        <Card title="Children List">
          <Table
            columns={columns}
            data={childrenStats.length > 0 ? childrenStats : children}
            onRowClick={(row) => navigate(`/parent/children/${row.id}`)}
          />
        </Card>
      )}
    </div>
  );
};

export default MyChildren;

