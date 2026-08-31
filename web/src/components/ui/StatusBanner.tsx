interface StatusBannerProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'rf';
  message: string;
}

const styles: Record<StatusBannerProps['status'], string> = {
  idle:    'bg-slate-800 border-slate-700 text-slate-400',
  loading: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  error:   'bg-red-500/10 border-red-500/20 text-red-400',
  rf:      'bg-violet-500/10 border-violet-500/20 text-violet-400',
};

const dotStyles: Record<StatusBannerProps['status'], string> = {
  idle:    'bg-slate-500',
  loading: 'bg-sky-400 animate-pulse',
  success: 'bg-emerald-400',
  error:   'bg-red-400 animate-pulse',
  rf:      'bg-violet-400 animate-pulse',
};

export function StatusBanner({ status, message }: StatusBannerProps) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${styles[status]}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotStyles[status]}`} />
      <span>{message}</span>
    </div>
  );
}
