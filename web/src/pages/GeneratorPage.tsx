import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw } from 'lucide-react';
import { generateRfCode } from '@/lib/codegen';
import { createCode } from '@/api/codes';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/components/ui/Toast';

export function GeneratorPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const qc = useQueryClient();
  const [type, setType] = useState<'RF433' | 'RF315'>('RF433');
  const [result, setResult] = useState<{ regular: string; long: string } | null>(null);
  const [codeName, setCodeName] = useState('');

  const saveMut = useMutation({
    mutationFn: (code: string) => createCode({ CodeType: 'RF', CodeName: codeName, Code: code }),
    onSuccess: () => {
      addToast('success', `Saved "${codeName}"`);
      qc.invalidateQueries({ queryKey: ['codes'] });
      setCodeName('');
    },
    onError: () => addToast('error', 'Failed to save'),
  });

  const generate = () => setResult(generateRfCode(type));
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', 'Copied to clipboard');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="RF Code Generator" subtitle="Generate random 433/315 MHz RF codes" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl">
        <div className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Frequency</label>
            <div className="flex gap-2">
              {(['RF433', 'RF315'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${type === t ? 'bg-sky-500 text-white' : 'bg-slate-800 dark:bg-slate-200 text-slate-400 dark:text-slate-600'}`}
                >
                  {t === 'RF433' ? '433 MHz' : '315 MHz'}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={generate}>
            <RefreshCw size={14} /> Generate Code
          </Button>

          {result && (
            <div className="flex flex-col gap-3">
              {[{ label: 'Regular Repeat', code: result.regular }, { label: 'Long Repeat', code: result.long }].map(r => (
                <div key={r.label}>
                  <div className="text-xs text-slate-500 mb-1">{r.label}</div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={r.code}
                      className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none"
                    />
                    <button
                      onClick={() => copy(r.code)}
                      className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 items-center">
                <input
                  value={codeName}
                  onChange={e => setCodeName(e.target.value)}
                  placeholder="Save as…"
                  className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-300 dark:text-slate-700 outline-none"
                />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!codeName || saveMut.isPending}
                  onClick={() => saveMut.mutate(result.regular)}
                >
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
