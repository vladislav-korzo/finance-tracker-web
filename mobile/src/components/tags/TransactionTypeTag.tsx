import { View } from 'react-native';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

type Props = {
  kind: 'income' | 'expense';
  className?: string;
};

/**
 * Income/expense pill driven entirely by the income/expense design tokens, so it
 * adapts to light/dark automatically: soft tinted fill, a tinted hairline border
 * (the native stand-in for the web's inset box-shadow), and tinted label text.
 */
export function TransactionTypeTag({ kind, className }: Props) {
  const isIncome = kind === 'income';

  return (
    <View
      className={cn(
        'shrink-0 flex-row items-center self-start rounded-full border px-2.5 py-0.5',
        isIncome
          ? 'border-income/35 bg-income/15'
          : 'border-expense/35 bg-expense/15',
        className
      )}
    >
      <Text
        weight="semibold"
        numberOfLines={1}
        className={cn('text-xs', isIncome ? 'text-income' : 'text-expense')}
      >
        {isIncome ? 'Доход' : 'Расход'}
      </Text>
    </View>
  );
}
