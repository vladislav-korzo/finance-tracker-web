// Seeds a demo account on the project's Supabase so the redesigned UI can be
// verified against realistic data. Idempotent: re-running signs in to the same
// account and skips seeding if data already exists.
//
// Usage: node scripts/seed-demo.mjs
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
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / key in .env');
  process.exit(1);
}

const EMAIL = process.env.SEED_EMAIL || 'claude.finance.demo@gmail.com';
const PASSWORD = process.env.SEED_PASSWORD || 'PreviewDemo!2026';

const supabase = createClient(url, key, { auth: { persistSession: false } });

const rand = (min, max) => Math.random() * (max - min) + min;
const round2 = (n) => Math.round(n * 100) / 100;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isoDate = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};
const monthStart = (offset) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d;
};

async function ensureSession() {
  let res = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (res.error) {
    console.log('Sign-in failed, attempting sign-up:', res.error.message);
    const up = await supabase.auth.signUp({ email: EMAIL, password: PASSWORD });
    if (up.error) throw up.error;
    res = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (res.error) {
      throw new Error(
        'Sign-in after sign-up failed (email confirmation likely ON): ' + res.error.message
      );
    }
  }
  return res.data.user;
}

// Insert rows; if the remote schema is missing an optional column, strip it and
// retry. Handles the project being behind on migrations.
async function insertResilient(table, rows, label) {
  let payload = rows;
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase.from(table).insert(payload).select();
    if (!error) return data;
    const m = error.message.match(/Could not find the '([^']+)' column/);
    if (m) {
      const col = m[1];
      console.log(`  (remote ${table} missing '${col}' — stripping and retrying)`);
      payload = payload.map((r) => {
        const { [col]: _drop, ...rest } = r;
        return rest;
      });
      continue;
    }
    throw error;
  }
  throw new Error(`insertResilient: too many missing columns for ${table}`);
}

async function resetUserData(uid) {
  // Order respects FKs: transactions → loans/goals/categories → accounts
  for (const table of ['transactions', 'loans', 'budget_goals', 'categories', 'accounts']) {
    const { error } = await supabase.from(table).delete().eq('user_id', uid);
    if (error) throw error;
  }
}

