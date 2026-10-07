/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  /** New dashboard: Publishable key (`sb_publishable_…`). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Legacy tab: anon JWT. Used if publishable is unset. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
