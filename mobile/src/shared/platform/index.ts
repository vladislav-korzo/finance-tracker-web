/**
 * Platform detection so the shared app code can adapt to the runtime shell.
 *
 * On the web this distinguishes the Tauri desktop shell (with a `?desktop=1`
 * dev override) from a normal browser. In React Native / Expo there is no
 * Tauri shell and no DOM, so we derive the same `isTauri` / `isDesktop`
 * signals from `Platform.OS`:
 *   - `isTauri`  is always false (Tauri only exists on web).
 *   - `isDesktop` is true only on the desktop RN targets (macOS / Windows),
 *     matching the web meaning of "use the desktop-grade layout/UX".
 *
 * The public API (`isTauri`, `isDesktop`) is identical to the web module.
 */

import { Platform } from 'react-native';

/** Running inside the Tauri desktop shell. Never true on React Native. */
export const isTauri = false;

/** Use the desktop-grade layout/UX (desktop RN targets only). */
export const isDesktop = Platform.OS === 'macos' || Platform.OS === 'windows';
