import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/shared/lib/supabase';

type AuthState = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Merge keys into Supabase user_metadata (profile, onboarding, prefs). */
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
};

let authListenerAttached = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      initialized: true,
    });
    if (!authListenerAttached) {
      authListenerAttached = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  updateProfile: async (data) => {
    const { data: res, error } = await supabase.auth.updateUser({ data });
    if (error) throw error;
    set({ user: res.user });
  },
}));
