import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Send, Download } from 'lucide-react';
import { fetchAllCodes, createCode, updateCode, deleteCode } from '@/api/codes';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { addToast } from '@/components/ui/Toast';
import { usePanel } from '@/contexts/PanelContext';
import type { Code, CodeInput } from '@/types';

const PAGE_SIZE = 10;

interface CodeFormProps {
  initial?: Code;
  onSave: (data: CodeInput) => void;
  onCancel: () => void;
  saving: boolean;
}

function CodeForm({ initial, onSave, onCancel, saving }: CodeFormProps) {
  const [type, setType] = useState(initial?.CodeType ?? 'IR');
  const [name, setName] = useState(initial?.CodeName ?? '');
  const [code, setCode] = useState(initial?.Code ?? '');

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-800/50 dark:bg-slate-100 rounded-xl border border-slate-700 dark:border-slate-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full bg-slate-900 dark:bg-white border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-200 dark:text-slate-800 outline-none"
          >
            <option>IR</option>
            <option>RF</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. TV Power"
            className="w-full bg-slate-900 dark:bg-white border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-200 dark:text-slate-800 outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Code (Base64 or Hex)</label>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          rows={2}
          placeholder="JgBIAAABK5QQ…"
          className="w-full bg-slate-900 dark:bg-white border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none focus:border-sky-500 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!name || !code || saving}
          onClick={() => onSave({ CodeType: type, CodeName: name, Code: code })}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export function SavedCodesPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const qc = useQueryClient();
  const { openPanel } = usePanel();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'IR' | 'RF'>('all');
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: codes = [] } = useQuery({
    queryKey: ['codes'],
    queryFn: fetchAllCodes,
  });

  const createMut = useMutation({
    mutationFn: createCode,
    onSuccess: () => {
      addToast('success', 'Code saved');
      qc.invalidateQueries({ queryKey: ['codes'] });
      setShowAdd(false);
    },
    onError: () => addToast('error', 'Failed to save code'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CodeInput }) => updateCode(id, data),
    onSuccess: () => {
      addToast('success', 'Code updated');
      qc.invalidateQueries({ queryKey: ['codes'] });
      setEditId(null);
    },
    onError: () => addToast('error', 'Failed to update code'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCode,
    onSuccess: () => {
      addToast('success', 'Code deleted');
      qc.invalidateQueries({ queryKey: ['codes'] });
    },
    onError: () => addToast('error', 'Failed to delete code'),
  });

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['CodeId', 'CodeType', 'CodeName', 'Code'],
      ...(codes as Code[]).map(c => [c.CodeId, c.CodeType, c.CodeName, c.Code]),
    ];
    const csv = rows.map(r => r.map(String).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'broadlink-codes.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filtered = (codes as Code[]).filter(c => {
    const matchType = typeFilter === 'all' || c.CodeType === typeFilter;
    const matchSearch = !search || c.CodeName.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title="Saved Codes"
        subtitle={`${(codes as Code[]).length} IR/RF codes`}
        onMenuClick={ctx.onMenuClick}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={exportCsv}>
              <Download size={12} /> Export CSV
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowAdd(true)}>
              <Plus size={12} /> Add Code
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        {showAdd && (
          <div className="mb-4">
            <CodeForm
              onSave={d => createMut.mutate(d)}
              onCancel={() => setShowAdd(false)}
              saving={createMut.isPending}
            />
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search codes…"
            className="flex-1 min-w-0 bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-300 dark:text-slate-700 outline-none focus:border-sky-500"
          />
          {(['all', 'IR', 'RF'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${typeFilter === t
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 dark:bg-slate-200 text-slate-400 dark:text-slate-600'}`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 dark:border-slate-200">
                {['#', 'Name', 'Type', 'Code Preview', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-12 text-sm">
                    No codes found.
                  </td>
                </tr>
              ) : paged.map((c: Code) =>
                editId === c.CodeId ? (
                  <tr key={c.CodeId} className="border-b border-slate-800/50">
                    <td colSpan={5} className="px-4 py-3">
                      <CodeForm
                        initial={c}
                        onSave={d => updateMut.mutate({ id: c.CodeId, data: d })}
                        onCancel={() => setEditId(null)}
                        saving={updateMut.isPending}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={c.CodeId}
                    className="border-b border-slate-800/50 dark:border-slate-200/50 hover:bg-slate-800/20 dark:hover:bg-slate-100/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{c.CodeId}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-100 dark:text-slate-900">{c.CodeName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.CodeType === 'RF' ? 'purple' : 'blue'}>{c.CodeType}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[160px] truncate">
                      {c.Code.slice(0, 30)}…
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ir"
                          onClick={() => openPanel(
                            { name: '', type: '', ip: '', mac: '' },
                            'send',
                            c.Code
                          )}
                        >
                          <Send size={11} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(c.CodeId)}>
                          <Edit2 size={11} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteMut.mutate(c.CodeId)}
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 size={11} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 dark:border-slate-200">
              <span className="text-xs text-slate-500">{filtered.length} codes</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>
                  ← Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all
                      ${safePage === i ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-800 dark:hover:bg-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <Button size="sm" variant="ghost" disabled={safePage === totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
