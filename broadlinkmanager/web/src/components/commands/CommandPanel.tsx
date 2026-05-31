import { X } from 'lucide-react';
import { usePanel } from '@/contexts/PanelContext';
import { IrLearnTab } from './IrLearnTab';
import { RfLearnTab } from './RfLearnTab';
import { SendTab } from './SendTab';

type Tab = 'ir' | 'rf' | 'send';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ir',   label: 'IR Code' },
  { id: 'rf',   label: 'RF Code' },
  { id: 'send', label: 'Send'    },
];

export function CommandPanel() {
  const { device, activeTab, setTab, closePanel, prefilledCode } = usePanel();
  if (!device) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-30" onClick={closePanel} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm z-40 flex flex-col
        bg-slate-900 dark:bg-slate-50 border-l border-slate-800 dark:border-slate-200 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 dark:border-slate-200 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm">
            📡
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-100 dark:text-slate-900">{device.name}</div>
            <div className="text-xs font-mono text-slate-500">{device.ip} · {device.mac}</div>
          </div>
          <button
            onClick={closePanel}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2.5 border-b border-slate-800 dark:border-slate-200 bg-slate-950/50 dark:bg-slate-100/50 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${activeTab === t.id
                  ? t.id === 'rf' ? 'bg-violet-500 text-white' : 'bg-sky-500 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'ir'   && <IrLearnTab device={device} />}
          {activeTab === 'rf'   && <RfLearnTab device={device} />}
          {activeTab === 'send' && <SendTab device={device} prefilledCode={prefilledCode} />}
        </div>
      </div>
    </>
  );
}
