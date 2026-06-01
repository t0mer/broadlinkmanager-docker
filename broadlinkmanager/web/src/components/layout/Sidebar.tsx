import { NavLink } from 'react-router-dom';
import {
  Monitor, BookMarked, Radio, ToggleLeft, Zap,
  RefreshCw, ArrowLeftRight, Info, Sun, Moon, X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_ITEMS = [
  { to: '/',          icon: Monitor,        label: 'Devices',       title: 'Devices' },
  { to: '/saved',     icon: BookMarked,     label: 'Saved Codes',   title: 'Saved Codes' },
  { to: '/generator', icon: Radio,          label: 'RF Generator',  title: 'RF Code Generator' },
  { to: '/livolo',    icon: ToggleLeft,     label: 'Livolo',        title: 'Livolo Code Generator' },
  { to: '/energenie', icon: Zap,            label: 'Energenie',     title: 'Energenie Generator' },
  { to: '/repeats',   icon: RefreshCw,      label: 'Repeats',       title: 'Change Repeats' },
  { to: '/convert',   icon: ArrowLeftRight, label: 'Convert',       title: 'Hex ↔ Base64' },
  { to: '/about',     icon: Info,           label: 'About',         title: 'About' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function NavItems({ onClose }: { onClose: () => void }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-12 mb-4 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-500/20">
          B
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, title }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={title}
            onClick={onClose}
            className={({ isActive }) =>
              `relative group flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 overflow-hidden cursor-pointer
               ${isActive
                 ? 'bg-sky-500/10 text-sky-400 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-sky-500 before:rounded-r'
                 : 'text-slate-500 hover:text-slate-300 dark:text-slate-400 dark:hover:text-slate-700 hover:bg-slate-800/60 dark:hover:bg-slate-200/60'}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap
              md:opacity-0 md:max-w-0 md:overflow-hidden
              md:group-hover:opacity-100 md:group-hover:max-w-xs
              transition-all duration-200">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="flex-shrink-0 mt-auto pt-3 border-t border-slate-800 dark:border-slate-200">
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl
            text-slate-500 hover:text-slate-300 dark:text-slate-400 dark:hover:text-slate-700
            hover:bg-slate-800/60 dark:hover:bg-slate-200/60 transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-sm font-medium md:hidden">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: icon-only sidebar that expands on hover */}
      <aside className="hidden md:flex flex-col w-14 hover:w-52 transition-all duration-200 ease-in-out overflow-hidden
        bg-slate-900 dark:bg-slate-50 border-r border-slate-800 dark:border-slate-200
        flex-shrink-0 h-full px-2 py-3 group">
        <NavItems onClose={() => {}} />
      </aside>

      {/* Mobile: full overlay drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative z-10 flex flex-col w-64 h-full
            bg-slate-900 dark:bg-slate-50 border-r border-slate-800 dark:border-slate-200
            px-3 py-3">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 p-1 rounded-lg"
            >
              <X size={18} />
            </button>
            <NavItems onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
