-- Валюта по умолчанию BYN (как в DEFAULT_ACCOUNT_CURRENCY в приложении)

alter table public.accounts alter column currency set default 'BYN';
alter table public.loans alter column currency set default 'BYN';
