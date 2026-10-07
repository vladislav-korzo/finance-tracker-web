-- Иконка (имя компонента Lucide) и цвет (#RRGGBB) для категорий

alter table public.categories
  add column icon text not null default 'Circle',
  add column color text not null default '#64748b';
