import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import ModernCard from '../../components/ModernCard';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Table from '../../components/Table';
import Select from '../../components/Select';

const ModernBehaviourReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('student') || '');
  const [chartData, setChartData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (selectedChild || user?.children?.[0]) {
      fetchIncidents();
    }
  }, [selectedChild, user]);

  const fetchIncidents = async () => {
    try {
      const studentId = selectedChild || user?.children?.[0]?.id;
      if (!studentId) return;

      const response = await api.getIncidents({ student_id: studentId });
      setIncidents(response.data);

      const totalIncidents = response.data.length;
      const totalPoints = response.data.reduce((sum: number, i: any) => sum + (i.points || 0), 0);
      setSummary({ totalIncidents, totalPoints });

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
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
        <span className="font-bold text-red-600">{value || 0}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full"
        />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-pink-500 p-8 text-white shadow-2xl"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 mb-4"
          >
            <AlertTriangle className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold">Behaviour Reports</h1>
          </motion.div>
          <p className="text-xl text-white/90">
            Monitor your child's behaviour incidents and patterns
          </p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedStatCard
            title="Total Incidents"
            value={summary.totalIncidents}
            icon={AlertTriangle}
            iconColor="text-red-600"
            bgGradient="from-red-500/10 to-pink-500/10"
            delay={0.1}
          />
          <AnimatedStatCard
            title="Total Demerit Points"
            value={summary.totalPoints}
            icon={TrendingDown}
            iconColor="text-orange-600"
            bgGradient="from-orange-500/10 to-red-500/10"
            delay={0.2}
          />
        </motion.div>
      )}

      {/* Filters */}
      {user?.children && user.children.length > 1 && (
        <motion.div variants={itemVariants}>
          <ModernCard title="Filters" variant="glass">
            <Select
              label="Child"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              options={user.children.map((c: any) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}`,
              }))}
            />
          </ModernCard>
        </motion.div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard title="Incident Trends Over Time" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="incidents" fill="#ef4444" name="Number of Incidents" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ModernCard>

          {severityData.length > 0 && (
            <ModernCard title="Severity Distribution" variant="glass">
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
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#10b981'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ModernCard>
          )}
        </motion.div>
      )}

      {pointsData.length > 0 && (
        <motion.div variants={itemVariants}>
          <ModernCard title="Demerit Points Accumulation" variant="glass">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#ef4444"
                  name="Cumulative Points"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ModernCard>
        </motion.div>
      )}

      {/* Records Table */}
      <motion.div variants={itemVariants}>
        <ModernCard title="Incident Records" variant="glass">
          <Table
            columns={columns}
            data={incidents}
            onRowClick={(row) => navigate(`/parent/behaviour/${row.id}`)}
          />
        </ModernCard>
      </motion.div>
    </motion.div>
  );
};

export default ModernBehaviourReport;

