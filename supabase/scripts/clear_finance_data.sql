-- Очистка всех данных Finance Tracker (счета, категории, транзакции, кредиты, цели бюджета).
-- Схема и RLS сохраняются. Таблица auth.users не затрагивается — логины остаются.
--
-- Где выполнить: Supabase Dashboard → SQL Editor → New query → вставить и Run.
-- Локально (если установлен CLI и есть config): supabase db reset — полный сброс + все миграции заново.

set search_path = public;

truncate table
  public.transactions,
  public.loans,
  public.budget_goals,
  public.categories,
  public.accounts
cascade;
