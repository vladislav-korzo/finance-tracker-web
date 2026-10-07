import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/shared/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
/** Prefer Dashboard → API Keys → Publishable (`sb_publishable_…`). Legacy JWT anon still works. */
const publicApiKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !publicApiKey) {
  console.warn(
    'Не заданы EXPO_PUBLIC_SUPABASE_URL или публичный ключ API. Укажите EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (рекомендуется) или EXPO_PUBLIC_SUPABASE_ANON_KEY (устаревший) в .env.'
  );
}

export const supabase = createClient<Database>(url ?? '', publicApiKey ?? '', {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
