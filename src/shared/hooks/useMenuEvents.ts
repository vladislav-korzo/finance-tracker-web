import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { isTauri } from '@/shared/platform';
import { useUIStore } from '@/shared/store/uiStore';

/**
 * Routes native menu-bar events (emitted from the Tauri shell as a "menu" event)
 * to the corresponding in-app action. No-op on the web build.
 */
export function useMenuEvents(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;

    void (async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen<string>('menu', (event) => {
        const action = event.payload;
        if (action === 'new-transaction') {
          useUIStore.getState().setQuickAddOpen(true);
        } else if (action === 'command-palette') {
          useUIStore.getState().setCommandOpen(true);
        } else if (action.startsWith('nav:')) {
          navigate(action.slice(4));
        }
      });
    })();

    return () => unlisten?.();
  }, [navigate]);
}
