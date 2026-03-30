export interface Incident {
  id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  incident_type_id: number;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'escalated';
  date: string;
  consequences_applied?: string;
  demerit_points: number;
  created_at: string;
}

export interface IncidentFilters {
  student_id?: number;
  start_date?: string;
  end_date?: string;
  severity?: string;
  status?: string;
  incident_type_id?: number;
}

export interface BehaviourStats {
  total_incidents: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
}
