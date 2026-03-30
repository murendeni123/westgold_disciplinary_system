import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import { Incident, IncidentFilters, BehaviourStats } from '../types/behaviour.types';

export const behaviourApi = {
  getIncidents: (filters?: IncidentFilters) => {
    return apiClient.get<Incident[]>(API_ENDPOINTS.BEHAVIOUR.LIST, filters);
  },

  getIncident: (id: number) => {
    return apiClient.get<Incident>(API_ENDPOINTS.BEHAVIOUR.DETAIL(id));
  },

  getStats: (studentId?: number) => {
    return apiClient.get<BehaviourStats>(API_ENDPOINTS.BEHAVIOUR.STATS, { student_id: studentId });
  },
};
