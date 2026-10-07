import type { User } from '@supabase/supabase-js';

export type Profile = {
  firstName: string;
  lastName: string;
  /** Public URL of the uploaded avatar photo ('' when none). */
  avatarUrl: string;
  onboarded: boolean;
  currencies: string[];
};

/** Reads the user's profile from Supabase user_metadata with safe fallbacks. */
export function getProfile(user: User | null): Profile {
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return {
    firstName: typeof m.firstName === 'string' ? m.firstName : '',
    lastName: typeof m.lastName === 'string' ? m.lastName : '',
    avatarUrl: typeof m.avatarUrl === 'string' ? m.avatarUrl : '',
    onboarded: m.onboarded === true,
    currencies: Array.isArray(m.currencies) ? (m.currencies as string[]) : [],
  };
}

/** Friendly display name: full name if set, otherwise a title-cased email local part. */
export function profileDisplayName(user: User | null): string {
  const p = getProfile(user);
  const full = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  const local = user?.email?.split('@')[0] ?? '';
  if (!local) return 'Пользователь';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Two-letter initials for the avatar fallback. */
export function profileInitials(user: User | null): string {
  const p = getProfile(user);
  if (p.firstName) {
    return (p.firstName.charAt(0) + (p.lastName.charAt(0) || '')).toUpperCase();
  }
  const local = user?.email?.split('@')[0] ?? '?';
  return (local.slice(0, 2) || '?').toUpperCase();
}
