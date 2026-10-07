import type { Transaction } from '@/shared/types/entities';

/** Сумма расходов, привязанных к кредиту (платежи по кредиту). */
export function sumLoanRepayments(transactions: Transaction[], loanId: string): number {
  return transactions
    .filter((t) => t.loan_id === loanId && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
}
