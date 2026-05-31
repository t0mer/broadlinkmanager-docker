import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { generateLivoloCode } from '@/lib/codegen';
import { createCode } from '@/api/codes';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/components/ui/Toast';

const BUTTON_OPTIONS = [
  { value: 90,  label: 'On only (Scene 1)' },
  { value: 40,  label: 'On/Off toggle' },
  { value: 106, label: 'Off only' },
];

export function LivoloPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const qc = useQueryClient();
  const [remoteId, setRemoteId] = useState('7400');
  const [buttonCode, setButtonCode] = useState(90);
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

  const generate = () => {
    const id = parseInt(remoteId, 10);
    if (isNaN(id) || id < 1 || id > 65500) {
      addToast('error', 'Remote ID must be 1–65500');
      return;
    }
    setResult(generateLivoloCode(id, buttonCode));
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Livolo Code Generator" subtitle="Generate RF codes for Livolo switches" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl">
        <div className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Remote ID (1–65500)</label>
            <input
              value={remoteId}
              onChange={e => setRemoteId(e.target.value)}
              placeholder="7400"
              className="w-full bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-200 dark:text-slate-800 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Button</label>
            <select
              value={buttonCode}
              onChange={e => setButtonCode(Number(e.target.value))}
              className="w-full bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-200 dark:text-slate-800 outline-none"
            >
              {BUTTON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Button variant="primary" onClick={generate}>Generate</Button>
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
