import type { UseFormReturn } from 'react-hook-form';

import type { LoanFormValues } from '@/screens/CreditsScreen/CreditsScreen.formConfig';
import type { TransactionFormValues } from '@/shared/forms/transactionFormConfig';
import type { Loan, Transaction } from '@/shared/types/entities';
import type { LoanMonthRow, LoanScheduleEstimate } from '@/shared/utils/loanSchedule';

export type LoanWithStats = Loan & {
  paid: number;
  remaining: number;
  progressPct: number;
  /** Оценка следующего платежа (тело + %), если заданы ставка и год окончания */
  scheduleEstimate: LoanScheduleEstimate | null;
  /** Помесячный план и факт оплат, если задан год окончания платежей и есть остаток */
  monthlySchedule: LoanMonthRow[] | null;
};

export type CreditsScreenProps = {
  loans: LoanWithStats[];
  loanTransactions: Map<string, Transaction[]>;
  loading: boolean;
  error: string | null;
  loanDialogOpen: boolean;
  editingLoan: Loan | null;
  loanForm: UseFormReturn<LoanFormValues>;
  paymentDialogOpen: boolean;
  paymentLoan: Loan | null;
  paymentForm: UseFormReturn<TransactionFormValues>;
  accountOptions: { id: string; name: string; currency: string }[];
  categoryOptions: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
  }[];
  onOpenCreateLoan: () => void;
  onOpenEditLoan: (loan: Loan) => void;
  onCloseLoanDialog: () => void;
  onSubmitLoan: () => void;
  onDeleteLoan: (loan: Loan) => void;
  onOpenPayment: (loan: Loan) => void;
  onClosePaymentDialog: () => void;
  onSubmitPayment: () => void;
};
