import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, Coffee } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';

export function AboutPage() {
  const ctx = useOutletContext<{ onMenuClick: () => void }>();
  const { data } = useQuery({
    queryKey: ['version'],
    queryFn: async () => {
      const r = await fetch('/api/version');
      return r.json() as Promise<{ version: string }>;
    },
    staleTime: Infinity,
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="About" subtitle="Broadlink Manager" onMenuClick={ctx.onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-sky-500/20">
              B
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 dark:text-slate-900">Broadlink Manager</h2>
              <p className="text-sm text-slate-500">Version {data?.version ?? '…'}</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 dark:text-slate-600 leading-relaxed">
            A web-based manager for Broadlink IR/RF devices. Discover devices on your network,
            learn and send IR and RF codes, manage your code library, and generate codes for
            supported third-party devices.
          </p>

          <div className="flex flex-col gap-2">
            <a
              href="https://github.com/t0mer/broadlinkmanager-docker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              <GitBranch size={16} /> github.com/t0mer/broadlinkmanager-docker
            </a>
            <span className="text-xs text-slate-500">By Tomer Klein · tomer.klein@gmail.com</span>
          </div>

          <div className="border-t border-slate-800 dark:border-slate-200 pt-4">
            <p className="text-xs text-slate-500 mb-3">Like this project? Buy me a coffee ☕</p>
            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
              <input type="hidden" name="cmd" value="_s-xclick" />
              <input type="hidden" name="hosted_button_id" value="G3LNNZEUT8WLW" />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Coffee size={14} /> Donate via PayPal
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
