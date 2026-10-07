-- Для уже применённой старой миграции: убрать monthly_payment, добавить ставку и год

alter table public.loans drop column if exists monthly_payment;

alter table public.loans add column if not exists annual_interest_rate numeric(7, 4)
  check (
    annual_interest_rate is null
    or (annual_interest_rate >= 0 and annual_interest_rate <= 100)
  );

alter table public.loans add column if not exists payment_end_year smallint
  check (
    payment_end_year is null
    or (payment_end_year >= 2000 and payment_end_year <= 2100)
  );
