import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useParentStudents } from '../hooks/useParentStudents';
import { api } from '../services/api';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuickStudentSearch: React.FC = () => {
  const { profile } = useAuth();
  const { students: parentStudents } = useParentStudents();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
      if (e.key === 'Escape') {
        setIsFocused(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      searchStudents();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchStudents = async () => {
    setLoading(true);
    try {
      let studentsToSearch: any[] = [];
      
      if (profile?.role === 'parent') {
        studentsToSearch = parentStudents;
      } else {
        const response = await api.getStudents();
        studentsToSearch = response.data;
      }
      
      const filtered = studentsToSearch.filter((student: any) => {
        const searchTerm = query.toLowerCase();
        return (
          student.first_name?.toLowerCase().includes(searchTerm) ||
          student.last_name?.toLowerCase().includes(searchTerm) ||
          student.student_id?.toLowerCase().includes(searchTerm) ||
          student.class_name?.toLowerCase().includes(searchTerm)
        );
      }).slice(0, 10);

      setResults(filtered);
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (student: any) => {
    const role = profile?.role;
    if (role === 'school_admin' || role === 'super_admin') {
      navigate(`/admin/students/${student.id}`);
    } else if (role === 'teacher') {
      navigate(`/teacher/students/${student.id}`);
    } else if (role === 'parent') {
      navigate(`/parent/children/${student.id}`);
    }
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <motion.div
        animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder="Search students (Ctrl+K)..."
          className="w-full pl-12 pr-10 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all shadow-sm hover:shadow-md"
        />
        {query && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {isFocused && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"
                />
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((student, index) => (
                  <motion.button
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                    onClick={() => handleSelect(student)}
                    className="w-full px-4 py-3 text-left border-b border-gray-100/50 last:border-b-0 flex items-center space-x-3 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      {student.photo_path ? (
                        <img
                          src={(() => {
                            const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                              ? 'http://192.168.18.160:5000'
                              : 'http://localhost:5000';
                            return student.photo_path.startsWith('http') ? student.photo_path : `${baseUrl}${student.photo_path}`;
                          })()}
                          alt={student.first_name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        ID: {student.student_id} • {student.class_name || 'No Class'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No students found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickStudentSearch;
