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

const GradeHeadMyClass: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myClass, setMyClass] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClass();
  }, []);

  const fetchMyClass = async () => {
    try {
      const response = await api.getClasses({ my_class_only: true });
      const classes: any[] = response.data || [];
      setMyClass(classes.length > 0 ? classes[0] : null);
    } catch (err) {
      console.error('Error fetching my class:', err);
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
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Class
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Your personally assigned class as a teacher
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
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Class Assigned</h3>
          <p className="text-gray-600">
            You don't have a class assigned to you as a teacher yet. Contact your administrator.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Stats row */}
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
              <p className="text-3xl font-bold">{myClass.class_name}</p>
              <p className="text-sm opacity-90 mt-1">Class Name</p>
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
              <p className="text-4xl font-bold">{myClass.student_count || 0}</p>
              <p className="text-sm opacity-90 mt-1">Students</p>
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
              <p className="text-4xl font-bold">Grade {myClass.grade_level}</p>
              <p className="text-sm opacity-90 mt-1">Grade Level</p>
            </motion.div>
          </div>

          {/* Class Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.01 }}
            onClick={() => navigate(`/grade-head/classes/${myClass.id}`)}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-8 cursor-pointer transition-all duration-300 max-w-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                  <BookOpen className="text-white" size={28} />
                </div>
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                >
                  <ArrowRight className="text-indigo-600" size={24} />
                </motion.div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                {myClass.class_name}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-gray-600">
                  <GraduationCap size={18} className="text-indigo-600" />
                  <span className="font-medium">Grade {myClass.grade_level}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <Users size={18} className="text-purple-600" />
                  <span className="font-medium">{myClass.student_count || 0} Students</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="font-medium">{myClass.academic_year}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Click to view full class details</span>
                <div className="flex items-center space-x-1 text-indigo-600">
                  <span className="text-sm font-semibold">Open</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default GradeHeadMyClass;
