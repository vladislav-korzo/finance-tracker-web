import type { TransactionType } from '@/shared/types/database';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  /** Имя иконки Lucide (PascalCase) */
  icon: string;
  /** Цвет #RRGGBB */
  color: string;
  /** Месячный лимит трат (только для расходов); null — без лимита */
  monthly_limit: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  /** Платёж по кредиту (обычно расход) */
  loan_id: string | null;
  amount: number;
  type: TransactionType;
  occurred_at: string;
  note: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  /** Сколько всего нужно погасить */
  total_amount: number;
  /** Процент годовых (например 12.5 = 12,5% годовых) */
  annual_interest_rate: number | null;
  /** Год, до конца которого идут платежи по договору */
  payment_end_year: number | null;
  /**
   * Сколько платежей осталось по графику (из выписки). Если задано — считаем тело и график по этому числу месяцев, а не по календарю до payment_end_year.
   */
  remaining_schedule_months: number | null;
  note: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  occurred_at: string;
  note: string | null;
  created_at: string;
}

export interface BudgetGoal {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  target_amount: number;
  saved_amount: number;
  created_at: string;
}
