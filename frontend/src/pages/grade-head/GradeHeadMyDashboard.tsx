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
  Calendar,
  Activity,
} from 'lucide-react';

const GradeHeadMyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myClass, setMyClass] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [recentBehaviour, setRecentBehaviour] = useState<any[]>([]);
  const [recentMerits, setRecentMerits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, behaviourRes, meritsRes] = await Promise.all([
        api.getClasses({ my_class_only: true }),
        api.getIncidents({ limit: 5 }).catch(() => ({ data: [] })),
        api.getMerits({ limit: 5 }).catch(() => ({ data: [] })),
      ]);

      const classes: any[] = classRes.data || [];
      const classData = classes.length > 0 ? classes[0] : null;
      setMyClass(classData);

      if (classData) {
        const studentsRes = await api.getStudents({ class_id: classData.id });
        setStudents(studentsRes.data || []);
      }

      setRecentBehaviour(behaviourRes.data?.incidents || behaviourRes.data || []);
      setRecentMerits(meritsRes.data?.merits || meritsRes.data || []);
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

  const totalStudents = students.length;
  const meritsCount = recentMerits.filter((m: any) =>
    myClass ? m.class_id === myClass.id : true
  ).length;
  const behaviourCount = recentBehaviour.filter((b: any) =>
    myClass ? b.class_id === myClass.id : true
  ).length;

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
              My Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              {myClass
                ? `Your personal view for ${myClass.class_name}`
                : 'No class assigned yet'}
            </p>
          </div>
          {user?.gradeHeadFor && (
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
              <Shield size={16} />
              <span>Grade Head — Grade {user.gradeHeadFor}</span>
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Class Assigned</h3>
          <p className="text-gray-600">
            You don't have a class assigned yet. Contact your administrator.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: 'My Students',
                value: totalStudents,
                icon: Users,
                gradient: 'from-indigo-500 to-purple-500',
                action: () => navigate(`/grade-head/classes/${myClass.id}`),
              },
              {
                label: 'Recent Incidents',
                value: behaviourCount,
                icon: AlertTriangle,
                gradient: 'from-red-500 to-rose-500',
                action: () => navigate('/grade-head/behaviour'),
              },
              {
                label: 'Recent Merits',
                value: meritsCount,
                icon: Award,
                gradient: 'from-green-500 to-emerald-500',
                action: () => navigate('/grade-head/merits'),
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

          {/* My Class Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Class Summary */}
            <div
              onClick={() => navigate(`/grade-head/classes/${myClass.id}`)}
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
                  <p className="text-2xl font-bold text-indigo-700">{totalStudents}</p>
                  <p className="text-xs text-indigo-500 font-medium mt-0.5">Students</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">Grade {myClass.grade_level}</p>
                  <p className="text-xs text-amber-500 font-medium mt-0.5">Grade Level</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity size={18} className="text-amber-500" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Log Incident', path: '/grade-head/behaviour/log', color: 'text-red-600 bg-red-50 hover:bg-red-100', icon: AlertTriangle },
                  { label: 'Award Merit', path: '/grade-head/merits/award', color: 'text-green-600 bg-green-50 hover:bg-green-100', icon: Award },
                  { label: 'View My Class', path: `/grade-head/classes/${myClass.id}`, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100', icon: BookOpen },
                  { label: 'View Students', path: '/grade-head/students', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100', icon: Users },
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

          {/* Recent Students */}
          {students.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Users size={18} className="text-indigo-500" />
                  <span>My Students</span>
                </h3>
                <button
                  onClick={() => navigate(`/grade-head/classes/${myClass.id}`)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.slice(0, 6).map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => navigate(`/grade-head/students/${student.id}`)}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{student.student_id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default GradeHeadMyDashboard;
