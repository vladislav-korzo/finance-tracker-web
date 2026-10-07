import { cn } from '@/shared/lib/utils';

type Props = {
  kind: 'income' | 'expense';
  className?: string;
};

export function TransactionTypeTag({ kind, className }: Props) {
  const isIncome = kind === 'income';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
      style={
        isIncome
          ? {
              backgroundColor: 'hsl(var(--income) / 0.16)',
              color: 'hsl(var(--income))',
              boxShadow: 'inset 0 0 0 1px hsl(var(--income) / 0.35)',
            }
          : {
              backgroundColor: 'hsl(var(--expense) / 0.14)',
              color: 'hsl(var(--expense))',
              boxShadow: 'inset 0 0 0 1px hsl(var(--expense) / 0.35)',
            }
      }
    >
      {isIncome ? 'Доход' : 'Расход'}
    </span>
  );
}
