import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
      ${toast.type === 'success'
        ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
        : 'bg-slate-900 border-red-500/30 text-red-400'}`}
    >
      {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      <span className="text-slate-200">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="ml-2 text-slate-500 hover:text-slate-300">
        <X size={14} />
      </button>
    </div>
  );
}

// Simple module-level singleton — sufficient for this app's single-window scope
let _setToasts: Dispatch<SetStateAction<ToastMessage[]>> | null = null;
let _counter = 0;

export function addToast(type: ToastType, message: string) {
  _setToasts?.(prev => [...prev, { id: ++_counter, type, message }]);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  _setToasts = setToasts;

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
    </div>
  );
}
