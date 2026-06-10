import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { learnIr } from '@/api/commands';
import { createCode } from '@/api/codes';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/components/ui/Toast';
import type { Device } from '@/types';

export function IrLearnTab({ device }: { device: Device }) {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [codeName, setCodeName] = useState('');
  const [copied, setCopied] = useState(false);

  const learnMut = useMutation({
    mutationFn: () => learnIr(device.ip, device.mac, device.type),
    onSuccess: data => {
      if (data.success === 1) {
        setCode(data.data);
      } else {
        addToast('error', data.message || 'No signal received');
      }
    },
    onError: () => addToast('error', 'IR learn request failed'),
  });

  const saveMut = useMutation({
    mutationFn: () => createCode({ CodeType: 'IR', CodeName: codeName, Code: code }),
    onSuccess: () => {
      addToast('success', `Saved "${codeName}"`);
      qc.invalidateQueries({ queryKey: ['codes'] });
      setCode('');
      setCodeName('');
    },
    onError: () => addToast('error', 'Failed to save code'),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const status = learnMut.isPending ? 'loading'
    : code          ? 'success'
    : learnMut.isError ? 'error'
    : 'idle';

  const statusMsg = learnMut.isPending
    ? 'Waiting for IR signal… Point remote and press a button.'
    : code
      ? 'IR code captured.'
      : learnMut.isError
        ? 'Failed — try again.'
        : 'Click "Learn IR" then press a button on your remote.';

  return (
    <div className="flex flex-col gap-3 p-4">
      <StatusBanner status={status} message={statusMsg} />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Captured Code</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={code}
            placeholder="Code will appear here…"
            className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none"
          />
          <button
            onClick={copy}
            disabled={!code}
            className="w-9 h-9 rounded-lg bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 flex items-center justify-center text-slate-400 disabled:opacity-30"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {code && (
        <div className="flex gap-2 items-center bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Save as:</span>
          <select className="bg-slate-900 dark:bg-white border border-slate-700 dark:border-slate-200 rounded px-2 py-1 text-xs text-slate-300 dark:text-slate-700 outline-none">
            <option>IR</option>
            <option>RF</option>
          </select>
          <input
            value={codeName}
            onChange={e => setCodeName(e.target.value)}
            placeholder="e.g. TV Power Off"
            className="flex-1 bg-slate-900 dark:bg-white border border-slate-700 dark:border-slate-200 rounded px-2 py-1 text-xs text-slate-300 dark:text-slate-700 outline-none"
          />
          <Button size="sm" variant="primary" disabled={!codeName || saveMut.isPending} onClick={() => saveMut.mutate()}>
            Save
          </Button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="lg" variant="ir" className="w-full justify-center font-bold"
          onClick={() => learnMut.mutate()} disabled={learnMut.isPending}>
          {learnMut.isPending ? 'Listening…' : code ? 'Learn Again' : 'Learn IR'}
        </Button>
        {code && (
          <Button size="sm" variant="ghost" onClick={() => setCode('')}>Clear</Button>
        )}
      </div>
    </div>
  );
}
