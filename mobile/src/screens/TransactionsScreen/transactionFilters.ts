import type { Account, Category, Loan, Transaction } from '@/shared/types/entities';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';

/* ----------------------------------------------------------------------------
 * Screen-local filtering + row-shaping helpers for the mobile Transactions
 * screen. Ported 1:1 from the web container's `rows` / `filteredRows` memos
 * (src/screens/TransactionsScreen/TransactionsScreen.container.tsx) so the
 * native screen has identical search/filter semantics — just factored out as
 * pure functions the screen can call.
 * ------------------------------------------------------------------------- */

/** How many rows are added per "Показать ещё" tap (mirrors the web PAGE_SIZE). */
export const PAGE_SIZE = 25;

export type TypeFilter = 'all' | 'income' | 'expense';

/** A transaction enriched with the display fields the list rows render. */
export type TransactionRow = Transaction & {
  accountName: string;
  /** Валюта кошелька операции */
  accountCurrency: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  loanName: string | null;
};

export type TransactionFilters = {
  query: string;
  type: TypeFilter;
  categoryId: string;
  accountId: string;
};

export const EMPTY_FILTERS: TransactionFilters = {
  query: '',
  type: 'all',
  categoryId: 'all',
  accountId: 'all',
};

export function hasActiveFilters(f: TransactionFilters): boolean {
  return (
    f.query.trim() !== '' ||
    f.type !== 'all' ||
    f.categoryId !== 'all' ||
    f.accountId !== 'all'
  );
}

/** Count of non-search filters that are active (drives the badge on «Фильтры»). */
export function activeFilterCount(f: TransactionFilters): number {
  let n = 0;
  if (f.type !== 'all') n += 1;
  if (f.categoryId !== 'all') n += 1;
  if (f.accountId !== 'all') n += 1;
  return n;
}

/**
 * Enrich raw transactions with account / category / loan display fields.
 * `transactions` is assumed already newest-first (the store keeps it sorted).
 */
export function buildRows(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  loans: Loan[],
): TransactionRow[] {
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const loanById = new Map(loans.map((l) => [l.id, l]));

  return transactions.map((t) => {
    const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
    const loan = t.loan_id ? loanById.get(t.loan_id) : undefined;
    return {
      ...t,
      accountName: accountById.get(t.account_id)?.name ?? '—',
      accountCurrency: accountById.get(t.account_id)?.currency ?? DEFAULT_ACCOUNT_CURRENCY,
      categoryName: t.category_id ? (cat?.name ?? null) : null,
      categoryIcon: t.category_id && cat ? cat.icon : null,
      categoryColor: t.category_id && cat ? cat.color : null,
      loanName: loan?.name ?? null,
    };
  });
}

/** Apply the active filters + free-text search to the enriched rows. */
export function filterRows(rows: TransactionRow[], f: TransactionFilters): TransactionRow[] {
  const q = f.query.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.type !== 'all' && r.type !== f.type) return false;
    if (f.accountId !== 'all' && r.account_id !== f.accountId) return false;
    if (f.categoryId !== 'all' && r.category_id !== f.categoryId) return false;
    if (q) {
      const haystack = [r.note ?? '', r.categoryName ?? '', r.accountName, String(r.amount)]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
