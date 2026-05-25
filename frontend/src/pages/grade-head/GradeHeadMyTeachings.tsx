import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  ArrowRight,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const GradeHeadMyTeachings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.getClasses({ my_class_only: true });
        setClasses(response.data || []);
      } catch (err) {
        console.error('Error fetching my teachings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            My Teachings
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Classes assigned to you as a teacher
          </p>
        </div>
        {user?.gradeHeadFor && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
            <Shield size={16} />
            <span>{t('gradeHead.gradeHeadBadge')} {user.gradeHeadFor}</span>
          </div>
        )}
      </motion.div>

      {/* Stats row */}
      {classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen size={32} />
              <TrendingUp size={20} className="opacity-75" />
            </div>
            <p className="text-4xl font-bold">{classes.length}</p>
            <p className="text-sm opacity-90 mt-1">Total Classes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Users size={32} />
              <TrendingUp size={20} className="opacity-75" />
            </div>
            <p className="text-4xl font-bold">{totalStudents}</p>
            <p className="text-sm opacity-90 mt-1">Total Students</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <GraduationCap size={32} />
              <TrendingUp size={20} className="opacity-75" />
            </div>
            <p className="text-4xl font-bold">
              {classes.length > 0
                ? Math.round(totalStudents / classes.length)
                : 0}
            </p>
            <p className="text-sm opacity-90 mt-1">Avg Students / Class</p>
          </motion.div>
        </div>
      )}

      {/* Class Cards */}
      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Class Assigned</h3>
          <p className="text-gray-600">
            You don't have any classes assigned as a teacher yet.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, idx) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => navigate(`/grade-head/classes/${cls.id}`)}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer hover:border-indigo-300 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                    <BookOpen className="text-white" size={22} />
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                  />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {cls.class_name}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <GraduationCap size={15} className="text-indigo-500 flex-shrink-0" />
                    <span>Grade {cls.grade_level}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <Users size={15} className="text-purple-500 flex-shrink-0" />
                    <span>{cls.student_count || 0} students</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <Calendar size={15} className="text-blue-500 flex-shrink-0" />
                    <span>{cls.academic_year}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Click to manage</span>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    Open →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeHeadMyTeachings;
