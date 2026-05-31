import { X } from 'lucide-react';
import { usePanel } from '@/contexts/PanelContext';

export function CommandPanel() {
  const { device, closePanel } = usePanel();
  if (!device) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30" onClick={closePanel} />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm z-40 flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <div className="flex-1 text-sm font-semibold text-slate-100">{device.name}</div>
          <button onClick={closePanel} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Command panel — coming in Task 15
        </div>
      </div>
    </>
  );
}
