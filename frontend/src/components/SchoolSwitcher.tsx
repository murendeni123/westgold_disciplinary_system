import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useParentStudents } from '../hooks/useParentStudents';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface School {
  id: number;
  name: string;
  email?: string;
}

interface SchoolSwitcherProps {
  onSchoolChange?: (schoolId: number) => void;
}

const SchoolSwitcher: React.FC<SchoolSwitcherProps> = ({ onSchoolChange }) => {
  const { profile } = useAuth();
  const { students } = useParentStudents();
  const [schools, setSchools] = useState<School[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, [students, profile]);

  const fetchSchools = async () => {
    try {
      // Get unique schools from parent's students
      if (students.length > 0) {
        const uniqueSchoolIds = new Set<number>();
        const schoolMap = new Map<number, School>();

        students.forEach((student) => {
          if (student.school_id && !uniqueSchoolIds.has(student.school_id)) {
            uniqueSchoolIds.add(student.school_id);
            schoolMap.set(student.school_id, {
              id: student.school_id,
              name: student.school_name || `School ${student.school_id}`,
            });
          }
        });

        const schoolsList = Array.from(schoolMap.values());
        setSchools(schoolsList);

        // Set current school from profile's school_id or first student's school
        if (profile?.school_id) {
          const school = schoolsList.find(s => s.id === Number(profile.school_id));
          if (school) {
            setCurrentSchool(school);
          } else if (schoolsList.length > 0) {
            setCurrentSchool(schoolsList[0]);
          }
        } else if (schoolsList.length > 0) {
          setCurrentSchool(schoolsList[0]);
        }
      } else if (profile?.school_id) {
        // If no students but has school_id, create school object from profile data
        setCurrentSchool({
          id: Number(profile.school_id),
          name: `School ${profile.school_id}`,
        });
        setSchools([{
          id: Number(profile.school_id),
          name: `School ${profile.school_id}`,
        }]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleSchoolSwitch = async (school: School) => {
    if (school.id === currentSchool?.id) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Update user's school context
      setCurrentSchool(school);
      setIsOpen(false);

      if (onSchoolChange) {
        onSchoolChange(school.id);
      }

      // Refresh page data if needed
      window.location.reload();
    } catch (error) {
      console.error('Error switching school:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show switcher if only one school or no schools
  if (schools.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all shadow-sm hover:shadow-md"
        disabled={loading}
      >
        <Building2 size={18} className="text-blue-600" />
        <span className="text-sm font-semibold text-gray-700 max-w-[150px] truncate">
          {currentSchool?.name || 'Select School'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-gray-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-20 overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Switch School
                </div>
                {schools.map((school, index) => (
                  <motion.button
                    key={school.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => handleSchoolSwitch(school)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all ${
                      currentSchool?.id === school.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 size={16} className={currentSchool?.id === school.id ? 'text-white' : 'text-gray-500'} />
                      <span className="text-sm font-medium">{school.name}</span>
                    </div>
                    {currentSchool?.id === school.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <Check size={16} className="text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchoolSwitcher;
