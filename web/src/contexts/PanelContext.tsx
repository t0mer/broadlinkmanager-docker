import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { addToast } from '@/components/ui/Toast';
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

  // Persists across renders without triggering re-renders
  const lastDeviceRef = useRef<Device | null>(null);

  const openPanel = (device: Device, tab: PanelTab = 'ir', code = '') => {
    const isReal = Boolean(device.ip);

    if (isReal) {
      // Real device selected — remember it for future "Send from Saved Codes"
      lastDeviceRef.current = device;
      setState({ isOpen: true, device, activeTab: tab, prefilledCode: code });
    } else {
      // Called from Saved Codes — fall back to last used device
      const fallback = lastDeviceRef.current;
      if (!fallback) {
        addToast('error', 'Select a device first from the Devices page');
        return;
      }
      setState({ isOpen: true, device: fallback, activeTab: tab, prefilledCode: code });
    }
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
