-- Месячный лимит трат по категории (только для расходов; null — без лимита).
-- Приложение устойчиво к отсутствию колонки.

alter table public.categories
  add column if not exists monthly_limit numeric(19, 4)
    check (monthly_limit is null or monthly_limit > 0);
