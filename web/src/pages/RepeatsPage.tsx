import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { changeRepeats } from '@/lib/codegen';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/components/ui/Toast';

export function RepeatsPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const [input, setInput] = useState('');
  const [repeats, setRepeats] = useState('12');
  const [result, setResult] = useState('');

  const process = () => {
    try {
      const n = parseInt(repeats, 10);
      if (isNaN(n) || n < 1 || n > 255) {
        addToast('error', 'Repeats must be 1–255');
        return;
      }
      setResult(changeRepeats(input.trim(), n));
    } catch {
      addToast('error', 'Invalid Base64 code');
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Change Repeats" subtitle="Modify the repeat count in an existing code" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl">
        <div className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
              Existing Code (Base64)
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={3}
              placeholder="Paste your existing Base64 code here…"
              className="w-full bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none focus:border-sky-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
              New Repeat Count (1–255)
            </label>
            <input
              value={repeats}
              onChange={e => setRepeats(e.target.value)}
              type="number"
              min={1}
              max={255}
              className="w-32 bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-200 dark:text-slate-800 outline-none focus:border-sky-500"
            />
          </div>
          <Button variant="primary" disabled={!input} onClick={process}>
            Update Repeats
          </Button>
          {result && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Result</label>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={result}
                  rows={3}
                  className="flex-1 bg-slate-800/50 dark:bg-slate-50 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 dark:text-slate-600 outline-none resize-none"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(result); addToast('success', 'Copied'); }}
                  className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 self-start hover:text-slate-200"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
