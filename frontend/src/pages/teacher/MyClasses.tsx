import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Table from '../../components/Table';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            My Classes
          </h1>
          <p className="text-gray-600 mt-2 text-lg">View and manage your assigned classes</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
        >
          <BookOpen size={20} />
          <span className="font-semibold">Classes</span>
        </motion.div>
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
              <BookOpen className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Assigned Classes ({classes.length})</h2>
          </div>
        </div>
        <Table
          columns={columns}
          data={classes}
          onRowClick={(row) => navigate(`/teacher/classes/${row.id}`)}
        />
      </motion.div>
    </div>
  );
};

export default MyClasses;



