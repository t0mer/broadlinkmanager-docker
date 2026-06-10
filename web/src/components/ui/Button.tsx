import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ir' | 'rf';
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-sky-500 hover:bg-sky-400 text-white',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-700 dark:border-slate-200',
  ghost:     'bg-transparent hover:bg-slate-800 text-slate-400 dark:hover:bg-slate-100 dark:text-slate-500',
  danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  ir:        'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400',
  rf:        'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-md',
  md: 'px-3.5 py-1.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({ variant = 'secondary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
