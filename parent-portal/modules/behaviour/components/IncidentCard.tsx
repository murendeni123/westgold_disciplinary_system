import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Incident } from '../types/behaviour.types';
import { behaviourService } from '../services/behaviour.service';
import { AlertTriangle, Calendar, User } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
}

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const severityColor = behaviourService.getSeverityColor(incident.severity);

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${severityColor}/10 flex items-center justify-center`}>
            <AlertTriangle className={`text-${severityColor}`} size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text">{incident.incident_type}</h3>
            <p className="text-sm text-text-muted">{incident.student_name}</p>
          </div>
        </div>
        <Badge variant={severityColor as any}>
          {incident.severity}
        </Badge>
      </div>

      <p className="text-sm text-text-muted mb-4 line-clamp-2">
        {incident.description}
      </p>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{behaviourService.formatIncidentDate(incident.date)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>{incident.teacher_name}</span>
        </div>
      </div>
    </Card>
  );
}
