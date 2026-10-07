import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { getProfile } from '@/shared/lib/profile';
import { useAuthStore } from '@/shared/store/authStore';

export function RequireAuth() {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // New users must finish onboarding before reaching the app.
  if (!getProfile(user).onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
