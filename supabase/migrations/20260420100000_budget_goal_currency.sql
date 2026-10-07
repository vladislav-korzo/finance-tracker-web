-- Валюта цели накоплений. По умолчанию BYN (как DEFAULT_ACCOUNT_CURRENCY).
-- Приложение устойчиво к отсутствию колонки, но без неё валюта целей не сохраняется.

alter table public.budget_goals
  add column if not exists currency text not null default 'BYN';
