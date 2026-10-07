import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  loanFormSchema,
  type LoanFormValues,
} from '@/screens/CreditsScreen/CreditsScreen.formConfig';
import { confirm } from '@/components/ConfirmDialog/confirmStore';
import { CreditsScreen } from '@/screens/CreditsScreen/CreditsScreen';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import type { LoanWithStats } from '@/screens/CreditsScreen/CreditsScreen.types';
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/forms/transactionFormConfig';
import { useAccountStore } from '@/shared/store/accountStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import type { Loan, Transaction } from '@/shared/types/entities';
import { sumLoanRepayments } from '@/shared/utils/loan';
import {
  buildLoanMonthlyRows,
  estimateEqualPrincipalPlusInterest,
  resolveScheduleMonthCount,
} from '@/shared/utils/loanSchedule';

function todayIsoDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function CreditsScreenContainer() {
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { loans, loading, error, fetchLoans, createLoan, updateLoan, deleteLoan } = useLoanStore();
  const { transactions, fetchTransactions, createTransaction } = useTransactionStore();

  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);

  const loanForm = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      name: '',
      currency: DEFAULT_ACCOUNT_CURRENCY,
      totalAmount: undefined as unknown as number,
      annualInterestRate: '',
      paymentEndYear: '',
      remainingScheduleMonths: '',
      note: '',
    },
  });

  const paymentForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      loanId: '',
      amount: 0,
      type: 'expense',
      occurredAt: todayIsoDate(),
      note: '',
    },
  });

  useEffect(() => {
    void fetchLoans();
    void fetchTransactions();
    void fetchAccounts();
    void fetchCategories();
  }, [fetchLoans, fetchTransactions, fetchAccounts, fetchCategories]);

  const loansWithStats: LoanWithStats[] = useMemo(() => {
    return loans.map((loan) => {
      const paid = sumLoanRepayments(transactions, loan.id);
      const remaining = Math.max(0, loan.total_amount - paid);
      const progressPct =
        loan.total_amount > 0 ? Math.min(100, (paid / loan.total_amount) * 100) : 0;
      const scheduleMonths = resolveScheduleMonthCount(
        loan.payment_end_year,
        loan.remaining_schedule_months,
        new Date()
      );
      const scheduleEstimate =
        loan.annual_interest_rate != null && scheduleMonths != null && remaining > 0
          ? estimateEqualPrincipalPlusInterest(remaining, loan.annual_interest_rate, scheduleMonths)
          : null;
      const monthlySchedule =
        scheduleMonths != null && remaining > 0
          ? buildLoanMonthlyRows(
              remaining,
              loan.annual_interest_rate,
              scheduleMonths,
              transactions,
              loan.id
            )
          : null;
      return { ...loan, paid, remaining, progressPct, scheduleEstimate, monthlySchedule };
    });
  }, [loans, transactions]);

  const loanTransactions = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const l of loans) {
      const list = transactions
        .filter((t) => t.loan_id === l.id)
        .sort(
          (a, b) =>
            b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at)
        );
      m.set(l.id, list);
    }
    return m;
  }, [loans, transactions]);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency })),
    [accounts]
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color })),
    [categories]
  );

  const onOpenCreateLoan = () => {
    setEditingLoan(null);
    loanForm.reset({
      name: '',
      currency: DEFAULT_ACCOUNT_CURRENCY,
      totalAmount: undefined as unknown as number,
      annualInterestRate: '',
      paymentEndYear: '',
      remainingScheduleMonths: '',
      note: '',
    });
    setLoanDialogOpen(true);
  };

  const onOpenEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    loanForm.reset({
      name: loan.name,
      currency: loan.currency as LoanFormValues['currency'],
      totalAmount: loan.total_amount,
      annualInterestRate:
        loan.annual_interest_rate != null ? String(loan.annual_interest_rate) : '',
      paymentEndYear: loan.payment_end_year != null ? String(loan.payment_end_year) : '',
      remainingScheduleMonths:
        loan.remaining_schedule_months != null ? String(loan.remaining_schedule_months) : '',
      note: loan.note ?? '',
    });
    setLoanDialogOpen(true);
  };

  const onCloseLoanDialog = () => {
    setLoanDialogOpen(false);
    setEditingLoan(null);
  };

  const onSubmitLoan = loanForm.handleSubmit(async (values) => {
    try {
      const rateRaw = values.annualInterestRate?.trim().replace(',', '.') ?? '';
      const annualInterestRate =
        rateRaw.length > 0 && !Number.isNaN(Number.parseFloat(rateRaw))
          ? Number.parseFloat(rateRaw)
          : null;
      const yearRaw = values.paymentEndYear?.trim() ?? '';
      const y = yearRaw.length >= 4 ? Number.parseInt(yearRaw.slice(0, 4), 10) : NaN;
      const paymentEndYear = !Number.isNaN(y) && y >= 2000 && y <= 2100 ? y : null;
      const monthsRaw = values.remainingScheduleMonths?.trim() ?? '';
      let remainingScheduleMonths: number | null = null;
      if (monthsRaw.length > 0) {
        const n = Number.parseInt(monthsRaw, 10);
        if (Number.isNaN(n) || n < 1 || n > 600) {
          loanForm.setError('remainingScheduleMonths', {
            message: 'Укажите целое число от 1 до 600 или оставьте пустым',
          });
          return;
        }
        remainingScheduleMonths = n;
      }
      if (editingLoan) {
        await updateLoan(editingLoan.id, {
          name: values.name,
          currency: values.currency,
          totalAmount: values.totalAmount,
          annualInterestRate,
          paymentEndYear,
          remainingScheduleMonths,
          note: values.note ?? null,
        });
      } else {
        await createLoan({
          name: values.name,
          currency: values.currency,
          totalAmount: values.totalAmount,
          annualInterestRate,
          paymentEndYear,
          remainingScheduleMonths,
          note: values.note ?? null,
        });
      }
      await fetchLoans();
      onCloseLoanDialog();
    } catch (e) {
      loanForm.setError('root', { message: (e as Error).message });
    }
  });

  const onDeleteLoan = async (loan: Loan) => {
    const ok = await confirm({
      title: 'Удалить кредит?',
      description: `«${loan.name}». Платежи останутся, но потеряют привязку к кредиту.`,
      confirmText: 'Удалить',
    });
    if (!ok) return;
    void deleteLoan(loan.id);
    void fetchTransactions();
  };

  const onOpenPayment = (loan: Loan) => {
    setPaymentLoan(loan);
    const first = accounts[0];
    paymentForm.reset({
      accountId: first?.id ?? '',
      categoryId: '',
      loanId: loan.id,
      amount: 0,
      type: 'expense',
      occurredAt: todayIsoDate(),
      note: '',
    });
    setPaymentDialogOpen(true);
  };

  const onClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentLoan(null);
  };

  const onSubmitPayment = paymentForm.handleSubmit(async (values) => {
    if (!paymentLoan) return;
    try {
      const categoryId =
        values.categoryId && values.categoryId.length > 0 ? values.categoryId : null;
      await createTransaction({
        accountId: values.accountId,
        categoryId,
        loanId: paymentLoan.id,
        amount: values.amount,
        type: 'expense',
        occurredAt: values.occurredAt,
        note: values.note ?? null,
      });
      await fetchTransactions();
      onClosePaymentDialog();
    } catch (e) {
      paymentForm.setError('root', { message: (e as Error).message });
    }
  });

  const loadingAll = loading;

  return (
    <CreditsScreen
      loans={loansWithStats}
      loanTransactions={loanTransactions}
      loading={loadingAll}
      error={error}
      loanDialogOpen={loanDialogOpen}
      editingLoan={editingLoan}
      loanForm={loanForm}
      paymentDialogOpen={paymentDialogOpen}
      paymentLoan={paymentLoan}
      paymentForm={paymentForm}
      accountOptions={accountOptions}
      categoryOptions={categoryOptions}
      onOpenCreateLoan={onOpenCreateLoan}
      onOpenEditLoan={onOpenEditLoan}
      onCloseLoanDialog={onCloseLoanDialog}
      onSubmitLoan={onSubmitLoan}
      onDeleteLoan={onDeleteLoan}
      onOpenPayment={onOpenPayment}
      onClosePaymentDialog={onClosePaymentDialog}
      onSubmitPayment={onSubmitPayment}
    />
  );
}
