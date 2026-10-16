import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { USE_MOCK_DATA } from '@/services/config';
import { useNavigate } from 'react-router-dom';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAiStatus } from '@/services/api/monitoringService';
import { checkBackendHealth } from '@/services/api/healthService';
import { useFleetSocketContext } from '@/hooks/useFleetSocketEvent';
import { Badge } from '@/components/ui/Badge';
import type { StatusTone } from '@/utils/statusColors';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'system', label: 'System status' },
  { id: 'alerts', label: 'Alert thresholds' },
  { id: 'account', label: 'Account' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { theme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { data: aiStatus } = useAsyncData(() => getAiStatus(), []);
  const { data: backendHealthy } = useAsyncData(() => checkBackendHealth(), []);
  const { status: wsStatus } = useFleetSocketContext();

  return (
    <div className="space-y-4 max-w-3xl">
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'general' && (
        <Card>
          <CardHeader title="Appearance" subtitle="Choose how FleetGuard looks on this device" />
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Theme</p>
              <p className="text-xs text-text-muted">Currently using {theme === 'light' ? 'light' : 'dark'} mode</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Organization name</p>
              <p className="text-xs text-text-muted">Displayed across the dashboard</p>
            </div>
            <input
              defaultValue="FleetGuard Demo Fleet"
              disabled
              className="text-sm rounded-md border border-border bg-surface-inset text-text-secondary px-3 py-2 w-56 cursor-not-allowed"
            />
          </div>
        </Card>
      )}

      {activeTab === 'system' && (
        <Card>
          <CardHeader
            title="System status"
            subtitle="What is actually active right now — never shows LIVE unless it genuinely is"
          />
          <StatusRow
            label="Data mode"
            value={USE_MOCK_DATA ? 'Demo (mock frontend data)' : 'Connected (real backend)'}
            tone={USE_MOCK_DATA ? 'neutral' : 'success'}
          />
          <StatusRow
            label="Backend"
            value={USE_MOCK_DATA ? 'Not used in demo mode' : backendHealthy ? 'Connected' : 'Offline'}
            tone={USE_MOCK_DATA ? 'neutral' : backendHealthy ? 'success' : 'danger'}
          />
          <StatusRow
            label="WebSocket"
            value={USE_MOCK_DATA ? 'Not used in demo mode' : wsStatus}
            tone={USE_MOCK_DATA ? 'neutral' : wsStatus === 'connected' ? 'success' : wsStatus === 'disconnected' ? 'danger' : 'warning'}
          />
          <StatusRow
            label="AI mode (configured)"
            value={aiStatus?.configuredMode ?? '—'}
            tone="info"
          />
          <StatusRow
            label="AI mode (actually active)"
            value={aiStatus?.activeSource === 'live' ? 'LIVE camera inference' : 'Simulation'}
            tone={aiStatus?.activeSource === 'live' ? 'success' : 'neutral'}
          />
          <StatusRow
            label="Vision dependencies (OpenCV/MediaPipe/YOLO)"
            value={aiStatus?.visionDependenciesInstalled ? 'Installed' : 'Not installed (simulation still works)'}
            tone={aiStatus?.visionDependenciesInstalled ? 'success' : 'neutral'}
            last
          />
          <p className="text-xs text-text-muted mt-4">
            Changing <code className="bg-surface-inset px-1 py-0.5 rounded">AI_MODE</code>,{' '}
            <code className="bg-surface-inset px-1 py-0.5 rounded">AI_CAMERA_INDEX</code>, or{' '}
            <code className="bg-surface-inset px-1 py-0.5 rounded">DATABASE_URL</code> requires editing{' '}
            <code className="bg-surface-inset px-1 py-0.5 rounded">backend/.env</code> and restarting the
            backend — these are not hot-swappable at runtime.
          </p>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <Card>
          <CardHeader title="Alert thresholds" subtitle="These values are placeholders — wired to the AI service in Phase 3" />
          {[
            { label: 'Drowsiness confidence threshold', value: '75%' },
            { label: 'Eye closure duration', value: '2.0 sec' },
            { label: 'Yawning frequency window', value: '10 min' },
            { label: 'Overspeed margin', value: '10 km/h' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <p className="text-sm text-text-primary">{row.label}</p>
              <input
                defaultValue={row.value}
                disabled
                className="text-sm rounded-md border border-border bg-surface-inset text-text-secondary px-3 py-2 w-28 text-right cursor-not-allowed"
              />
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'account' && (
        <Card>
          <CardHeader title="Account" subtitle="Session and access controls" />
          {USE_MOCK_DATA ? (
            <p className="text-sm text-text-secondary mb-4">
              Running in demo mode (mock data) — there is no real session. Set{' '}
              <code className="text-xs bg-surface-inset px-1 py-0.5 rounded">VITE_USE_MOCK=false</code> to
              authenticate against the real backend.
            </p>
          ) : isAuthenticated && user ? (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Signed in as <span className="font-medium text-text-primary">{user.full_name}</span> (
                {user.email})
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">You're not signed in.</p>
              <Button onClick={() => navigate('/login')}>Go to sign in</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
  last = false,
}: {
  label: string;
  value: string;
  tone: StatusTone;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? '' : 'border-b border-border'}`}>
      <p className="text-sm text-text-primary">{label}</p>
      <Badge label={value} tone={tone} dot />
    </div>
  );
}
