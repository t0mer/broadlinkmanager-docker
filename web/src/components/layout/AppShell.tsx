import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 dark:bg-white text-slate-100 dark:text-slate-900">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Outlet context={{ onMenuClick: () => setMobileOpen(true) }} />
      </div>
    </div>
  );
}
