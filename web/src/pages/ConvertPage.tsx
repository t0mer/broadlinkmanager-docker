import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { hexToBase64, base64ToHex } from '@/lib/codegen';
import { Topbar } from '@/components/layout/Topbar';
import { addToast } from '@/components/ui/Toast';

function ConvertPanel({ label, input, output, onChange }: {
  label: string;
  input: string;
  output: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      <textarea
        value={input}
        onChange={e => onChange(e.target.value)}
        rows={5}
        placeholder="Paste here…"
        className="w-full bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none focus:border-sky-500 resize-none"
      />
      {output && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Result</label>
            <button
              onClick={() => { navigator.clipboard.writeText(output); addToast('success', 'Copied'); }}
              className="p-1 rounded text-slate-500 hover:text-slate-300"
            >
              <Copy size={12} />
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            rows={5}
            className="w-full bg-slate-800/50 dark:bg-slate-50 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 dark:text-slate-600 outline-none resize-none"
          />
        </div>
      )}
    </div>
  );
}

export function ConvertPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const [hex, setHex] = useState('');
  const [b64, setB64] = useState('');

  const hexOut = hex ? (() => { try { return hexToBase64(hex); } catch { return 'Invalid hex'; } })() : '';
  const b64Out = b64 ? (() => { try { return base64ToHex(b64); } catch { return 'Invalid Base64'; } })() : '';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Convert Hex ↔ Base64" subtitle="Live conversion between formats" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col md:flex-row gap-4 max-w-4xl">
          <div className="flex-1 bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-5">
            <ConvertPanel label="Hex → Base64" input={hex} output={hexOut} onChange={setHex} />
          </div>
          <div className="flex-1 bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-5">
            <ConvertPanel label="Base64 → Hex" input={b64} output={b64Out} onChange={setB64} />
          </div>
        </div>
      </div>
    </div>
  );
}
