import { Info } from 'lucide-react';

import { TransferDialog } from '@/components/TransferDialog/TransferDialog';
import { TransfersCard } from '@/components/TransferDialog/TransfersCard';
import { AccountsScreenContainer } from '@/screens/AccountsScreen/AccountsScreen.container';

export function WalletsScreenContainer() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
          Кошельки хранят балансы и привязаны к транзакциям.
        </p>
        <TransferDialog />
      </div>
      <AccountsScreenContainer embedded />
      <TransfersCard />
    </div>
  );
}
