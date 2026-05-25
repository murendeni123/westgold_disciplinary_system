import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  Star,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const GradeHeadMyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [myClass, setMyClass] = useState<any | null>(null);
  const [recentBehaviour, setRecentBehaviour] = useState<any[]>([]);
  const [recentMerits, setRecentMerits] = useState<any[]>([]);
  const [otherTeacherActivity, setOtherTeacherActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const classRes = await api.getClasses({ my_class_only: true });
      const classes: any[] = classRes.data || [];
      const classData = classes.length > 0 ? classes[0] : null;
      setMyClass(classData);

      if (classData) {
        const [behaviourRes, meritsRes] = await Promise.all([
          api.getIncidents({ class_id: classData.id, limit: 10 }).catch(() => ({ data: [] })),
          api.getMerits({ class_id: classData.id, limit: 10 }).catch(() => ({ data: [] })),
        ]);

        const incidents: any[] = behaviourRes.data?.incidents || behaviourRes.data || [];
        const merits: any[] = meritsRes.data?.merits || meritsRes.data || [];

        // Recent 5 for stat cards
        setRecentBehaviour(incidents.slice(0, 5));
        setRecentMerits(merits.slice(0, 5));

        // Activity from OTHER teachers — filter out logs by the current grade head
        const myTeacherId = user?.teacherId;
        const otherIncidents = incidents
          .filter((i: any) => !myTeacherId || Number(i.teacher_id) !== Number(myTeacherId))
          .map((i: any) => ({ ...i, _type: 'incident' }));
        const otherMerits = merits
          .filter((m: any) => !myTeacherId || Number(m.teacher_id) !== Number(myTeacherId))
          .map((m: any) => ({ ...m, _type: 'merit' }));

        // Merge and sort by date descending
        const combined = [...otherIncidents, ...otherMerits].sort((a, b) => {
          const da = new Date(a.date || a.merit_date || a.created_at).getTime();
          const db = new Date(b.date || b.merit_date || b.created_at).getTime();
          return db - da;
        });
        setOtherTeacherActivity(combined.slice(0, 10));
      }
    } catch (err) {
      console.error('Error loading my dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {t('gradeHead.myDashboard')}
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              {myClass
                ? `${t('gradeHead.myDashboardSubtitle')} ${myClass.class_name}`
                : t('gradeHead.noClassAssignedDesc')}
            </p>
          </div>
          {user?.gradeHeadFor && (
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
              <Shield size={16} />
              <span>{t('gradeHead.gradeHeadBadge')} {user.gradeHeadFor}</span>
            </div>
          )}
        </div>
      </motion.div>

      {!myClass ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('gradeHead.noClassAssignedTitle')}</h3>
          <p className="text-gray-600">{t('gradeHead.noClassAssignedDesc')}</p>
        </motion.div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: t('gradeHead.recentIncidents'),
                value: recentBehaviour.length,
                icon: AlertTriangle,
                gradient: 'from-red-500 to-rose-500',
                action: () => navigate('/grade-head/behaviour'),
              },
              {
                label: t('gradeHead.recentMerits'),
                value: recentMerits.length,
                icon: Award,
                gradient: 'from-green-500 to-emerald-500',
                action: () => navigate('/grade-head/merits'),
              },
              {
                label: 'Other Teacher Activity',
                value: otherTeacherActivity.length,
                icon: Activity,
                gradient: 'from-indigo-500 to-purple-500',
                action: () => {},
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={stat.action}
                className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 text-white shadow-xl cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon size={32} />
                  <TrendingUp size={20} className="opacity-75" />
                </div>
                <p className="text-4xl font-bold">{stat.value}</p>
                <p className="text-sm opacity-90 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Class Card + Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Class Summary — clicking goes to My Teachings page */}
            <div
              onClick={() => navigate('/grade-head/my-teachings')}
              className="group rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer hover:border-amber-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg">
                    <BookOpen className="text-white" size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {myClass.class_name}
                    </h3>
                    <p className="text-sm text-gray-500">Grade {myClass.grade_level} · {myClass.academic_year}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-700">{myClass.student_count || 0}</p>
                  <p className="text-xs text-indigo-500 font-medium mt-0.5">{t('common.students')}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">Grade {myClass.grade_level}</p>
                  <p className="text-xs text-amber-500 font-medium mt-0.5">{t('common.gradeLevel')}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3 font-medium">Click to manage your class →</p>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity size={18} className="text-amber-500" />
                <span>{t('gradeHead.quickActions')}</span>
              </h3>
              <div className="space-y-2">
                {[
                  { label: t('gradeHead.logIncident'), path: '/grade-head/behaviour/log', color: 'text-red-600 bg-red-50 hover:bg-red-100', icon: AlertTriangle },
                  { label: t('gradeHead.awardMerit'), path: '/grade-head/merits/award', color: 'text-green-600 bg-green-50 hover:bg-green-100', icon: Award },
                  { label: t('gradeHead.assignConsequence'), path: '/grade-head/consequence-management', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100', icon: Shield },
                  { label: t('nav.reports'), path: '/grade-head/reports', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100', icon: BookOpen },
                ].map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${action.color}`}
                  >
                    <action.icon size={16} />
                    <span>{action.label}</span>
                    <ArrowRight size={14} className="ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Activity from Other Teachers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Users size={18} className="text-indigo-500" />
                <span>Activity from Other Teachers</span>
              </h3>
              <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full font-medium">
                {myClass.class_name}
              </span>
            </div>

            {otherTeacherActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Star size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No activity from other teachers yet</p>
                <p className="text-xs mt-1">Incidents and merits logged by other teachers will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {otherTeacherActivity.map((item: any, idx: number) => {
                  const isIncident = item._type === 'incident';
                  return (
                    <div key={`${item._type}-${item.id}-${idx}`} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isIncident ? 'bg-red-100' : 'bg-emerald-100'
                      }`}>
                        {isIncident
                          ? <AlertTriangle size={15} className="text-red-500" />
                          : <Award size={15} className="text-emerald-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {item.student_name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isIncident ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {isIncident ? `−${item.points_deducted || item.points || 0} pts` : `+${item.points || 0} pts`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {item.description || item.incident_type_name || item.merit_type || '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          By <span className="font-medium text-gray-600">{item.teacher_name}</span>
                          {' · '}
                          {new Date(item.date || item.merit_date || item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default GradeHeadMyDashboard;
