import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onMenuClick: () => void;
}

export function Topbar({ title, subtitle, actions, onMenuClick }: TopbarProps) {
  return (
    <header className="flex items-center gap-3 h-14 px-4 border-b border-slate-800 dark:border-slate-200 bg-slate-900 dark:bg-slate-50 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-100 dark:text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
