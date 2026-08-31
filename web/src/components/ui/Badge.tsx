import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  children: ReactNode;
  dot?: boolean;
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  blue:   'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  green:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  red:    'bg-red-500/10 text-red-400 border border-red-500/20',
  yellow: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  purple: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  gray:   'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

export function Badge({ variant = 'blue', children, dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
