import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { MainLayout } from '@/components/MainLayout/MainLayout';
import { QuickAddTransactionContainer } from '@/components/QuickAddTransaction';
import { getProfile, profileDisplayName } from '@/shared/lib/profile';
import { useAuthStore } from '@/shared/store/authStore';
import { RouteTransition } from '@/shared/ui/motion/RouteTransition';

const PATH_TITLES: Record<string, string> = {
  '/': 'Дашборд',
  '/analytics': 'Аналитика',
  '/transactions': 'Транзакции',
  '/wallets': 'Мои кошельки',
  '/categories': 'Категории',
  '/budget': 'Бюджет',
  '/credits': 'Кредиты',
  '/settings': 'Настройки',
};

function titleForPath(pathname: string): string {
  return PATH_TITLES[pathname] ?? 'Дашборд';
}

export function MainLayoutContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const userDisplayName = profileDisplayName(user);
  const avatarUrl = getProfile(user).avatarUrl;
  const signOut = useAuthStore((s) => s.signOut);

  const pageTitle = useMemo(() => titleForPath(location.pathname), [location.pathname]);

  return (
    <MainLayout
      userEmail={user?.email ?? ''}
      userDisplayName={userDisplayName}
      avatarUrl={avatarUrl}
      pageTitle={pageTitle}
      headerActions={<QuickAddTransactionContainer />}
      onSignOut={async () => {
        await signOut();
        navigate('/login');
      }}
    >
      <RouteTransition />
    </MainLayout>
  );
}
