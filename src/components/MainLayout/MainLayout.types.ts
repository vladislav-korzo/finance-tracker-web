import type { ReactNode } from 'react';

export type MainLayoutProps = {
  userEmail: string;
  userDisplayName: string;
  /** Avatar photo URL from the user's profile; falls back to initials when empty. */
  avatarUrl?: string;
  pageTitle: string;
  headerActions?: ReactNode;
  children: ReactNode;
  onSignOut: () => void | Promise<void>;
};
