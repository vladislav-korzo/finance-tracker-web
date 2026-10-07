import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const EMAIL = process.env.SEED_EMAIL || 'claude.finance.demo@gmail.com';
const PASSWORD = process.env.SEED_PASSWORD || 'PreviewDemo!2026';

async function main() {
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authErr) {
    console.error('Auth failed:', authErr.message);
    process.exit(1);
  }

  const checks = [
    ['budget_goals.currency', () => supabase.from('budget_goals').select('currency').limit(1)],
    ['categories.monthly_limit', () => supabase.from('categories').select('monthly_limit').limit(1)],
    ['transfers (table)', () => supabase.from('transfers').select('id').limit(1)],
  ];

  for (const [label, run] of checks) {
    const { error } = await run();
    if (!error) console.log(`OK  ${label} — applied`);
    else console.log(`MISSING  ${label} — NOT applied  (${error.message})`);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
