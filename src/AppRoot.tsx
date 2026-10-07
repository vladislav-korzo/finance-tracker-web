import { useEffect } from 'react';

import { App } from '@/app/App';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { Toaster } from '@/components/Toaster/Toaster';
import { useAuthStore } from '@/shared/store/authStore';
import { useThemeStore } from '@/shared/theme/themeStore';

export function AppRoot() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeTheme = useThemeStore((s) => s.initialize);

  useEffect(() => {
    initializeTheme();
    void initialize();
  }, [initialize, initializeTheme]);

  return (
    <>
      <App />
      <Toaster />
      <ConfirmDialog />
    </>
  );
}
