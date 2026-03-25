import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface Props {
  incidents: any[];
  merits: any[];
  loading: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#7C3AED',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const MERIT_PALETTE = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const StudentAnalytics: React.FC<Props> = ({ incidents, merits, loading }) => {
  if (loading || (incidents.length === 0 && merits.length === 0)) return null;

  // ── 6-month trend ─────────────────────────────────────────────────────────
  const now = new Date();
  const monthlyMap: Record<string, { month: string; incidents: number; merits: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyMap[key] = { month: key, incidents: 0, merits: 0 };
  }
  incidents.forEach((inc: any) => {
    const raw = inc.incident_date || inc.date || inc.created_at;
    if (!raw) return;
    const key = new Date(raw).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (monthlyMap[key]) monthlyMap[key].incidents++;
  });
  merits.forEach((m: any) => {
    const raw = m.merit_date || m.date || m.created_at;
    if (!raw) return;
    const key = new Date(raw).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (monthlyMap[key]) monthlyMap[key].merits++;
  });
  const trendData = Object.values(monthlyMap);

  // ── Severity breakdown ────────────────────────────────────────────────────
  const severityCounts: Record<string, number> = {};
  incidents.forEach((inc: any) => {
    const s = (inc.severity || 'unknown').toLowerCase();
    severityCounts[s] = (severityCounts[s] || 0) + 1;
  });
  const severityData = Object.entries(severityCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const order = ['critical', 'high', 'medium', 'low'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

  // ── Top incident types ────────────────────────────────────────────────────
  const typeCounts: Record<string, number> = {};
  incidents.forEach((inc: any) => {
    const t = inc.incident_type_name || inc.incident_type || 'Other';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const incidentTypeData = Object.entries(typeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // ── Merit points by type ──────────────────────────────────────────────────
  const meritTypePts: Record<string, number> = {};
  merits.forEach((m: any) => {
    const t = m.merit_type || m.merit_type_name || 'General';
    meritTypePts[t] = (meritTypePts[t] || 0) + (m.points || 1);
  });
  const meritTypeData = Object.entries(meritTypePts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <BarChart2 className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
      </div>

      {/* Row 1: 6-month trend + severity donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-month bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="text-indigo-500" size={18} />
            <h3 className="text-lg font-bold text-gray-800">6-Month Behaviour Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <defs>
                <linearGradient id="saIncidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#FCA5A5" />
                </linearGradient>
                <linearGradient id="saMeritGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#6EE7B7" />
                </linearGradient>
              </defs>
              <Bar dataKey="incidents" fill="url(#saIncidentGrad)" name="Incidents" radius={[5, 5, 0, 0]} />
              <Bar dataKey="merits" fill="url(#saMeritGrad)" name="Merits" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Severity donut */}
        {severityData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <PieIcon className="text-red-500" size={18} />
              <h3 className="text-lg font-bold text-gray-800">Incident Severity</h3>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {severityData.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SEVERITY_COLORS[entry.name] || '#94A3B8' }}
                    />
                    <span className="capitalize text-gray-600">{entry.name}</span>
                  </div>
                  <span className="font-bold text-gray-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Row 2: Top incident types + merit points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top incident types */}
        {incidentTypeData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Incident Types</h3>
            <ResponsiveContainer width="100%" height={incidentTypeData.length * 44 + 30}>
              <BarChart data={incidentTypeData} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Count" radius={[0, 5, 5, 0]}>
                  {incidentTypeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? '#EF4444' : i === 1 ? '#F97316' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Merit points by type */}
        {meritTypeData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Merit Points by Type</h3>
            <ResponsiveContainer width="100%" height={meritTypeData.length * 44 + 30}>
              <BarChart data={meritTypeData} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Points" radius={[0, 5, 5, 0]}>
                  {meritTypeData.map((_, i) => (
                    <Cell key={i} fill={MERIT_PALETTE[i % MERIT_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;
