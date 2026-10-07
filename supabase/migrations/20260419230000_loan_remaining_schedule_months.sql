-- Явное число оставшихся платежей для графика (перекрывает расчёт по payment_end_year).

alter table public.loans add column if not exists remaining_schedule_months smallint
  check (
    remaining_schedule_months is null
    or (remaining_schedule_months >= 1 and remaining_schedule_months <= 600)
  );

comment on column public.loans.remaining_schedule_months is
  'Оставшихся платежей по договору для расчёта графика; если задано, не используем только год окончания.';
