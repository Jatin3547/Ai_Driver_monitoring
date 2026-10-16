import { Camera, Eye, Moon, Smartphone, User, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { monitoringSignalTone } from '@/utils/statusColors';
import { timeAgo } from '@/utils/formatDate';
import type { Driver, DriverMonitoringStatus, Vehicle } from '@/types';

interface Props {
  status: DriverMonitoringStatus;
  driver?: Driver;
  vehicle?: Vehicle;
}

const signalRows: { key: keyof DriverMonitoringStatus; label: string; icon: typeof Eye }[] = [
  { key: 'eyeState', label: 'Eye state', icon: Eye },
  { key: 'drowsinessLevel', label: 'Drowsiness', icon: Moon },
  { key: 'yawnStatus', label: 'Yawning', icon: User },
  { key: 'phoneUseStatus', label: 'Phone use', icon: Smartphone },
  { key: 'distractionStatus', label: 'Distraction', icon: UserX },
];

export function DriverMonitorCard({ status, driver, vehicle }: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="aspect-video bg-surface-inset flex items-center justify-center relative">
        <Camera size={28} className="text-text-muted" />
        <span className="absolute top-2 left-2 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
          {status.isOnline ? 'LIVE (placeholder)' : 'NO SIGNAL'}
        </span>
        <span
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${status.isOnline ? 'bg-status-success-text' : 'bg-status-danger-text'}`}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">{driver?.name ?? status.driverId}</p>
            <p className="text-xs text-text-muted">{vehicle?.plateNumber ?? status.vehicleId}</p>
          </div>
          <Badge
            label={status.presenceDetected ? 'Present' : 'No presence'}
            tone={status.presenceDetected ? 'success' : 'danger'}
          />
        </div>

        <div className="space-y-2 flex-1">
          {signalRows.map(({ key, label, icon: Icon }) => {
            const value = status[key] as string;
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Icon size={13} className="text-text-muted" /> {label}
                </span>
                <Badge label={value.replace('-', ' ')} tone={monitoringSignalTone(value)} dot={false} />
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-text-muted mt-3 pt-3 border-t border-border">
          Updated {timeAgo(status.lastUpdated)}
        </p>
      </div>
    </div>
  );
}
