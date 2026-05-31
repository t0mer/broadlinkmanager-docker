import { useOutletContext } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
export function DevicesPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Devices" subtitle="Broadlink devices on your network" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 p-6 text-slate-400">Devices page — coming soon</div>
    </div>
  );
}
