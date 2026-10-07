import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { NAV_ITEMS } from '@/components/MainLayout/navItems';
import { useUIStore } from '@/shared/store/uiStore';

/**
 * App-wide keyboard shortcuts, desktop-first (also active on web where the
 * browser doesn't reserve the key):
 *   ⌘/Ctrl + N      → quick-add transaction
 *   ⌘/Ctrl + 1..7   → jump to a primary section
 * ⌘/Ctrl + K (command palette) is owned by the CommandPalette component.
 */
export function useAppShortcuts(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;

      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        useUIStore.getState().setQuickAddOpen(true);
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const item = NAV_ITEMS[Number(e.key) - 1];
        if (item) {
          e.preventDefault();
          navigate(item.to);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);
}
