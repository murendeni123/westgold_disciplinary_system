import { useQuery } from '@tanstack/react-query';
import { behaviourService } from '../services/behaviour.service';
import { IncidentFilters } from '../types/behaviour.types';
import { QUERY_KEYS } from '@/core/config/constants';

export function useBehaviour(filters?: IncidentFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENTS, filters],
    queryFn: () => behaviourService.getIncidents(filters),
  });
}

export function useIncident(id: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENT, id],
    queryFn: () => behaviourService.getIncident(id),
    enabled: !!id,
  });
}

export function useBehaviourStats(studentId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.BEHAVIOUR_STATS, studentId],
    queryFn: () => behaviourService.getStats(studentId),
  });
}
