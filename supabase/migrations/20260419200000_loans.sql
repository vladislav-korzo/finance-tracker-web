-- Кредиты: сумма к погашению; платежи — расходы с loan_id

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  currency text not null default 'BYN',
  total_amount numeric(19, 4) not null check (total_amount > 0),
  annual_interest_rate numeric(7, 4) check (
    annual_interest_rate is null
    or (annual_interest_rate >= 0 and annual_interest_rate <= 100)
  ),
  payment_end_year smallint check (
    payment_end_year is null
    or (payment_end_year >= 2000 and payment_end_year <= 2100)
  ),
  note text,
  created_at timestamptz not null default now()
);

create index loans_user_idx on public.loans (user_id);

alter table public.loans enable row level security;

create policy "loans_select_own" on public.loans for select using (auth.uid() = user_id);
create policy "loans_insert_own" on public.loans for insert with check (auth.uid() = user_id);
create policy "loans_update_own" on public.loans for update using (auth.uid() = user_id);
create policy "loans_delete_own" on public.loans for delete using (auth.uid() = user_id);

alter table public.transactions
  add column loan_id uuid references public.loans (id) on delete set null;

create index transactions_loan_idx on public.transactions (loan_id) where loan_id is not null;

-- Защита: кредит в транзакции должен принадлежать тому же пользователю
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions for insert
with check (
  auth.uid() = user_id
  and (
    loan_id is null
    or exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid())
  )
);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    loan_id is null
    or exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid())
  )
);
