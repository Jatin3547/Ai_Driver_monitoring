import { Badge } from '@/components/ui/Badge';
import { severityTone, incidentStatusTone } from '@/utils/statusColors';
import { MONITORING_EVENT_LABELS } from '@/utils/constants';
import { formatDateTime } from '@/utils/formatDate';
import { Camera, MapPin, User, Truck, Clock } from 'lucide-react';
import type { Driver, Incident, Vehicle } from '@/types';

interface Props {
  incident: Incident;
  driver?: Driver;
  vehicle?: Vehicle;
}

export function IncidentDetailPanel({ incident, driver, vehicle }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge label={incident.severity} tone={severityTone(incident.severity)} />
        <Badge label={incident.status} tone={incidentStatusTone(incident.status)} />
      </div>

      <div className="aspect-video bg-surface-inset rounded-md flex items-center justify-center text-text-muted">
        <Camera size={26} />
        <span className="text-xs ml-2">Snapshot unavailable (Phase 3)</span>
      </div>

      <h3 className="text-sm font-semibold text-text-primary">
        {MONITORING_EVENT_LABELS[incident.type] ?? incident.type}
      </h3>
      <p className="text-sm text-text-secondary">{incident.description}</p>

      <dl className="grid grid-cols-1 gap-2.5 text-sm pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-text-secondary">
          <User size={14} className="text-text-muted" /> {driver?.name ?? incident.driverId}
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Truck size={14} className="text-text-muted" /> {vehicle?.plateNumber ?? incident.vehicleId ?? 'Unassigned'}
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <MapPin size={14} className="text-text-muted" /> {incident.location}
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock size={14} className="text-text-muted" /> {formatDateTime(incident.timestamp)}
        </div>
      </dl>
    </div>
  );
}
