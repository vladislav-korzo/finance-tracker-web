import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/shared/types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
/** Prefer Dashboard → API Keys → Publishable (`sb_publishable_…`). Legacy JWT anon still works. */
const publicApiKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !publicApiKey) {
  console.warn(
    'Не заданы VITE_SUPABASE_URL или публичный ключ API. Укажите VITE_SUPABASE_PUBLISHABLE_KEY (рекомендуется) или VITE_SUPABASE_ANON_KEY (устаревший) в .env.'
  );
}

export const supabase = createClient<Database>(url ?? '', publicApiKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
