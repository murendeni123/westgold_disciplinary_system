import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen, Users, TrendingUp, Calendar, ArrowRight, GraduationCap, BarChart3 } from 'lucide-react';

const MyClasses: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'class_name', label: 'Class Name' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'student_count', label: 'Students' },
    { key: 'academic_year', label: 'Academic Year' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
  const avgStudentsPerClass = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              My Classes
            </h1>
            <p className="text-gray-600 mt-2 text-lg">View and manage your assigned classes</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg cursor-pointer"
          >
            <BookOpen size={20} />
            <span className="font-semibold">{classes.length} Classes</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-xl"
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
          whileHover={{ y: -5 }}
          className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Users size={32} />
            <BarChart3 size={20} className="opacity-75" />
          </div>
          <p className="text-4xl font-bold">{totalStudents}</p>
          <p className="text-sm opacity-90 mt-1">Total Students</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <GraduationCap size={32} />
            <TrendingUp size={20} className="opacity-75" />
          </div>
          <p className="text-4xl font-bold">{avgStudentsPerClass}</p>
          <p className="text-sm opacity-90 mt-1">Avg Students/Class</p>
        </motion.div>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-12 text-center"
        >
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Classes Assigned</h3>
          <p className="text-gray-600">You don't have any classes assigned yet. Contact your administrator.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6 cursor-pointer transition-all duration-300"
            >
              {/* Gradient Background on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                    <BookOpen className="text-white" size={24} />
                  </div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                  >
                    <ArrowRight className="text-emerald-600" size={24} />
                  </motion.div>
                </div>

                {/* Class Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {classItem.class_name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <GraduationCap size={16} className="text-emerald-600" />
                    <span className="text-sm font-medium">Grade {classItem.grade_level}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users size={16} className="text-purple-600" />
                    <span className="text-sm font-medium">{classItem.student_count || 0} Students</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-sm font-medium">{classItem.academic_year}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">View Details</span>
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <span className="text-xs font-semibold">Open</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;



