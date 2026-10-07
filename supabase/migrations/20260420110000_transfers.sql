-- Переводы между счетами: не доход и не расход, на аналитику не влияют,
-- но меняют баланс конкретных кошельков. RLS — только свои записи.

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete cascade,
  to_account_id uuid not null references public.accounts (id) on delete cascade,
  amount numeric(19, 4) not null check (amount > 0),
  occurred_at date not null default ((now() at time zone 'utc'))::date,
  note text,
  created_at timestamptz not null default now(),
  constraint transfers_distinct_accounts check (from_account_id <> to_account_id)
);

create index if not exists transfers_user_occurred_idx
  on public.transfers (user_id, occurred_at desc);

alter table public.transfers enable row level security;

create policy "transfers_select_own" on public.transfers
  for select using (auth.uid() = user_id);
create policy "transfers_insert_own" on public.transfers
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.accounts a where a.id = from_account_id and a.user_id = auth.uid())
    and exists (select 1 from public.accounts a where a.id = to_account_id and a.user_id = auth.uid())
  );
create policy "transfers_update_own" on public.transfers
  for update using (auth.uid() = user_id);
create policy "transfers_delete_own" on public.transfers
  for delete using (auth.uid() = user_id);
