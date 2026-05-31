import { useOutletContext } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
export function AboutPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="About" subtitle="Broadlink Manager" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 p-6 text-slate-400">About — coming soon</div>
    </div>
  );
}
