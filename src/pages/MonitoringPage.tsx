import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMonitoringStatuses, getMonitoringEvents, getAiStatus } from '@/services/api/monitoringService';
import { getDrivers } from '@/services/api/driverService';
import { getVehicles } from '@/services/api/vehicleService';
import { useFleetSocketEvent } from '@/hooks/useFleetSocketEvent';
import { MonitoringStatusGrid } from '@/components/monitoring/MonitoringStatusGrid';
import { EventTimeline } from '@/components/monitoring/EventTimeline';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { USE_MOCK_DATA } from '@/services/config';
import { Camera, Radio } from 'lucide-react';
import type { DriverMonitoringStatus, MonitoringEvent } from '@/types';

export default function MonitoringPage() {
  const { data: initialStatuses, status, error, refetch } = useAsyncData(() => getMonitoringStatuses(), []);
  const { data: initialEvents } = useAsyncData(() => getMonitoringEvents(), []);
  const { data: drivers } = useAsyncData(() => getDrivers(), []);
  const { data: vehicles } = useAsyncData(() => getVehicles(), []);
  const { data: aiStatus } = useAsyncData(() => getAiStatus(), []);

  const [liveStatuses, setLiveStatuses] = useState<DriverMonitoringStatus[] | null>(null);
  const [liveEvents, setLiveEvents] = useState<MonitoringEvent[] | null>(null);

  const statuses = liveStatuses ?? initialStatuses ?? [];
  const events = liveEvents ?? initialEvents ?? [];

  useFleetSocketEvent<DriverMonitoringStatus>('monitoring_update', (update) => {
    setLiveStatuses((prev) => {
      const base = prev ?? initialStatuses ?? [];
      const exists = base.some((s) => s.driverId === update.driverId);
      const updated = exists
        ? base.map((s) => (s.driverId === update.driverId ? update : s))
        : [...base, update];
      return updated.sort((a, b) => {
        const aLive = a.driverId === 'DRV-001' || a.source === 'live';
        const bLive = b.driverId === 'DRV-001' || b.source === 'live';
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        return a.driverId.localeCompare(b.driverId);
      });
    });
  });

  useFleetSocketEvent<MonitoringEvent>('safety_event', (event) => {
    setLiveEvents((prev) => {
      const base = prev ?? initialEvents ?? [];
      if (base.some((e) => e.id === event.id)) return base;
      return [event, ...base].slice(0, 50);
    });
  });

  if (status === 'loading') return <LoadingState label="Connecting to monitoring feeds…" />;
  if (status === 'error') return <ErrorState message={error ?? 'Unknown error'} onRetry={refetch} />;

  const isLive = aiStatus?.activeSource === 'live';

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-2 border text-xs rounded-lg px-4 py-2.5 ${
          isLive
            ? 'bg-status-success-bg border-status-success-border text-status-success-text'
            : 'bg-status-info-bg border-status-info-border text-status-info-text'
        }`}
      >
        {isLive ? <Radio size={14} /> : <Camera size={14} />}
        {isLive ? (
          <span>
            <strong>LIVE AI</strong> — real OpenCV/MediaPipe/YOLO camera inference is active
            (camera index {aiStatus?.cameraIndex}).
          </span>
        ) : (
          <span>
            <strong>DEMO / SIMULATION</strong> — these cards show deterministic simulated AI signals, not
            real camera inference. {USE_MOCK_DATA ? '' : 'Set AI_MODE=live on the backend (with a webcam and requirements-ai.txt installed) to switch to real detection.'}
          </span>
        )}
      </div>

      <MonitoringStatusGrid statuses={statuses} drivers={drivers ?? []} vehicles={vehicles ?? []} />

      <EventTimeline events={events} drivers={drivers ?? []} vehicles={vehicles ?? []} />
    </div>
  );
}
