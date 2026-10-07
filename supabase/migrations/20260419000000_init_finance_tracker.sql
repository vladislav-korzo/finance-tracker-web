-- Finance Tracker: accounts, categories, transactions with RLS

create extension if not exists "pgcrypto";

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  currency text not null default 'BYN',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(19, 4) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  occurred_at date not null default ((now() at time zone 'utc'))::date,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_user_occurred_idx on public.transactions (user_id, occurred_at desc);
create index transactions_account_idx on public.transactions (account_id);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "accounts_select_own" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = user_id);

create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);
