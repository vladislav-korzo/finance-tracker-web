import { motion } from 'framer-motion';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { SectionCard } from '@/components/blocks';
import { confirm } from '@/components/ConfirmDialog/confirmStore';
import { Button } from '@/components/ui/button';
import { useAccountStore } from '@/shared/store/accountStore';
import { useTransferStore } from '@/shared/store/transferStore';
import { formatDateDisplay, formatMoney } from '@/shared/utils/format';

/** Recent transfers history with delete. Hidden entirely when there are none. */
export function TransfersCard() {
  const accounts = useAccountStore((s) => s.accounts);
  const transfers = useTransferStore((s) => s.transfers);
  const fetchTransfers = useTransferStore((s) => s.fetchTransfers);
  const deleteTransfer = useTransferStore((s) => s.deleteTransfer);

  useEffect(() => {
    void fetchTransfers();
  }, [fetchTransfers]);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  if (transfers.length === 0) return null;

  const onDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Удалить перевод?',
      description: 'Балансы счетов вернутся к прежним значениям.',
      confirmText: 'Удалить',
    });
    if (!ok) return;
    void deleteTransfer(id);
  };

  return (
    <SectionCard
      title="Переводы"
      description={`Всего: ${transfers.length}`}
      flush
      contentClassName="px-2 pb-2 sm:px-3 sm:pb-3"
    >
      <ul className="divide-y divide-border/60">
        {transfers.map((t, i) => {
          const from = accountById.get(t.from_account_id);
          const to = accountById.get(t.to_account_id);
          const currency = from?.currency ?? to?.currency ?? '';
          return (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                  <span className="truncate">{from?.name ?? '—'}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{to?.name ?? '—'}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateDisplay(t.occurred_at)}
                  {t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-foreground sm:text-base">
                {formatMoney(t.amount, currency)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Удалить перевод"
                onClick={() => onDelete(t.id)}
                className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </Button>
            </motion.li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
