import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Upload, User, Mail, Phone, GraduationCap, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { getPhotoUrl, handlePhotoError } from '../../utils/photoUrl';

const TeacherProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, ToastContainer } = useToast();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchTeacher();
    }
  }, [id]);

  const fetchTeacher = async () => {
    try {
      const response = await api.getTeacher(Number(id));
      setTeacher(response.data);
    } catch (error) {
      console.error('Error fetching teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      await api.uploadTeacherPhoto(Number(id), file);
      fetchTeacher();
      success('Photo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading photo:', err);
      error('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"
        />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <p className="text-xl text-gray-500">Teacher not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />
      
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
            onClick={() => navigate('/admin/teachers')}
            className="rounded-xl"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </motion.div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {teacher.name}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Teacher Profile</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            <User className="text-amber-600" size={24} />
          </div>
          <div className="flex gap-6">
            {/* Photo in top left corner */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {teacher.photo_path ? (
                  <img
                    src={getPhotoUrl(teacher.photo_path) || ''}
                    alt="Teacher"
                    className="w-full h-full object-cover"
                    onError={handlePhotoError}
                  />
                ) : null}
                {!teacher.photo_path && (
                  <span className="text-gray-400 text-sm photo-placeholder">No Photo</span>
                )}
                <span className="text-gray-400 text-sm photo-placeholder hidden">Photo not found</span>
              </div>
              <div className="flex flex-col space-y-2 mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs py-1 px-2 rounded-xl"
                  >
                    <Upload size={14} className="mr-1" />
                    Upload
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="secondary"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs py-1 px-2 rounded-xl"
                  >
                    <Camera size={14} className="mr-1" />
                    Camera
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Information on the right */}
            <div className="flex-1 space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                <p className="text-lg font-semibold text-amber-700">{teacher.employee_id}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-amber-700">{teacher.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-lg font-semibold text-amber-700">{teacher.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="text-lg font-semibold text-amber-700">{teacher.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {teacher.classes && teacher.classes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Assigned Classes</h2>
              <GraduationCap className="text-amber-600" size={24} />
            </div>
            <div className="space-y-2">
              {teacher.classes.map((cls: any, index: number) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-amber-700">{cls.class_name}</p>
                  <p className="text-sm text-gray-600">{cls.grade_level || 'N/A'}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;

