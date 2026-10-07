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
const isoDate = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

async function main() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authErr) throw authErr;
  const uid = auth.user.id;

  // --- Category monthly limits ---
  const limits = {
    Продукты: 600,
    'Кафе и рестораны': 300,
    Транспорт: 250,
    Развлечения: 200,
  };
  for (const [name, limit] of Object.entries(limits)) {
    const { error } = await supabase
      .from('categories')
      .update({ monthly_limit: limit })
      .eq('user_id', uid)
      .eq('name', name)
      .eq('type', 'expense');
    if (error) console.log('limit error', name, error.message);
  }
  console.log('Set monthly limits on', Object.keys(limits).length, 'categories');

  // --- Transfers between two BYN accounts ---
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id,name,currency')
    .eq('user_id', uid);
  const byn = (accounts ?? []).filter((a) => a.currency === 'BYN');
  if (byn.length >= 2) {
    const from = byn.find((a) => a.name === 'Основной счёт') ?? byn[0];
    const to = byn.find((a) => a.name === 'Сберегательный') ?? byn[1];
    // Avoid duplicating on re-run: only insert if no transfers yet.
    const { data: existing } = await supabase.from('transfers').select('id').eq('user_id', uid).limit(1);
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('transfers').insert([
        { user_id: uid, from_account_id: from.id, to_account_id: to.id, amount: 500, occurred_at: isoDate(3), note: 'В копилку' },
        { user_id: uid, from_account_id: from.id, to_account_id: to.id, amount: 250, occurred_at: isoDate(12), note: 'Откладываю на отпуск' },
      ]);
      if (error) console.log('transfer error', error.message);
      else console.log('Created 2 transfers', from.name, '→', to.name);
    } else {
      console.log('Transfers already exist — skipped');
    }
  } else {
    console.log('Need 2 BYN accounts for a transfer; found', byn.length);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
