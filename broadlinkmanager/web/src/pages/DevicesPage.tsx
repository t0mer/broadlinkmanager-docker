import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Save, Upload, Wifi, Thermometer } from 'lucide-react';
import { fetchDevices, saveDevices, loadDevices, pingDevice } from '@/api/devices';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePanel } from '@/contexts/PanelContext';
import { addToast } from '@/components/ui/Toast';
import { CommandPanel } from '@/components/commands/CommandPanel';
import type { Device } from '@/types';

function StatsRow({ total, online, codes, lastScan }: {
  total: number;
  online: number;
  codes: number;
  lastScan: Date | null;
}) {
  const age = lastScan ? Math.round((Date.now() - lastScan.getTime()) / 60000) : null;
  const stats = [
    { label: 'Total Devices', value: String(total), color: '' },
    { label: 'Online',        value: String(online), color: 'text-emerald-400' },
    { label: 'Saved Codes',   value: String(codes),  color: 'text-sky-400' },
    { label: 'Last Scan',     value: age !== null ? `${age}m ago` : '—', color: 'text-slate-400', small: true },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {stats.map(s => (
        <div key={s.label} className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-3.5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">{s.label}</div>
          <div className={`font-bold ${s.small ? 'text-sm mt-1' : 'text-2xl'} ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function DeviceRow({ device }: { device: Device }) {
  const { openPanel } = usePanel();

  const { data: pingData } = useQuery({
    queryKey: ['ping', device.ip],
    queryFn: () => pingDevice(device.ip),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const isOffline = pingData !== undefined && pingData.status !== 'online';

  return (
    <tr
      className={`border-b border-slate-800/50 dark:border-slate-200/50 hover:bg-slate-800/30 dark:hover:bg-slate-100/50 transition-colors cursor-pointer ${isOffline ? 'opacity-50' : ''}`}
      onClick={() => openPanel(device, 'ir')}
    >
      <td className="px-4 py-3">
        <div className="font-semibold text-sm text-slate-100 dark:text-slate-900">{device.name}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{device.type}</div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="blue">{device.type}</Badge>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-400">{device.ip}</td>
      <td className="px-4 py-3 font-mono text-xs text-slate-400 hidden md:table-cell">{device.mac}</td>
      <td className="px-4 py-3">
        {pingData === undefined
          ? <Badge variant="gray" dot>Checking…</Badge>
          : pingData.status === 'online'
            ? <Badge variant="green" dot>Online</Badge>
            : <Badge variant="gray" dot>Offline</Badge>}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ir"   disabled={isOffline} onClick={() => openPanel(device, 'ir')}>
            <Wifi size={11} /> IR
          </Button>
          <Button size="sm" variant="rf"   disabled={isOffline} onClick={() => openPanel(device, 'rf')}>RF</Button>
          <Button size="sm" variant="ghost" disabled={isOffline} onClick={() => openPanel(device, 'send')}>Send</Button>
          <Button size="sm" variant="ghost" disabled={isOffline} onClick={() => openPanel(device, 'send')}
            title="Read temperature">
            <Thermometer size={11} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function DevicesPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const qc = useQueryClient();
  const { isOpen } = usePanel();

  const { data: devices = [], isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['devices'],
    queryFn: () => fetchDevices(true),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['codes'],
    queryFn: async () => {
      const r = await fetch('/api/codes');
      if (!r.ok) return [];
      return r.json();
    },
  });

  const rescan = () => qc.invalidateQueries({ queryKey: ['devices'] });

  const saveMut = useMutation({
    mutationFn: () => saveDevices(devices as Device[]),
    onSuccess: () => addToast('success', 'Devices saved to file'),
    onError:   () => addToast('error',   'Failed to save devices'),
  });

  const loadMut = useMutation({
    mutationFn: loadDevices,
    onSuccess: data => {
      qc.setQueryData(['devices'], data);
      addToast('success', `Loaded ${data.length} device(s) from file`);
    },
    onError: () => addToast('error', 'Failed to load devices'),
  });

  const lastScan = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const codesCount = Array.isArray(codes) ? codes.length : 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title="Devices"
        subtitle="Broadlink devices on your network"
        onMenuClick={ctx.onMenuClick}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => loadMut.mutate()} disabled={loadMut.isPending}>
              <Upload size={12} /> Load
            </Button>
            <Button size="sm" variant="secondary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending || (devices as Device[]).length === 0}>
              <Save size={12} /> Save
            </Button>
            <Button size="sm" variant="primary" onClick={rescan} disabled={isFetching}>
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Rescan
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        <StatsRow
          total={(devices as Device[]).length}
          online={(devices as Device[]).length}
          codes={codesCount}
          lastScan={lastScan}
        />

        {isFetching && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-xl bg-sky-500/5 border border-sky-500/20 text-sky-400 text-sm">
            <RefreshCw size={14} className="animate-spin flex-shrink-0" />
            <span>Scanning network for Broadlink devices…</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discovered Devices</span>
          <Badge variant="blue" dot>{(devices as Device[]).length} device{(devices as Device[]).length !== 1 ? 's' : ''}</Badge>
        </div>

        <div className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 dark:border-slate-200">
                {['Device', 'Type', 'IP Address', 'MAC Address', 'Status', 'Actions'].map(h => (
                  <th key={h}
                    className={`text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-2.5 ${h === 'MAC Address' ? 'hidden md:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(devices as Device[]).length === 0 && !isFetching ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-12 text-sm">
                    No devices found. Click <strong>Rescan</strong> to search your network.
                  </td>
                </tr>
              ) : (
                (devices as Device[]).map((d: Device) => <DeviceRow key={d.mac} device={d} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && <CommandPanel />}
    </div>
  );
}
