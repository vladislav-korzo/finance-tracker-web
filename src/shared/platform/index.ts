/**
 * Platform detection so the shared React app can adapt to the Tauri desktop shell.
 * `isDesktop` is also forced on by `?desktop=1` (persisted) for previewing the
 * desktop layout in a normal browser during development.
 */

type MaybeTauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
};

function getWindow(): MaybeTauriWindow | undefined {
  return typeof window !== 'undefined' ? (window as MaybeTauriWindow) : undefined;
}

/** Running inside the Tauri desktop shell. */
export const isTauri = ((): boolean => {
  const w = getWindow();
  return !!w && ('__TAURI_INTERNALS__' in w || '__TAURI__' in w);
})();

function hasDesktopOverride(): boolean {
  const w = getWindow();
  if (!w) return false;
  try {
    if (new URLSearchParams(w.location.search).has('desktop')) {
      w.localStorage.setItem('ui.desktopMode', '1');
    }
    return w.localStorage.getItem('ui.desktopMode') === '1';
  } catch {
    return false;
  }
}

/** Use the desktop-grade layout/UX (Tauri, or the dev override). */
export const isDesktop = isTauri || hasDesktopOverride();
