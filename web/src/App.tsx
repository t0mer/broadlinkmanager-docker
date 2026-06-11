import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PanelProvider } from '@/contexts/PanelContext';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';
import { DevicesPage } from '@/pages/DevicesPage';
import { SavedCodesPage } from '@/pages/SavedCodesPage';
import { GeneratorPage } from '@/pages/GeneratorPage';
import { LivoloPage } from '@/pages/LivoloPage';
import { EnergenieePage } from '@/pages/EnergenieePage';
import { RepeatsPage } from '@/pages/RepeatsPage';
import { ConvertPage } from '@/pages/ConvertPage';
import { AboutPage } from '@/pages/AboutPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PanelProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/"          element={<DevicesPage />} />
                <Route path="/saved"     element={<SavedCodesPage />} />
                <Route path="/generator" element={<GeneratorPage />} />
                <Route path="/livolo"    element={<LivoloPage />} />
                <Route path="/energenie" element={<EnergenieePage />} />
                <Route path="/repeats"   element={<RepeatsPage />} />
                <Route path="/convert"   element={<ConvertPage />} />
                <Route path="/about"     element={<AboutPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </PanelProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