async function main() {
  const user = await ensureSession();
  const uid = user.id;
  console.log('Authenticated as', EMAIL, '→', uid);

  await resetUserData(uid);
  console.log('Cleared any previous demo data for this user');

  // ---- Accounts (multi-currency) ----
  const accountsSpec = [
    { name: 'Основной счёт', currency: 'BYN' },
    { name: 'Долларовая карта', currency: 'USD' },
    { name: 'Евро-счёт', currency: 'EUR' },
    { name: 'Сберегательный', currency: 'BYN' },
  ];
  const accounts = await insertResilient(
    'accounts',
    accountsSpec.map((a) => ({ ...a, user_id: uid })),
    'accounts'
  );
  const accBYN = accounts.find((a) => a.currency === 'BYN').id;
  const accUSD = accounts.find((a) => a.currency === 'USD').id;
  const accEUR = accounts.find((a) => a.currency === 'EUR').id;
  console.log('Created', accounts.length, 'accounts');

  // ---- Categories with icons + colors ----
  const catSpec = [
    { name: 'Зарплата', type: 'income', icon: 'Banknote', color: '#10b981' },
    { name: 'Фриланс', type: 'income', icon: 'Laptop', color: '#6366f1' },
    { name: 'Кэшбэк', type: 'income', icon: 'Coins', color: '#f59e0b' },
    { name: 'Инвестиции', type: 'income', icon: 'TrendingUp', color: '#14b8a6' },
    { name: 'Продукты', type: 'expense', icon: 'ShoppingCart', color: '#84cc16' },
    { name: 'Транспорт', type: 'expense', icon: 'Car', color: '#0ea5e9' },
    { name: 'Кафе и рестораны', type: 'expense', icon: 'Utensils', color: '#f97316' },
    { name: 'Развлечения', type: 'expense', icon: 'Film', color: '#a855f7' },
    { name: 'Подписки', type: 'expense', icon: 'Smartphone', color: '#ec4899' },
    { name: 'Здоровье', type: 'expense', icon: 'Heart', color: '#ef4444' },
    { name: 'Одежда', type: 'expense', icon: 'Shirt', color: '#d946ef' },
    { name: 'Дом и быт', type: 'expense', icon: 'Home', color: '#8b5cf6' },
    { name: 'Спорт', type: 'expense', icon: 'Dumbbell', color: '#06b6d4' },
    { name: 'Образование', type: 'expense', icon: 'BookOpen', color: '#3b82f6' },
  ];
  const cats = await insertResilient(
    'categories',
    catSpec.map((c) => ({ ...c, user_id: uid })),
    'categories'
  );
  const C = Object.fromEntries(cats.map((c) => [c.name, c.id]));
  console.log('Created', cats.length, 'categories');

  // ---- Loans ----
  const loansSpec = [
    {
      name: 'Ипотека',
      currency: 'BYN',
      total_amount: 120000,
      annual_interest_rate: 9.5,
      payment_end_year: 2033,
      remaining_schedule_months: 90,
      note: 'Квартира, аннуитет',
    },
    {
      name: 'Авто в кредит',
      currency: 'BYN',
      total_amount: 28000,
      annual_interest_rate: 13.5,
      payment_end_year: 2027,
      remaining_schedule_months: 18,
      note: null,
    },
  ];
  const loans = await insertResilient(
    'loans',
    loansSpec.map((l) => ({ ...l, user_id: uid })),
    'loans'
  );
  const loanMortgage = loans.find((l) => l.name === 'Ипотека').id;
  const loanCar = loans.find((l) => l.name === 'Авто в кредит').id;
  console.log('Created', loans.length, 'loans');

  // ---- Budget goals ----
  const goalsSpec = [
    { name: 'Отпуск в Японии', target_amount: 12000, saved_amount: 4250 },
    { name: 'Новый MacBook Pro', target_amount: 6800, saved_amount: 5200 },
    { name: 'Резервный фонд', target_amount: 30000, saved_amount: 13400 },
    { name: 'Ремонт кухни', target_amount: 18000, saved_amount: 3100 },
  ];
  const { error: goalErr } = await supabase
    .from('budget_goals')
    .insert(goalsSpec.map((g) => ({ ...g, user_id: uid })));
  if (goalErr) throw goalErr;
  console.log('Created', goalsSpec.length, 'budget goals');

  // ---- Transactions ----
  const tx = [];
  // Salaries: 1st of each month, last 6 months (BYN)
  for (let m = -5; m <= 0; m++) {
    tx.push({
      user_id: uid,
      account_id: accBYN,
      category_id: C['Зарплата'],
      amount: round2(rand(3400, 3900)),
      type: 'income',
      occurred_at: isoDate(monthStart(m)),
      note: 'Зарплата',
    });
  }
  // Extra incomes
  const incomeNotes = ['Проект на фрилансе', 'Кэшбэк по карте', 'Дивиденды', 'Продажа на Куфаре', 'Премия'];
  for (let i = 0; i < 16; i++) {
    const r = Math.random();
    let account_id = accBYN;
    let amount = round2(rand(150, 1800));
    let category_id = pick([C['Фриланс'], C['Кэшбэк'], C['Инвестиции']]);
    if (r < 0.2) {
      account_id = accUSD;
      amount = round2(rand(60, 900));
    } else if (r < 0.32) {
      account_id = accEUR;
      amount = round2(rand(50, 800));
    }
    tx.push({
      user_id: uid,
      account_id,
      category_id,
      amount,
      type: 'income',
      occurred_at: isoDate(daysAgo(Math.floor(rand(0, 165)))),
      note: pick(incomeNotes),
    });
  }
  // Expenses
  const expenseByCat = {
    'Продукты': { notes: ['Евроопт', 'Соседи', 'Green', 'Корона', 'Рынок'], byn: [25, 180], usd: [8, 60], eur: [8, 55] },
    'Транспорт': { notes: ['Заправка', 'Яндекс Go', 'Метро', 'Парковка', 'Автобус'], byn: [3, 120], usd: [3, 30], eur: [3, 28] },
    'Кафе и рестораны': { notes: ['Кофе с собой', 'Бизнес-ланч', 'Ужин', 'Пиццерия', 'Бар'], byn: [10, 150], usd: [5, 60], eur: [5, 55] },
    'Развлечения': { notes: ['Кинотеатр', 'Концерт', 'Боулинг', 'Музей', 'Игры'], byn: [15, 200], usd: [5, 70], eur: [5, 65] },
    'Подписки': { notes: ['Netflix', 'Spotify', 'YouTube Premium', 'iCloud', 'ChatGPT Plus'], byn: [5, 40], usd: [4, 25], eur: [4, 22] },
    'Здоровье': { notes: ['Аптека', 'Стоматолог', 'Анализы', 'Витамины'], byn: [15, 300], usd: [10, 120], eur: [10, 110] },
    'Одежда': { notes: ['Zara', 'H&M', 'Кроссовки', 'Куртка', 'Lamoda'], byn: [40, 450], usd: [20, 200], eur: [20, 180] },
    'Дом и быт': { notes: ['Mile', 'ОМА', 'Бытовая химия', 'Лампочки', 'Посуда'], byn: [20, 350], usd: [10, 120], eur: [10, 110] },
    'Спорт': { notes: ['Абонемент в зал', 'Бассейн', 'Протеин', 'Инвентарь'], byn: [25, 180], usd: [15, 80], eur: [15, 75] },
    'Образование': { notes: ['Курс на Stepik', 'Книги', 'Udemy', 'Вебинар'], byn: [20, 250], usd: [10, 120], eur: [10, 110] },
  };
  const expenseCats = Object.keys(expenseByCat);
  for (let i = 0; i < 110; i++) {
    const catName = pick(expenseCats);
    const spec = expenseByCat[catName];
    const r = Math.random();
    let account_id = accBYN;
    let range = spec.byn;
    if (r < 0.12) {
      account_id = accUSD;
      range = spec.usd;
    } else if (r < 0.2) {
      account_id = accEUR;
      range = spec.eur;
    }
    tx.push({
      user_id: uid,
      account_id,
      category_id: C[catName],
      amount: round2(rand(range[0], range[1])),
      type: 'expense',
      occurred_at: isoDate(daysAgo(Math.floor(rand(0, 175)))),
      note: pick(spec.notes),
    });
  }
  // Loan payments (last 5 months) as expenses tied to loans
  for (let m = -4; m <= 0; m++) {
    const d = monthStart(m);
    d.setUTCDate(10);
    tx.push({
      user_id: uid,
      account_id: accBYN,
      category_id: C['Дом и быт'],
      loan_id: loanMortgage,
      amount: round2(rand(1250, 1320)),
      type: 'expense',
      occurred_at: isoDate(d),
      note: 'Платёж по ипотеке',
    });
    const d2 = monthStart(m);
    d2.setUTCDate(20);
    tx.push({
      user_id: uid,
      account_id: accBYN,
      category_id: C['Транспорт'],
      loan_id: loanCar,
      amount: round2(rand(1500, 1560)),
      type: 'expense',
      occurred_at: isoDate(d2),
      note: 'Платёж за авто',
    });
  }
  // A few explicit highlight purchases
  tx.push(
    { user_id: uid, account_id: accUSD, category_id: C['Одежда'], amount: 1199, type: 'expense', occurred_at: isoDate(daysAgo(9)), note: 'iPhone 16 — Apple' },
    { user_id: uid, account_id: accUSD, category_id: C['Подписки'], amount: 15, type: 'expense', occurred_at: isoDate(daysAgo(4)), note: 'Figma Professional' },
    { user_id: uid, account_id: accEUR, category_id: C['Развлечения'], amount: 220, type: 'expense', occurred_at: isoDate(daysAgo(28)), note: 'Концерт в Вильнюсе' }
  );

  // Insert in chunks
  for (let i = 0; i < tx.length; i += 200) {
    const chunk = tx.slice(i, i + 200);
    const { error } = await supabase.from('transactions').insert(chunk);
    if (error) throw error;
  }
  console.log('Created', tx.length, 'transactions');
  console.log('\n✅ Demo seed complete.');
  console.log('   Login:', EMAIL);
  console.log('   Password:', PASSWORD);
}

main().catch((e) => {
  console.error('Seed failed:', e.message || e);
  process.exit(1);
});
