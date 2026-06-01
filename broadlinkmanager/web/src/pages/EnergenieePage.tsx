import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { generateEnergeniCode } from '@/lib/codegen';
import { createCode } from '@/api/codes';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/components/ui/Toast';

export function EnergenieePage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const qc = useQueryClient();
  const [socket, setSocket] = useState<1 | 2 | 3 | 4>(1);
  const [on, setOn] = useState(true);
  const [result, setResult] = useState('');
  const [codeName, setCodeName] = useState('');

  const saveMut = useMutation({
    mutationFn: () => createCode({ CodeType: 'RF', CodeName: codeName, Code: result }),
    onSuccess: () => {
      addToast('success', `Saved "${codeName}"`);
      qc.invalidateQueries({ queryKey: ['codes'] });
      setCodeName('');
    },
    onError: () => addToast('error', 'Failed to save'),
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Energenie Code Generator" subtitle="Generate codes for Energenie Type-D RF sockets" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl">
        <div className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Socket Number</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setSocket(n)}
                  className={`w-12 h-10 rounded-lg text-sm font-bold transition-all
                    ${socket === n ? 'bg-sky-500 text-white' : 'bg-slate-800 dark:bg-slate-200 text-slate-400 dark:text-slate-600'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Command</label>
            <div className="flex gap-2">
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  onClick={() => setOn(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${on === v
                      ? v ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-slate-800 dark:bg-slate-200 text-slate-400 dark:text-slate-600'}`}
                >
                  {v ? 'Turn On' : 'Turn Off'}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" onClick={() => setResult(generateEnergeniCode(socket, on))}>Generate</Button>
          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result}
                  className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(result); addToast('success', 'Copied'); }}
                  className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200"
                >
                  <Copy size={13} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={codeName}
                  onChange={e => setCodeName(e.target.value)}
                  placeholder="Save as…"
                  className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-300 dark:text-slate-700 outline-none"
                />
                <Button size="sm" variant="primary" disabled={!codeName || saveMut.isPending} onClick={() => saveMut.mutate()}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
