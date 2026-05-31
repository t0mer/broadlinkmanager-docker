import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Device } from '@/types';

type PanelTab = 'ir' | 'rf' | 'send';

interface PanelState {
  isOpen: boolean;
  device: Device | null;
  activeTab: PanelTab;
  prefilledCode: string;
}

interface PanelContextValue extends PanelState {
  openPanel: (device: Device, tab?: PanelTab, code?: string) => void;
  closePanel: () => void;
  setTab: (tab: PanelTab) => void;
}

const PanelContext = createContext<PanelContextValue>({
  isOpen: false,
  device: null,
  activeTab: 'ir',
  prefilledCode: '',
  openPanel: () => {},
  closePanel: () => {},
  setTab: () => {},
});

export function PanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PanelState>({
    isOpen: false,
    device: null,
    activeTab: 'ir',
    prefilledCode: '',
  });

  const openPanel = (device: Device, tab: PanelTab = 'ir', code = '') => {
    setState({ isOpen: true, device, activeTab: tab, prefilledCode: code });
  };

  const closePanel = () => setState(s => ({ ...s, isOpen: false, prefilledCode: '' }));

  const setTab = (tab: PanelTab) => setState(s => ({ ...s, activeTab: tab }));

  return (
    <PanelContext.Provider value={{ ...state, openPanel, closePanel, setTab }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  return useContext(PanelContext);
}
