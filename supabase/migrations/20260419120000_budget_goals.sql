-- Цели накоплений (ручной прогресс) + RLS по пользователю

create table public.budget_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(19, 4) not null check (target_amount > 0),
  saved_amount numeric(19, 4) not null default 0 check (saved_amount >= 0),
  created_at timestamptz not null default now()
);

create index budget_goals_user_idx on public.budget_goals (user_id);

alter table public.budget_goals enable row level security;

create policy "budget_goals_select_own" on public.budget_goals for select using (auth.uid() = user_id);
create policy "budget_goals_insert_own" on public.budget_goals for insert with check (auth.uid() = user_id);
create policy "budget_goals_update_own" on public.budget_goals for update using (auth.uid() = user_id);
create policy "budget_goals_delete_own" on public.budget_goals for delete using (auth.uid() = user_id);
