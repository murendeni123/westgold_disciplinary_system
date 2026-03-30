import { behaviourApi } from '../api/behaviour.api';
import { IncidentFilters } from '../types/behaviour.types';
import { formatDate } from '@/shared/utils/format';
import { SEVERITY_COLORS } from '@/core/config/constants';

export const behaviourService = {
  async getIncidents(filters?: IncidentFilters) {
    const response = await behaviourApi.getIncidents(filters);
    return response.data;
  },

  async getIncident(id: number) {
    const response = await behaviourApi.getIncident(id);
    return response.data;
  },

  async getStats(studentId?: number) {
    const response = await behaviourApi.getStats(studentId);
    return response.data;
  },

  getSeverityColor(severity: string) {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || 'info';
  },

  formatIncidentDate(date: string) {
    return formatDate(date);
  },
};
