/**
 * Hook to fetch students linked to the current parent user.
 * Uses the existing API endpoint and filters by parent relationship.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/SupabaseAuthContext';

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  school_id: number;
  school_name?: string;
  grade?: string;
  class_name?: string;
  parent_id?: number;
  parent_user_id?: string;
}

interface UseParentStudentsResult {
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasStudents: boolean;
}

export const useParentStudents = (): UseParentStudentsResult => {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!user || !profile) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // Only fetch for parent role
    if (profile.role !== 'parent') {
      setStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getStudents();
      const allStudents: Student[] = response.data || [];
      
      // Filter students linked to this parent
      // Check both parent_user_id (Supabase user id) and parent_id (legacy)
      const myStudents = allStudents.filter((student: Student) => 
        student.parent_user_id === user.id || 
        student.parent_id === parseInt(user.id, 10)
      );
      
      setStudents(myStudents);
    } catch (err: any) {
      console.error('Error fetching parent students:', err);
      setError(err.message || 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    hasStudents: students.length > 0,
  };
};

export default useParentStudents;
