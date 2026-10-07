import {
  ArrowRightLeft,
  Landmark,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  Tags,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match the route exactly (used for the index route). */
  end?: boolean;
  /** Short hint shown in the command palette. */
  hint?: string;
};

/** Primary navigation — shared by the sidebar and the command palette. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Дашборд', icon: LayoutDashboard, end: true, hint: 'Обзор финансов' },
  { to: '/transactions', label: 'Транзакции', icon: ArrowRightLeft, hint: 'История операций' },
  { to: '/analytics', label: 'Аналитика', icon: PieChart, hint: 'Графики и тренды' },
  { to: '/wallets', label: 'Мои кошельки', icon: Wallet, hint: 'Счета и балансы' },
  { to: '/categories', label: 'Категории', icon: Tags, hint: 'Доходы и расходы' },
  { to: '/budget', label: 'Бюджет', icon: PiggyBank, hint: 'Цели накоплений' },
  { to: '/credits', label: 'Кредиты', icon: Landmark, hint: 'Кредиты и платежи' },
];
