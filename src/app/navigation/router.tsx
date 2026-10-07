import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { MainLayoutContainer } from '@/components/MainLayout';
import { RequireAuth } from '@/app/navigation/RequireAuth';
import { ScreenFallback } from '@/components/ScreenFallback/ScreenFallback';

/** Lazy-load a screen by its named export and wrap it in a Suspense boundary. */
function screen(loader: () => Promise<Record<string, unknown>>, name: string) {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return { default: mod[name] as ComponentType };
  });
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Lazy />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: screen(() => import('@/screens/LoginScreen'), 'LoginScreenContainer'),
  },
  {
    path: '/register',
    element: screen(() => import('@/screens/RegisterScreen'), 'RegisterScreenContainer'),
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: 'onboarding',
        element: screen(() => import('@/screens/OnboardingScreen'), 'OnboardingScreen'),
      },
      {
        element: <MainLayoutContainer />,
        children: [
          {
            index: true,
            element: screen(() => import('@/screens/DashboardScreen'), 'DashboardScreenContainer'),
          },
          {
            path: 'analytics',
            element: screen(() => import('@/screens/AnalyticsScreen'), 'AnalyticsScreenContainer'),
          },
          {
            path: 'transactions',
            element: screen(
              () => import('@/screens/TransactionsScreen'),
              'TransactionsScreenContainer'
            ),
          },
          {
            path: 'wallets',
            element: screen(() => import('@/screens/WalletsScreen'), 'WalletsScreenContainer'),
          },
          {
            path: 'categories',
            element: screen(() => import('@/screens/CategoriesScreen'), 'CategoriesPageContainer'),
          },
          {
            path: 'budget',
            element: screen(() => import('@/screens/BudgetScreen'), 'BudgetScreenContainer'),
          },
          {
            path: 'credits',
            element: screen(() => import('@/screens/CreditsScreen'), 'CreditsScreenContainer'),
          },
          {
            path: 'settings',
            element: screen(() => import('@/screens/SettingsScreen'), 'SettingsScreen'),
          },
        ],
      },
    ],
  },
]);
