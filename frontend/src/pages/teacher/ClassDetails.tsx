import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl } from '../../utils/photoUrl';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, BookOpen, Users } from 'lucide-react';

const ClassDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClass();
    }
  }, [id]);

  const fetchClass = async () => {
    try {
      const response = await api.getClass(Number(id));
      setClassData(response.data);
    } catch (error) {
      console.error('Error fetching class:', error);
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
            src={getPhotoUrl(value) || ''}
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

  if (!classData) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <p className="text-xl text-gray-500">Class not found</p>
        </div>
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
        className="flex items-center space-x-4"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/teacher/classes')}
            className="rounded-xl"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </motion.div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {classData.class_name}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Class Details</p>
        </div>
      </motion.div>

      {/* Class Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Class Information</h2>
          <BookOpen className="text-emerald-600" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <p className="text-sm text-gray-600 mb-1">Grade Level</p>
            <p className="text-lg font-semibold text-emerald-700">{classData.grade_level || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <p className="text-sm text-gray-600 mb-1">Academic Year</p>
            <p className="text-lg font-semibold text-emerald-700">{classData.academic_year}</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => navigate(`/teacher/attendance/daily?class=${id}`)}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Calendar size={20} className="mr-2" />
            Take Daily Attendance
          </Button>
        </motion.div>
      </motion.div>

      {/* Students Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Students ({(classData.students || []).length})
          </h2>
          <Users className="text-emerald-600" size={24} />
        </div>
        <Table
          columns={columns}
          data={classData.students || []}
          onRowClick={(row) => navigate(`/teacher/students/${row.id}`)}
        />
      </motion.div>
    </div>
  );
};

export default ClassDetails;

