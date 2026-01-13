import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { api } from '../../services/api';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Camera, Upload, User, Building2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const TeacherProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [teacher, setTeacher] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchTeacher();
    }
  }, [user]);

  const fetchTeacher = async () => {
    try {
      if (!user?.id) return;
      const response = await api.getTeacher(parseInt(user.id, 10));
      console.log('Teacher data received:', response.data);
      setTeacher(response.data);
    } catch (error) {
      console.error('Error fetching teacher:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      await api.uploadTeacherPhoto(parseInt(user.id, 10), file);
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

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-gray-600 mt-2 text-lg">View and manage your profile information</p>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <User className="text-emerald-600" size={24} />
        </div>
        <div className="flex gap-6">
          {/* Photo in top left corner */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {teacher?.photo_path ? (
                <img
                  src={(() => {
                    const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                      ? 'http://192.168.18.160:5000'
                      : 'http://localhost:5000';
                    return teacher.photo_path.startsWith('http') ? teacher.photo_path : `${baseUrl}${teacher.photo_path}`;
                  })()}
                  alt="Teacher"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image load error:', teacher.photo_path);
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const placeholder = target.parentElement?.querySelector('.photo-placeholder');
                    if (placeholder) placeholder.classList.remove('hidden');
                  }}
                />
              ) : null}
              {!teacher?.photo_path && (
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
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="text-lg font-semibold text-emerald-700">{profile?.full_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-emerald-700">{user?.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Role</p>
              <p className="text-lg font-semibold text-emerald-700 capitalize">{user?.role}</p>
            </div>
            {teacher && (
              <>
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                  <p className="text-lg font-semibold text-emerald-700">{teacher.employee_id}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="text-lg font-semibold text-emerald-700">{teacher.phone || 'N/A'}</p>
                </div>
                {teacher.school_name && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <Building2 size={16} className="text-blue-600" />
                      <p className="text-sm text-gray-600">Assigned School</p>
                    </div>
                    <p className="text-lg font-semibold text-blue-700">{teacher.school_name}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherProfile;

