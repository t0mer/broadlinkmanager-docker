import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { sendCommand } from '@/api/commands';
import { fetchAllCodes } from '@/api/codes';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { addToast } from '@/components/ui/Toast';
import type { Device, Code } from '@/types';

export function SendTab({ device, prefilledCode = '' }: { device: Device; prefilledCode?: string }) {
  const [code, setCode] = useState(prefilledCode);
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null);
  const [filter, setFilter] = useState('');

  const { data: codes = [] } = useQuery({ queryKey: ['codes'], queryFn: fetchAllCodes });

  const sendMut = useMutation({
    mutationFn: (c: string) => sendCommand(device.ip, device.mac, device.type, c),
    onSuccess: data => {
      if (data.success === 1) {
        setLastResult('success');
        addToast('success', 'Command sent');
      } else {
        setLastResult('error');
        addToast('error', data.message || 'Send failed');
      }
    },
    onError: () => {
      setLastResult('error');
      addToast('error', 'Send failed');
    },
  });

  const filtered = (codes as Code[]).filter(c =>
    !filter || c.CodeName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paste Code (Base64 or Hex)</label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="JgBIAAABK5QQ..."
            className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none focus:border-sky-500"
          />
          <Button size="sm" variant="primary" disabled={!code || sendMut.isPending} onClick={() => sendMut.mutate(code)}>
            <Send size={12} /> Send
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600">
        <div className="flex-1 h-px bg-slate-800 dark:bg-slate-200" />
        or pick from saved
        <div className="flex-1 h-px bg-slate-800 dark:bg-slate-200" />
      </div>

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter codes…"
        className="bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-300 dark:text-slate-700 outline-none focus:border-sky-500"
      />

      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">No saved codes yet.</div>
        ) : (
          filtered.map((c: Code) => (
            <div key={c.CodeId}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 dark:bg-slate-100 border border-slate-800 dark:border-slate-200 hover:border-sky-500/30 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: c.CodeType === 'RF' ? '#a78bfa' : '#38bdf8' }} />
              <span className="flex-1 text-xs text-slate-300 dark:text-slate-700 truncate">{c.CodeName}</span>
              <Badge variant={c.CodeType === 'RF' ? 'purple' : 'blue'}>{c.CodeType}</Badge>
              <Button
                size="sm"
                variant={c.CodeType === 'RF' ? 'rf' : 'ir'}
                disabled={sendMut.isPending}
                onClick={() => sendMut.mutate(c.Code)}
              >
                Send
              </Button>
            </div>
          ))
        )}
      </div>

      {lastResult && (
        <StatusBanner
          status={lastResult}
          message={lastResult === 'success'
            ? `Command sent to ${device.name}`
            : 'Send failed — check device is online'}
        />
      )}
    </div>
  );
}
